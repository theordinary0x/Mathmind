import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PropositionNode, AppTheme } from '../../types';
import { GraphMutationDiff } from '../../types/copilot';
import { ContextPill } from './ContextPill';
import { CopilotMessageItem } from './CopilotMessageItem';
import { AttachmentCard } from './AttachmentCard';
import { AttachmentPreviewModal, AttachmentPreviewData } from './AttachmentPreviewModal';
import { CopilotSessionDrawer } from './CopilotSessionDrawer';
import { QuoteReplyButton } from './QuoteReplyButton';
import { useCopilotChat } from '../../hooks/useCopilotChat';
import { exportChatToMarkdown, copyChatToClipboard } from '../../utils/chatExport';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Settings, 
  Send, 
  Square,
  Paperclip, 
  UploadCloud,
  BookOpen,
  MessageSquare,
  Download,
  Share2,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  selectedNodes: PropositionNode[];
  onApplyMutation: (diff: GraphMutationDiff, enabledActionIds?: Set<string>) => void;
  onNavigateToNode?: (nodeId: string) => void;
  onOpenSettings: () => void;
  onOpenAiIngestion?: () => void;
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
  onOpenAiIngestion,
  theme
}) => {
  const isDark = theme === 'dark';
  const [previewingAttachment, setPreviewingAttachment] = useState<AttachmentPreviewData | null>(null);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [chatCopied, setChatCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    activeSessionId,
    activeSession,
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
    handleRegenerate,
    handleEditAndResend,
    handleApplyDiff,
    handleUpdateProposalDiff,
    handleClearHistory,
    handleProcessFile,
    handleFileUpload,
    handlePaste,
    handleQuote,
    handleCreateSession,
    handleSelectSession,
    handleRenameSession,
    handleDeleteSession
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

  // 输入框高度自动伸缩 (1 到 6 行，约 28px - 140px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(140, Math.max(28, scrollHeight))}px`;
    }
  }, [inputPrompt]);

  // 点击外部关闭导出菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

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
      onPaste={handlePaste}
      className={`fixed right-0 top-13 sm:top-14 bottom-6 w-full sm:w-[440px] lg:w-[480px] z-40 flex flex-col border-l shadow-2xl transition-all select-text duration-200 ${
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
            支持图片、PDF、Word、PPT、Excel、CSV、LaTeX、代码及文本文档
          </div>
        </div>
      )}

      {/* 头部标题栏与功能控制 */}
      <div className="h-12 px-3 sm:px-4 border-b border-inherit flex items-center justify-between shrink-0 select-none bg-black/5 dark:bg-white/5 relative">
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          {/* 会话抽屉切换按钮 */}
          <button
            type="button"
            onClick={() => setIsSessionDrawerOpen(true)}
            className="flex items-center space-x-1 p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            title="查看所有对话历史与切换会话"
          >
            <div className="p-1 bg-blue-600 text-white shadow-xs group-hover:bg-blue-500">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-serif font-bold text-xs truncate max-w-[130px] sm:max-w-[170px]">
                  {activeSession.title}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </div>
              <div className="text-[9px] opacity-60 font-sans">
                {sessions.length} 个对话 • 点击切换
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {/* 讨论记录导出与分享菜单 */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 hover:text-blue-500 transition-colors cursor-pointer"
              title="导出或复制整场讨论记录"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {isExportMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-1 w-44 border shadow-xl z-50 p-1 text-xs animate-in fade-in zoom-in-95 duration-150 ${
                  isDark
                    ? 'bg-[#1C1C20] border-[#333338] text-zinc-100'
                    : 'bg-white border-stone-200 text-stone-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    exportChatToMarkdown(activeSession.title, messages);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-blue-600 hover:text-white text-left transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>导出为 .md 文件</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await copyChatToClipboard(activeSession.title, messages);
                    if (success) {
                      setChatCopied(true);
                      setTimeout(() => setChatCopied(false), 2000);
                      setIsExportMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-blue-600 hover:text-white text-left transition-colors cursor-pointer"
                >
                  {chatCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{chatCopied ? '已复制全篇' : '复制整篇对话'}</span>
                </button>
              </div>
            )}
          </div>

          {onOpenAiIngestion && (
            <button
              onClick={onOpenAiIngestion}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 hover:text-blue-500 transition-colors cursor-pointer"
              title="打开教材批量录入/精修弹窗 (I)"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleClearHistory}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
            title="清空当前会话消息"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
            title="AI 模型与密钥设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors ml-1 cursor-pointer"
            title="收起助手面板 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 选区上下文胶囊 (去除了底部重复的附件药丸) */}
      <ContextPill
        selectedNodes={selectedNodes}
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
            onUpdateDiff={handleUpdateProposalDiff}
            onRegenerate={handleRegenerate}
            onEditAndResend={handleEditAndResend}
            allNodes={allNodes}
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
            className={`text-[10px] px-2.5 py-1 border whitespace-nowrap transition-colors shrink-0 font-serif cursor-pointer ${
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
        {/* 附件信息卡片 (带 Office 与代码高保真图标) */}
        {attachment && (
          <AttachmentCard
            attachment={attachment}
            onRemove={() => setAttachment(null)}
            onPreview={(att) => setPreviewingAttachment(att)}
            isDark={isDark}
          />
        )}

        <div
          className={`flex items-end space-x-1.5 border p-1.5 transition-colors ${
            isDark
              ? 'bg-[#202024] border-[#333338] focus-within:border-blue-500'
              : 'bg-white border-stone-300 focus-within:border-blue-600'
          }`}
        >
          {/* 上传附件按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
            title="上传图片、PDF、Word、PPT、Excel、CSV、LaTeX 或代码文件"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf,.docx,.pptx,.xlsx,.csv,.tsv,.txt,.md,.markdown,.tex,.latex,.bib,.typ,.py,.cpp,.c,.h,.hpp,.java,.rs,.go,.ts,.js,.jsx,.tsx,.html,.css,.json,.yaml,.yml,.toml,.xml,.sql,.r,.m"
            className="hidden"
          />

          {/* 自动伸缩输入框 (1-6行自适应) */}
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              selectedNodes.length > 0
                ? `对选中的 ${selectedNodes.length} 个命题提问或指示重构... (Enter 发送)`
                : '输入数学问题、定理探讨或要求构建命题图谱... (Enter 发送)'
            }
            className="flex-1 bg-transparent resize-none text-xs focus:outline-none font-serif leading-5 px-1 py-1 overflow-y-auto"
            style={{ minHeight: '28px', maxHeight: '140px' }}
          />

          {/* 发送 / 停止生成 切换按钮 */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-xs animate-pulse shrink-0"
              title="停止生成 (Esc)"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() && !attachment}
              className={`p-1.5 transition-all shrink-0 ${
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

      {/* 会话历史抽屉 */}
      <CopilotSessionDrawer
        isOpen={isSessionDrawerOpen}
        onClose={() => setIsSessionDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isDark={isDark}
      />

      {/* 附件查看大弹窗 */}
      <AttachmentPreviewModal
        isOpen={!!previewingAttachment}
        onClose={() => setPreviewingAttachment(null)}
        attachment={previewingAttachment}
        isDark={isDark}
      />
    </aside>
  );
};
