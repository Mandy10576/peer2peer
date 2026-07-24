import React, { useState } from 'react';
import { ShieldCheck, Volume2, VolumeX, Edit2, Check, Zap, Server } from 'lucide-react';

export default function Navbar({ isConnected, myPeerInfo, updateMyName, soundEnabled, setSoundEnabled }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(myPeerInfo?.name || '');

  const handleNameSave = () => {
    if (tempName.trim()) {
      updateMyName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <nav className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                AeroDrop
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                P2P WebRTC
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Instant Direct File Transfer</p>
          </div>
        </div>

        {/* Status & Settings */}
        <div className="flex items-center gap-3">
          {/* Server Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-amber-500'}`} />
            <span className="text-slate-300 hidden md:inline">{isConnected ? 'Server Connected' : 'Connecting...'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Peer Alias Badge / Edit */}
          {myPeerInfo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-slate-950 border border-cyan-500/40 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none w-28"
                    autoFocus
                  />
                  <button onClick={handleNameSave} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">You:</span>
                  <span className="font-semibold text-cyan-300">{myPeerInfo.name}</span>
                  <button
                    onClick={() => {
                      setTempName(myPeerInfo.name);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    title="Edit Display Alias"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
