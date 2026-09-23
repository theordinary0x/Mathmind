import React, { useRef, useState } from 'react';
import { Camera, Sparkles, Plus, Search, X } from 'lucide-react';

interface MobileBottomBarProps {
  isDark: boolean;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  onOpenCreateModal: () => void;
  onCapturePhoto: (file: File) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  isDark,
  isCopilotOpen,
  onToggleCopilot,
  onOpenCreateModal,
  onCapturePhoto,
  searchQuery,
  onSearchChange
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapturePhoto(file);
      // 清空 input 使得再次选择同一张照片也能触发 onChange
      e.target.value = '';
    }
  };

  return (
    <>
      {/* 搜索弹出浮层 */}
      {isSearchExpanded && (
        <div
          className={`fixed bottom-14 left-2 right-2 p-2 border shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
          }`}
        >
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="搜索画布中的命题与定理..."
              className={`w-full pl-8 pr-8 py-1.5 text-xs border focus:outline-none font-serif ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-white border-[#D4CDC0] text-stone-900 placeholder-stone-400 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 底部悬浮操作岛 */}
      <nav
        className={`fixed bottom-0 left-0 right-0 h-13 border-t flex items-center justify-around px-2 z-20 select-none ${
          isDark
            ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
            : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
        }`}
      >
        {/* 隐藏的真实相机文件输入（带 capture="environment" 直连后置摄像头） */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleCameraChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* 1. 搜索按钮 */}
        <button
          type="button"
          onClick={() => setIsSearchExpanded(prev => !prev)}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-serif transition-colors cursor-pointer ${
            isSearchExpanded || searchQuery
              ? 'text-blue-500'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>搜索</span>
        </button>

        {/* 2. 新建命题按钮 */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-serif opacity-70 hover:opacity-100 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mb-0.5" />
          <span>新建命题</span>
        </button>

        {/* 3. 【核心高亮主键】拍照录笔记 */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="relative -top-2 flex flex-col items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-lg transition-transform cursor-pointer border-2 border-white dark:border-[#18181B]"
          title="手机拍照上传笔记，AI 自动转图谱节点"
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-serif font-bold tracking-tight">拍照</span>
        </button>

        {/* 4. AI 导师 / Copilot 按钮 */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-serif transition-colors cursor-pointer ${
            isCopilotOpen
              ? 'text-blue-500 font-bold'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-amber-400" />
          <span>Copilot</span>
        </button>
      </nav>
    </>
  );
};
