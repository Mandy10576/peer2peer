import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { getDeviceInfo, formatBytes, formatTime } from '../utils/deviceInfo';
import { playSound } from '../utils/audioNotification';

const CHUNK_SIZE = 64 * 1024; // 64KB per WebRTC data chunk
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || '';

export function useWebRTC() {
  const [socket, setSocket] = useState(null);
  const [peerInstance, setPeerInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [myPeerInfo, setMyPeerInfo] = useState(null);
  const [peers, setPeers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active PeerJS data connections map: targetSocketId/peerId -> DataConnection
  const dataConnections = useRef(new Map());
  // Incoming file chunk buffers: fileId -> buffer
  const incomingBuffers = useRef(new Map());
  // Pause & Cancel state maps
  const transferPauseStates = useRef(new Map());
  const transferCancelStates = useRef(new Map());

  // Initialize device info
  useEffect(() => {
    const info = getDeviceInfo();
    setMyPeerInfo(info);

    // If custom Socket.IO signaling URL is set, connect to it
    if (SIGNALING_URL && SIGNALING_URL !== 'http://localhost:3001') {
      const newSocket = io(SIGNALING_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10
      });
      newSocket.on('connect', () => {
        setIsConnected(true);
        setMyPeerInfo((prev) => ({ ...prev, socketId: newSocket.id }));
      });
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, []);

  // Helper to log transfer to Vercel Serverless Function -> AWS RDS
  const logTransferToRDS = useCallback((logData) => {
    fetch('/api/logs/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch((err) => console.warn('RDS Log failed:', err));
  }, []);

  // Handle incoming data channel messages (Headers, Chunks, Control)
  const handleIncomingMessage = useCallback(async (senderId, data) => {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);

        if (msg.type === 'PEER_INFO') {
          // Received peer metadata
          setPeers((prev) => {
            if (prev.some((p) => p.socketId === senderId)) return prev;
            if (soundEnabled) playSound('join');
            return [...prev, { socketId: senderId, ...msg.peerInfo }];
          });
        } else if (msg.type === 'FILE_HEADER') {
          incomingBuffers.current.set(msg.fileId, {
            chunks: [],
            header: msg,
            bytesReceived: 0,
            startTime: Date.now(),
            lastSpeedCheck: Date.now(),
            lastBytesCount: 0,
            currentSpeed: 0
          });

          setTransfers((prev) => [
            {
              id: msg.fileId,
              fileId: msg.fileId,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              fileType: msg.fileType,
              senderSocketId: senderId,
              type: 'receive',
              transferredBytes: 0,
              progress: 0,
              speed: '0 KB/s',
              timeRemaining: 'Calculating...',
              status: 'transferring',
              paused: false
            },
            ...prev
          ]);
        } else if (msg.type === 'PAUSE_TRANSFER') {
          setTransfers((prev) =>
            prev.map((t) => (t.fileId === msg.fileId ? { ...t, status: 'paused', paused: true } : t))
          );
        } else if (msg.type === 'RESUME_TRANSFER') {
          setTransfers((prev) =>
            prev.map((t) => (t.fileId === msg.fileId ? { ...t, status: 'transferring', paused: false } : t))
          );
        } else if (msg.type === 'CANCEL_TRANSFER') {
          incomingBuffers.current.delete(msg.fileId);
          setTransfers((prev) =>
            prev.map((t) => (t.fileId === msg.fileId ? { ...t, status: 'cancelled' } : t))
          );
        }
      } catch (e) {
        console.error('Error parsing channel message:', e);
      }
      return;
    }

    // Binary ArrayBuffer / Uint8Array / Blob chunk received
    let chunkBuffer = null;
    if (data instanceof ArrayBuffer) {
      chunkBuffer = data;
    } else if (ArrayBuffer.isView(data)) {
      chunkBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else if (data && typeof data === 'object' && data.byteLength !== undefined && data.buffer) {
      chunkBuffer = data.buffer.slice(data.byteOffset || 0, (data.byteOffset || 0) + data.byteLength);
    } else if (data instanceof Blob) {
      chunkBuffer = await data.arrayBuffer();
    }

    if (chunkBuffer) {
      for (const [fileId, buffer] of incomingBuffers.current.entries()) {
        if (buffer.bytesReceived < buffer.header.fileSize) {
          buffer.chunks.push(chunkBuffer);
          buffer.bytesReceived += chunkBuffer.byteLength;

          const now = Date.now();
          const elapsed = (now - buffer.lastSpeedCheck) / 1000;

          if (elapsed >= 0.5) {
            const bytesSinceLast = buffer.bytesReceived - buffer.lastBytesCount;
            buffer.currentSpeed = bytesSinceLast / elapsed;
            buffer.lastSpeedCheck = now;
            buffer.lastBytesCount = buffer.bytesReceived;
          }

          const remainingBytes = buffer.header.fileSize - buffer.bytesReceived;
          const etaSecs = buffer.currentSpeed > 0 ? remainingBytes / buffer.currentSpeed : 0;
          const progress = Math.min(100, Math.round((buffer.bytesReceived / buffer.header.fileSize) * 100));

          if (buffer.bytesReceived >= buffer.header.fileSize) {
            const blob = new Blob(buffer.chunks, { type: buffer.header.fileType || 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(blob);

            setTransfers((prev) =>
              prev.map((t) =>
                t.fileId === fileId
                  ? {
                      ...t,
                      transferredBytes: buffer.header.fileSize,
                      progress: 100,
                      speed: 'Done',
                      timeRemaining: 'Complete',
                      status: 'completed',
                      blobUrl
                    }
                  : t
              )
            );

            if (soundEnabled) playSound('complete');

            // Log to AWS RDS via Vercel Serverless Function
            logTransferToRDS({
              fileId,
              roomCode: roomId || 'DIRECT',
              fileName: buffer.header.fileName,
              fileSize: buffer.header.fileSize,
              fileType: buffer.header.fileType,
              senderAlias: 'Remote Peer',
              receiverAlias: myPeerInfo?.name || 'Local Peer'
            });

            incomingBuffers.current.delete(fileId);
          } else {
            setTransfers((prev) =>
              prev.map((t) =>
                t.fileId === fileId
                  ? {
                      ...t,
                      transferredBytes: buffer.bytesReceived,
                      progress,
                      speed: `${formatBytes(buffer.currentSpeed)}/s`,
                      timeRemaining: formatTime(etaSecs)
                    }
                  : t
              )
            );
          }
          break;
        }
      }
    }
  }, [soundEnabled, roomId, myPeerInfo, logTransferToRDS]);

  // Setup PeerJS connection listeners
  const setupDataConnection = useCallback((conn, isHost) => {
    dataConnections.current.set(conn.peer, conn);

    conn.on('open', () => {
      console.log('PeerJS DataConnection opened with:', conn.peer);
      // Send device metadata
      const info = getDeviceInfo();
      conn.send(JSON.stringify({ type: 'PEER_INFO', peerInfo: info }));

      setPeers((prev) => {
        if (prev.some((p) => p.socketId === conn.peer)) return prev;
        if (soundEnabled) playSound('join');
        return [...prev, { socketId: conn.peer, ...info }];
      });
    });

    conn.on('data', (data) => {
      handleIncomingMessage(conn.peer, data);
    });

    conn.on('close', () => {
      console.log('PeerJS Connection closed:', conn.peer);
      setPeers((prev) => prev.filter((p) => p.socketId !== conn.peer));
      dataConnections.current.delete(conn.peer);
      if (soundEnabled) playSound('leave');
    });

    conn.on('error', (err) => {
      console.error('PeerConnection error:', err);
    });
  }, [handleIncomingMessage, soundEnabled]);

  // Create Room
  const createRoom = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const peerId = `aerodrop-${code}`;
    const peer = new Peer(peerId, { config: ICE_SERVERS, debug: 1 });

    peer.on('open', (id) => {
      console.log('Room created on PeerJS Cloud with ID:', id);
      setRoomId(code);
      setPeerInstance(peer);
    });

    peer.on('connection', (conn) => {
      console.log('Incoming peer connection to room:', conn.peer);
      setupDataConnection(conn, true);
    });

    peer.on('error', (err) => {
      console.error('PeerJS create room error:', err);
      // Retry if ID taken
      if (err.type === 'unavailable-id') {
        createRoom();
      }
    });
  }, [setupDataConnection]);

  // Join Room
  const joinRoom = useCallback((code) => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    if (!cleanCode) return Promise.reject('Invalid room code');

    return new Promise((resolve, reject) => {
      const myTempId = `aerodrop-client-${Math.random().toString(36).substr(2, 6)}`;
      const peer = new Peer(myTempId, { config: ICE_SERVERS, debug: 1 });

      peer.on('open', () => {
        const hostPeerId = `aerodrop-${cleanCode}`;
        console.log(`Connecting to host peer: ${hostPeerId}`);
        const conn = peer.connect(hostPeerId, { reliable: true });

        setupDataConnection(conn, false);

        conn.on('open', () => {
          setRoomId(cleanCode);
          setPeerInstance(peer);
          resolve(cleanCode);
        });

        conn.on('error', (err) => {
          reject('Could not connect to room. Please check the code.');
        });
      });

      peer.on('error', (err) => {
        reject('Could not join room. PeerJS connection error.');
      });
    });
  }, [setupDataConnection]);

  // Leave Room
  const leaveRoom = useCallback(() => {
    if (peerInstance) {
      peerInstance.destroy();
    }
    dataConnections.current.forEach((conn) => conn.close());
    dataConnections.current.clear();
    setPeerInstance(null);
    setRoomId(null);
    setPeers([]);
  }, [peerInstance]);

  // Send Files to target or all peers
  const sendFiles = useCallback(
    async (targetId, files) => {
      const conn = dataConnections.current.get(targetId);
      if (!conn || !conn.open) {
        alert('WebRTC Peer Connection is establishing or disconnected. Please try again.');
        return;
      }

      for (const file of files) {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const transferObj = {
          id: fileId,
          fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          receiverSocketId: targetId,
          type: 'send',
          transferredBytes: 0,
          progress: 0,
          speed: '0 KB/s',
          timeRemaining: 'Starting...',
          status: 'transferring',
          paused: false,
          fileRef: file
        };

        setTransfers((prev) => [transferObj, ...prev]);

        // Send Header
        conn.send(
          JSON.stringify({
            type: 'FILE_HEADER',
            fileId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            totalChunks
          })
        );

        // Stream binary chunks
        let offset = 0;
        let lastSpeedCheck = Date.now();
        let lastBytesCount = 0;
        let currentSpeed = 0;

        while (offset < file.size) {
          if (transferCancelStates.current.get(fileId)) {
            conn.send(JSON.stringify({ type: 'CANCEL_TRANSFER', fileId }));
            transferCancelStates.current.delete(fileId);
            break;
          }

          while (transferPauseStates.current.get(fileId)) {
            await new Promise((r) => setTimeout(r, 200));
            if (transferCancelStates.current.get(fileId)) break;
          }

          // Buffer control
          if (conn.dataChannel && conn.dataChannel.bufferedAmount > 1024 * 1024) {
            await new Promise((resolve) => {
              const checkBuffer = () => {
                if (conn.dataChannel.bufferedAmount <= 256 * 1024) {
                  resolve();
                } else {
                  setTimeout(checkBuffer, 50);
                }
              };
              checkBuffer();
            });
          }

          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const chunk = await slice.arrayBuffer();

          try {
            conn.send(chunk);
          } catch (e) {
            console.error('Error sending chunk:', e);
            setTransfers((prev) =>
              prev.map((t) => (t.fileId === fileId ? { ...t, status: 'error' } : t))
            );
            break;
          }

          offset += chunk.byteLength;

          const now = Date.now();
          const elapsed = (now - lastSpeedCheck) / 1000;

          if (elapsed >= 0.5) {
            const bytesSinceLast = offset - lastBytesCount;
            currentSpeed = bytesSinceLast / elapsed;
            lastSpeedCheck = now;
            lastBytesCount = offset;
          }

          const remainingBytes = file.size - offset;
          const etaSecs = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;
          const progress = Math.min(100, Math.round((offset / file.size) * 100));

          setTransfers((prev) =>
            prev.map((t) =>
              t.fileId === fileId
                ? {
                    ...t,
                    transferredBytes: offset,
                    progress,
                    speed: `${formatBytes(currentSpeed)}/s`,
                    timeRemaining: formatTime(etaSecs)
                  }
                : t
            )
          );
        }

        if (offset >= file.size) {
          setTransfers((prev) =>
            prev.map((t) =>
              t.fileId === fileId
                ? {
                    ...t,
                    transferredBytes: file.size,
                    progress: 100,
                    speed: 'Sent',
                    timeRemaining: 'Complete',
                    status: 'completed'
                  }
                : t
            )
          );
          if (soundEnabled) playSound('complete');

          logTransferToRDS({
            fileId,
            roomCode: roomId || 'DIRECT',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            senderAlias: myPeerInfo?.name || 'Local Peer',
            receiverAlias: 'Remote Peer'
          });
        }
      }
    },
    [soundEnabled, roomId, myPeerInfo, logTransferToRDS]
  );

  // Pause Transfer
  const pauseTransfer = useCallback((fileId, targetId) => {
    transferPauseStates.current.set(fileId, true);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'paused', paused: true } : t))
    );
    const conn = dataConnections.current.get(targetId);
    if (conn && conn.open) {
      conn.send(JSON.stringify({ type: 'PAUSE_TRANSFER', fileId }));
    }
  }, []);

  // Resume Transfer
  const resumeTransfer = useCallback((fileId, targetId) => {
    transferPauseStates.current.set(fileId, false);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'transferring', paused: false } : t))
    );
    const conn = dataConnections.current.get(targetId);
    if (conn && conn.open) {
      conn.send(JSON.stringify({ type: 'RESUME_TRANSFER', fileId }));
    }
  }, []);

  // Cancel Transfer
  const cancelTransfer = useCallback((fileId, targetId) => {
    transferCancelStates.current.set(fileId, true);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'cancelled' } : t))
    );
    const conn = dataConnections.current.get(targetId);
    if (conn && conn.open) {
      conn.send(JSON.stringify({ type: 'CANCEL_TRANSFER', fileId }));
    }
  }, []);

  // Update Peer Name
  const updateMyName = useCallback((newName) => {
    setMyPeerInfo((prev) => ({ ...prev, name: newName }));
  }, []);

  return {
    socket,
    isConnected,
    roomId,
    myPeerInfo,
    peers,
    transfers,
    soundEnabled,
    setSoundEnabled,
    createRoom,
    joinRoom,
    leaveRoom,
    sendFiles,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    updateMyName
  };
}
