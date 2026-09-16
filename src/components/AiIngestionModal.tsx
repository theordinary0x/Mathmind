import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Link, 
  Eye, 
  EyeOff, 
  Trash2,
  Layers,
  Plus
} from 'lucide-react';
import { PropositionNode, PropositionType, AppTheme, NODE_TYPES } from '../types';
import { 
  AiProvider, 
  AiSettings, 
  ExtractedProposition, 
  IngestionBuildMode,
  AiIngestionInput 
} from '../types/ai';
import { 
  loadAiSettings, 
  saveAiSettings, 
  PROVIDER_CONFIGS, 
  getSavedKeyForProvider 
} from '../services/ai/aiConfig';
import { extractMathPropositions } from '../services/ai/aiService';
import { 
  processImageFile, 
  processPdfFile, 
  extractImageFromClipboard, 
  formatFileSize,
  ProcessedImageData,
  ProcessedPdfData
} from '../utils/fileHelper';
import { MathRenderer } from './MathRenderer';

interface AiIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  theme: AppTheme;
  onBatchImport: (
    newNodes: Array<Omit<PropositionNode, 'id'> & { tempId: string }>,
    connections: Array<{ fromTempOrId: string; toTempOrId: string }>
  ) => void;
  onOpenSingleInCreateModal: (nodeData: Partial<PropositionNode>) => void;
}

