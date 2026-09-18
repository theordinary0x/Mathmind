import React, { useState } from 'react';
import { CopilotSession } from '../../types/copilot';
import { Plus, MessageSquare, Edit2, Trash2, Check, X, Clock } from 'lucide-react';

interface CopilotSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CopilotSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  isDark: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
}

export const CopilotSessionDrawer: React.FC<CopilotSessionDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  isDark
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!isOpen) return null;

  const startRename = (s: CopilotSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditingTitle(s.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = editingTitle.trim();
    if (clean) {
      onRenameSession(id, clean);
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="absolute inset-0 z-40 flex bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-[85%] max-w-[320px] h-full flex flex-col border-r shadow-2xl transition-all ${
          isDark
            ? 'bg-[#1C1C20] border-[#333338] text-zinc-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题与新建按钮 */}
        <div className="p-3.5 border-b border-inherit flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <h3 className="font-serif font-bold text-xs">对话历史</h3>
            <span className="text-[10px] opacity-60 font-mono">({sessions.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
            title="关闭会话列表"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 新建对话按钮 */}
        <div className="p-3 border-b border-inherit">
          <button
            type="button"
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-blue-500 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建对话</span>
          </button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => {
            const isActive = s.id === activeSessionId;
            const isEditingThis = editingId === s.id;
            const msgCount = s.messages.filter(m => m.id !== 'msg_welcome').length;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (!isEditingThis) {
                    onSelectSession(s.id);
                    onClose();
                  }
                }}
                className={`group flex items-center justify-between p-2.5 text-xs transition-all cursor-pointer border ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-medium'
                      : 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                    : isDark
                    ? 'border-transparent hover:border-inherit hover:bg-zinc-800/60 text-zinc-300'
                    : 'border-transparent hover:border-inherit hover:bg-stone-100 text-stone-700'
                }`}
              >
                {isEditingThis ? (
                  <div className="flex items-center space-x-1 w-full" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveRename(s.id, e as any);
                        if (e.key === 'Escape') cancelRename(e as any);
                      }}
                      autoFocus
                      className="flex-1 text-xs px-1.5 py-0.5 border border-blue-500 bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={e => saveRename(s.id, e)}
                      className="p-1 hover:text-emerald-400"
                      title="保存"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="p-1 hover:text-rose-400"
                      title="取消"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate font-serif text-[12px]">{s.title}</span>
                      <div className="flex items-center space-x-2 text-[10px] opacity-60 font-sans mt-0.5">
                        <span className="flex items-center space-x-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatRelativeTime(s.updatedAt)}</span>
                        </span>
                        <span>•</span>
                        <span>{msgCount} 条交流</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={e => startRename(s, e)}
                        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
                        title="重命名会话"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`确定要删除对话「${s.title}」吗？`)) {
                              onDeleteSession(s.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 transition-colors"
                          title="删除会话"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
