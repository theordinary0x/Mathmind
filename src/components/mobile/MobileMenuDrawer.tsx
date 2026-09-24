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
  Coffee, 
  Undo2, 
  Redo2,
  BookOpen,
  Sparkles,
  Square,
  Zap
} from 'lucide-react';
import { AppTheme, CornerStyle, SurfaceMaterial, AnimationFpsMode } from '../../types';

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
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  isDark,
  theme,
  onToggleTheme,
  cornerStyle,
  onToggleCornerStyle,
  surfaceMaterial,
  onToggleSurfaceMaterial,
  fpsMode,
  onCycleFpsMode,
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
  onOpenSponsor
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-100 select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm border shadow-2xl p-4 font-sans select-text animate-in slide-in-from-bottom-4 duration-150 rounded-2xl glass-panel ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3 className="font-serif font-bold text-sm">移动端工具菜单</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷操作网格 */}
        <div className="grid grid-cols-2 gap-2 py-3 text-xs">
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

          {/* 边角形态切换（圆角 / 直角） */}
          <button
            type="button"
            onClick={() => {
              onToggleCornerStyle();
              onClose();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Square className="w-4 h-4 text-blue-400" />
            <span>{cornerStyle === 'rounded' ? '形态：圆角' : '形态：直角'}</span>
          </button>

          {/* 表面材质切换（毛玻璃 / 纯色） */}
          <button
            type="button"
            onClick={() => {
              onToggleSurfaceMaterial();
              onClose();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{surfaceMaterial === 'glass' ? '材质：毛玻璃' : '材质：纯色'}</span>
          </button>

          {/* 动画与帧率切换 */}
          <button
            type="button"
            onClick={() => {
              onCycleFpsMode();
            }}
            className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer rounded-xl ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-blue-500'
                : 'bg-black/5 border-black/10 hover:border-blue-600'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>
              {fpsMode === 'high' ? '帧率：120Hz 高刷' : fpsMode === 'standard' ? '帧率：60 FPS' : fpsMode === 'economy' ? '帧率：30 FPS 节能' : '帧率：0 FPS 无影'}
            </span>
          </button>

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

          {/* 系统设置 */}
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
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>全局设置</span>
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

        {/* 底部打赏支持 */}
        <div className="pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSponsor();
            }}
            className="w-full flex items-center justify-center space-x-2 p-2 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-medium transition-colors cursor-pointer rounded-xl"
          >
            <Coffee className="w-4 h-4" />
            <span>为作者赞助一杯奶茶 🥤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
