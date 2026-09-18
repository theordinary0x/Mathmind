import React, { useRef, useEffect, useCallback } from 'react';
import { PropositionNode, AppTheme } from '../../types';
import { GraphMutationDiff } from '../../types/copilot';
import { ContextPill } from './ContextPill';
import { CopilotMessageItem } from './CopilotMessageItem';
import { AttachmentCard } from './AttachmentCard';
import { QuoteReplyButton } from './QuoteReplyButton';
import { useCopilotChat } from '../../hooks/useCopilotChat';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Settings, 
  Send, 
  Square,
  Paperclip, 
  UploadCloud
} from 'lucide-react';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  selectedNodes: PropositionNode[];
  onApplyMutation: (diff: GraphMutationDiff, enabledActionIds?: Set<string>) => void;
  onNavigateToNode?: (nodeId: string) => void;
  onOpenSettings: () => void;
  theme: AppTheme;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  allNodes,
  selectedNodes,
  onApplyMutation,
  onNavigateToNode,
  onOpenSettings,
  theme
}) => {
  const isDark = theme === 'dark';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    inputPrompt,
    setInputPrompt,
    isLoading,
    isGenerating,
    attachment,
    setAttachment,
    isDraggingFile,
    setIsDraggingFile,
    handleSendMessage,
    handleStopGeneration,
    handleApplyDiff,
    handleClearHistory,
    handleProcessFile,
    handleFileUpload,
    handleQuote
  } = useCopilotChat({
    allNodes,
    selectedNodes,
    onApplyMutation,
    textareaRef
  });

  // 自动滚底
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages.length, scrollToBottom]);

  // 快捷 Prompt 标签
  const quickPrompts = selectedNodes.length > 0 ? [
    '分析选区命题的严密性与逻辑过渡',
    '检查选区内是否存在循环论证或悬空推论',
    '精简合并选区冗余引理并重构连线',
    '为当前选区命题补充详细证明'
  ] : [
    '审视当前全图的数学拓扑结构合理性',
    '检查整张画布是否存在循环推导',
    '推荐适合当前命题网络的前沿推论',
    '提取教材定理并构建关联图谱'
  ];

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed right-0 top-13 sm:top-14 bottom-7 w-full sm:w-[440px] lg:w-[480px] z-30 flex flex-col border-l shadow-2xl transition-all select-text duration-200 ${
        isDark
          ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#2C2B29]'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX <= rect.left ||
          e.clientX >= rect.right ||
          e.clientY <= rect.top ||
          e.clientY >= rect.bottom
        ) {
          setIsDraggingFile(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          handleProcessFile(file);
        }
      }}
    >
      {/* 拖拽全域释放蒙层 */}
      {isDraggingFile && (
        <div className="absolute inset-0 bg-blue-500/15 backdrop-blur-xs border-2 border-dashed border-blue-500 z-50 flex flex-col items-center justify-center pointer-events-none select-none">
          <UploadCloud className="w-12 h-12 text-blue-500 mb-2 animate-bounce" />
          <div className="text-sm font-semibold font-serif text-blue-600 dark:text-blue-400">
            释放文件即可添加到对话
          </div>
          <div className="text-xs opacity-70 mt-1">
            支持图片、PDF、Markdown、LaTeX 及文本文件
          </div>
        </div>
      )}

      {/* 头部标题栏 */}
      <div className="h-12 px-4 border-b border-inherit flex items-center justify-between shrink-0 select-none bg-black/5 dark:bg-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm leading-tight">Math Copilot</h2>
            <div className="text-[10px] opacity-60 font-sans">数理思维结对助手</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors"
            title="清空会话历史"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors"
            title="AI 模型与密钥设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors ml-1"
            title="收起助手面板 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 选区与附件上下文胶囊 */}
      <ContextPill
        selectedNodes={selectedNodes}
        attachmentName={attachment?.name}
        onClearAttachment={() => setAttachment(null)}
        isDark={isDark}
      />

      {/* 消息滚动列表区 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 select-text relative"
      >
        {messages.map(msg => (
          <CopilotMessageItem
            key={msg.id}
            message={msg}
            onApplyDiff={handleApplyDiff}
            onNavigateToNode={onNavigateToNode}
            onStopGeneration={handleStopGeneration}
            isDark={isDark}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 划词浮动引用回复按钮 */}
      <QuoteReplyButton
        containerRef={messagesContainerRef}
        onQuote={handleQuote}
        isDark={isDark}
      />

      {/* 快捷推荐指令药丸 */}
      <div className="px-3 py-1.5 border-t border-inherit flex items-center space-x-1.5 overflow-x-auto no-scrollbar select-none">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isGenerating}
            className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors shrink-0 font-serif ${
              isDark
                ? 'bg-[#27272A] border-[#3F3F46] hover:border-blue-500 hover:text-blue-400 text-zinc-300'
                : 'bg-white border-stone-200 hover:border-blue-600 hover:text-blue-600 text-stone-700'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 底部输入交互栏 */}
      <div className="p-3 border-t border-inherit bg-black/5 dark:bg-white/5 shrink-0 select-none">
        {/* 附件信息卡片 */}
        {attachment && (
          <AttachmentCard
            attachment={attachment}
            onRemove={() => setAttachment(null)}
            isDark={isDark}
          />
        )}

        <div
          className={`flex items-end space-x-1.5 rounded-lg border p-1.5 transition-colors ${
            isDark
              ? 'bg-[#202024] border-[#333338] focus-within:border-blue-500'
              : 'bg-white border-stone-300 focus-within:border-blue-600'
          }`}
        >
          {/* 上传附件按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors"
            title="上传图片截图、PDF或文本文档"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf,.txt,.md,.tex,.json,.py,.cpp"
            className="hidden"
          />

          {/* 输入框 */}
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              selectedNodes.length > 0
                ? `对当前选中的 ${selectedNodes.length} 个命题提问或指示重构... (Enter 发送)`
                : '输入数学问题、定理探讨或要求构建命题图谱... (Enter 发送)'
            }
            rows={2}
            className="flex-1 bg-transparent resize-none text-xs focus:outline-none font-serif leading-relaxed px-1"
          />

          {/* 发送 / 停止生成 切换按钮 */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-xs animate-pulse"
              title="停止生成 (Esc)"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() && !attachment}
              className={`p-1.5 rounded-md transition-all ${
                inputPrompt.trim() || attachment
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                  : 'opacity-40 cursor-not-allowed text-zinc-400'
              }`}
              title="发送指令 (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
