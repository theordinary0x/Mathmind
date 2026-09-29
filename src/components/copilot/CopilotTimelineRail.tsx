import React, { useState } from 'react';
import { CopilotMessage } from '../../types/copilot';
import { ArrowUp, ArrowDown, GitCommit, User, Sparkles } from 'lucide-react';

interface CopilotTimelineRailProps {
  messages: CopilotMessage[];
  activeMsgId?: string | null;
  onSelectMessage: (msgId: string) => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  isDark: boolean;
}

function formatTimeShort(ts?: number): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

export const CopilotTimelineRail: React.FC<CopilotTimelineRailProps> = ({
  messages,
  activeMsgId,
  onSelectMessage,
  onScrollToTop,
  onScrollToBottom,
  isDark,
}) => {
  const [hoveredMsg, setHoveredMsg] = useState<{ msg: CopilotMessage; idx: number } | null>(null);

  if (messages.length <= 1) return null;

  return (
    <div
      className="absolute right-1.5 top-3 bottom-3 z-20 flex flex-col items-center justify-between py-1.5 px-1 select-none pointer-events-auto"
      onMouseLeave={() => setHoveredMsg(null)}
    >
      {/* Top Jump Button */}
      <button
        type="button"
        onClick={onScrollToTop}
        className={`p-1 rounded-full border transition-all cursor-pointer opacity-60 hover:opacity-100 ${
          isDark
            ? 'bg-[#202024]/90 border-white/10 text-zinc-300 hover:text-white hover:border-blue-500'
            : 'bg-white/90 border-black/10 text-stone-600 hover:text-stone-900 hover:border-blue-600'
        }`}
        title="回到最早消息"
      >
        <ArrowUp className="w-2.5 h-2.5" />
      </button>

      {/* Vertical Timeline Spine & Turn Nodes */}
      <div
        className={`relative flex-1 my-1.5 w-5 rounded-full border flex flex-col items-center justify-evenly py-2 px-0.5 overflow-hidden transition-all ${
          isDark
            ? 'bg-[#18181B]/80 border-white/10 hover:border-blue-500/40'
            : 'bg-white/80 border-black/10 hover:border-blue-500/40'
        }`}
      >
        {/* Spine Line */}
        <div
          className={`absolute top-2 bottom-2 w-px left-1/2 -translate-x-1/2 pointer-events-none ${
            isDark ? 'bg-white/15' : 'bg-black/15'
          }`}
        />

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const hasDiff = Boolean(msg.diffProposal);
          const isApplied = Boolean(msg.diffProposal?.applied);
          const isActive = activeMsgId === msg.id || hoveredMsg?.msg.id === msg.id;

          let dotClass = '';
          if (hasDiff) {
            dotClass = isApplied
              ? 'w-2.5 h-2.5 bg-emerald-500 ring-2 ring-emerald-500/30'
              : 'w-2.5 h-2.5 bg-amber-500 ring-2 ring-amber-500/30';
          } else if (isUser) {
            dotClass = 'w-2 h-2 bg-blue-500';
          } else {
            dotClass = isDark ? 'w-1.5 h-1.5 bg-zinc-400' : 'w-1.5 h-1.5 bg-stone-400';
          }

          return (
            <button
              key={msg.id}
              type="button"
              onMouseEnter={() => setHoveredMsg({ msg, idx })}
              onClick={() => onSelectMessage(msg.id)}
              className="relative z-10 w-4 h-4 flex items-center justify-center group cursor-pointer"
              aria-label={`跳转至第 ${idx + 1} 条消息`}
            >
              <span
                className={`rounded-full transition-transform duration-150 ${dotClass} ${
                  isActive ? 'scale-150' : 'group-hover:scale-125'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Jump Button */}
      <button
        type="button"
        onClick={onScrollToBottom}
        className={`p-1 rounded-full border transition-all cursor-pointer opacity-60 hover:opacity-100 ${
          isDark
            ? 'bg-[#202024]/90 border-white/10 text-zinc-300 hover:text-white hover:border-blue-500'
            : 'bg-white/90 border-black/10 text-stone-600 hover:text-stone-900 hover:border-blue-600'
        }`}
        title="直达最新消息底部"
      >
        <ArrowDown className="w-2.5 h-2.5" />
      </button>

      {/* Hover Tooltip Card */}
      {hoveredMsg && (
        <div
          className={`absolute right-8 top-1/2 -translate-y-1/2 w-56 p-2.5 rounded-xl border shadow-xl pointer-events-none z-30 mm-view-fade ${
            isDark
              ? 'bg-[#202024] border-white/15 text-zinc-100'
              : 'bg-white border-black/15 text-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-mono">
            <span className="flex items-center space-x-1 font-sans font-semibold">
              {hoveredMsg.msg.role === 'user' ? (
                <>
                  <User className="w-3 h-3 text-blue-500" />
                  <span>我的提问 #{hoveredMsg.idx + 1}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Copilot 推导 #{hoveredMsg.idx + 1}</span>
                </>
              )}
            </span>
            <span>{formatTimeShort(hoveredMsg.msg.timestamp)}</span>
          </div>

          <div className="text-[11px] font-serif line-clamp-2 opacity-90 leading-snug">
            {hoveredMsg.msg.content.replace(/[#*`$]/g, '').slice(0, 70) || '（附件/图谱操作）'}
          </div>

          {hoveredMsg.msg.diffProposal && (
            <div className="mt-1.5 pt-1 border-t border-inherit flex items-center space-x-1 text-[10px] font-mono text-emerald-500">
              <GitCommit className="w-3 h-3" />
              <span>
                {hoveredMsg.msg.diffProposal.applied ? '已应用图谱变更' : '含图谱修改方案'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
