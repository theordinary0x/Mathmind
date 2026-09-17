import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

interface ShortcutsTabProps {
  isDark: boolean;
}

export const ShortcutsTab: React.FC<ShortcutsTabProps> = ({ isDark }) => {
  const { t } = useTranslation();

  const shortcutList = [
    {
      group: t('shortcuts.catSystem'),
      items: [
        { key: 'Ctrl + ,', desc: t('shortcuts.openSettings') },
        { key: 'Ctrl + S', desc: t('shortcuts.saveStorage') },
        { key: 'Alt + S', desc: t('shortcuts.saveAsJson') },
        { key: 'P / Ctrl + P', desc: t('shortcuts.openProjects') },
        { key: '?', desc: t('shortcuts.openShortcuts') },
        { key: '/', desc: t('shortcuts.focusSearch') },
        { key: 'Shift + I', desc: t('shortcuts.openAi') },
        { key: 'T', desc: t('shortcuts.toggleTheme') }
      ]
    },
    {
      group: t('shortcuts.catProposition'),
      items: [
        { key: 'N / Ctrl + N', desc: t('shortcuts.newProp') },
        { key: '双击画布', desc: t('shortcuts.dblClickCanvas') },
        { key: 'Ctrl + Enter', desc: t('shortcuts.saveSubmit') },
        { key: 'Delete / Backspace', desc: t('shortcuts.deleteProp') },
        { key: 'Ctrl + C / X / V', desc: t('shortcuts.copyProp') + ' / 剪切 / 粘贴' },
        { key: 'Ctrl + Z / Y', desc: t('shortcuts.undo') + ' / ' + t('shortcuts.redo') }
      ]
    },
    {
      group: t('shortcuts.catCanvas'),
      items: [
        { key: '1', desc: t('shortcuts.layoutDagre') },
        { key: '2', desc: t('shortcuts.layoutCose') },
        { key: 'F', desc: t('shortcuts.toggleFocus') },
        { key: '0', desc: t('shortcuts.fitView') },
        { key: '+ / -', desc: t('shortcuts.zoomIn') + ' / ' + t('shortcuts.zoomOut') },
        { key: 'L', desc: t('shortcuts.toggleConnect') },
        { key: 'Esc', desc: t('shortcuts.exitConnect') }
      ]
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          {t('shortcuts.title')}
        </h3>
        <p className="text-xs opacity-60 mb-3">
          熟练使用快捷键可显著提升数学推导与知识图谱排版效率
        </p>
      </div>

      <div className="space-y-4">
        {shortcutList.map(group => (
          <div
            key={group.group}
            className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
            }`}
          >
            <div className="text-xs font-bold opacity-80">{group.group}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.items.map(item => (
                <div key={item.desc} className="flex items-center justify-between text-xs py-1">
                  <span className="opacity-70">{item.desc}</span>
                  <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] select-none ${
                    isDark ? 'bg-white/10 text-zinc-200' : 'bg-black/5 text-stone-800'
                  }`}>
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
