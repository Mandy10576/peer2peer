import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export default function CameraQRScannerModal({ onScanSuccess, onClose }) {
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef(null);
  const html5QrcodeInstance = useRef(null);

  useEffect(() => {
    const elementId = 'qr-reader-video';
    const html5Qrcode = new Html5Qrcode(elementId);
    html5QrcodeInstance.current = html5Qrcode;

    const qrCodeSuccessCallback = (decodedText) => {
      // Extract room code if full URL was scanned, e.g. https://.../?room=A42SQ9
      const match = decodedText.match(/room=([A-Z0-9]{6})/i) || decodedText.match(/([A-Z0-9]{6})/i);
      const code = match ? match[1].toUpperCase() : decodedText.trim().toUpperCase();

      if (code && code.length === 6) {
        if (html5QrcodeInstance.current && html5QrcodeInstance.current.isScanning) {
          html5QrcodeInstance.current.stop().then(() => {
            onScanSuccess(code);
          }).catch(() => {
            onScanSuccess(code);
          });
        } else {
          onScanSuccess(code);
        }
      }
    };

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    // Prefer back camera on mobile devices
    html5Qrcode
      .start({ facingMode: 'environment' }, config, qrCodeSuccessCallback, () => {})
      .catch((err) => {
        console.warn('Camera start with environment facing failed, retrying default camera:', err);
        html5Qrcode
          .start({ facingMode: 'user' }, config, qrCodeSuccessCallback, () => {})
          .catch((e) => {
            setErrorMessage('Camera access failed. Please grant camera permissions in your browser.');
          });
      });

    return () => {
      if (html5QrcodeInstance.current && html5QrcodeInstance.current.isScanning) {
        html5QrcodeInstance.current.stop().catch((e) => console.warn('Error stopping QR scanner:', e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-sm p-5 rounded-2xl border border-slate-800 shadow-2xl relative space-y-4 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Scan QR Code with Camera</h3>
          <p className="text-xs text-slate-400">Point your camera at another device's room QR code</p>
        </div>

        {/* Camera Preview Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[240px] flex items-center justify-center">
          <div id="qr-reader-video" className="w-full h-full" />
          {errorMessage && (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300">{errorMessage}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500">Scanning will automatically join the room</p>
      </div>
    </div>
  );
}
