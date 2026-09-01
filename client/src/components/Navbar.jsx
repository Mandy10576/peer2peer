import React, { useState } from 'react';
import { Volume2, VolumeX, Edit2, Check, Zap } from 'lucide-react';

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
    <nav className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              AeroDrop
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              P2P
            </span>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-amber-500'}`} />
            <span className="text-slate-300 hidden md:inline">{isConnected ? 'Connected' : 'Connecting'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Peer Alias Badge / Edit */}
          {myPeerInfo && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 max-w-[130px] sm:max-w-none">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-slate-950 border border-cyan-500/40 rounded px-1.5 py-0.5 text-[11px] text-slate-100 focus:outline-none w-20"
                    autoFocus
                  />
                  <button onClick={handleNameSave} className="p-0.5 text-emerald-400">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-cyan-300 truncate">{myPeerInfo.name}</span>
                  <button
                    onClick={() => {
                      setTempName(myPeerInfo.name);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-slate-300 shrink-0"
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
