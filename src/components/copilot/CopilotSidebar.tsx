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
  MessageSquare,
  Download,
  Share2,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';

export interface CopilotExternalTrigger {
  text: string;
  autoSend?: boolean;
  timestamp: number;
}

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  selectedNodes: PropositionNode[];
  onApplyMutation: (diff: GraphMutationDiff, enabledActionIds?: Set<string>) => void;
  onNavigateToNode?: (nodeId: string) => void;
  onOpenSettings: () => void;
  theme: AppTheme;
  externalTrigger?: CopilotExternalTrigger | null;
  onClearExternalTrigger?: () => void;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  allNodes,
  selectedNodes,
  onApplyMutation,
  onNavigateToNode,
  onOpenSettings,
  theme,
  externalTrigger,
  onClearExternalTrigger
}) => {
  const isDark = theme === 'dark';
  const [previewingAttachment, setPreviewingAttachment] = useState<AttachmentPreviewData | null>(null);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [chatCopied, setChatCopied] = useState(false);

  // 侧边栏宽度可调节状态 (默认 380px，范围 300px~800px，支持 localStorage 持久化)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mathmind_copilot_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 300 && val <= 800) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 380;
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(380);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartXRef.current - e.clientX;
      const minW = 300;
      const maxW = Math.min(800, window.innerWidth - 80);
      const newWidth = Math.max(minW, Math.min(maxW, resizeStartWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarWidth(curr => {
        try {
          localStorage.setItem('mathmind_copilot_sidebar_width', String(curr));
        } catch {
          // ignore
        }
        return curr;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

  const lastHandledTriggerRef = useRef<number>(0);
  const dragCounterRef = useRef<number>(0);

  // 全局拖拽结束清理（防止用户在浏览器外释放或取消拖拽导致遮罩常驻）
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, [setIsDraggingFile]);

  // 当侧边栏关闭时重置拖拽计数与状态
  useEffect(() => {
    if (!isOpen) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  }, [isOpen, setIsDraggingFile]);

  // 侧边栏及内部弹层专属 Escape 键分层关闭逻辑
  useEffect(() => {
    if (!isOpen) return;

    const handleSidebarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 1. 如果处于文件拖拽释放蒙层，优先关闭蒙层
        if (isDraggingFile) {
          e.preventDefault();
          e.stopPropagation();
          dragCounterRef.current = 0;
          setIsDraggingFile(false);
          return;
        }
        // 2. 如果附件大图预览打开，关闭大图预览
        if (previewingAttachment) {
          e.preventDefault();
          e.stopPropagation();
          setPreviewingAttachment(null);
          return;
        }
        // 3. 如果导出菜单打开，关闭导出菜单
        if (isExportMenuOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsExportMenuOpen(false);
          return;
        }
        // 4. 如果会话历史抽屉打开，关闭抽屉
        if (isSessionDrawerOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsSessionDrawerOpen(false);
          return;
        }
        // 5. 如果焦点在输入框且有内容，先失焦
        if (document.activeElement === textareaRef.current && inputPrompt.trim()) {
          e.preventDefault();
          e.stopPropagation();
          textareaRef.current?.blur();
          return;
        }
        // 6. 其它情况直接关闭侧边栏
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleSidebarKeyDown, true);
    return () => window.removeEventListener('keydown', handleSidebarKeyDown, true);
  }, [isOpen, isDraggingFile, previewingAttachment, isExportMenuOpen, isSessionDrawerOpen, inputPrompt, onClose, setIsDraggingFile]);

  // 响应来自外部组件（如命题详情抽屉）的 Copilot 触发
  useEffect(() => {
    if (externalTrigger && externalTrigger.text && externalTrigger.timestamp !== lastHandledTriggerRef.current) {
      lastHandledTriggerRef.current = externalTrigger.timestamp;
      if (externalTrigger.autoSend) {
        handleSendMessage(externalTrigger.text);
      } else {
        setInputPrompt(externalTrigger.text);
        textareaRef.current?.focus();
      }
      onClearExternalTrigger?.();
    }
  }, [externalTrigger, handleSendMessage, setInputPrompt, onClearExternalTrigger]);

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

  // 稳健文件拖拽交互事件
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    const isFiles = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
    if (!isFiles) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDraggingFile(true);
    }
  }, [setIsDraggingFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    const isFiles = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
    if (!isFiles) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  }, [setIsDraggingFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  }, [handleProcessFile, setIsDraggingFile]);

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
      style={{
        width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : `${sidebarWidth}px`
      }}
      className={`fixed right-0 top-13 sm:top-14 bottom-6 max-w-full z-30 flex flex-col border-l select-text ${
        isResizing ? '' : 'transition-[width] duration-200'
      } ${
        isDark
          ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
          : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 左边缘拖拽调节手柄 */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2 -translate-x-1 cursor-col-resize z-40 group items-center justify-center select-none"
        title="拖拽调节侧边栏宽度"
      >
        <div className={`w-0.5 h-8 rounded-full transition-colors ${
          isResizing 
            ? 'bg-blue-500' 
            : 'bg-transparent group-hover:bg-blue-500/60'
        }`} />
      </div>

      {/* 拖拽全域释放蒙层（仅覆盖内容区域，不遮盖顶部标题栏与关闭按钮） */}
      {isDraggingFile && (

        <div
          onClick={() => {
            dragCounterRef.current = 0;
            setIsDraggingFile(false);
          }}
          className="absolute top-12 inset-x-0 bottom-0 bg-blue-500/15 backdrop-blur-xs border-2 border-dashed border-blue-500 z-40 flex flex-col items-center justify-center select-none cursor-pointer p-4 text-center"
        >
          {/* 取消按钮 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dragCounterRef.current = 0;
              setIsDraggingFile(false);
            }}
            className={`absolute top-3 right-3 px-2 py-1 text-xs border cursor-pointer flex items-center space-x-1 transition-colors ${
              isDark
                ? 'bg-[#18181B] border-[#2E2E33] hover:border-red-500 text-zinc-300 hover:text-red-400'
                : 'bg-white border-[#D4CDC0] hover:border-red-600 text-stone-700 hover:text-red-600'
            }`}
            title="关闭拖拽提示 (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>取消</span>
          </button>

          <UploadCloud className="w-12 h-12 text-blue-500 mb-2 animate-bounce pointer-events-none" />
          <div className="text-sm font-semibold font-serif text-blue-600 dark:text-blue-400 pointer-events-none">
            释放文件即可添加到对话
          </div>
          <div className="text-xs opacity-70 mt-1 pointer-events-none">
            支持图片、PDF、Word、PPT、Excel、CSV、LaTeX、代码及文本文档
          </div>
          <div className="text-[11px] opacity-60 mt-2 font-mono pointer-events-none">
            (点击任意处或按 Esc 关闭提示)
          </div>
        </div>
      )}

      {/* 头部标题栏与功能控制 */}
      <div className={`h-12 px-3 sm:px-4 border-b border-inherit flex items-center justify-between shrink-0 select-none relative z-50 ${
        isDark ? 'bg-[#18181B]' : 'bg-[#FAF8F5]'
      }`}>
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
                    ? 'bg-[#18181B] border-[#2E2E33] text-zinc-100'
                    : 'bg-[#FAF8F5] border-[#D4CDC0] text-stone-900'
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
            type="button"
            onClick={() => {
              dragCounterRef.current = 0;
              setIsDraggingFile(false);
              onClose();
            }}
            className={`p-1.5 border transition-colors ml-1 cursor-pointer flex items-center justify-center ${
              isDark
                ? 'border-[#2E2E33] hover:border-red-500 hover:bg-red-500/10 text-zinc-400 hover:text-red-400'
                : 'border-[#D4CDC0] hover:border-red-600 hover:bg-red-50 text-stone-600 hover:text-red-600'
            }`}
            title="关闭助手面板 (Esc)"
            aria-label="关闭助手面板"
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
                ? 'bg-[#202024] border-[#2E2E33] hover:border-blue-500 hover:text-blue-400 text-zinc-300'
                : 'bg-white border-[#D4CDC0] hover:border-blue-600 hover:text-blue-600 text-stone-700'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 底部输入交互栏 */}
      <div className={`p-3 border-t border-inherit shrink-0 select-none ${
        isDark ? 'bg-[#18181B]' : 'bg-[#FAF8F5]'
      }`}>
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
          className={`flex flex-col border p-2 transition-colors ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] focus-within:border-blue-500'
              : 'bg-white border-[#D4CDC0] focus-within:border-blue-600'
          }`}
        >
          {/* 上半部分：自动伸缩输入框 (1-6行自适应，独占整行宽度) */}
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
            className="w-full bg-transparent resize-none text-xs focus:outline-none font-serif leading-relaxed px-1 py-0.5 overflow-y-auto"
            style={{ minHeight: '36px', maxHeight: '140px' }}
          />

          {/* 下半部分：操作按钮栏 (左侧上传附件，右侧发送) */}
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-black/5 dark:border-white/5">
            {/* 上传附件按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors cursor-pointer rounded-xs"
              title="上传图片、PDF、Word、PPT、Excel、CSV、LaTeX 或代码文件"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.docx,.pptx,.xlsx,.csv,.tsv,.txt,.md,.markdown,.tex,.latex,.bib,.typ,.py,.cpp,.c,.h,.hpp,.java,.rs,.go,.ts,.js,.jsx,.tsx,.html,.css,.json,.yaml,.yml,.toml,.xml,.sql,.r,.m"
              className="hidden"
            />

            {/* 发送 / 停止生成 切换按钮 */}
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-xs animate-pulse flex items-center space-x-1 text-[11px]"
                title="停止生成 (Esc)"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>停止</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() && !attachment}
                className={`p-1.5 transition-all rounded-xs ${
                  inputPrompt.trim() || attachment
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95 shadow-xs'
                    : 'opacity-40 cursor-not-allowed text-zinc-400'
                }`}
                title="发送指令 (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
