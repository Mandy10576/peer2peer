import React, { useState } from 'react';
import { Shield, Zap, Lock, ArrowRight, Sparkles, Clipboard, Wifi, Cpu, Laptop, Smartphone } from 'lucide-react';

export default function HomeView({ createRoom, joinRoom, isConnected }) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Extract room code if full URL was pasted
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-cyan-400 shadow-xl">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Server-less Direct Peer-to-Peer Transfer</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Transfer files <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">directly</span> across devices.
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            No cloud uploads. No size limits. High-speed WebRTC data channels stream your photos, videos, and documents directly between devices.
          </p>
        </div>

        {/* Action Cards: Create Room or Join Room */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4 text-left">
          {/* Create Room Card */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors">
              <Zap className="w-24 h-24 stroke-[1]" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Create a New Room</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Start an instant room code or QR code to share with nearby or remote devices.
                </p>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <button
                onClick={createRoom}
                disabled={!isConnected}
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <span>Create Transfer Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
              <Cpu className="w-24 h-24 stroke-[1]" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Join Existing Room</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Enter the 6-character room code generated by another device.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="pt-6 space-y-3 relative z-10">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DROP01"
                  className="w-full py-3 px-4 rounded-xl glass-input tracking-widest text-center font-mono font-bold text-lg uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 placeholder:text-sm"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Paste Code from Clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

              <button
                type="submit"
                disabled={!isConnected || !joinCode.trim() || isJoining}
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
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

        {/* Feature Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">100% Direct P2P</h4>
              <p className="text-xs text-slate-400 mt-0.5">Files pass directly peer-to-peer. Zero server disk storage.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Maximum Speed</h4>
              <p className="text-xs text-slate-400 mt-0.5">Speed limited only by your local network or bandwidth.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Cross-Platform</h4>
              <p className="text-xs text-slate-400 mt-0.5">Works on Windows, Mac, Linux, Android, iOS browsers instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
