import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Sparkles, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES, AppTheme, PropositionStatus } from '../types';
import { MathSymbolToolbar } from './MathSymbolToolbar';
import { PrerequisitePicker } from './drawer/PrerequisitePicker';
import { FieldLatexPreview } from './drawer/FieldLatexPreview';
import { useTranslation } from '../i18n/LanguageContext';
import { useBackdropClose } from '../hooks/useBackdropClose';
import { UnsavedChangesModal } from './UnsavedChangesModal';


interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  onCreateNode: (newNode: PropositionNode) => void;
  onTriggerCopilot?: (prompt: string) => void;
  theme: AppTheme;
  initialPosition?: { x: number; y: number } | null;
  initialNodeData?: Partial<PropositionNode> | null;
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  allNodes,
  onCreateNode,
  onTriggerCopilot,
  theme,
  initialPosition,
  initialNodeData
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropositionType>('theorem');
  const [status, setStatus] = useState<PropositionStatus | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [statement, setStatement] = useState('');
  const [proofSketch, setProofSketch] = useState('');
  const [note, setNote] = useState('');
  const [fullProof, setFullProof] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [isFullProofExpanded, setIsFullProofExpanded] = useState(false);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<string>('title');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);

  const activeElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowUnsavedPrompt(false);
      if (initialNodeData) {
        setTitle(initialNodeData.title || '');
        setType(initialNodeData.type || 'theorem');
        setStatus(initialNodeData.status);
        setTags(initialNodeData.tags || []);
        setStatement(initialNodeData.statement || '');
        setProofSketch(initialNodeData.proof_sketch || '');
        setNote(initialNodeData.note || '');
        setFullProof(initialNodeData.full_proof || '');
        setExamples(initialNodeData.examples || []);
        setIsFullProofExpanded(Boolean(initialNodeData.full_proof));
        setDependsOn(initialNodeData.depends_on || []);
      } else {
        setTitle('');
        setType('theorem');
        setStatus(undefined);
        setTags([]);
        setStatement('');
        setProofSketch('');
        setNote('');
        setFullProof('');
        setExamples([]);
        setIsFullProofExpanded(false);
        setDependsOn([]);
      }
      setActiveField('title');
      setErrorMessage(null);
    }
  }, [isOpen, initialNodeData]);

  // 计算是否输入或修改了表单内容
  const isDirty = useMemo(() => {
    if (initialNodeData) {
      return (
        title !== (initialNodeData.title || '') ||
        type !== (initialNodeData.type || 'theorem') ||
        status !== initialNodeData.status ||
        statement !== (initialNodeData.statement || '') ||
        proofSketch !== (initialNodeData.proof_sketch || '') ||
        note !== (initialNodeData.note || '') ||
        fullProof !== (initialNodeData.full_proof || '') ||
        JSON.stringify(examples) !== JSON.stringify(initialNodeData.examples || []) ||
        JSON.stringify(dependsOn) !== JSON.stringify(initialNodeData.depends_on || [])
      );
    }
    return (
      title.trim() !== '' ||
      statement.trim() !== '' ||
      proofSketch.trim() !== '' ||
      fullProof.trim() !== '' ||
      note.trim() !== '' ||
      examples.length > 0 ||
      dependsOn.length > 0
    );
  }, [initialNodeData, title, type, status, statement, proofSketch, note, fullProof, examples, dependsOn]);

  const recordCursor = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.SyntheticEvent) => {
    activeElementRef.current = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  };

  const handleInsertSymbol = (symbol: string) => {
    const el = activeElementRef.current;

    // Handle insertion for dynamic example fields (e.g. 'example_0')
    if (activeField.startsWith('example_')) {
      const idx = parseInt(activeField.replace('example_', ''), 10);
      const examplesCopy = [...examples];
      const currentVal = examplesCopy[idx] || '';

      let start = currentVal.length;
      let end = currentVal.length;
      if (el && document.body.contains(el)) {
        start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
        end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
      }

      const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
      examplesCopy[idx] = newVal;
      setExamples(examplesCopy);

      let cursorOffset = symbol.length;
      if (symbol === '$ $') {
        cursorOffset = 1;
      } else if (symbol === '$$\n\n$$') {
        cursorOffset = 3;
      }

      requestAnimationFrame(() => {
        if (el && document.body.contains(el)) {
          el.focus();
          const nextPos = start + cursorOffset;
          el.setSelectionRange(nextPos, nextPos);
        }
      });
      return;
    }

    let currentVal = '';
    if (activeField === 'title') currentVal = title;
    else if (activeField === 'statement') currentVal = statement;
    else if (activeField === 'proof_sketch') currentVal = proofSketch;
    else if (activeField === 'full_proof') currentVal = fullProof;
    else if (activeField === 'note') currentVal = note;

    let start = currentVal.length;
    let end = currentVal.length;

    if (el && document.body.contains(el)) {
      start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
      end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
    }

    const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
    if (activeField === 'title') setTitle(newVal);
    else if (activeField === 'statement') setStatement(newVal);
    else if (activeField === 'proof_sketch') setProofSketch(newVal);
    else if (activeField === 'full_proof') setFullProof(newVal);
    else if (activeField === 'note') setNote(newVal);

    let cursorOffset = symbol.length;
    if (symbol === '$ $') {
      cursorOffset = 1;
    } else if (symbol === '$$\n\n$$') {
      cursorOffset = 3;
    }

    requestAnimationFrame(() => {
      if (el && document.body.contains(el)) {
        el.focus();
        const nextPos = start + cursorOffset;
        el.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const handleTogglePrerequisite = (candId: string) => {
    setDependsOn(prev => {
      const current = new Set(prev);
      if (current.has(candId)) {
        current.delete(candId);
      } else {
        current.add(candId);
      }
      return Array.from(current);
    });
  };

  const doSubmit = () => {
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        setErrorMessage(t('createModal.titleRequired'));
        return;
      }

      const cleanExamples = examples.map(ex => ex.trim()).filter(Boolean);

      const newNode: PropositionNode = {
        id: initialNodeData?.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        type,
        statement: statement.trim() || cleanTitle,
        proof_sketch: proofSketch.trim(),
        note: note.trim() || undefined,
        full_proof: fullProof.trim() || undefined,
        examples: cleanExamples.length > 0 ? cleanExamples : undefined,
        depends_on: Array.isArray(dependsOn) ? dependsOn : [],
        position: initialPosition || initialNodeData?.position || undefined,
        status: status || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      onCreateNode(newNode);
      onClose();
    } catch (err: any) {
      console.error('Failed to create node:', err);
      setErrorMessage(`创建命题失败: ${err?.message || '未知错误'}`);
    }
  };

  const requestClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedPrompt(false);
    onClose();
  };

  const handleCancelStay = () => {
    setShowUnsavedPrompt(false);
  };

  // Keyboard shortcut: ESC to close, Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showUnsavedPrompt) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        doSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, showUnsavedPrompt, isDirty, title, type, statement, proofSketch, fullProof, note, examples, dependsOn]);

  // 点击外部蒙版：在编辑页面任何情况下无法退出
  const handleBackdropClick = () => {
    // 静默拦截，禁止退出
  };
  const backdropProps = useBackdropClose(handleBackdropClick);

  if (!isOpen) return null;

  return (
    <div
      {...backdropProps}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-100 select-none"
    >

      <div
        className={`border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans select-text rounded-2xl glass-panel transition-all ${
          isDark
            ? 'bg-[#18181B] border-white/10 text-[#EDECE8]'
            : 'bg-[#FAF8F5] border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <select
              value={type}
              onChange={e => setType(e.target.value as PropositionType)}
              className={`text-xs px-2 py-1 border font-serif focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            >
              <option value="axiom">{t('nodeTypes.axiom')}</option>
              <option value="definition">{t('nodeTypes.definition')}</option>
              <option value="proposition">{t('nodeTypes.proposition')}</option>
              <option value="theorem">{t('nodeTypes.theorem')}</option>
              <option value="corollary">{t('nodeTypes.corollary')}</option>
              <option value="remark">{t('nodeTypes.remark')}</option>
            </select>
            <select
              value={status || ''}
              onChange={e => setStatus((e.target.value as PropositionStatus) || undefined)}
              className={`text-xs px-2 py-1 border font-serif focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
              title="研读标记状态"
            >
              <option value="">无标记</option>
              <option value="doubt">❓ 存疑</option>
              <option value="core">★ 重点</option>
              <option value="review">🔄 需复习</option>
              <option value="verified">✔ 已证毕</option>
            </select>
            <span className="text-[11px] font-mono opacity-60 flex items-center">
              ✨ {initialNodeData ? t('createModal.modalTitleEdit') : t('header.newProposition')}
            </span>
            {initialPosition && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border text-blue-500 border-blue-500/30 bg-blue-500/10">
                ({Math.round(initialPosition.x)}, {Math.round(initialPosition.y)})
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {onTriggerCopilot && (
              <button
                type="button"
                onClick={() => {
                  onTriggerCopilot(
                    title.trim()
                      ? `请为数学命题【${title.trim()}】生成严密规范的数学陈述、核心证明思路与前置依赖。`
                      : '请推荐或指导我创建一个数学命题，并给出严谨陈述与证明思路。'
                  );
                }}
                className={`flex items-center space-x-1 px-2 py-1 text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:border-blue-500 text-zinc-300 hover:text-white bg-[#121214]'
                    : 'border-[#D4CDC0] hover:border-blue-600 text-stone-700 hover:text-blue-600 bg-white'
                }`}
                title="呼叫 Copilot 助手生成或建议命题内容"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">AI 辅助</span>
              </button>
            )}

            <button
              type="button"
              onClick={requestClose}
              className="p-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LaTeX Symbols Quick Insert Toolbar */}
        <MathSymbolToolbar onInsert={handleInsertSymbol} theme={theme} />

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-500 font-serif">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold opacity-70 font-serif">
                命题标题 <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] opacity-40 font-mono">Enter 或 \\ 换行 · 支持 LaTeX</span>
            </div>
            <textarea
              autoFocus
              value={title}
              rows={Math.min(3, Math.max(1, (title.match(/\n/g) || []).length + 1))}
              onFocus={e => {
                setActiveField('title');
                recordCursor(e);
              }}
              onClick={recordCursor}
              onKeyUp={recordCursor}
              onSelect={recordCursor}
              onChange={e => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="如: T5: 加法消去律 ($a+c=b+c \implies a=b$)"
              className={`w-full text-sm font-serif font-bold p-2.5 border focus:outline-none resize-none leading-relaxed ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white'
                  : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            />
            <FieldLatexPreview
              label="标题渲染预览"
              content={title}
              isDark={isDark}
              className="font-serif font-bold"
            />
          </div>

          {/* Tags Configuration */}
          <div>
            <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
              自由标签 (Tags，用逗号或空格分隔)
            </div>
            <input
              type="text"
              value={tags.join(', ')}
              onChange={e => {
                const raw = e.target.value;
                const parsed = raw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
                setTags(parsed);
              }}
              placeholder="如: 反例, 期末考点, 拓扑闭包"
              className={`w-full text-xs p-2.5 border font-mono focus:outline-none ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white placeholder-zinc-500'
                  : 'bg-white border-[#D4CDC0] text-[#2C2B29] placeholder-stone-400'
              }`}
            />
          </div>

          {/* Statement */}
          <div>
            <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
              命题陈述 (Statement)
            </div>
            <textarea
              value={statement}
              onFocus={e => {
                setActiveField('statement');
                recordCursor(e);
              }}
              onClick={recordCursor}
              onKeyUp={recordCursor}
              onSelect={recordCursor}
              onChange={e => setStatement(e.target.value)}
              rows={3}
              placeholder="支持 LaTeX 语法，如 $x \in \mathbb{N}$ 或 $$a+b=b+a$$"
              className={`w-full p-2.5 text-xs font-serif border focus:outline-none leading-relaxed resize-none ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white'
                  : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            />
            <FieldLatexPreview
              label="陈述渲染预览"
              content={statement}
              isDark={isDark}
              className="font-serif"
            />
          </div>

          {/* Proof Sketch */}
          <div>
            <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
              证明思路概括 (Proof Sketch)
            </div>
            <textarea
              value={proofSketch}
              onFocus={e => {
                setActiveField('proof_sketch');
                recordCursor(e);
              }}
              onClick={recordCursor}
              onKeyUp={recordCursor}
              onSelect={recordCursor}
              onChange={e => setProofSketch(e.target.value)}
              rows={2}
              placeholder="一两句话概述推导核心思路..."
              className={`w-full p-2.5 text-xs border focus:outline-none resize-none ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white'
                  : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            />
            <FieldLatexPreview
              label="思路渲染预览"
              content={proofSketch}
              isDark={isDark}
              className="font-serif italic"
            />
          </div>

          {/* Full Proof (Collapsible) */}
          <div className="border-t border-inherit pt-3">
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setIsFullProofExpanded(!isFullProofExpanded)}
                className="flex items-center space-x-1 text-xs font-semibold font-serif text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isFullProofExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>完整严格证明 (Full Proof)</span>
                {fullProof && <span className="text-[10px] opacity-60 font-mono">({fullProof.length} 字符)</span>}
              </button>

              {onTriggerCopilot && !fullProof && (
                <button
                  type="button"
                  onClick={() =>
                    onTriggerCopilot(
                      title.trim()
                        ? `请为命题【${title.trim()}】生成完整严谨的分步数学推导证明。`
                        : '请为当前正在新建的命题补充严谨的分步证明。'
                    )
                  }
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-serif border transition-all cursor-pointer ${
                    isDark
                      ? 'border-[#E07A5F]/40 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#F28482]'
                      : 'border-[#E07A5F]/40 bg-[#FFF5F2] hover:bg-[#FFEAE5] text-[#C45D40]'
                  }`}
                  title="唤起 Copilot 自动生成完整推导"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI 补充证明</span>
                </button>
              )}
            </div>

            {isFullProofExpanded && (
              <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                <textarea
                  value={fullProof}
                  onFocus={e => {
                    setActiveField('full_proof');
                    recordCursor(e);
                  }}
                  onClick={recordCursor}
                  onKeyUp={recordCursor}
                  onSelect={recordCursor}
                  onChange={e => setFullProof(e.target.value)}
                  rows={6}
                  placeholder="严格分步推导正文（支持 Markdown 与 LaTeX 公式，如 $\implies$, $$...$$）"
                  className={`w-full p-2.5 text-xs font-serif border focus:outline-none leading-relaxed ${
                    isDark
                      ? 'bg-[#121214] border-[#2E2E33] text-white'
                      : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
                  }`}
                />
                <FieldLatexPreview
                  label="证明渲染预览"
                  content={fullProof}
                  isDark={isDark}
                  className="font-serif leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Multi-Example Dynamic Editor (典型实例 / 算例) */}
          <div className="border-t border-inherit pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold opacity-70 font-serif">
                  典型实例 / 算例 (Examples)
                </span>
                {examples.length > 0 && (
                  <span className="text-[10px] font-mono opacity-50">
                    ({examples.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setExamples(prev => [...prev, '']);
                  setActiveField(`example_${examples.length}`);
                }}
                className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:border-blue-500 bg-[#121214] text-zinc-300 hover:text-white'
                    : 'border-[#D4CDC0] hover:border-blue-600 bg-white text-stone-700 hover:text-blue-600'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>添加实例</span>
              </button>
            </div>

            {examples.length > 0 ? (
              <div className="space-y-3">
                {examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border space-y-2 ${
                      isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold opacity-70">
                        例 {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExamples(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
                        title="删除此实例"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={ex}
                      rows={2}
                      onFocus={e => {
                        setActiveField(`example_${idx}`);
                        recordCursor(e);
                      }}
                      onClick={recordCursor}
                      onKeyUp={recordCursor}
                      onSelect={recordCursor}
                      onChange={e => {
                        const val = e.target.value;
                        setExamples(prev => {
                          const copy = [...prev];
                          copy[idx] = val;
                          return copy;
                        });
                      }}
                      placeholder="输入具体算例、应用示范或特例反例，支持 LaTeX..."
                      className={`w-full p-2 text-xs font-serif border focus:outline-none resize-none leading-relaxed ${
                        isDark
                          ? 'bg-[#18181B] border-[#2E2E33] text-white'
                          : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                      }`}
                    />
                    <FieldLatexPreview
                      label={`例 ${idx + 1} 渲染预览`}
                      content={ex}
                      isDark={isDark}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs opacity-40 font-serif italic py-1">
                暂无实例。可点击右上角「添加实例」补充具体算例或应用场景。
              </div>
            )}
          </div>

          {/* Prerequisites Picker */}
          <div className="border-t border-inherit pt-3">
            <PrerequisitePicker
              currentNodeId={initialNodeData?.id || ''}
              allNodes={allNodes}
              selectedPrereqIds={dependsOn}
              onTogglePrereq={handleTogglePrerequisite}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 select-none ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <span className="text-[11px] opacity-50 font-mono hidden sm:inline">
            Ctrl + Enter {initialNodeData ? '保存' : '创建'} · Esc 取消
          </span>
          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={requestClose}
              className={`px-3 py-1.5 text-xs border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#2E2E33] hover:bg-white/5 text-zinc-300'
                  : 'border-[#D4CDC0] hover:bg-black/5 text-stone-700'
              }`}
            >
              取消 (Esc)
            </button>

            <button
              type="button"
              onClick={doSubmit}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{initialNodeData ? '保存修改 (Ctrl+Enter)' : '创建命题 (Ctrl+Enter)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onConfirmDiscard={handleConfirmDiscard}
        onCancelStay={handleCancelStay}
        isDark={isDark}
      />
    </div>
  );
};