export const AiIngestionModal: React.FC<AiIngestionModalProps> = ({
  isOpen,
  onClose,
  allNodes,
  theme,
  onBatchImport,
  onOpenSingleInCreateModal
}) => {
  const isDark = theme === 'dark';

  // AI Settings State
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Input States
  const [inputTab, setInputTab] = useState<'text' | 'image' | 'pdf'>('text');
  const [textContent, setTextContent] = useState<string>('');
  const [imageData, setImageData] = useState<ProcessedImageData | null>(null);
  const [pdfData, setPdfData] = useState<ProcessedPdfData | null>(null);
  const [buildMode, setBuildMode] = useState<IngestionBuildMode>('batch');

  // Execution & Extraction States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedNodes, setExtractedNodes] = useState<ExtractedProposition[]>([]);
  const [selectedTempIds, setSelectedTempIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Sync settings when provider changes
  const handleProviderChange = (provider: AiProvider) => {
    const meta = PROVIDER_CONFIGS[provider];
    const savedKey = getSavedKeyForProvider(provider);
    const updated: AiSettings = {
      provider,
      apiKey: savedKey,
      baseUrl: meta.defaultBaseUrl,
      model: meta.defaultModel
    };
    setAiSettings(updated);
    saveAiSettings(updated);
  };

  const handleUpdateSettings = (partial: Partial<AiSettings>) => {
    const updated = { ...aiSettings, ...partial };
    setAiSettings(updated);
    saveAiSettings(updated);
  };

  // Keyboard shortcut listener (Escape & Ctrl+Enter)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isLoading && hasValidInput) {
          handleStartExtraction();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, textContent, imageData, pdfData, aiSettings, buildMode]);

  // Global paste handler for images
  const handleContainerPaste = useCallback(async (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      const processed = await extractImageFromClipboard(e.clipboardData.items);
      if (processed) {
        setImageData(processed);
        setInputTab('image');
        setErrorMessage(null);
      }
    }
  }, []);

  const hasValidInput = useMemo(() => {
    if (inputTab === 'text') return textContent.trim().length > 0;
    if (inputTab === 'image') return imageData !== null;
    if (inputTab === 'pdf') return pdfData !== null;
    return false;
  }, [inputTab, textContent, imageData, pdfData]);

  // Map of existing node ID to node
  const existingNodeMap = useMemo(() => {
    const map = new Map<string, PropositionNode>();
    allNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [allNodes]);

  // Handle Extraction Execution
  const handleStartExtraction = async () => {
    if (!aiSettings.apiKey.trim() && aiSettings.provider !== 'custom') {
      setShowSettingsPanel(true);
      setErrorMessage(`请先配置 ${PROVIDER_CONFIGS[aiSettings.provider].name} 的 API Key。`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setExtractedNodes([]);
    setSelectedTempIds(new Set());

    const input: AiIngestionInput = {
      mode: inputTab,
      text: textContent,
      image: imageData ? {
        mimeType: imageData.mimeType,
        data: imageData.data,
        previewUrl: imageData.previewUrl,
        fileName: imageData.fileName
      } : undefined,
      pdf: pdfData ? {
        fileName: pdfData.fileName,
        fileSize: pdfData.fileSize,
        data: pdfData.data,
        textContent: pdfData.textContent
      } : undefined
    };

    try {
      const results = await extractMathPropositions(input, buildMode, allNodes, aiSettings);
      setExtractedNodes(results);
      setSelectedTempIds(new Set(results.map(r => r.tempId)));
    } catch (err: any) {
      setErrorMessage(err.message || 'AI 提取服务出错，请检查配置与网络。');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (tempId: string) => {
    setSelectedTempIds(prev => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedTempIds.size === extractedNodes.length) {
      setSelectedTempIds(new Set());
    } else {
      setSelectedTempIds(new Set(extractedNodes.map(n => n.tempId)));
    }
  };

  // Execute Batch Import
  const handleExecuteBatchImport = () => {
    const toImport = extractedNodes.filter(n => selectedTempIds.has(n.tempId));
    if (toImport.length === 0) return;

    const newNodes = toImport.map(item => ({
      tempId: item.tempId,
      type: item.type,
      title: item.title,
      statement: item.statement,
      proof_sketch: item.proof_sketch,
      depends_on: item.depends_on_existing_ids
    }));

    const connections: Array<{ fromTempOrId: string; toTempOrId: string }> = [];

    toImport.forEach(target => {
      // 1. Existing canvas node -> target
      target.depends_on_existing_ids.forEach(fromId => {
        if (existingNodeMap.has(fromId)) {
          connections.push({ fromTempOrId: fromId, toTempOrId: target.tempId });
        }
      });
      // 2. Newly extracted node -> target
      target.depends_on_new_temp_ids.forEach(fromTempId => {
        if (selectedTempIds.has(fromTempId)) {
          connections.push({ fromTempOrId: fromTempId, toTempOrId: target.tempId });
        }
      });
    });

    onBatchImport(newNodes, connections);
    onClose();
  };

  // Execute Single Mode Refinement
  const handleOpenSingle = (node: ExtractedProposition) => {
    onOpenSingleInCreateModal({
      type: node.type,
      title: node.title,
      statement: node.statement,
      proof_sketch: node.proof_sketch,
      depends_on: node.depends_on_existing_ids
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onPaste={handleContainerPaste}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-100"
    >
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans ${
          isDark ? 'bg-[#18181B] border-white/10 text-[#EDECE8]' : 'bg-white border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#202024] border-white/10' : 'bg-[#FAF8F5] border-black/10'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-serif font-bold">AI 教材智能录入</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono">
                  {PROVIDER_CONFIGS[aiSettings.provider].name}
                </span>
              </div>
              <p className="text-[11px] opacity-60">
                支持文本、剪贴板截图与 PDF，智能识别因果前置拓扑链
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors ${
                showSettingsPanel 
                  ? 'bg-blue-600 text-white' 
                  : isDark ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-stone-600 hover:text-black'
              }`}
              title="配置 AI 模型与 API Key"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">模型配置</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              title="关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline AI Configuration Panel */}
        {showSettingsPanel && (
          <div
            className={`p-4 border-b shrink-0 animate-in slide-in-from-top-2 duration-150 ${
              isDark ? 'bg-[#242429] border-white/10' : 'bg-stone-50 border-black/10'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Provider Selector */}
              <div>
                <label className="block text-[11px] font-medium opacity-70 mb-1">模型服务商</label>
                <select
                  value={aiSettings.provider}
                  onChange={e => handleProviderChange(e.target.value as AiProvider)}
                  className={`w-full p-1.5 rounded border text-xs outline-hidden ${
                    isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-white border-black/15 text-stone-800'
                  }`}
                >
                  <option value="gemini">Google Gemini (多模态/PDF)</option>
                  <option value="deepseek">DeepSeek (深度求索)</option>
                  <option value="qwen">通义千问 (Qwen)</option>
                  <option value="glm">智谱清言 (GLM)</option>
                  <option value="custom">自定义 / 本地 Ollama</option>
                </select>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-[11px] font-medium opacity-70 mb-1">模型名称</label>
                <input
                  type="text"
                  value={aiSettings.model}
                  onChange={e => handleUpdateSettings({ model: e.target.value })}
                  placeholder="如 gemini-2.5-flash / deepseek-chat"
                  className={`w-full p-1.5 rounded border text-xs outline-hidden font-mono ${
                    isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-white border-black/15 text-stone-800'
                  }`}
                />
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium opacity-70">API Key</label>
                  {PROVIDER_CONFIGS[aiSettings.provider].docUrl && (
                    <a
                      href={PROVIDER_CONFIGS[aiSettings.provider].docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      获取密钥 &rarr;
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiSettings.apiKey}
                    onChange={e => handleUpdateSettings({ apiKey: e.target.value })}
                    placeholder="输入 API Key (本地保存)"
                    className={`w-full p-1.5 pr-8 rounded border text-xs outline-hidden font-mono ${
                      isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-white border-black/15 text-stone-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Input and Configuration */}
          <div className="w-full md:w-1/2 flex flex-col p-4 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 overflow-y-auto">
            {/* Build Mode Selector */}
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60">提炼策略</label>
              <div className="flex items-center p-0.5 rounded-lg border border-black/10 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setBuildMode('batch')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    buildMode === 'batch' 
                      ? 'bg-blue-600 text-white font-medium shadow-xs' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  ⚡ 批量抽取 (Batch)
                </button>
                <button
                  type="button"
                  onClick={() => setBuildMode('single')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    buildMode === 'single' 
                      ? 'bg-blue-600 text-white font-medium shadow-xs' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  🎯 单个精修 (Single)
                </button>
              </div>
            </div>

            {/* Input Type Tabs */}
            <div className="flex border-b border-black/10 dark:border-white/10 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setInputTab('text')}
                className={`pb-2 px-3 border-b-2 flex items-center space-x-1.5 font-medium transition-colors ${
                  inputTab === 'text'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>文本 / LaTeX</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('image')}
                className={`pb-2 px-3 border-b-2 flex items-center space-x-1.5 font-medium transition-colors ${
                  inputTab === 'image'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>截图 / 图片</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('pdf')}
                className={`pb-2 px-3 border-b-2 flex items-center space-x-1.5 font-medium transition-colors ${
                  inputTab === 'pdf'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>PDF 文档</span>
              </button>
            </div>

            {/* Input Form Fields */}
            <div className="flex-1 flex flex-col min-h-[180px]">
              {inputTab === 'text' && (
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder="在此粘贴教材正文、定理推导段落或 LaTeX 源码...&#10;&#10;例：&#10;定义 1.2（一致连续）：设函数 f(x) 在区间 I 上有定义。若对于任意给定的 ε > 0，总存在 δ > 0..."
                  className={`w-full flex-1 p-3 rounded-lg border text-xs leading-relaxed resize-none outline-hidden font-serif ${
                    isDark
                      ? 'bg-[#121214] border-white/10 text-white placeholder-zinc-500'
                      : 'bg-[#FAF8F5] border-black/10 text-stone-900 placeholder-stone-400'
                  }`}
                />
              )}

              {inputTab === 'image' && (
                <div className="flex-1 flex flex-col">
                  {imageData ? (
                    <div className="relative flex-1 flex flex-col items-center justify-center p-2 border rounded-lg border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                      <img
                        src={imageData.previewUrl}
                        alt="待识别图片"
                        className="max-h-52 object-contain rounded shadow-sm"
                      />
                      <div className="mt-2 text-[11px] opacity-70 flex items-center justify-between w-full px-2">
                        <span className="truncate">{imageData.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setImageData(null)}
                          className="text-red-500 hover:text-red-600 flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>移除</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
                        isDark 
                          ? 'border-white/15 hover:border-blue-500/50 hover:bg-white/5' 
                          : 'border-black/15 hover:border-blue-500/50 hover:bg-stone-50'
                      }`}
                    >
                      <ImageIcon className="w-8 h-8 opacity-40 mb-2 text-blue-500" />
                      <p className="text-xs font-medium">点击选择或拖拽图片到此</p>
                      <p className="text-[11px] opacity-60 mt-1">支持在任意位置直接 Ctrl + V 粘贴剪贴板截图</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const processed = await processImageFile(file);
                        setImageData(processed);
                      }
                    }}
                  />
                  {/* Optional supplementary instructions */}
                  <input
                    type="text"
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="可选：补充补充说明或重点关注的定理名称..."
                    className={`mt-2 p-2 rounded border text-xs outline-hidden ${
                      isDark ? 'bg-[#121214] border-white/10 text-white' : 'bg-[#FAF8F5] border-black/10 text-stone-800'
                    }`}
                  />
                </div>
              )}

              {inputTab === 'pdf' && (
                <div className="flex-1 flex flex-col">
                  {pdfData ? (
                    <div className="relative flex-1 flex flex-col items-center justify-center p-4 border rounded-lg border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                      <FileSpreadsheet className="w-10 h-10 text-red-500 opacity-80 mb-2" />
                      <p className="text-xs font-bold truncate max-w-xs">{pdfData.fileName}</p>
                      <p className="text-[11px] opacity-60 mt-0.5">{formatFileSize(pdfData.fileSize)}</p>
                      <button
                        type="button"
                        onClick={() => setPdfData(null)}
                        className="mt-3 text-xs text-red-500 hover:text-red-600 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>移除并重选</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => pdfInputRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
                        isDark 
                          ? 'border-white/15 hover:border-blue-500/50 hover:bg-white/5' 
                          : 'border-black/15 hover:border-blue-500/50 hover:bg-stone-50'
                      }`}
                    >
                      <FileSpreadsheet className="w-8 h-8 opacity-40 mb-2 text-indigo-500" />
                      <p className="text-xs font-medium">点击选择本地 PDF 文档</p>
                      <p className="text-[11px] opacity-60 mt-1">推荐使用 Google Gemini 原生解析 PDF 公式与逻辑</p>
                    </div>
                  )}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const processed = await processPdfFile(file);
                        setPdfData(processed);
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="可选：指定解析章节或补充提示..."
                    className={`mt-2 p-2 rounded border text-xs outline-hidden ${
                      isDark ? 'bg-[#121214] border-white/10 text-white' : 'bg-[#FAF8F5] border-black/10 text-stone-800'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Trigger Button */}
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] opacity-50 font-mono hidden sm:inline">Ctrl + Enter 启动</span>
              <button
                type="button"
                onClick={handleStartExtraction}
                disabled={isLoading || !hasValidInput}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 正在提炼数学逻辑...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>开始智能提炼</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Result Checklist */}
          <div className="w-full md:w-1/2 flex flex-col p-4 overflow-y-auto min-h-[260px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  提炼结果预览 ({extractedNodes.length})
                </h3>
              </div>
              {extractedNodes.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] text-blue-500 hover:underline"
                >
                  {selectedTempIds.size === extractedNodes.length ? '取消全选' : '全选'}
                </button>
              )}
            </div>

            {/* Empty or Loading State */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-70">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-xs font-medium">正在解析命题、验证 LaTeX 公式与前置依赖...</p>
                <p className="text-[11px] opacity-60 mt-1">耗时通常约 3~8 秒，请稍候</p>
              </div>
            ) : extractedNodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 border-2 border-dashed rounded-lg border-black/10 dark:border-white/10">
                <Sparkles className="w-8 h-8 mb-2" />
                <p className="text-xs">在左侧输入数学材料后点击“开始智能提炼”</p>
                <p className="text-[11px] mt-1">提取出的定义、定理与拓扑连接将在此展示</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {extractedNodes.map((item) => {
                  const isSelected = selectedTempIds.has(item.tempId);
                  const typeMeta = NODE_TYPES[item.type] || { label: item.type, color: 'bg-zinc-500' };

                  return (
                    <div
                      key={item.tempId}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isSelected 
                          ? isDark ? 'bg-blue-950/20 border-blue-500/50' : 'bg-blue-50/50 border-blue-400'
                          : isDark ? 'bg-white/5 border-white/10 opacity-75' : 'bg-stone-50 border-black/10 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.tempId)}
                            className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                          />
                          <span className={`px-1.5 py-0.5 rounded text-[10px] text-white font-medium ${typeMeta.color}`}>
                            {typeMeta.label}
                          </span>
                          <span className="font-serif font-bold text-sm">{item.title}</span>
                        </div>

                        {buildMode === 'single' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSingle(item)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] shrink-0"
                          >
                            精修编辑 &rarr;
                          </button>
                        )}
                      </div>

                      {/* Statement Preview */}
                      <div className="mt-2 pl-5.5">
                        <div className="p-2 rounded bg-black/5 dark:bg-black/20 font-serif leading-relaxed text-xs">
                          <MathRenderer content={item.statement} />
                        </div>

                        {item.proof_sketch && (
                          <p className="mt-1.5 text-[11px] opacity-70 leading-relaxed font-serif">
                            <span className="font-bold">思路：</span>{item.proof_sketch}
                          </p>
                        )}

                        {/* Dependencies */}
                        {(item.depends_on_existing_ids.length > 0 || item.depends_on_new_temp_ids.length > 0) && (
                          <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="opacity-60 flex items-center">
                              <Link className="w-3 h-3 mr-1" /> 前置依赖:
                            </span>
                            {/* Existing canvas nodes */}
                            {item.depends_on_existing_ids.map(id => {
                              const existing = existingNodeMap.get(id);
                              return (
                                <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                                  {existing?.title || id} (已有)
                                </span>
                              );
                            })}
                            {/* In-batch new nodes */}
                            {item.depends_on_new_temp_ids.map(tempId => {
                              const targetNew = extractedNodes.find(n => n.tempId === tempId);
                              return (
                                <span key={tempId} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono flex items-center">
                                  <ArrowRight className="w-2.5 h-2.5 mr-0.5" />
                                  {targetNew?.title || tempId}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Batch Import Button */}
            {extractedNodes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs opacity-70">
                  已选择 <strong className="text-blue-500">{selectedTempIds.size}</strong> / {extractedNodes.length} 个命题
                </span>
                <button
                  type="button"
                  onClick={handleExecuteBatchImport}
                  disabled={selectedTempIds.size === 0}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>一键导入画布</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
