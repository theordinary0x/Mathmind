import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { PropositionNode, PropositionType, AppTheme, PropositionStatus } from '../types';
import { MathSymbolToolbar } from './MathSymbolToolbar';
import { NodeEditView } from './drawer/NodeEditView';
import { useTranslation } from '../i18n/LanguageContext';
import { useBackdropClose } from '../hooks/useBackdropClose';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { useAnimatedVisibility } from '../hooks/useAnimatedVisibility';
import { SparkleAiVectorIcon } from './icons/CustomIcons';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  onCreateNode: (newNode: PropositionNode) => void;
  onTriggerCopilot?: (prompt: string) => void;
  onOpenHandwriting?: (onInsert: (latex: string) => void) => void;
  theme: AppTheme;
  initialPosition?: { x: number; y: number } | null;
  initialNodeData?: Partial<PropositionNode> | null;
}

const createDefaultFormNode = (
  initialNodeData?: Partial<PropositionNode> | null,
  initialPosition?: { x: number; y: number } | null
): PropositionNode => ({
  id: initialNodeData?.id || '',
  title: initialNodeData?.title || '',
  type: initialNodeData?.type || 'theorem',
  status: initialNodeData?.status,
  tags: initialNodeData?.tags || [],
  statement: initialNodeData?.statement || '',
  proof_sketch: initialNodeData?.proof_sketch || '',
  note: initialNodeData?.note || '',
  full_proof: initialNodeData?.full_proof || '',
  examples: initialNodeData?.examples || [],
  depends_on: initialNodeData?.depends_on || [],
  position: initialPosition || initialNodeData?.position || undefined,
});

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  allNodes,
  onCreateNode,
  onTriggerCopilot,
  onOpenHandwriting,
  theme,
  initialPosition,
  initialNodeData
}) => {
  const [formData, setFormData] = useState<PropositionNode | null>(() =>
    createDefaultFormNode(initialNodeData, initialPosition)
  );
  const [isFullProofExpanded, setIsFullProofExpanded] = useState(false);
  const [activeField, setActiveField] = useState<string>('title');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);

  const activeElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const { shouldRender, isVisible } = useAnimatedVisibility(isOpen, 240);

  useEffect(() => {
    if (isOpen) {
      setShowUnsavedPrompt(false);
      setFormData(createDefaultFormNode(initialNodeData, initialPosition));
      setIsFullProofExpanded(Boolean(initialNodeData?.full_proof));
      setActiveField('title');
      setErrorMessage(null);
    }
  }, [isOpen, initialNodeData, initialPosition]);

  const isDirty = useMemo(() => {
    if (!formData) return false;
    if (initialNodeData) {
      return (
        formData.title !== (initialNodeData.title || '') ||
        formData.type !== (initialNodeData.type || 'theorem') ||
        formData.status !== initialNodeData.status ||
        formData.statement !== (initialNodeData.statement || '') ||
        formData.proof_sketch !== (initialNodeData.proof_sketch || '') ||
        (formData.note || '') !== (initialNodeData.note || '') ||
        (formData.full_proof || '') !== (initialNodeData.full_proof || '') ||
        JSON.stringify(formData.examples || []) !== JSON.stringify(initialNodeData.examples || []) ||
        JSON.stringify(formData.depends_on || []) !== JSON.stringify(initialNodeData.depends_on || [])
      );
    }
    return (
      formData.title.trim() !== '' ||
      formData.statement.trim() !== '' ||
      formData.proof_sketch.trim() !== '' ||
      (formData.full_proof || '').trim() !== '' ||
      (formData.note || '').trim() !== '' ||
      (formData.examples || []).length > 0 ||
      formData.depends_on.length > 0
    );
  }, [initialNodeData, formData]);

  const recordCursor = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.SyntheticEvent) => {
    activeElementRef.current = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  };

  const handleInsertSymbol = (symbol: string) => {
    if (!formData) return;
    const el = activeElementRef.current;

    if (activeField.startsWith('example_')) {
      const idx = parseInt(activeField.replace('example_', ''), 10);
      const examplesCopy = [...(formData.examples || [])];
      const currentVal = examplesCopy[idx] || '';

      let start = currentVal.length;
      let end = currentVal.length;
      if (el && document.body.contains(el)) {
        start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
        end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
      }

      const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
      examplesCopy[idx] = newVal;
      setFormData(prev => (prev ? { ...prev, examples: examplesCopy } : null));

      let cursorOffset = symbol.length;
      if (symbol === '$ $') cursorOffset = 1;
      else if (symbol === '$$\n\n$$') cursorOffset = 3;

      requestAnimationFrame(() => {
        if (el && document.body.contains(el)) {
          el.focus();
          const nextPos = start + cursorOffset;
          el.setSelectionRange(nextPos, nextPos);
        }
      });
      return;
    }

    const targetKey = activeField as 'title' | 'statement' | 'proof_sketch' | 'full_proof' | 'note';
    const currentVal = (formData[targetKey] as string) || '';

    let start = currentVal.length;
    let end = currentVal.length;
    if (el && document.body.contains(el)) {
      start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
      end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
    }

    const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
    setFormData(prev => (prev ? { ...prev, [targetKey]: newVal } : null));

    let cursorOffset = symbol.length;
    if (symbol === '$ $') cursorOffset = 1;
    else if (symbol === '$$\n\n$$') cursorOffset = 3;

    requestAnimationFrame(() => {
      if (el && document.body.contains(el)) {
        el.focus();
        const nextPos = start + cursorOffset;
        el.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const handleTogglePrerequisite = (candId: string) => {
    setFormData(prev => {
      if (!prev) return null;
      const current = new Set(prev.depends_on);
      if (current.has(candId)) {
        current.delete(candId);
      } else {
        current.add(candId);
      }
      return { ...prev, depends_on: Array.from(current) };
    });
  };

  const doSubmit = () => {
    if (!formData) return;
    try {
      const cleanTitle = formData.title.trim();
      if (!cleanTitle) {
        setErrorMessage(t('createModal.titleRequired'));
        return;
      }

      const cleanExamples = (formData.examples || []).map(ex => ex.trim()).filter(Boolean);

      const newNode: PropositionNode = {
        id: initialNodeData?.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        type: formData.type,
        statement: formData.statement.trim() || cleanTitle,
        proof_sketch: formData.proof_sketch.trim(),
        note: formData.note?.trim() || undefined,
        full_proof: formData.full_proof?.trim() || undefined,
        examples: cleanExamples.length > 0 ? cleanExamples : undefined,
        depends_on: Array.isArray(formData.depends_on) ? formData.depends_on : [],
        position: initialPosition || initialNodeData?.position || undefined,
        status: formData.status || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined
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
  }, [isOpen, showUnsavedPrompt, isDirty, formData]);

  const handleBackdropClick = () => {
    // 静默拦截，防止误触蒙版丢失编辑内容
  };
  const backdropProps = useBackdropClose(handleBackdropClick);

  if (!shouldRender || !formData) return null;

  return (
    <div
      {...backdropProps}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none modal-backdrop-glass mm-backdrop-transition ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans select-text rounded-2xl modal-surface mm-modal-transition ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
        style={{
          transform: isVisible
            ? 'translate3d(0, 0, 0) scale(1)'
            : 'translate3d(0, 14px, 0) scale(0.95)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as PropositionType })}
              className={`text-xs px-2.5 py-1 rounded-lg border font-serif focus:outline-none cursor-pointer ${
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
              value={formData.status || ''}
              onChange={e => setFormData({ ...formData, status: (e.target.value as PropositionStatus) || undefined })}
              className={`text-xs px-2.5 py-1 rounded-lg border font-serif focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
              title="研读标记状态"
            >
              <option value="">无标记</option>
              <option value="doubt">[?] 存疑</option>
              <option value="core">[*] 重点</option>
              <option value="review">[~] 需复习</option>
              <option value="verified">[v] 已证毕</option>
            </select>
            <span className="text-[11px] font-mono opacity-70 flex items-center space-x-1">
              <SparkleAiVectorIcon size={13} className="text-amber-400" />
              <span>{initialNodeData ? t('createModal.modalTitleEdit') : t('header.newProposition')}</span>
            </span>
            {initialPosition && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border text-blue-500 border-blue-500/30 bg-blue-500/10">
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
                    formData.title.trim()
                      ? `请为数学命题【${formData.title.trim()}】生成严密规范的数学陈述、核心证明思路与前置依赖。`
                      : '请推荐或指导我创建一个数学命题，并给出严谨陈述与证明思路。'
                  );
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:border-blue-500 text-zinc-300 hover:text-white bg-[#121214]'
                    : 'border-[#D4CDC0] hover:border-blue-600 text-stone-700 hover:text-blue-600 bg-white'
                }`}
                title="呼叫 Copilot 助手生成或建议命题内容"
              >
                <SparkleAiVectorIcon size={14} className="text-amber-400" />
                <span className="hidden sm:inline">AI 辅助</span>
              </button>
            )}

            <button
              type="button"
              onClick={requestClose}
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LaTeX Symbols Quick Insert Toolbar */}
        <MathSymbolToolbar
          onInsert={handleInsertSymbol}
          theme={theme}
          onOpenHandwriting={
            onOpenHandwriting
              ? () => onOpenHandwriting(latex => handleInsertSymbol(latex))
              : undefined
          }
        />

        {/* Reuse NodeEditView for unified 100% rounded editing experience */}
        <NodeEditView
          formData={formData}
          setFormData={setFormData}
          isDark={isDark}
          errorMessage={errorMessage}
          activeField={activeField}
          setActiveField={setActiveField}
          recordCursor={recordCursor}
          allNodes={allNodes}
          downstreamNodes={[]}
          onNavigateToNode={() => {}}
          onTogglePrereq={handleTogglePrerequisite}
          isFullProofExpanded={isFullProofExpanded}
          onToggleFullProof={() => setIsFullProofExpanded(!isFullProofExpanded)}
          onTriggerCopilot={onTriggerCopilot}
        />

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
              className={`px-3.5 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
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
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
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
