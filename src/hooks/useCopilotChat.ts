import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PropositionNode } from '../types';
import { CopilotMessage, GraphMutationDiff, CopilotSession } from '../types/copilot';
import { loadAiSettings } from '../services/ai/aiConfig';
import { sendCopilotRequest } from '../services/ai/copilotService';
import { CopilotAttachment } from '../components/copilot/AttachmentCard';
import {
  processImageFile,
  processPdfFile,
  isOfficeFile,
  processOfficeFile,
  isCodeOrTextFile
} from '../utils/fileHelper';

const SESSIONS_STORAGE_KEY = 'mathmind_copilot_sessions_v1';
const LEGACY_MESSAGES_KEY = 'mathmind_copilot_messages_v1';

const createDefaultSession = (): CopilotSession => ({
  id: `session_${Date.now()}`,
  title: '新对话',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
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
  ]
});

function loadInitialSessions(): CopilotSession[] {
  try {
    const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (saved) {
      const parsed: CopilotSession[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(s => ({
          ...s,
          messages: s.messages.map(m =>
            m.isStreaming
              ? { ...m, isStreaming: false, content: m.content || '*(生成已中断)*' }
              : m
          )
        }));
      }
    }

    // 尝试平滑迁移旧版单会话历史
    const legacy = localStorage.getItem(LEGACY_MESSAGES_KEY);
    if (legacy) {
      const parsedMsgs: CopilotMessage[] = JSON.parse(legacy);
      if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
        const firstUser = parsedMsgs.find(m => m.role === 'user');
        const sessionTitle = firstUser?.content ? firstUser.content.slice(0, 16) : '默认对话';
        const migrated: CopilotSession = {
          id: `session_${Date.now()}`,
          title: sessionTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: parsedMsgs.map(m =>
            m.isStreaming
              ? { ...m, isStreaming: false, content: m.content || '*(生成已中断)*' }
              : m
          )
        };
        return [migrated];
      }
    }
  } catch (e) {
    console.error('Failed to load copilot sessions:', e);
  }
  return [createDefaultSession()];
}

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
  const [sessions, setSessions] = useState<CopilotSession[]>(loadInitialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '');

  // 确保有效会话
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || createDefaultSession();
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<CopilotAttachment | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isGenerating = isLoading || messages.some(m => m.isStreaming);

  // 会话持久化存储
  useEffect(() => {
    try {
      const leanSessions = sessions.map(s => ({
        ...s,
        messages: s.messages.slice(-30).map(m => {
          if (m.attachment && m.attachment.data && m.attachment.data.length > 300000) {
            return {
              ...m,
              attachment: {
                ...m.attachment,
                data: ''
              }
            };
          }
          return m;
        })
      }));
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(leanSessions));
    } catch (e) {
      console.error('Failed to save copilot sessions:', e);
    }
  }, [sessions]);

  // 更新当前活跃会话的消息列表
  const updateCurrentMessages = useCallback(
    (updater: (prevMsgs: CopilotMessage[]) => CopilotMessage[]) => {
      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSession.id) {
            const nextMsgs = updater(s.messages);
            return {
              ...s,
              updatedAt: Date.now(),
              messages: nextMsgs
            };
          }
          return s;
        })
      );
    },
    [activeSession.id]
  );

  // 多会话操作
  const handleCreateSession = useCallback(() => {
    const newSession = createDefaultSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputPrompt('');
    setAttachment(null);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setInputPrompt('');
    setAttachment(null);
  }, []);

  const handleRenameSession = useCallback((id: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createDefaultSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId]);

  // 统一文件解析处理（支持 Office、图片、PDF、代码/文本）
  const handleProcessFile = useCallback(async (file: File): Promise<CopilotAttachment | null> => {
    const fileNameLower = file.name.toLowerCase();

    // 严禁上传 .ipynb（用户明确要求）
    if (fileNameLower.endsWith('.ipynb')) {
      alert('暂不支持 .ipynb 文件。如需分析代码或推导，请直接上传 .py、.tex、.md 或文本格式。');
      return null;
    }

    // 1. Office 文档 (Word, PowerPoint, Excel, CSV, TSV)
    if (isOfficeFile(file.name)) {
      try {
        const officeData = await processOfficeFile(file);
        const att: CopilotAttachment = {
          name: officeData.fileName,
          size: officeData.fileSize,
          mimeType:
            officeData.format === 'csv'
              ? 'text/csv'
              : 'application/vnd.openxmlformats-officedocument',
          data: '',
          textContent: officeData.textContent
        };
        setAttachment(att);
        return att;
      } catch (err: any) {
        console.error('Failed to parse office file:', err);
        alert(`解析办公文档失败: ${err.message || err}`);
        return null;
      }
    }

    // 2. 学术与代码文件 (.tex, .py, .cpp, .md, .typ, .bib, .json, .ts, etc.)
    if (isCodeOrTextFile(file.name)) {
      try {
        const text = await file.text();
        const att: CopilotAttachment = {
          name: file.name,
          size: file.size,
          mimeType: 'text/plain',
          data: '',
          textContent: text
        };
        setAttachment(att);
        return att;
      } catch (err: any) {
        console.error('Failed to read text file:', err);
        alert(`读取文本/代码文件失败: ${err.message || err}`);
        return null;
      }
    }

    // 3. PDF
    if (file.type === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
      try {
        const { data, textContent } = await processPdfFile(file);
        const att: CopilotAttachment = {
          name: file.name,
          size: file.size,
          mimeType: 'application/pdf',
          data,
          textContent,
          previewUrl: undefined
        };
        setAttachment(att);
        return att;
      } catch (err: any) {
        console.error('Failed to process PDF file:', err);
        alert(`解析 PDF 失败: ${err.message || err}`);
        return null;
      }
    }

    // 4. 图片
    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileNameLower)) {
      try {
        const { data, previewUrl, mimeType } = await processImageFile(file);
        const att: CopilotAttachment = {
          name: file.name,
          size: file.size,
          mimeType: mimeType || 'image/jpeg',
          data,
          previewUrl
        };
        setAttachment(att);
        return att;
      } catch (err: any) {
        console.error('Failed to process image file:', err);
        alert(`解析图片失败: ${err.message || err}`);
        return null;
      }
    }

    alert('支持上传图片 (PNG, JPG)、PDF、Office 文档 (Word, PPT, Excel, CSV) 以及代码/学术文本 (.tex, .py, .md 等)。');
    return null;
  }, []);

  // 文件上传选择
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

  // 剪贴板粘贴
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      const clipboardData =
        (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
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

  // 停止生成
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    updateCurrentMessages(prev =>
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
  }, [updateCurrentMessages]);

  // Esc 停止生成快捷键
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

  // 核心执行 AI 请求并流式写回
  const executeAiRequest = useCallback(
    async (
      userMsg: CopilotMessage,
      historyBefore: CopilotMessage[],
      assistantMsgId: string
    ) => {
      const aiSettings = loadAiSettings();
      if (!aiSettings.apiKey.trim() && aiSettings.provider !== 'custom') {
        updateCurrentMessages(prev => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: 'assistant',
            content:
              '⚠️ **未配置 AI 提供商密钥**\n\n请点击右上角设置图标（或在系统全局设置中）配置并保存你的 API 密钥后再进行对话。',
            timestamp: Date.now()
          }
        ]);
        return;
      }

      setIsLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const startTime = Date.now();

      try {
        const response = await sendCopilotRequest({
          history: historyBefore,
          userPrompt: userMsg.content,
          allNodes,
          selectedNodes,
          attachment: userMsg.attachment
            ? {
                mimeType: userMsg.attachment.mimeType,
                data: userMsg.attachment.data || '',
                name: userMsg.attachment.name,
                textContent: userMsg.attachment.textContent
              }
            : undefined,
          settings: aiSettings,
          signal: controller.signal
        });

        const durationMs = Date.now() - startTime;

        updateCurrentMessages(prev =>
          prev.map(m => {
            if (m.id === assistantMsgId) {
              return {
                ...m,
                content: response.text,
                diffProposal: response.diff
                  ? {
                      diff: response.diff,
                      applied: false
                    }
                  : undefined,
                durationMs,
                isStreaming: false
              };
            }
            return m;
          })
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          updateCurrentMessages(prev =>
            prev.map(m => {
              if (m.id === assistantMsgId) {
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
        updateCurrentMessages(prev =>
          prev.map(m => {
            if (m.id === assistantMsgId) {
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
    [allNodes, selectedNodes, updateCurrentMessages]
  );

  // 发送新消息
  const handleSendMessage = useCallback(
    async (textToSend?: string, customAttachment?: CopilotAttachment | null) => {
      const prompt = (textToSend !== undefined ? textToSend : inputPrompt).trim();
      const currentAttachment = customAttachment !== undefined ? customAttachment : attachment;
      if ((!prompt && !currentAttachment) || isLoading) return;

      const userMessageId = `msg_user_${Date.now()}`;
      const assistantMessageId = `msg_asst_${Date.now() + 1}`;
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

      // 自动命名新会话
      if (activeSession.title === '新对话') {
        const generatedTitle = (prompt || currentAttachment?.name || '数学研讨').slice(0, 16);
        handleRenameSession(activeSession.id, generatedTitle);
      }

      const historyBefore = messages;
      updateCurrentMessages(prev => [...prev, userMsg, pendingAssistantMsg]);
      setInputPrompt('');
      setAttachment(null);

      executeAiRequest(userMsg, historyBefore, assistantMessageId);
    },
    [
      inputPrompt,
      attachment,
      isLoading,
      activeSession.title,
      activeSession.id,
      messages,
      updateCurrentMessages,
      handleRenameSession,
      executeAiRequest,
      selectedNodes
    ]
  );

  // 重新生成回答 (Regenerate)
  const handleRegenerate = useCallback(
    (assistantMessageId: string) => {
      if (isLoading) return;
      const asstIdx = messages.findIndex(m => m.id === assistantMessageId);
      if (asstIdx === -1) return;

      // 寻找对应的上一条用户提问
      let userIdx = -1;
      for (let i = asstIdx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userIdx = i;
          break;
        }
      }
      if (userIdx === -1) return;

      const userMsg = messages[userIdx];
      const historyBefore = messages.slice(0, userIdx);
      const newAssistantMessageId = `msg_asst_${Date.now()}`;

      const pendingAssistantMsg: CopilotMessage = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      // 保留到 userMsg，移除旧的回答并附加新的占位消息
      updateCurrentMessages(() => [...messages.slice(0, userIdx + 1), pendingAssistantMsg]);
      executeAiRequest(userMsg, historyBefore, newAssistantMessageId);
    },
    [isLoading, messages, updateCurrentMessages, executeAiRequest]
  );

  // 编辑提问并重新发送 (Edit & Resend)
  const handleEditAndResend = useCallback(
    (userMessageId: string, newPrompt: string) => {
      if (isLoading) return;
      const userIdx = messages.findIndex(m => m.id === userMessageId);
      if (userIdx === -1) return;

      const oldUserMsg = messages[userIdx];
      const updatedUserMsg: CopilotMessage = {
        ...oldUserMsg,
        content: newPrompt.trim(),
        timestamp: Date.now()
      };

      const historyBefore = messages.slice(0, userIdx);
      const newAssistantMessageId = `msg_asst_${Date.now()}`;

      const pendingAssistantMsg: CopilotMessage = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      // 截断该消息之后的所有内容
      updateCurrentMessages(() => [...historyBefore, updatedUserMsg, pendingAssistantMsg]);
      executeAiRequest(updatedUserMsg, historyBefore, newAssistantMessageId);
    },
    [isLoading, messages, updateCurrentMessages, executeAiRequest]
  );

  // 应用变更集
  const handleApplyDiff = useCallback(
    (messageId: string, selectedActionIds?: Set<string>) => {
      const targetMsg = messages.find(m => m.id === messageId);
      if (!targetMsg || !targetMsg.diffProposal || targetMsg.diffProposal.applied) return;

      onApplyMutation(targetMsg.diffProposal.diff, selectedActionIds);

      updateCurrentMessages(prev =>
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
    [messages, onApplyMutation, updateCurrentMessages]
  );

  // 更新变更提案
  const handleUpdateProposalDiff = useCallback(
    (messageId: string, updatedDiff: GraphMutationDiff) => {
      updateCurrentMessages(prev =>
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
    [updateCurrentMessages]
  );

  // 清空当前对话
  const handleClearHistory = useCallback(() => {
    if (confirm('确定要清空当前的 AI 对话记录吗？')) {
      updateCurrentMessages(() => [
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: '历史对话已清空。有什么可以协助你的吗？',
          timestamp: Date.now()
        }
      ]);
    }
  }, [updateCurrentMessages]);

  return {
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
  };
};
