import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDb, logTransfer, getTransferHistory, getStats } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room store: roomId -> Map(socketId -> peerInfo)
const rooms = new Map();

// Helper to generate unique room ID
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    totalConnections: io.sockets.sockets.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/history', async (req, res) => {
  const history = await getTransferHistory(30);
  res.json({ success: true, history });
});

app.get('/api/stats', async (req, res) => {
  const stats = await getStats();
  res.json({ success: true, stats, activeRooms: rooms.size });
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create room
  socket.on('create-room', ({ peerInfo }, callback) => {
    let roomId = generateRoomCode();
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    const roomPeers = new Map();
    const peer = {
      socketId: socket.id,
      ...peerInfo,
      joinedAt: new Date().toISOString()
    };

    roomPeers.set(socket.id, peer);
    rooms.set(roomId, roomPeers);
    socket.join(roomId);
    socket.currentRoom = roomId;

    console.log(`[Room Created] Room: ${roomId} by Socket: ${socket.id}`);

    if (typeof callback === 'function') {
      callback({ success: true, roomId, peers: [peer] });
    }
  });

  // Join existing room
  socket.on('join-room', ({ roomId, peerInfo }, callback) => {
    const cleanRoomId = roomId ? roomId.trim().toUpperCase() : '';
    const roomPeers = rooms.get(cleanRoomId);

    if (!roomPeers) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room not found. Please check the room code.' });
      }
      return;
    }

    const peer = {
      socketId: socket.id,
      ...peerInfo,
      joinedAt: new Date().toISOString()
    };

    // Notify existing room members that a new peer joined
    socket.to(cleanRoomId).emit('peer-joined', { peer });

    // Add new peer to room map
    roomPeers.set(socket.id, peer);
    socket.join(cleanRoomId);
    socket.currentRoom = cleanRoomId;

    const allPeers = Array.from(roomPeers.values());
    console.log(`[Peer Joined] Room: ${cleanRoomId}, Socket: ${socket.id}, Total Peers: ${allPeers.length}`);

    if (typeof callback === 'function') {
      callback({ success: true, roomId: cleanRoomId, peers: allPeers });
    }
  });

  // WebRTC Signal Forwarding (Offer, Answer, ICE Candidates)
  socket.on('signal', ({ targetSocketId, signalData }) => {
    io.to(targetSocketId).emit('signal', {
      senderSocketId: socket.id,
      signalData
    });
  });

  // Peer metadata update (e.g. name or status change)
  socket.on('update-peer-info', ({ peerInfo }) => {
    const roomId = socket.currentRoom;
    if (roomId && rooms.has(roomId)) {
      const roomPeers = rooms.get(roomId);
      if (roomPeers.has(socket.id)) {
        const updated = { ...roomPeers.get(socket.id), ...peerInfo };
        roomPeers.set(socket.id, updated);
        io.to(roomId).emit('peer-updated', { peer: updated });
      }
    }
  });

  // Log completed transfer into AWS RDS
  socket.on('log-completed-transfer', (data) => {
    logTransfer({
      fileId: data.fileId,
      roomCode: socket.currentRoom || data.roomCode || 'DIRECT',
      fileName: data.fileName,
      fileSizeBytes: data.fileSize,
      fileType: data.fileType,
      senderAlias: data.senderAlias || 'Peer',
      receiverAlias: data.receiverAlias || 'Peer',
      status: 'completed'
    });
  });

  // Explicit leave room
  socket.on('leave-room', () => {
    handleLeave(socket);
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const roomId = socket.currentRoom;
  if (!roomId) return;

  const roomPeers = rooms.get(roomId);
  if (roomPeers) {
    roomPeers.delete(socket.id);
    socket.to(roomId).emit('peer-left', { socketId: socket.id });

    if (roomPeers.size === 0) {
      rooms.delete(roomId);
      console.log(`[Room Cleaned] Room ${roomId} is now empty and removed.`);
    }
  }

  socket.leave(roomId);
  socket.currentRoom = null;
}

const PORT = process.env.PORT || 3001;

// Initialize DB and start server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`⚡ [Signaling & DB Server] Running on http://localhost:${PORT}`);
  });
});
