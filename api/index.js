import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// AWS RDS PostgreSQL Pool
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
}

let isDbInitialized = false;
async function ensureDb() {
  if (isDbInitialized || !pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_code VARCHAR(10) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS room_peers (
        id SERIAL PRIMARY KEY,
        peer_id VARCHAR(100) NOT NULL,
        room_code VARCHAR(10) NOT NULL,
        peer_info JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        target_peer_id VARCHAR(100) NOT NULL,
        sender_peer_id VARCHAR(100) NOT NULL,
        signal_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transfer_logs (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(100) NOT NULL,
        room_code VARCHAR(10) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        file_type VARCHAR(100),
        sender_alias VARCHAR(100),
        receiver_alias VARCHAR(100),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isDbInitialized = true;
    console.log('✅ AWS RDS Serverless Schema Ready');
  } catch (err) {
    console.error('AWS RDS Init Error:', err.message);
  }
}

// Middleware to ensure DB schema
app.use(async (req, res, next) => {
  await ensureDb();
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'Vercel Serverless + AWS RDS',
    dbConnected: Boolean(pool),
    timestamp: new Date().toISOString()
  });
});

// Create Room
app.post('/api/rooms/create', async (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let roomCode = '';
  for (let i = 0; i < 6; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (pool) {
    try {
      await pool.query('INSERT INTO rooms (room_code) VALUES ($1) ON CONFLICT DO NOTHING', [roomCode]);
    } catch (e) {
      console.error('RDS insert room error:', e);
    }
  }

  res.json({ success: true, roomCode });
});

// Join Room / Register Peer
app.post('/api/rooms/join', async (req, res) => {
  const { roomCode, peerId, peerInfo } = req.body;
  const cleanCode = (roomCode || '').trim().toUpperCase();

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO room_peers (peer_id, room_code, peer_info)
         VALUES ($1, $2, $3)`,
        [peerId, cleanCode, JSON.stringify(peerInfo)]
      );

      // Fetch existing peers in room
      const result = await pool.query(
        `SELECT peer_id as "peerId", peer_info as "peerInfo"
         FROM room_peers
         WHERE room_code = $1 AND updated_at > NOW() - INTERVAL '5 minutes'`,
        [cleanCode]
      );

      return res.json({ success: true, roomCode: cleanCode, peers: result.rows });
    } catch (e) {
      console.error('RDS join room error:', e);
    }
  }

  res.json({ success: true, roomCode: cleanCode, peers: [] });
});

// Log Completed Transfer into AWS RDS
app.post('/api/logs/transfer', async (req, res) => {
  const { fileId, roomCode, fileName, fileSize, fileType, senderAlias, receiverAlias } = req.body;

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO transfer_logs (file_id, room_code, file_name, file_size_bytes, file_type, sender_alias, receiver_alias)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fileId, roomCode || 'DIRECT', fileName, fileSize, fileType, senderAlias, receiverAlias]
      );
      console.log(`[AWS RDS Serverless] Logged: ${fileName}`);
    } catch (e) {
      console.error('RDS log error:', e);
    }
  }

  res.json({ success: true });
});

// Fetch Transfer Logs
app.get('/api/logs/history', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT id, file_id as "fileId", room_code as "roomCode", file_name as "fileName",
                file_size_bytes as "fileSizeBytes", file_type as "fileType",
                sender_alias as "senderAlias", receiver_alias as "receiverAlias",
                status, created_at as "createdAt"
         FROM transfer_logs
         ORDER BY created_at DESC LIMIT 30`
      );
      return res.json({ success: true, history: result.rows });
    } catch (e) {
      console.error('RDS history error:', e);
    }
  }

  res.json({ success: true, history: [] });
});

export default app;
