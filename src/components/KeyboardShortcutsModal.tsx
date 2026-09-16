import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { AppTheme } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

interface ShortcutGroup {
  category: string;
  items: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: '命题编辑',
    items: [
      { keys: ['N', 'Ctrl + N'], description: '新建命题' },
      { keys: ['双击画布'], description: '在鼠标位置新建命题' },
      { keys: ['Ctrl + Enter'], description: '保存 / 提交创建' },
      { keys: ['Delete', 'Backspace'], description: '删除选中命题' },
      { keys: ['Ctrl + C'], description: '复制命题' },
      { keys: ['Ctrl + X'], description: '剪切命题' },
      { keys: ['Ctrl + V'], description: '粘贴命题' }
    ]
  },
  {
    category: '依赖与连线',
    items: [
      { keys: ['L'], description: '开启 / 关闭连线模式' },
      { keys: ['Esc'], description: '退出连线 / 取消选择' }
    ]
  },
  {
    category: '画布与视图',
    items: [
      { keys: ['1'], description: '分层拓扑布局 (Dagre)' },
      { keys: ['2'], description: '力导向布局 (CoSE)' },
      { keys: ['F'], description: '开启 / 关闭单链聚焦模式' },
      { keys: ['0'], description: '全览居中 (适应视口)' },
      { keys: ['+', '='], description: '放大画布' },
      { keys: ['-'], description: '缩小画布' },
      { keys: ['T'], description: '切换深色 / 浅色主题' }
    ]
  },
  {
    category: '系统与导航',
    items: [
      { keys: ['Ctrl + ,'], description: '打开系统设置' },
      { keys: ['Ctrl + Z'], description: '撤销' },
      { keys: ['Ctrl + Y', 'Ctrl + Shift + Z'], description: '重做' },
      { keys: ['Ctrl + S'], description: '立即保存到本地存储' },
      { keys: ['Alt + S', 'Ctrl + Shift + S'], description: '另存为 JSON 文件' },
      { keys: ['P', 'Ctrl + P', 'M'], description: '打开项目管理' },
      { keys: ['/'], description: '聚焦搜索框' },
      { keys: ['?'], description: '打开快捷键指南' }
    ]
  }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100"
    >
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#18181B] border-white/10 text-[#EDECE8]'
            : 'bg-white border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="font-serif font-bold text-sm tracking-tight">键盘快捷键指南</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-56px)] font-serif">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHORTCUT_GROUPS.map((group, gIdx) => (
              <div
                key={gIdx}
                className={`p-3.5 rounded-lg border ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-[#FAF8F5]'
                }`}
              >
                <h4 className="font-bold text-xs mb-3 pb-1 border-b border-inherit opacity-80 uppercase tracking-wider font-mono">
                  {group.category}
                </h4>
                <div className="space-y-2">
                  {group.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-xs">
                      <span className="opacity-80">{item.description}</span>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            {kIdx > 0 && <span className="opacity-40 text-[10px]">/</span>}
                            <kbd
                              className={`px-1.5 py-0.5 text-[11px] font-mono rounded shadow-2xs font-semibold ${
                                isDark
                                  ? 'bg-zinc-800 text-zinc-200 border border-white/10'
                                  : 'bg-white text-stone-800 border border-black/10'
                              }`}
                            >
                              {k}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className={`p-3 rounded-lg border text-xs text-center ${
              isDark ? 'border-white/10 bg-white/5 text-zinc-400' : 'border-black/5 bg-black/5 text-stone-600'
            }`}
          >
            提示：在画布任意位置随时按 <kbd className={`px-1.5 py-0.5 text-[11px] font-mono rounded font-semibold ${isDark ? 'bg-zinc-800 text-zinc-200 border border-white/10' : 'bg-white text-stone-800 border border-black/10'}`}>?</kbd> 键即可唤起此指南。
          </div>
        </div>
      </div>
    </div>
  );
};
