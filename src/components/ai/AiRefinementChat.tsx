import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';

interface AiRefinementChatProps {
  isRefining: boolean;
  onRefine: (instruction: string) => Promise<void>;
  isDark: boolean;
}

const QUICK_SUGGESTIONS = [
  '补充严谨分步证明',
  '提炼更简明的证明思路',
  '补充更多相关推论',
  '规范 LaTeX 数学符号'
];

export const AiRefinementChat: React.FC<AiRefinementChatProps> = ({
  isRefining,
  onRefine,
  isDark
}) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = instruction.trim();
    if (!trimmed || isRefining) return;
    onRefine(trimmed).then(() => {
      setInstruction('');
    });
  };

  const handleQuickClick = (text: string) => {
    if (isRefining) return;
    onRefine(text);
  };

  return (
    <div
      className={`p-2.5 rounded-xl border text-xs ${
        isDark ? 'bg-[#1e1e24] border-white/10' : 'bg-stone-50 border-black/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5 text-blue-500">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px]">命题微调与调整命令</span>
        </div>
        <span className="text-[10px] opacity-60 font-mono">基于当前提炼结果二次优化</span>
      </div>

      {/* Quick suggestions */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
        {QUICK_SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            disabled={isRefining}
            onClick={() => handleQuickClick(s)}
            className={`px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap transition-colors disabled:opacity-50 ${
              isDark
                ? 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                : 'border-black/15 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            + {s}
          </button>
        ))}
      </div>

      {/* Chat input form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-1.5">
        <input
          type="text"
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          disabled={isRefining}
          placeholder="输入调整命令（如：定理二证明更详细点、把定义拆成两个引理）..."
          className={`flex-1 p-2 rounded-lg border text-xs outline-hidden disabled:opacity-50 ${
            isDark
              ? 'bg-[#121214] border-white/10 text-white placeholder-zinc-500 focus:border-blue-500/50'
              : 'bg-white border-black/10 text-stone-900 placeholder-stone-400 focus:border-blue-500/50'
          }`}
        />
        <button
          type="submit"
          disabled={!instruction.trim() || isRefining}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium flex items-center space-x-1 shrink-0 transition-colors shadow-xs"
        >
          {isRefining ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>调整中</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>调整</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
