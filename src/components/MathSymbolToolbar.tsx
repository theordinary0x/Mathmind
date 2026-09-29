import React from 'react';
import { AppTheme } from '../types';
import { StylusPenVectorIcon } from './icons/CustomIcons';

interface MathSymbolToolbarProps {
  onInsert: (symbol: string) => void;
  theme: AppTheme;
  onOpenHandwriting?: () => void;
}

interface SymbolGroup {
  label: string;
  symbols: { display: string; insert: string; title: string }[];
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    label: '公式',
    symbols: [
      { display: '$x$', insert: '$ $', title: '行内公式' },
      { display: '$$X$$', insert: '$$\n\n$$', title: '独立公式' }
    ]
  },
  {
    label: '逻辑',
    symbols: [
      { display: '∀', insert: '\\forall ', title: '全称量词' },
      { display: '∃', insert: '\\exists ', title: '存在量词' },
      { display: '⇒', insert: '\\implies ', title: '推出' },
      { display: '⇔', insert: '\\iff ', title: '等价' },
      { display: '¬', insert: '\\neg ', title: '否定' }
    ]
  },
  {
    label: '集合',
    symbols: [
      { display: '∈', insert: '\\in ', title: '属于' },
      { display: '∉', insert: '\\notin ', title: '不属于' },
      { display: '⊆', insert: '\\subseteq ', title: '子集' },
      { display: '⊂', insert: '\\subset ', title: '真子集' },
      { display: '∪', insert: '\\cup ', title: '并集' },
      { display: '∩', insert: '\\cap ', title: '交集' },
      { display: '∅', insert: '\\emptyset ', title: '空集' }
    ]
  },
  {
    label: '数集',
    symbols: [
      { display: 'ℕ', insert: '\\mathbb{N}', title: '自然数' },
      { display: 'ℤ', insert: '\\mathbb{Z}', title: '整数' },
      { display: 'ℚ', insert: '\\mathbb{Q}', title: '有理数' },
      { display: 'ℝ', insert: '\\mathbb{R}', title: '实数' }
    ]
  },
  {
    label: '算子',
    symbols: [
      { display: 'S(n)', insert: 'S(n)', title: '后继算子' },
      { display: '·', insert: '\\cdot ', title: '乘号' },
      { display: '≠', insert: '\\neq ', title: '不等' },
      { display: '∑', insert: '\\sum_{i=1}^{n} ', title: '求和' },
      { display: '∫', insert: '\\int_{a}^{b} ', title: '定积分' },
      { display: 'a/b', insert: '\\frac{a}{b} ', title: '分式' },
      { display: '√', insert: '\\sqrt{x} ', title: '根号' },
      { display: '∞', insert: '\\infty ', title: '无穷大' },
      { display: '△', insert: '\\triangle ABC', title: '三角形' }
    ]
  }
];

export const MathSymbolToolbar: React.FC<MathSymbolToolbarProps> = ({
  onInsert,
  theme,
  onOpenHandwriting,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`border-b px-3 py-2 flex items-center space-x-3 overflow-x-auto scrollbar-thin touch-pan-x text-xs select-none shrink-0 ${
        isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F5F2EB] border-[#D4CDC0]'
      }`}
    >
      {onOpenHandwriting && (
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={onOpenHandwriting}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25 hover:border-blue-400'
              : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
          }`}
          title="打开压感手写演算板，手写公式识别插入 LaTeX"
        >
          <StylusPenVectorIcon size={14} />
          <span>手写公式</span>
        </button>
      )}

      <span className="text-[11px] font-mono opacity-50 shrink-0 uppercase tracking-wider">
        快捷符号:
      </span>

      <div className="flex items-center space-x-2.5 shrink-0">
        {SYMBOL_GROUPS.map((group, gIdx) => (
          <div
            key={gIdx}
            className={`flex items-center space-x-1.5 pr-2.5 border-r last:border-r-0 ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            {group.symbols.map((item, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onInsert(item.insert)}
                className={`px-2.5 py-1 min-w-[30px] font-serif text-xs sm:text-[13px] font-medium rounded-lg border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  isDark
                    ? 'border-[#3F3F46] bg-[#18181B] text-[#EDECE8] hover:bg-[#2C2C32] hover:border-[#60A5FA] hover:text-white'
                    : 'border-[#D4CDC0] bg-white text-[#2C2B29] hover:bg-[#EFECE6] hover:border-[#2563EB] hover:text-[#1D4ED8]'
                }`}
                title={`${item.title} (${item.insert.trim()})`}
              >
                {item.display}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
