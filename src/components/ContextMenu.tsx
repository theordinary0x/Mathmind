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
import { PropositionNode, PropositionType, AppTheme, NODE_TYPES } from '../types';
import { latexToUnicode } from '../utils/latexToUnicode';
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
  const menuWidth = 220;
  const menuHeight = menuState.type === 'node' ? 320 : 180;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  let posX = menuState.x;
  let posY = menuState.y;

  if (posX + menuWidth > screenW - 10) {
    posX = screenW - menuWidth - 10;
  }
  if (posY + menuHeight > screenH - 10) {
    posY = screenH - menuHeight - 10;
  }
  if (posX < 10) posX = 10;
  if (posY < 10) posY = 10;

  return (
    <>
      <div
        ref={menuRef}
        style={{ left: `${posX}px`, top: `${posY}px` }}
        className={`fixed z-50 w-56 border shadow-2xl py-1.5 text-xs select-none backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 ${
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
            <div className="font-bold text-xs truncate max-w-full">
              {latexToUnicode(menuState.node.title)}
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
            {(['axiom', 'definition', 'proposition', 'theorem', 'corollary'] as PropositionType[]).map(tKey => {
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
