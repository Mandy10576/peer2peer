import React, { useState, useRef } from 'react';
import { QrCode, Copy, Check, LogOut, UploadCloud, Smartphone, Laptop, Monitor, Send, Users, Sparkles, FilePlus } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

export default function RoomView({ roomId, myPeerInfo, peers, sendFiles, leaveRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTargetPeer, setSelectedTargetPeer] = useState(null);
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
      e.target.value = '';
    }
  };

  const dispatchSendFiles = (files) => {
    if (peers.length === 0) {
      alert('No other devices connected in this room. Please scan the QR code or share the link with another device.');
      return;
    }

    if (selectedTargetPeer) {
      sendFiles(selectedTargetPeer.socketId, files);
    } else {
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
    if (type === 'mobile') return <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />;
    if (type === 'tablet') return <Laptop className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />;
    return <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 pb-36 sm:pb-24 relative min-h-[calc(100vh-55px)]"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-cyan-950/90 backdrop-blur-xl border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none animate-pulse px-4 text-center">
          <UploadCloud className="w-16 h-16 sm:w-24 sm:h-24 text-cyan-400 mb-3" />
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">Drop Files Here to Send</h2>
          <p className="text-cyan-200 mt-1 text-xs sm:text-base">Direct WebRTC stream will start immediately</p>
        </div>
      )}

      {/* Room Info Header */}
      <div className="w-full max-w-4xl glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Room</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 font-mono border border-slate-800">
                  {peers.length + 1} {peers.length === 0 ? 'Device' : 'Devices'}
                </span>
              </div>
              <span className="font-mono font-extrabold text-lg sm:text-xl text-cyan-300 tracking-wider">{roomId}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleCopyLink}
            className="py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="truncate">{copiedLink ? 'Copied' : 'Link'}</span>
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>QR</span>
          </button>

          <button
            onClick={leaveRoom}
            className="py-2 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-[11px] font-semibold text-rose-400 flex items-center justify-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Radar / Peer Canvas */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center relative my-2 min-h-[300px]">
        {/* Cyber Radar Backdrop Rings */}
        <div className="absolute w-[240px] h-[240px] sm:w-[420px] sm:h-[420px] rounded-full border border-cyan-500/10 pointer-events-none" />
        <div className="absolute w-[170px] h-[170px] sm:w-[300px] sm:h-[300px] rounded-full border border-purple-500/10 pointer-events-none" />
        <div className="absolute w-[100px] h-[100px] sm:w-[160px] sm:h-[160px] rounded-full border border-slate-800 pointer-events-none" />

        {/* Pulse Radar rings */}
        <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-cyan-500/20 animate-radar pointer-events-none" />
        <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-purple-500/20 animate-radar-delayed pointer-events-none" />

        {/* Center Node (Your Device) */}
        <div className="relative z-20 flex flex-col items-center text-center my-4">
          <div className="relative group">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 sm:p-1 shadow-xl shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[12px] sm:rounded-[14px] flex items-center justify-center text-cyan-400">
                {getDeviceIcon(myPeerInfo?.deviceType)}
              </div>
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
              YOU
            </span>
          </div>
          <h4 className="font-bold text-slate-200 text-xs sm:text-sm mt-2">{myPeerInfo?.name || 'Your Device'}</h4>
          <p className="text-[10px] text-slate-500">{myPeerInfo?.os} • {myPeerInfo?.browser}</p>
        </div>

        {/* Connected Peers Display */}
        {peers.length === 0 ? (
          <div className="relative z-10 text-center max-w-xs sm:max-w-sm p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 mt-2 backdrop-blur-md">
            <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">Waiting for peers to join...</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Share the QR code or link with another device to transfer files.
            </p>
            <button
              onClick={() => setShowQR(true)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show QR Code</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-20 mt-4">
            {peers.map((peer) => {
              const isSelected = selectedTargetPeer?.socketId === peer.socketId;
              return (
                <div
                  key={peer.socketId}
                  onClick={() => setSelectedTargetPeer(isSelected ? null : peer)}
                  className={`glass-card p-3.5 sm:p-4 rounded-2xl border cursor-pointer relative transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getDeviceIcon(peer.deviceType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-200 text-xs sm:text-sm truncate">{peer.name}</h4>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {peer.os} • {peer.browser}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Ready</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTargetPeer(peer);
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Send Controls */}
      <div className="w-full max-w-3xl glass-panel p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30 shadow-2xl mt-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 truncate">
              {selectedTargetPeer ? `Send to: ${selectedTargetPeer.name}` : 'Broadcast to All Peers'}
            </h4>
            <p className="text-[10px] text-slate-400">Select files to stream directly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedTargetPeer && (
            <button
              onClick={() => setSelectedTargetPeer(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={peers.length === 0}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Select & Send Files</span>
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && <QRCodeModal roomId={roomId} onClose={() => setShowQR(false)} />}
    </div>
  );
}
