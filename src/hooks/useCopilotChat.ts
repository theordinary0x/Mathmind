import { useState, useRef, useEffect, useCallback } from 'react';
import { PropositionNode } from '../types';
import { CopilotMessage, GraphMutationDiff } from '../types/copilot';
import { loadAiSettings } from '../services/ai/aiConfig';
import { sendCopilotRequest } from '../services/ai/copilotService';
import { CopilotAttachment } from '../components/copilot/AttachmentCard';
import { processImageFile, processPdfFile } from '../utils/fileHelper';

const STORAGE_KEY = 'mathmind_copilot_messages_v1';

interface UseCopilotChatProps {
  allNodes: PropositionNode[];
  selectedNodes: PropositionNode[];
  onApplyMutation: (diff: GraphMutationDiff, enabledActionIds?: Set<string>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const useCopilotChat = ({
  allNodes,
  selectedNodes,
  onApplyMutation,
  textareaRef
}: UseCopilotChatProps) => {
  // 历史消息列表
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: CopilotMessage[] = JSON.parse(saved);
        // 关键防御：防止因意外中断/刷新导致消息永久停留在 isStreaming: true 状态
        return parsed.map(m =>
          m.isStreaming
            ? { ...m, isStreaming: false, content: m.content || '*(生成已中断)*' }
            : m
        );
      }
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
- 📖 **教材提取录入**：拖入定理段落、公式截图或文档，快速构建命题图谱。
- 💬 **划词精准追问**：划选任意数学陈述或推导，即可一键引用回复。`,
        timestamp: Date.now()
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<CopilotAttachment | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isGenerating = isLoading || messages.some(m => m.isStreaming);

  // 保存消息到 localStorage (保留最近 30 条，并对过大附件做持久化瘦身)
  useEffect(() => {
    try {
      const leanMessages = messages.slice(-30).map(m => {
        if (m.attachment && m.attachment.data && m.attachment.data.length > 300000) {
          return {
            ...m,
            attachment: {
              ...m.attachment,
              data: '' // 仅剔除超长 base64，保留 previewUrl 或 textContent
            }
          };
        }
        return m;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leanMessages));
    } catch (e) {
      console.error('Failed to save copilot messages:', e);
    }
  }, [messages]);

  // 统一文件解析处理（支持图片、PDF、文本、代码、LaTeX）
  const handleProcessFile = useCallback(async (file: File) => {
    const fileNameLower = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileNameLower);
    const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      /\.(txt|md|tex|json|py|cpp|c|h|ts|js|jsx|tsx|html|css|csv)$/i.test(fileNameLower);

    if (!isImage && !isPdf && !isText) {
      alert('目前支持上传图片 (PNG, JPG, WebP)、PDF 文档，以及文本/代码文件 (.txt, .md, .tex, .json, .py)。');
      return;
    }

    try {
      if (isPdf) {
        const { data, textContent } = await processPdfFile(file);
        setAttachment({
          name: file.name,
          size: file.size,
          mimeType: 'application/pdf',
          data,
          textContent,
          previewUrl: undefined
        });
      } else if (isImage) {
        const { data, previewUrl, mimeType } = await processImageFile(file);
        setAttachment({
          name: file.name,
          size: file.size,
          mimeType: mimeType || 'image/jpeg',
          data,
          previewUrl
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent = (reader.result as string) || '';
          setAttachment({
            name: file.name,
            size: file.size,
            mimeType: file.type || 'text/plain',
            data: '',
            textContent
          });
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      console.error('Failed to process attachment file:', err);
      alert(`解析文件失败: ${err.message || err}`);
    }
  }, []);

  // 处理文件上传选择
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleProcessFile(file);
      }
      e.target.value = '';
    },
    [handleProcessFile]
  );

  // 划词引用回调
  const handleQuote = useCallback(
    (quotedText: string) => {
      const cleanQuote = quotedText.trim();
      if (!cleanQuote) return;

      const formattedQuote = `> ${cleanQuote.replace(/\r?\n+/g, '\n> ')}\n\n`;
      setInputPrompt(prev => (prev ? `${formattedQuote}${prev}` : formattedQuote));
      textareaRef.current?.focus();
    },
    [textareaRef]
  );

  // 剪贴板粘贴文件/图片处理 (Ctrl+V 截图或文件)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      const clipboardData = (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessFile(file);
            return;
          }
        }
      }
    },
    [handleProcessFile]
  );

  // 随时停止生成
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setMessages(prev =>
      prev.map(m => {
        if (m.isStreaming) {
          return {
            ...m,
            content: m.content ? `${m.content}\n\n*(已手动停止生成)*` : '*(已停止生成)*',
            isStreaming: false
          };
        }
        return m;
      })
    );
  }, []);

  // 键盘快捷键监听 (Esc 停止生成)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenerating) {
        e.preventDefault();
        handleStopGeneration();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, handleStopGeneration]);

  // 发送消息
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
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

      const currentAttachment = attachment;
      const userMsg: CopilotMessage = {
        id: userMessageId,
        role: 'user',
        content: prompt || (currentAttachment ? `请解析并分析附加文件：${currentAttachment.name}` : ''),
        timestamp: Date.now(),
        attachment: currentAttachment
          ? {
              name: currentAttachment.name,
              size: currentAttachment.size,
              mimeType: currentAttachment.mimeType,
              previewUrl: currentAttachment.previewUrl,
              textContent: currentAttachment.textContent,
              data: currentAttachment.data
            }
          : undefined,
        contextSnapshot: {
          nodeIds: selectedNodes.map(n => n.id),
          nodeTitles: selectedNodes.map(n => n.title),
          attachmentName: currentAttachment?.name
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
      setAttachment(null);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await sendCopilotRequest({
          history: messages,
          userPrompt: userMsg.content,
          allNodes,
          selectedNodes,
          attachment: currentAttachment
            ? {
                mimeType: currentAttachment.mimeType,
                data: currentAttachment.data,
                name: currentAttachment.name,
                textContent: currentAttachment.textContent
              }
            : undefined,
          settings: aiSettings,
          signal: controller.signal
        });

        setMessages(prev =>
          prev.map(m => {
            if (m.id === assistantMessageId) {
              return {
                ...m,
                content: response.text,
                diffProposal: response.diff
                  ? {
                      diff: response.diff,
                      applied: false
                    }
                  : undefined,
                isStreaming: false
              };
            }
            return m;
          })
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setMessages(prev =>
            prev.map(m => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: m.content ? `${m.content}\n\n*(已手动停止生成)*` : '*(已停止生成)*',
                  isStreaming: false
                };
              }
              return m;
            })
          );
          return;
        }
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
        abortControllerRef.current = null;
      }
    },
    [inputPrompt, attachment, isLoading, messages, allNodes, selectedNodes]
  );

  // 应用变更集
  const handleApplyDiff = useCallback(
    (messageId: string, selectedActionIds?: Set<string>) => {
      const targetMsg = messages.find(m => m.id === messageId);
      if (!targetMsg || !targetMsg.diffProposal || targetMsg.diffProposal.applied) return;

      onApplyMutation(targetMsg.diffProposal.diff, selectedActionIds);

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
    },
    [messages, onApplyMutation]
  );

  // 更新并微调变更提案
  const handleUpdateProposalDiff = useCallback(
    (messageId: string, updatedDiff: GraphMutationDiff) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id === messageId && m.diffProposal) {
            return {
              ...m,
              diffProposal: {
                ...m.diffProposal,
                diff: updatedDiff
              }
            };
          }
          return m;
        })
      );
    },
    []
  );

  // 清空历史
  const handleClearHistory = useCallback(() => {
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
  }, []);

  return {
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
    handleUpdateProposalDiff,
    handleClearHistory,
    handleProcessFile,
    handleFileUpload,
    handlePaste,
    handleQuote
  };
};
