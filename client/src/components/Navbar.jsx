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
    <nav className="w-full border-b border-neutral-800 bg-black sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-lime-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-lime-400">
              AeroDrop
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-500 text-black">
              P2P
            </span>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-lime-400' : 'bg-amber-500'}`} />
            <span className="text-neutral-300 hidden md:inline">{isConnected ? 'Connected' : 'Connecting'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-lime-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
          </button>

          {/* Peer Alias Badge / Edit */}
          {myPeerInfo && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 max-w-[130px] sm:max-w-none">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-black border border-lime-500 rounded px-1.5 py-0.5 text-[11px] text-neutral-100 focus:outline-none w-20"
                    autoFocus
                  />
                  <button onClick={handleNameSave} className="p-0.5 text-lime-400">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-lime-300 truncate">{myPeerInfo.name}</span>
                  <button
                    onClick={() => {
                      setTempName(myPeerInfo.name);
                      setIsEditingName(true);
                    }}
                    className="text-neutral-500 hover:text-neutral-300 shrink-0"
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
