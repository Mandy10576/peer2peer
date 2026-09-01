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
    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 pt-4 pb-3 sm:py-5 relative overflow-hidden min-h-[calc(100vh-57px)]">
      <div className="max-w-4xl w-full text-center space-y-3 sm:space-y-4 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] sm:text-xs text-lime-400 shadow-xl">
          <Sparkles className="w-3 h-3" />
          <span>Server-less Direct Peer-to-Peer Transfer</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Transfer files <span className="text-lime-400">directly</span> across devices.
          </h1>
          <p className="hidden sm:block text-neutral-400 text-xs sm:text-sm max-w-xl mx-auto font-normal px-2">
            No cloud uploads. No size limits. High-speed WebRTC data channels stream files directly between devices.
          </p>
        </div>

        {/* Action Cards: Create Room or Join Room */}
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
          {/* Create Room Card */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-lime-500 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-neutral-800">
              <Zap className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1]" />
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lime-500 flex items-center justify-center text-black shrink-0">
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">Create a New Room</h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-snug">
                  Instant room code or QR to share with nearby/remote devices.
                </p>
              </div>
            </div>

            <div className="pt-3 relative z-10">
              <button
                onClick={createRoom}
                disabled={!isConnected}
                className="w-full py-2.5 px-5 rounded-xl font-semibold bg-lime-500 hover:bg-lime-400 text-black flex items-center justify-center gap-2 transition-colors disabled:opacity-50 active:scale-[0.98] text-xs sm:text-sm"
              >
                <span>Create Transfer Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-orange-500 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-neutral-800">
              <Cpu className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1]" />
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 flex items-center justify-center text-black shrink-0">
                <Laptop className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">Join Existing Room</h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-snug">
                  Enter 6-digit room code or scan QR with camera.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="pt-2.5 space-y-2 relative z-10">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DROP01"
                    className="w-full py-2.5 px-3.5 rounded-xl glass-input tracking-widest text-center font-mono font-bold text-sm sm:text-base uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-neutral-600 placeholder:text-xs"
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2.5 top-1/2 -tranneutral-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                    title="Paste Code"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Camera Scan Button */}
                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shrink-0 transition-colors"
                  title="Scan QR Code with Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={!isConnected || !joinCode.trim() || isJoining}
                className="w-full py-2.5 px-5 rounded-xl font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 active:scale-[0.98] text-xs sm:text-sm"
              >
                {isJoining ? (
                  <span>Joining Room...</span>
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto pt-1">
          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="text-[11px] font-medium text-neutral-300">100% Direct P2P</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="text-[11px] font-medium text-neutral-300">Maximum Speed</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-[11px] font-medium text-neutral-300">Cross-Platform</span>
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
