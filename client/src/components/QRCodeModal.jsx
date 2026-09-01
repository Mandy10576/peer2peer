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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
      <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl relative space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-lime-500 text-black flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100">Scan to Join Room</h3>
          <p className="text-xs text-neutral-400">Scan this QR code with your mobile camera or tablet</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <QRCodeSVG value={roomUrl} size={180} level="H" includeMargin={false} />
        </div>

        {/* Room Code & Copy Button */}
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Room Code</span>
              <span className="font-mono font-bold text-neutral-200 tracking-wider text-base">{roomId}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
