import React, { useEffect, useRef } from 'react';
import { 
  Plus, 
  Copy, 
  Scissors, 
  Trash2, 
  Link2, 
  Edit3, 
  Image, 
  Maximize2, 
  GitFork, 
  Network, 
  ClipboardPaste, 
  Check 
} from 'lucide-react';
import { PropositionNode, PropositionType, AppTheme, NODE_TYPES, PropositionStatus, PROPOSITION_STATUSES } from '../types';
import { latexToUnicode, formatSingleLineFormulaTitle } from '../utils/latexToUnicode';
import { MathRenderer } from './MathRenderer';

import { useTranslation } from '../i18n/LanguageContext';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: 'node' | 'canvas';
  node: PropositionNode | null;
  canvasPosition?: { x: number; y: number };
}

interface ContextMenuProps {
  menuState: ContextMenuState;
  onClose: () => void;
  onStartConnectFromNode: (nodeId: string) => void;
  onCopyNode: (node: PropositionNode) => void;
  onCutNode: (node: PropositionNode) => void;
  onPasteNode: (position?: { x: number; y: number }) => void;
  hasClipboard: boolean;
  onChangeNodeType: (nodeId: string, newType: PropositionType) => void;
  onOpenEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNodeAtPos: (pos?: { x: number; y: number }) => void;
  onExportPng: () => void;
  onFitCanvas: () => void;
  onToggleLayout: () => void;
  currentLayout: 'dagre' | 'cose';
  theme: AppTheme;
  selectedNodeCount?: number;
  onBatchDelete?: () => void;
  onUpdateNodeStatus?: (nodeId: string, status?: PropositionStatus) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  menuState,
  onClose,
  onStartConnectFromNode,
  onCopyNode,
  onCutNode,
  onPasteNode,
  hasClipboard,
  onChangeNodeType,
  onOpenEditNode,
  onDeleteNode,
  onCreateNodeAtPos,
  onExportPng,
  onFitCanvas,
  onToggleLayout,
  currentLayout,
  theme,
  selectedNodeCount,
  onBatchDelete,
  onUpdateNodeStatus,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const { t, language } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuState.isOpen, onClose]);

  if (!menuState.isOpen) return null;

  // Smart boundary collision detection
  const menuWidth = 224;
  const menuHeight = menuState.type === 'node' ? 480 : 200;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  let posX = menuState.x;
  let posY = menuState.y;

  if (posX + menuWidth > screenW - 12) {
    posX = screenW - menuWidth - 12;
  }
  if (posY + menuHeight > screenH - 12) {
    posY = screenH - menuHeight - 12;
  }
  if (posX < 12) posX = 12;
  if (posY < 12) posY = 12;

  return (
    <>
      <div
        ref={menuRef}
        style={{ left: `${posX}px`, top: `${posY}px` }}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`fixed z-50 w-56 max-h-[calc(100vh-24px)] overflow-y-auto overflow-x-hidden border shadow-2xl py-1.5 text-xs select-none backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent ${
          isDark
            ? 'bg-[#18181B]/95 border-white/10 text-zinc-200 divide-white/10'
            : 'bg-white/95 border-black/10 text-stone-800 divide-black/5'
        }`}
      >

      {menuState.type === 'node' && menuState.node ? (
        /* Node Right-Click Actions */
        <div className="divide-y divide-inherit">
          {/* Header Preview */}
          <div className="px-3 py-1.5 font-serif border-b border-inherit">
            <div className="text-[10px] opacity-50 uppercase tracking-wider font-mono">
              {menuState.node.id}
            </div>
            <div
              className="font-bold text-xs truncate max-w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [&_*]:!inline [&_*]:!whitespace-nowrap [&_*]:!m-0 [&_*]:!p-0 [&_.katex-display]:!inline [&_.katex-display]:!m-0"
              title={latexToUnicode(menuState.node.title.replace(/[\r\n]+/g, ' · '))}
            >
              <MathRenderer content={formatSingleLineFormulaTitle(menuState.node.title)} />
            </div>
          </div>


          <div className="py-1">
            <button
              onClick={() => {
                onStartConnectFromNode(menuState.node!.id);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Link2 className="w-3.5 h-3.5" />
                <span>{t('contextMenu.startConnect')}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">L</span>
            </button>

            <button
              onClick={() => {
                onOpenEditNode(menuState.node!.id);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('contextMenu.editNode')}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">E</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                onCopyNode(menuState.node!);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5" />
                <span>{t('contextMenu.copyNode')}</span>
              </div>
              <span className="text-[10px] opacity-50 font-mono">Ctrl+C</span>
            </button>

            <button
              onClick={() => {
                onCutNode(menuState.node!);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Scissors className="w-3.5 h-3.5" />
                <span>{t('contextMenu.cutNode')}</span>
              </div>
              <span className="text-[10px] opacity-50 font-mono">Ctrl+X</span>
            </button>
          </div>

          {/* Type Quick Conversion */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider opacity-50 font-mono">
              {t('contextMenu.changeType')}:
            </div>
            {(['axiom', 'definition', 'proposition', 'theorem', 'corollary', 'remark'] as PropositionType[]).map(tKey => {
              const conf = NODE_TYPES[tKey] || NODE_TYPES.theorem;
              const isCurrent = menuState.node!.type === tKey;
              const typeLabel = t(`nodeTypes.${tKey}` as any) || conf.label;
              return (
                <button
                  key={tKey}
                  onClick={() => {
                    onChangeNodeType(menuState.node!.id, tKey);
                    onClose();
                  }}
                  className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[11px]"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2 h-2"
                      style={{ backgroundColor: isDark ? conf.darkColor : conf.color }}
                    />
                    <span>{typeLabel}</span>
                  </div>
                  {isCurrent && <Check className="w-3 h-3 text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Status Quick Marking */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider opacity-50 font-mono">
              研读标记:
            </div>
            {(['doubt', 'core', 'review', 'verified'] as PropositionStatus[]).map(statusKey => {
              const conf = PROPOSITION_STATUSES[statusKey];
              const isCurrent = menuState.node!.status === statusKey;
              return (
                <button
                  key={statusKey}
                  onClick={() => {
                    onUpdateNodeStatus?.(menuState.node!.id, isCurrent ? undefined : statusKey);
                    onClose();
                  }}
                  className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[11px]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">{conf.icon}</span>
                    <span>{conf.label}</span>
                  </div>
                  {isCurrent && <Check className="w-3 h-3 text-emerald-500" />}
                </button>
              );
            })}
            {menuState.node!.status && (
              <button
                onClick={() => {
                  onUpdateNodeStatus?.(menuState.node!.id, undefined);
                  onClose();
                }}
                className="w-full px-3 py-1 text-left flex items-center space-x-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[11px] opacity-70 hover:opacity-100"
              >
                <span className="text-xs">✕</span>
                <span>清除标记</span>
              </button>
            )}
          </div>

          <div className="py-1">
            {selectedNodeCount && selectedNodeCount >= 2 && onBatchDelete ? (
              <button
                onClick={() => {
                  onBatchDelete();
                  onClose();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-red-500 hover:bg-red-600 hover:text-white transition-colors font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'zh' ? `批量删除选中的 ${selectedNodeCount} 个命题` : `Batch delete ${selectedNodeCount} selected`}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono">Del</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onDeleteNode(menuState.node!.id);
                  onClose();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-red-500 hover:bg-red-600 hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('contextMenu.deleteNode')}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono">Del</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Canvas Right-Click Actions */
        <div className="divide-y divide-inherit">
          <div className="py-1">
            <button
              onClick={() => {
                onCreateNodeAtPos(menuState.canvasPosition);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors font-bold"
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-3.5 h-3.5" />
                <span>{t('header.newProposition')}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">N</span>
            </button>

            {hasClipboard && (
              <button
                onClick={() => {
                  onPasteNode(menuState.canvasPosition);
                  onClose();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>{t('contextMenu.pasteHere')}</span>
                </div>
                <span className="text-[10px] opacity-50 font-mono">Ctrl+V</span>
              </button>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                onToggleLayout();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                {currentLayout === 'dagre' ? <Network className="w-3.5 h-3.5" /> : <GitFork className="w-3.5 h-3.5" />}
                <span>{currentLayout === 'dagre' ? t('contextMenu.switchToCose') : t('contextMenu.switchToDagre')}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">1 / 2</span>
            </button>

            <button
              onClick={() => {
                onFitCanvas();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{t('contextMenu.fitCanvas')}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">0</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                onExportPng();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Image className="w-3.5 h-3.5" />
                <span>{t('contextMenu.exportPng')}</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
