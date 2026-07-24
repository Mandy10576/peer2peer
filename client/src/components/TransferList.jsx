import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  AlertCircle, 
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
  const [previewTransfer, setPreviewTransfer] = useState(null);

  if (!transfers || transfers.length === 0) return null;

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    if (type?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-400" />;
    if (type?.startsWith('audio/')) return <Music className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-sky-400" />;
  };

  const activeCount = transfers.filter((t) => t.status === 'transferring' || t.status === 'paused').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-md px-4 sm:px-0">
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Drawer Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-4 bg-slate-900/90 flex items-center justify-between cursor-pointer border-b border-slate-800/80 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              {transfers.length}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Active File Transfers</h4>
              <p className="text-[10px] text-slate-400">
                {activeCount > 0 ? `${activeCount} in progress` : 'All transfers completed'}
              </p>
            </div>
          </div>

          <button className="p-1 text-slate-400 hover:text-slate-200">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Transfer Cards List */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/50">
            {transfers.map((t) => (
              <div key={t.id} className="pt-2.5 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getFileIcon(t.fileType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-200 truncate max-w-[180px]">
                          {t.fileName}
                        </span>
                        {t.type === 'send' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium inline-flex items-center gap-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5" /> Sending
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium inline-flex items-center gap-0.5">
                            <ArrowDownLeft className="w-2.5 h-2.5" /> Receiving
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatBytes(t.transferredBytes || 0)} / {formatBytes(t.fileSize)} •{' '}
                        <span className="text-cyan-400 font-mono">{t.speed}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-1 shrink-0">
                    {t.status === 'transferring' && (
                      <button
                        onClick={() => pauseTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                        title="Pause Transfer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {t.status === 'paused' && (
                      <button
                        onClick={() => resumeTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                        title="Resume Transfer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(t.status === 'transferring' || t.status === 'paused') && (
                      <button
                        onClick={() => cancelTransfer(t.fileId, t.receiverSocketId || t.senderSocketId)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Cancel Transfer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {t.status === 'completed' && t.type === 'receive' && t.blobUrl && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewTransfer(t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={t.blobUrl}
                          download={t.fileName}
                          className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors font-bold"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {t.status === 'completed' && t.type === 'send' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}

                    {t.status === 'cancelled' && (
                      <span className="text-[10px] text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Animated Progress Bar */}
                {(t.status === 'transferring' || t.status === 'paused') && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          t.status === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse'
                        }`}
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
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
