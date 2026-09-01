import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import RoomView from './components/RoomView';
import TransferList from './components/TransferList';
import { useWebRTC } from './hooks/useWebRTC';

export default function App() {
  const {
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
  } = useWebRTC();

  // Auto-join room from URL search parameter e.g., ?room=CODE
  useEffect(() => {
    if (isConnected && !roomId) {
      const params = new URLSearchParams(window.location.search);
      const urlRoomCode = params.get('room');
      if (urlRoomCode) {
        joinRoom(urlRoomCode.toUpperCase()).catch((err) => {
          console.warn('URL Auto-join failed:', err);
        });
      }
    }
  }, [isConnected, roomId, joinRoom]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navbar Header */}
      <Navbar
        isConnected={isConnected}
        myPeerInfo={myPeerInfo}
        updateMyName={updateMyName}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main View Body */}
      <main className="flex-1 flex flex-col">
        {!roomId ? (
          <HomeView createRoom={createRoom} joinRoom={joinRoom} isConnected={isConnected} />
        ) : (
          <RoomView
            roomId={roomId}
            myPeerInfo={myPeerInfo}
            peers={peers}
            sendFiles={sendFiles}
            leaveRoom={leaveRoom}
          />
        )}
      </main>

      {/* Active File Transfers Floating Drawer */}
      <TransferList
        transfers={transfers}
        pauseTransfer={pauseTransfer}
        resumeTransfer={resumeTransfer}
        cancelTransfer={cancelTransfer}
      />
    </div>
  );
}
