import React, { useState } from 'react';
import { Shield, Zap, Lock, ArrowRight, Sparkles, Clipboard, Wifi, Cpu, Laptop, Camera } from 'lucide-react';
import CameraQRScannerModal from './CameraQRScannerModal';

export default function HomeView({ createRoom, joinRoom, isConnected }) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!joinCode.trim()) return;
    setErrorMsg('');
    setIsJoining(true);

    try {
      await joinRoom(joinCode.trim().toUpperCase());
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : 'Could not join room. Please check the code.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCameraScanSuccess = async (scannedCode) => {
    setShowCameraScanner(false);
    setJoinCode(scannedCode);
    setIsJoining(true);
    setErrorMsg('');
    try {
      await joinRoom(scannedCode);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : 'Could not join room from scanned code.');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const match = text.match(/room=([A-Z0-9]{6})/i) || text.match(/([A-Z0-9]{6})/i);
        if (match) {
          setJoinCode(match[1].toUpperCase());
        } else {
          setJoinCode(text.trim().toUpperCase());
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 relative overflow-hidden min-h-[calc(100vh-57px)]">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl w-full text-center space-y-4 sm:space-y-6 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-cyan-400 shadow-xl">
          <Sparkles className="w-4 h-4" />
          <span>Server-less Direct Peer-to-Peer Transfer</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Transfer files <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">directly</span> across devices.
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto font-normal px-2">
            No cloud uploads. No size limits. High-speed WebRTC data channels stream files directly between devices.
          </p>
        </div>

        {/* Action Cards: Create Room or Join Room */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto text-left">
          {/* Create Room Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors">
              <Zap className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1]" />
            </div>

            <div className="space-y-3 sm:space-y-4 relative z-10">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">Create a New Room</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-snug">
                  Instant room code or QR to share with nearby/remote devices.
                </p>
              </div>
            </div>

            <div className="pt-5 sm:pt-6 relative z-10">
              <button
                onClick={createRoom}
                disabled={!isConnected}
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
              >
                <span>Create Transfer Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
              <Cpu className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1]" />
            </div>

            <div className="space-y-3 sm:space-y-4 relative z-10">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">Join Existing Room</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-snug">
                  Enter 6-digit room code or scan QR with camera.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="pt-4 space-y-3 relative z-10">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DROP01"
                    className="w-full py-3.5 px-4 rounded-xl glass-input tracking-widest text-center font-mono font-bold text-base sm:text-lg uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 placeholder:text-xs"
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Paste Code"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>

                {/* Camera Scan Button */}
                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="py-3.5 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 transition-colors"
                  title="Scan QR Code with Camera"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={!isConnected || !joinCode.trim() || isJoining}
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
              >
                {isJoining ? (
                  <span>Joining Room...</span>
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4 text-purple-400" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto pt-1">
          <div className="px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800/60 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">100% Direct P2P</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800/60 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">Maximum Speed</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800/60 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">Cross-Platform</span>
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showCameraScanner && (
        <CameraQRScannerModal
          onScanSuccess={handleCameraScanSuccess}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
}
