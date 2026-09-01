import React from 'react';
import { X, Download, FileText, Image as ImageIcon, Video, Music } from 'lucide-react';
import { formatBytes } from '../utils/deviceInfo';

export default function FilePreviewModal({ transfer, onClose }) {
  if (!transfer || !transfer.blobUrl) return null;

  const isImage = transfer.fileType?.startsWith('image/');
  const isVideo = transfer.fileType?.startsWith('video/');
  const isAudio = transfer.fileType?.startsWith('audio/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] p-6 rounded-2xl shadow-2xl relative flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-lime-500 text-black">
              {isImage ? <ImageIcon className="w-5 h-5" /> : isVideo ? <Video className="w-5 h-5" /> : isAudio ? <Music className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 truncate max-w-sm">{transfer.fileName}</h3>
              <p className="text-xs text-neutral-400">{formatBytes(transfer.fileSize)} • Received Direct P2P</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto max-h-[60vh] flex items-center justify-center bg-black rounded-xl p-4 border border-neutral-800">
          {isImage ? (
            <img src={transfer.blobUrl} alt={transfer.fileName} className="max-w-full max-h-full object-contain rounded-lg" />
          ) : isVideo ? (
            <video src={transfer.blobUrl} controls className="max-w-full max-h-full rounded-lg" />
          ) : isAudio ? (
            <audio src={transfer.blobUrl} controls className="w-full" />
          ) : (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto" />
              <p className="text-sm text-neutral-400">No inline preview available for this file type.</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-200"
          >
            Close Preview
          </button>
          <a
            href={transfer.blobUrl}
            download={transfer.fileName}
            className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </a>
        </div>
      </div>
    </div>
  );
}
