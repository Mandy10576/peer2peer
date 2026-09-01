import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { formatBytes } from '../utils/deviceInfo';
import FilePreviewModal from './FilePreviewModal';

export default function TransferList({ transfers, pauseTransfer, resumeTransfer, cancelTransfer }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [previewTransfer, setPreviewTransfer] = useState(null);

  if (!transfers || transfers.length === 0 || isDismissed) return null;

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-lime-400" />;
    if (type?.startsWith('video/')) return <Video className="w-4 h-4 text-orange-400" />;
    if (type?.startsWith('audio/')) return <Music className="w-4 h-4 text-emerald-400" />;
    return <FileText className="w-4 h-4 text-lime-400" />;
  };

  const activeCount = transfers.filter((t) => t.status === 'transferring' || t.status === 'paused').length;

  return (
    <div className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:bottom-4 z-40 w-auto sm:w-full sm:max-w-md pointer-events-none">
      <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto">
        {/* Drawer Header */}
        <div
          className="p-3 sm:p-4 bg-neutral-900 flex items-center justify-between cursor-pointer border-b border-neutral-800 hover:bg-neutral-800 transition-colors"
        >
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2.5 flex-1 min-w-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-lime-500 text-black flex items-center justify-center font-bold text-xs shrink-0">
              {transfers.length}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-neutral-200 truncate">Active File Transfers</h4>
              <p className="text-[10px] text-neutral-400 truncate">
                {activeCount > 0 ? `${activeCount} in progress` : 'All transfers completed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-1 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transfer Cards List */}
        {isExpanded && (
          <div className="max-h-64 sm:max-h-80 overflow-y-auto p-2.5 sm:p-3 space-y-2 divide-y divide-neutral-800">
            {transfers.map((t) => (
              <div key={t.id} className="pt-2 first:pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0">
                      {getFileIcon(t.fileType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs text-neutral-200 truncate max-w-[120px] sm:max-w-[180px]">
                          {t.fileName}
                        </span>
                        {t.type === 'send' ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-lime-500 text-black font-medium inline-flex items-center gap-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5" /> Send
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-orange-500 text-black font-medium inline-flex items-center gap-0.5">
                            <ArrowDownLeft className="w-2.5 h-2.5" /> Recv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {formatBytes(t.transferredBytes || 0)} / {formatBytes(t.fileSize)} •{' '}
                        <span className="text-lime-400 font-mono">{t.speed}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-1 shrink-0">
                    {t.status === 'transferring' && (
                      <button
                        onClick={() => pauseTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1 rounded-lg bg-amber-500 text-black"
                        title="Pause"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {t.status === 'paused' && (
                      <button
                        onClick={() => resumeTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1 rounded-lg bg-lime-500 text-black"
                        title="Resume"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(t.status === 'transferring' || t.status === 'paused') && (
                      <button
                        onClick={() => cancelTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1 rounded-lg bg-rose-600 text-white"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {t.status === 'completed' && t.type === 'receive' && t.blobUrl && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewTransfer(t)}
                          className="p-1 rounded-lg bg-neutral-800 text-neutral-200"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={t.blobUrl}
                          download={t.fileName}
                          className="p-1 rounded-lg bg-lime-500 text-black font-bold"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {t.status === 'completed' && t.type === 'send' && (
                      <CheckCircle2 className="w-4 h-4 text-lime-400" />
                    )}
                  </div>
                </div>

                {/* Live Progress Bar */}
                {(t.status === 'transferring' || t.status === 'paused') && (
                  <div className="space-y-0.5">
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          t.status === 'paused' ? 'bg-amber-400' : 'bg-lime-400 animate-pulse'
                        }`}
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-neutral-400">
                      <span>{t.progress}%</span>
                      <span>ETA: {t.timeRemaining}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTransfer && (
        <FilePreviewModal transfer={previewTransfer} onClose={() => setPreviewTransfer(null)} />
      )}
    </div>
  );
}
