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
      window.addEventListener('pointerdown', handleClickOutside, { capture: true });
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('pointerdown', handleClickOutside, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuState.isOpen, onClose]);

  if (!menuState.isOpen) return null;

  // Ensure menu stays within screen viewport
  const adjustedX = Math.min(menuState.x, window.innerWidth - 220);
  const adjustedY = Math.min(menuState.y, window.innerHeight - 300);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        onContextMenu={e => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
        className={`fixed z-50 w-52 rounded-xl border shadow-2xl p-1 text-xs select-none animate-in fade-in duration-100 font-serif backdrop-blur-md ${
          isDark
            ? 'bg-[#18181B]/95 border-white/10 text-[#EDECE8] shadow-black/80'
            : 'bg-white/95 border-black/10 text-[#2C2B29] shadow-xl'
        }`}
      >
      {menuState.type === 'node' && menuState.node ? (
        /* Node Right-Click Actions */
        <div className="divide-y divide-inherit">
          <div className="px-3 py-1.5 font-bold text-[11px] opacity-60 truncate border-b border-inherit font-serif">
            命题: {latexToUnicode(menuState.node.title)}
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
                <span>从此节点连线...</span>
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
                <span>编辑详细与批注</span>
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
                <span>复制命题</span>
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
                <span>剪切命题</span>
              </div>
              <span className="text-[10px] opacity-50 font-mono">Ctrl+X</span>
            </button>
          </div>

          {/* Type Quick Conversion */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider opacity-50 font-mono">
              转换为类型:
            </div>
            {(['axiom', 'definition', 'proposition', 'theorem', 'corollary'] as PropositionType[]).map(t => {
              const conf = NODE_TYPES[t] || NODE_TYPES.theorem;
              const isCurrent = menuState.node!.type === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    onChangeNodeType(menuState.node!.id, t);
                    onClose();
                  }}
                  className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[11px]"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2 h-2"
                      style={{ backgroundColor: isDark ? conf.darkColor : conf.color }}
                    />
                    <span>{conf.label}</span>
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
                  <span>批量删除选中的 {selectedNodeCount} 个命题</span>
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
                  <span>删除此命题</span>
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
                <span>在此处新建命题</span>
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
                  <span>粘贴命题到此处</span>
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
                <span>切换为 {currentLayout === 'dagre' ? '力导向布局' : '分层 DAG 布局'}</span>
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
                <span>适应画布</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">0 / 双击</span>
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
                <span>导出图片</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
