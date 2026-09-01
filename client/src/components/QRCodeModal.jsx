import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode } from 'lucide-react';

export default function QRCodeModal({ roomId, onClose }) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/?room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-slate-800 shadow-2xl relative space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Scan to Join Room</h3>
          <p className="text-xs text-slate-400">Scan this QR code with your mobile camera or tablet</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <QRCodeSVG value={roomUrl} size={180} level="H" includeMargin={false} />
        </div>

        {/* Room Code & Copy Button */}
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Room Code</span>
              <span className="font-mono font-bold text-slate-200 tracking-wider text-base">{roomId}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
