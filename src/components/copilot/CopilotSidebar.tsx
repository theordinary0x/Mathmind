import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PropositionNode, AppTheme } from '../../types';
import { CopilotMessage, GraphMutationDiff } from '../../types/copilot';
import { loadAiSettings } from '../../services/ai/aiConfig';
import { sendCopilotRequest } from '../../services/ai/copilotService';
import { ContextPill } from './ContextPill';
import { CopilotMessageItem } from './CopilotMessageItem';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Settings, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  RotateCcw,
  BookOpen
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

const STORAGE_KEY = 'mathmind_copilot_messages_v1';

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

  // 历史消息列表
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load copilot messages:', e);
    }
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `你好！我是你的 **Math Copilot (数理思维副驾驶)**。
你可以随时与我讨论数理逻辑，或者圈选画布上的命题，让我协助你：
- 🔍 **审校逻辑链条**：检查严密性、发现隐含假设或循环依赖；
- 🔄 **重构命题网络**：合并等价结论、精简冗余引理、调整前置依赖；
- 📖 **教材提取录入**：拖入定理段落或公式截图，快速转换为结构化命题图谱。`,
        timestamp: Date.now()
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{
    name: string;
    mimeType: string;
    data: string;
    previewUrl?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 保存消息到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.error('Failed to save copilot messages:', e);
    }
  }, [messages]);

  // 自动滚底
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages.length, scrollToBottom]);

  // 处理附件图片选取
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('目前仅支持上传图片格式 (PNG, JPG, WebP) 或 PDF 文件。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 发送消息
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if ((!prompt && !attachment) || isLoading) return;

    const aiSettings = loadAiSettings();
    if (!aiSettings.apiKey.trim() && aiSettings.provider !== 'custom') {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ **未配置 AI 提供商密钥**\n\n请点击右上角设置图标（或在系统全局设置中）配置并保存你的 API 密钥后再进行对话。',
          timestamp: Date.now()
        }
      ]);
      return;
    }

    const userMessageId = `msg_user_${Date.now()}`;
    const assistantMessageId = `msg_asst_${Date.now() + 1}`;

    const userMsg: CopilotMessage = {
      id: userMessageId,
      role: 'user',
      content: prompt || (attachment ? `请解析并分析附件：${attachment.name}` : ''),
      timestamp: Date.now(),
      contextSnapshot: {
        nodeIds: selectedNodes.map(n => n.id),
        nodeTitles: selectedNodes.map(n => n.title),
        attachmentName: attachment?.name
      }
    };

    const pendingAssistantMsg: CopilotMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, pendingAssistantMsg]);
    setInputPrompt('');
    const currentAttachment = attachment;
    setAttachment(null);
    setIsLoading(true);

    try {
      const response = await sendCopilotRequest({
        history: messages,
        userPrompt: userMsg.content,
        allNodes,
        selectedNodes,
        attachment: currentAttachment ? {
          mimeType: currentAttachment.mimeType,
          data: currentAttachment.data,
          name: currentAttachment.name
        } : undefined,
        settings: aiSettings
      });

      setMessages(prev =>
        prev.map(m => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: response.text,
              diffProposal: response.diff ? {
                diff: response.diff,
                applied: false
              } : undefined,
              isStreaming: false
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: '',
              error: err.message || '网络请求失败，请检查 API 配置或网络连通性。',
              isStreaming: false
            };
          }
          return m;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 应用变更集
  const handleApplyDiff = (messageId: string, selectedActionIds?: Set<string>) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.diffProposal || targetMsg.diffProposal.applied) return;

    onApplyMutation(targetMsg.diffProposal.diff, selectedActionIds);

    // 标记为已应用
    setMessages(prev =>
      prev.map(m => {
        if (m.id === messageId && m.diffProposal) {
          return {
            ...m,
            diffProposal: {
              ...m.diffProposal,
              applied: true,
              appliedAt: Date.now()
            }
          };
        }
        return m;
      })
    );
  };

  // 清空历史
  const handleClearHistory = () => {
    if (confirm('确定要清空当前的 AI 对话记录吗？')) {
      setMessages([
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: '历史对话已清空。有什么可以协助你的吗？',
          timestamp: Date.now()
        }
      ]);
    }
  };

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
    >
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
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
        {messages.map(msg => (
          <CopilotMessageItem
            key={msg.id}
            message={msg}
            onApplyDiff={handleApplyDiff}
            onNavigateToNode={onNavigateToNode}
            isDark={isDark}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷推荐指令药丸 */}
      <div className="px-3 py-1.5 border-t border-inherit flex items-center space-x-1.5 overflow-x-auto no-scrollbar select-none">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
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
        {/* 图片预览预览条 */}
        {attachment?.previewUrl && (
          <div className="mb-2 relative inline-block">
            <img
              src={attachment.previewUrl}
              alt="attachment"
              className="h-16 w-auto rounded border border-inherit object-cover shadow-sm"
            />
            <button
              onClick={() => setAttachment(null)}
              className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div
          className={`flex items-end space-x-1.5 rounded-lg border p-1.5 transition-colors ${
            isDark
              ? 'bg-[#202024] border-[#333338] focus-within:border-blue-500'
              : 'bg-white border-stone-300 focus-within:border-blue-600'
          }`}
        >
          {/* 上传图片按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors"
            title="上传教材/公式截图或附件"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
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

          {/* 发送按钮 */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputPrompt.trim() && !attachment) || isLoading}
            className={`p-1.5 rounded-md transition-all ${
              (inputPrompt.trim() || attachment) && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                : 'opacity-40 cursor-not-allowed text-zinc-400'
            }`}
            title="发送指令 (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
