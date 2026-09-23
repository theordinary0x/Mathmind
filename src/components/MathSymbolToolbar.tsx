import React from 'react';
import { AppTheme } from '../types';

interface MathSymbolToolbarProps {
  onInsert: (symbol: string) => void;
  theme: AppTheme;
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
      { display: 'a/b', insert: '\\frac{a}{b} ', title: '分式' },
      { display: '√', insert: '\\sqrt{x} ', title: '根号' },
      { display: '△', insert: '\\triangle ABC', title: '三角形' }
    ]
  }
];

export const MathSymbolToolbar: React.FC<MathSymbolToolbarProps> = ({ onInsert, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`border px-2 py-1 flex items-center space-x-3 overflow-x-auto scrollbar-thin touch-pan-x text-xs select-none ${
        isDark ? 'bg-[#222226] border-[#3F3F46]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
      }`}
    >
      <span className="text-[10px] font-mono opacity-50 shrink-0 uppercase tracking-wider">
        符号:
      </span>

      <div className="flex items-center space-x-2 shrink-0">
        {SYMBOL_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="flex items-center space-x-1 border-r border-inherit pr-2 last:border-r-0">
            {group.symbols.map((item, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onInsert(item.insert)}
                className={`px-1.5 py-0.5 font-serif text-[11px] border transition-colors ${
                  isDark
                    ? 'border-[#3F3F46] bg-[#18181B] text-[#EDECE8] hover:bg-[#2E2E33] hover:border-[#60A5FA]'
                    : 'border-[#D4CDC0] bg-white text-[#2C2B29] hover:bg-[#F2EFE9] hover:border-[#2C2B29]'
                }`}
                title={item.title}
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
