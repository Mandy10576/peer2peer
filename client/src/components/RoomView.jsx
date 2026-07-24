import React, { useState, useRef } from 'react';
import { QrCode, Copy, Check, LogOut, UploadCloud, Smartphone, Laptop, Monitor, Send, Users, ShieldCheck, Sparkles, FilePlus } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

export default function RoomView({ roomId, myPeerInfo, peers, sendFiles, leaveRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTargetPeer, setSelectedTargetPeer] = useState(null); // null = broadcast to all or pick target
  const fileInputRef = useRef(null);

  const roomUrl = `${window.location.origin}/?room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      dispatchSendFiles(filesArray);
      e.target.value = ''; // Reset input
    }
  };

  const dispatchSendFiles = (files) => {
    if (peers.length === 0) {
      alert('No other peers connected in this room. Please invite a device to start sending.');
      return;
    }

    if (selectedTargetPeer) {
      sendFiles(selectedTargetPeer.socketId, files);
    } else {
      // Send to all connected peers in room
      peers.forEach((peer) => {
        sendFiles(peer.socketId, files);
      });
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      dispatchSendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const getDeviceIcon = (type) => {
    if (type === 'mobile') return <Smartphone className="w-6 h-6 text-purple-400" />;
    if (type === 'tablet') return <Laptop className="w-6 h-6 text-cyan-400" />;
    return <Monitor className="w-6 h-6 text-cyan-400" />;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col items-center justify-between p-4 md:p-8 relative min-h-[calc(100vh-65px)]"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Fullscreen Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-cyan-950/90 backdrop-blur-xl border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none animate-pulse">
          <UploadCloud className="w-24 h-24 text-cyan-400 mb-4" />
          <h2 className="text-3xl font-extrabold text-white">Drop Files Here to Send</h2>
          <p className="text-cyan-200 mt-2 text-base">Direct WebRTC stream will begin immediately</p>
        </div>
      )}

      {/* Header Room Info Bar */}
      <div className="w-full max-w-5xl glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Room</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono border border-slate-800">
                {peers.length + 1} {peers.length === 0 ? 'Device' : 'Devices'}
              </span>
            </div>
            <span className="font-mono font-extrabold text-xl text-cyan-300 tracking-wider">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Room Link'}</span>
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Show QR</span>
          </button>

          <button
            onClick={leaveRoom}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Main Radar / Peer Canvas */}
      <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center relative my-4">
        {/* Cyber Radar Backdrop Circles */}
        <div className="absolute w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full border border-cyan-500/10 pointer-events-none" />
        <div className="absolute w-[220px] h-[220px] sm:w-[340px] sm:h-[340px] rounded-full border border-purple-500/10 pointer-events-none" />
        <div className="absolute w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] rounded-full border border-slate-800 pointer-events-none" />

        {/* Pulse Radar rings */}
        <div className="absolute w-64 h-64 rounded-full border border-cyan-500/20 animate-radar pointer-events-none" />
        <div className="absolute w-64 h-64 rounded-full border border-purple-500/20 animate-radar-delayed pointer-events-none" />

        {/* Center Node (Your Device) */}
        <div className="relative z-20 flex flex-col items-center text-center my-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 shadow-2xl shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                {getDeviceIcon(myPeerInfo?.deviceType)}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              YOU
            </span>
          </div>
          <h4 className="font-bold text-slate-200 text-sm mt-3">{myPeerInfo?.name || 'Your Device'}</h4>
          <p className="text-xs text-slate-500">{myPeerInfo?.os} • {myPeerInfo?.browser}</p>
        </div>

        {/* Connected Peers Radial Display */}
        {peers.length === 0 ? (
          <div className="relative z-10 text-center max-w-sm p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 mt-4 backdrop-blur-md">
            <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-sm">Waiting for peers to join...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Share the room link or QR code with another phone, laptop, or browser window to start sending files.
            </p>
            <button
              onClick={() => setShowQR(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Show QR Code</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl grid sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-20 mt-6">
            {peers.map((peer) => {
              const isSelected = selectedTargetPeer?.socketId === peer.socketId;
              return (
                <div
                  key={peer.socketId}
                  onClick={() => setSelectedTargetPeer(isSelected ? null : peer)}
                  className={`glass-card p-5 rounded-2xl border cursor-pointer relative transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {getDeviceIcon(peer.deviceType)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{peer.name}</h4>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {peer.os} • {peer.browser}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Direct P2P Ready</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTargetPeer(peer);
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send File</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Send Controls / Quick Drop Area */}
      <div className="w-full max-w-2xl glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 relative z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              {selectedTargetPeer ? `Send to: ${selectedTargetPeer.name}` : 'Broadcast to All Peers'}
            </h4>
            <p className="text-[11px] text-slate-400">Drag files here or click to select</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedTargetPeer && (
            <button
              onClick={() => setSelectedTargetPeer(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Clear Selection
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={peers.length === 0}
            className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <FilePlus className="w-4 h-4" />
            <span>Select & Send Files</span>
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && <QRCodeModal roomId={roomId} onClose={() => setShowQR(false)} />}
    </div>
  );
}
