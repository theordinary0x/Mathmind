import React, { useRef } from 'react';
import { 
  GitFork, 
  Network, 
  Eye, 
  EyeOff, 
  Plus, 
  Link2, 
  Download, 
  Upload, 
  RotateCcw,
  Search,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  layoutType: 'dagre' | 'cose';
  onChangeLayout: (type: 'dagre' | 'cose') => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isConnectingMode: boolean;
  onToggleConnectingMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSeed: () => void;
  nodeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  layoutType,
  onChangeLayout,
  isFocusMode,
  onToggleFocusMode,
  isConnectingMode,
  onToggleConnectingMode,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onExport,
  onImport,
  onResetSeed,
  nodeCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="h-16 px-6 bg-white border-b border-[#E8E3D9] flex items-center justify-between select-none z-20 shrink-0">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E3D9] flex items-center justify-center text-[#26547C]">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-bold text-base tracking-tight text-[#2C2B29]">MathMind</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#F5F2EB] text-[#78756E] rounded">
              v0.1.0
            </span>
          </div>
          <p className="text-xs text-[#8C887E]">公理推导网络 · 极简学术版 ({nodeCount} 命题)</p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="relative w-72">
        <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索命题标题或类型..."
          className="w-full pl-9 pr-4 py-1.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] focus:bg-white text-xs text-[#2C2B29] rounded-lg border border-[#E8E3D9] focus:outline-none focus:border-[#2C2B29] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C887E] hover:text-[#2C2B29]"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Layout Switcher */}
        <div className="flex items-center bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E3D9]">
          <button
            onClick={() => onChangeLayout('dagre')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-all ${
              layoutType === 'dagre'
                ? 'bg-white shadow-xs font-semibold text-[#2C2B29] border border-[#E8E3D9]'
                : 'text-[#78756E] hover:text-[#2C2B29]'
            }`}
            title="分层推导布局（从公理到定理层层推进）"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>分层 DAG</span>
          </button>
          <button
            onClick={() => onChangeLayout('cose')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-all ${
              layoutType === 'cose'
                ? 'bg-white shadow-xs font-semibold text-[#2C2B29] border border-[#E8E3D9]'
                : 'text-[#78756E] hover:text-[#2C2B29]'
            }`}
            title="力导向聚类布局（按关联紧密度聚合）"
          >
            <Network className="w-3.5 h-3.5" />
            <span>力导向</span>
          </button>
        </div>

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
            isFocusMode
              ? 'bg-[#26547C] border-[#26547C] text-white font-medium shadow-xs'
              : 'bg-white border-[#E8E3D9] text-[#78756E] hover:text-[#2C2B29] hover:bg-[#FAF8F5]'
          }`}
          title="聚焦模式：点击节点只高亮其上下游链条，弱化其余节点"
        >
          {isFocusMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>聚焦模式: {isFocusMode ? '开' : '关'}</span>
        </button>

        {/* Connect Mode */}
        <button
          onClick={onToggleConnectingMode}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
            isConnectingMode
              ? 'bg-[#2563EB] border-[#2563EB] text-white font-medium shadow-xs'
              : 'bg-white border-[#E8E3D9] text-[#78756E] hover:text-[#2C2B29] hover:bg-[#FAF8F5]'
          }`}
          title="图上拖拽/点选连线建立依赖关系"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{isConnectingMode ? '连线中...' : '连线建立'}</span>
        </button>

        <div className="h-4 w-[1px] bg-[#E8E3D9] mx-1" />

        {/* Add Node Button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2C2B29] hover:bg-[#43413E] text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建命题</span>
        </button>

        {/* Data Tools: Export / Import / Reset */}
        <div className="flex items-center space-x-1 pl-1">
          <button
            onClick={onExport}
            className="p-1.5 text-[#78756E] hover:text-[#2C2B29] hover:bg-[#FAF8F5] rounded border border-[#E8E3D9] transition-colors"
            title="导出为 JSON 文件"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-[#78756E] hover:text-[#2C2B29] hover:bg-[#FAF8F5] rounded border border-[#E8E3D9] transition-colors"
            title="从 JSON 文件导入"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={onResetSeed}
            className="p-1.5 text-[#78756E] hover:text-[#A8423F] hover:bg-[#FAF8F5] rounded border border-[#E8E3D9] transition-colors"
            title="重置为初始皮亚诺公理示例"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
