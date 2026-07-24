import { useState, useEffect, useRef, useCallback } from 'react';
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

// Default signaling server URL (or fallback to window location)
let SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3001';

// Mixed Content Guard: If running on HTTPS (e.g. Vercel) and URL starts with http:// (non-localhost), upgrade to https://
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && SIGNALING_URL.startsWith('http://') && !SIGNALING_URL.includes('localhost')) {
  console.warn('⚠️ [SSL Guard] App is running on HTTPS (Vercel) but VITE_SIGNALING_URL uses http://. Upgrading to https:// to prevent Mixed Content blocking.');
  SIGNALING_URL = SIGNALING_URL.replace('http://', 'https://');
}

export function useWebRTC() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [myPeerInfo, setMyPeerInfo] = useState(null);
  const [peers, setPeers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // WebRTC PeerConnections map: targetSocketId -> RTCPeerConnection
  const peerConnections = useRef(new Map());
  // WebRTC DataChannels map: targetSocketId -> RTCDataChannel
  const dataChannels = useRef(new Map());
  // Incoming file chunk buffers: fileId -> { chunks: [], header: {}, bytesReceived: 0, startTime: number }
  const incomingBuffers = useRef(new Map());
  // Outgoing transfer pause controllers: fileId -> boolean (isPaused)
  const transferPauseStates = useRef(new Map());
  // Outgoing transfer cancellation controllers: fileId -> boolean (isCancelled)
  const transferCancelStates = useRef(new Map());

  // Socket initialization
  useEffect(() => {
    const info = getDeviceInfo();
    setMyPeerInfo(info);

    const newSocket = io(SIGNALING_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('Connected to signaling server:', newSocket.id);
      setIsConnected(true);
      setMyPeerInfo((prev) => ({ ...prev, socketId: newSocket.id }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Helper to send data channel message
  const sendChannelMessage = useCallback((targetSocketId, data) => {
    const dc = dataChannels.current.get(targetSocketId);
    if (dc && dc.readyState === 'open') {
      try {
        dc.send(typeof data === 'string' ? data : JSON.stringify(data));
      } catch (err) {
        console.error('DataChannel send error:', err);
      }
    }
  }, []);

  // Initialize WebRTC Connection to a peer
  const createPeerConnection = useCallback((targetSocketId, isInitiator) => {
    if (peerConnections.current.has(targetSocketId)) {
      return peerConnections.current.get(targetSocketId);
    }

    console.log(`Creating PeerConnection to ${targetSocketId} (initiator: ${isInitiator})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(targetSocketId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', {
          targetSocketId,
          signalData: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    const setupDataChannel = (dc) => {
      dc.binaryType = 'arraybuffer';
      dataChannels.current.set(targetSocketId, dc);

      dc.onopen = () => {
        console.log(`DataChannel connected with ${targetSocketId}`);
      };

      dc.onclose = () => {
        console.log(`DataChannel closed with ${targetSocketId}`);
      };

      dc.onmessage = (event) => {
        handleIncomingDataChannelMessage(targetSocketId, event.data);
      };
    };

    if (isInitiator) {
      const dc = pc.createDataChannel('fileTransfer', { ordered: true });
      setupDataChannel(dc);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit('signal', {
            targetSocketId,
            signalData: { type: 'offer', offer: pc.localDescription }
          });
        })
        .catch((err) => console.error('Error creating offer:', err));
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    }

    return pc;
  }, [socket]);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async ({ senderSocketId, signalData }) => {
      let pc = peerConnections.current.get(senderSocketId);

      if (!pc) {
        pc = createPeerConnection(senderSocketId, false);
      }

      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', {
          targetSocketId: senderSocketId,
          signalData: { type: 'answer', offer: pc.localDescription }
        });
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
      } else if (signalData.type === 'candidate' && signalData.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    };

    const handlePeerJoined = ({ peer }) => {
      console.log('Peer joined room:', peer);
      setPeers((prev) => {
        if (prev.some((p) => p.socketId === peer.socketId)) return prev;
        return [...prev, peer];
      });

      if (soundEnabled) playSound('join');

      // Initiate WebRTC connection if our socket ID is greater (prevents duplicate calls)
      if (socket.id > peer.socketId) {
        createPeerConnection(peer.socketId, true);
      }
    };

    const handlePeerLeft = ({ socketId }) => {
      console.log('Peer left room:', socketId);
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      if (soundEnabled) playSound('leave');

      // Cleanup WebRTC connections
      if (peerConnections.current.has(socketId)) {
        peerConnections.current.get(socketId).close();
        peerConnections.current.delete(socketId);
      }
      dataChannels.current.delete(socketId);
    };

    socket.on('signal', handleSignal);
    socket.on('peer-joined', handlePeerJoined);
    socket.on('peer-left', handlePeerLeft);

    return () => {
      socket.off('signal', handleSignal);
      socket.off('peer-joined', handlePeerJoined);
      socket.off('peer-left', handlePeerLeft);
    };
  }, [socket, createPeerConnection, soundEnabled]);

  // Incoming DataChannel message handler (Headers, Chunks, Control)
  const handleIncomingDataChannelMessage = useCallback((senderSocketId, data) => {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);

        if (msg.type === 'FILE_HEADER') {
          // New file transfer header incoming
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
              senderSocketId,
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
        console.error('Error parsing DataChannel JSON:', e);
      }
      return;
    }

    // Binary ArrayBuffer chunk received
    if (data instanceof ArrayBuffer) {
      // Find matching incoming buffer (assuming active receiving transfers)
      for (const [fileId, buffer] of incomingBuffers.current.entries()) {
        if (buffer.bytesReceived < buffer.header.fileSize) {
          buffer.chunks.push(data);
          buffer.bytesReceived += data.byteLength;

          const now = Date.now();
          const elapsed = (now - buffer.lastSpeedCheck) / 1000;
          
          if (elapsed >= 0.5) {
            const bytesSinceLast = buffer.bytesReceived - buffer.lastBytesCount;
            const speedBps = bytesSinceLast / elapsed;
            buffer.currentSpeed = speedBps;
            buffer.lastSpeedCheck = now;
            buffer.lastBytesCount = buffer.bytesReceived;
          }

          const remainingBytes = buffer.header.fileSize - buffer.bytesReceived;
          const etaSecs = buffer.currentSpeed > 0 ? remainingBytes / buffer.currentSpeed : 0;
          const progress = Math.min(100, Math.round((buffer.bytesReceived / buffer.header.fileSize) * 100));

          // Check if file is completely received
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

            // Log transfer to backend/AWS RDS
            if (socket) {
              socket.emit('log-completed-transfer', {
                fileId,
                fileName: buffer.header.fileName,
                fileSize: buffer.header.fileSize,
                fileType: buffer.header.fileType,
                senderAlias: 'Remote Peer',
                receiverAlias: myPeerInfo?.name || 'Local Peer'
              });
            }

            incomingBuffers.current.delete(fileId);
          } else {
            // Update live progress
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
  }, [soundEnabled]);

  // Actions: Create Room
  const createRoom = useCallback(() => {
    if (!socket || !isConnected) return;
    const info = getDeviceInfo();
    socket.emit('create-room', { peerInfo: info }, (response) => {
      if (response && response.success) {
        setRoomId(response.roomId);
        setPeers(response.peers.filter((p) => p.socketId !== socket.id));
      }
    });
  }, [socket, isConnected]);

  // Actions: Join Room
  const joinRoom = useCallback(
    (code) => {
      if (!socket || !isConnected) return Promise.reject('Socket disconnected');
      return new Promise((resolve, reject) => {
        const info = getDeviceInfo();
        socket.emit('join-room', { roomId: code, peerInfo: info }, (response) => {
          if (response && response.success) {
            setRoomId(response.roomId);
            setPeers(response.peers.filter((p) => p.socketId !== socket.id));
            resolve(response.roomId);
          } else {
            reject(response ? response.error : 'Failed to join room');
          }
        });
      });
    },
    [socket, isConnected]
  );

  // Actions: Leave Room
  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leave-room');
    }
    setRoomId(null);
    setPeers([]);

    // Close all WebRTC channels
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    dataChannels.current.clear();
  }, [socket, roomId]);

  // Actions: Send Files to target peer
  const sendFiles = useCallback(
    async (targetSocketId, files) => {
      const dc = dataChannels.current.get(targetSocketId);
      if (!dc || dc.readyState !== 'open') {
        alert('WebRTC DataChannel is establishing or disconnected. Please try again in a moment.');
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
          receiverSocketId: targetSocketId,
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
        sendChannelMessage(targetSocketId, {
          type: 'FILE_HEADER',
          fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks
        });

        // Stream Chunks with backpressure handling & pause/cancel support
        let offset = 0;
        let lastSpeedCheck = Date.now();
        let lastBytesCount = 0;
        let currentSpeed = 0;

        while (offset < file.size) {
          // Check cancellation
          if (transferCancelStates.current.get(fileId)) {
            sendChannelMessage(targetSocketId, { type: 'CANCEL_TRANSFER', fileId });
            transferCancelStates.current.delete(fileId);
            break;
          }

          // Check pause state loop
          while (transferPauseStates.current.get(fileId)) {
            await new Promise((r) => setTimeout(r, 200));
            if (transferCancelStates.current.get(fileId)) break;
          }

          // Handle WebRTC DataChannel buffer threshold backpressure
          if (dc.bufferedAmount > 1024 * 1024) {
            await new Promise((resolve) => {
              const checkBuffer = () => {
                if (dc.bufferedAmount <= 256 * 1024) {
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
            dc.send(chunk);
          } catch (e) {
            console.error('Error sending chunk:', e);
            setTransfers((prev) =>
              prev.map((t) => (t.fileId === fileId ? { ...t, status: 'error' } : t))
            );
            break;
          }

          offset += chunk.byteLength;

          // Speed and Progress calculations
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

        // Completion
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
        }
      }
    },
    [sendChannelMessage, soundEnabled]
  );

  // Actions: Pause Transfer
  const pauseTransfer = useCallback((fileId, targetSocketId) => {
    transferPauseStates.current.set(fileId, true);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'paused', paused: true } : t))
    );
    if (targetSocketId) {
      sendChannelMessage(targetSocketId, { type: 'PAUSE_TRANSFER', fileId });
    }
  }, [sendChannelMessage]);

  // Actions: Resume Transfer
  const resumeTransfer = useCallback((fileId, targetSocketId) => {
    transferPauseStates.current.set(fileId, false);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'transferring', paused: false } : t))
    );
    if (targetSocketId) {
      sendChannelMessage(targetSocketId, { type: 'RESUME_TRANSFER', fileId });
    }
  }, [sendChannelMessage]);

  // Actions: Cancel Transfer
  const cancelTransfer = useCallback((fileId, targetSocketId) => {
    transferCancelStates.current.set(fileId, true);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'cancelled' } : t))
    );
    if (targetSocketId) {
      sendChannelMessage(targetSocketId, { type: 'CANCEL_TRANSFER', fileId });
    }
  }, [sendChannelMessage]);

  // Actions: Update Peer Name
  const updateMyName = useCallback(
    (newName) => {
      setMyPeerInfo((prev) => {
        const updated = { ...prev, name: newName };
        if (socket && roomId) {
          socket.emit('update-peer-info', { peerInfo: updated });
        }
        return updated;
      });
    },
    [socket, roomId]
  );

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
