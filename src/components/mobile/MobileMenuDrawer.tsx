import React from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  GitFork,
  Network,
  Eye,
  EyeOff,
  Download,
  Upload,
  Undo2,
  Redo2,
  BookOpen,
} from 'lucide-react';
import { AppTheme, CornerStyle, SurfaceMaterial, AnimationFpsMode } from '../../types';
import { useAnimatedVisibility } from '../../hooks/useAnimatedVisibility';
import {
  StylusPenVectorIcon,
  PdfNoteVectorIcon,
  TeaCupVectorIcon,
} from '../icons/CustomIcons';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  theme: AppTheme;
  onToggleTheme: () => void;
  cornerStyle: CornerStyle;
  onToggleCornerStyle: () => void;
  surfaceMaterial: SurfaceMaterial;
  onToggleSurfaceMaterial: () => void;
  fpsMode: AnimationFpsMode;
  onCycleFpsMode: () => void;
  layoutType: 'dagre' | 'cose';
  onChangeLayout: (type: 'dagre' | 'cose') => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveAs: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  onOpenSponsor: () => void;
  onOpenHandwriting?: () => void;
  onOpenPdfWorkspace?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  layoutType,
  onChangeLayout,
  isFocusMode,
  onToggleFocusMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveAs,
  onImport,
  onOpenSettings,
  onOpenSponsor,
  onOpenHandwriting,
  onOpenPdfWorkspace,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { shouldRender, isVisible } = useAnimatedVisibility(isOpen, 220);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 modal-backdrop-glass mm-backdrop-transition select-none ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm border p-4 font-sans select-text rounded-2xl modal-surface mm-modal-transition ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
        style={{
          transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 20px, 0) scale(0.96)',
          opacity: isVisible ? 1 : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3 className="font-serif font-bold text-sm">画布与笔记工具箱</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷操作网格（去除冗余重复项，突出核心功能） */}
        <div className="grid grid-cols-2 gap-2.5 py-3.5 text-xs">
          {/* 压感手写板 */}
          {onOpenHandwriting && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHandwriting();
              }}
              className={`flex items-center space-x-2 p-3 border transition-all cursor-pointer rounded-xl ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:border-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-500'
              }`}
            >
              <StylusPenVectorIcon size={16} className="text-blue-500 shrink-0" />
              <span className="font-medium">压感手写演算</span>
            </button>
          )}

          {/* PDF 讲义批注台 */}
          {onOpenPdfWorkspace && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPdfWorkspace();
              }}
              className={`flex items-center space-x-2 p-3 border transition-all cursor-pointer rounded-xl ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-500'
              }`}
            >
              <PdfNoteVectorIcon size={16} className="text-emerald-500 shrink-0" />
              <span className="font-medium">PDF 讲义批注</span>
            </button>
          )}

          {/* 布局切换 */}
          <button
            type="button"
            onClick={() => {
              onChangeLayout(layoutType === 'dagre' ? 'cose' : 'dagre');
              onClose();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            {layoutType === 'dagre' ? (
              <>
                <Network className="w-4 h-4 text-purple-400" />
                <span>切力导向布局</span>
              </>
            ) : (
              <>
                <GitFork className="w-4 h-4 text-emerald-400" />
                <span>切分层布局</span>
              </>
            )}
          </button>

          {/* 聚焦模式 */}
          <button
            type="button"
            onClick={() => {
              onToggleFocusMode();
              onClose();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            {isFocusMode ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-blue-500" />}
            <span>{isFocusMode ? '退出聚焦' : '开启聚焦'}</span>
          </button>

          {/* 外观模式切换 */}
          <button
            type="button"
            onClick={() => {
              onToggleTheme();
              onClose();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
            <span>{isDark ? '切浅色纸张' : '切深色黑曜'}</span>
          </button>

          {/* 全局系统设置 */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>全局系统设置</span>
          </button>

          {/* 撤销 / 重做 */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className={`flex items-center space-x-2 p-2.5 border transition-all rounded-xl ${
              canUndo
                ? isDark
                  ? 'bg-white/5 border-white/10 hover:border-blue-500 cursor-pointer'
                  : 'bg-black/5 border-black/10 hover:border-blue-600 cursor-pointer'
                : 'opacity-40 cursor-not-allowed border-black/5 dark:border-white/5'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span>撤销修改</span>
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className={`flex items-center space-x-2 p-2.5 border transition-all rounded-xl ${
              canRedo
                ? isDark
                  ? 'bg-white/5 border-white/10 hover:border-blue-500 cursor-pointer'
                  : 'bg-black/5 border-black/10 hover:border-blue-600 cursor-pointer'
                : 'opacity-40 cursor-not-allowed border-black/5 dark:border-white/5'
            }`}
          >
            <Redo2 className="w-4 h-4" />
            <span>重做修改</span>
          </button>

          {/* 导出 JSON */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSaveAs();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>导出讲义</span>
          </button>

          {/* 导入 JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-500" />
            <span>导入体系</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              onImport(e);
              onClose();
            }}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        {/* 底部打赏支持（使用统一绘制的矢量图标替代原始 Emoji） */}
        <div className="pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSponsor();
            }}
            className="w-full flex items-center justify-center space-x-2 p-2.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-medium transition-colors cursor-pointer rounded-xl"
          >
            <TeaCupVectorIcon size={15} />
            <span>为作者赞助一杯奶茶</span>
          </button>
        </div>
      </div>
    </div>
  );
};
