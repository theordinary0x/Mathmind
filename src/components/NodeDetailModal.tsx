import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Check, Trash2, Sparkles, BookOpen, Edit3 
} from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES, AppTheme, PropositionStatus, PROPOSITION_STATUSES } from '../types';
import { MathSymbolToolbar } from './MathSymbolToolbar';
import { NodeReadView } from './drawer/NodeReadView';
import { NodeEditView } from './drawer/NodeEditView';
import { useTranslation } from '../i18n/LanguageContext';
import { useBackdropClose } from '../hooks/useBackdropClose';
import { UnsavedChangesModal } from './UnsavedChangesModal';

interface NodeDetailModalProps {
  isOpen: boolean;
  node: PropositionNode | null;
  allNodes: PropositionNode[];
  downstreamMap: Record<string, string[]>;
  onClose: () => void;
  onUpdateNode: (updatedNode: PropositionNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onNavigateToNode: (nodeId: string) => void;
  onTriggerCopilot?: (prompt: string) => void;
  theme: AppTheme;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  isOpen,
  node,
  allNodes,
  downstreamMap,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onNavigateToNode,
  onTriggerCopilot,
  theme
}) => {
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [formData, setFormData] = useState<PropositionNode | null>(null);
  const [activeField, setActiveField] = useState<string>('title');
  const [isFullProofExpanded, setIsFullProofExpanded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<'cancel_edit' | 'close_modal'>('cancel_edit');

  const activeElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  // 点击外部蒙版：在编辑页面任何情况下无法退出
  const handleBackdropClick = () => {
    if (mode === 'edit') {
      return;
    }
    onClose();
  };
  const backdropProps = useBackdropClose(handleBackdropClick);

  // Synchronize formData with incoming node prop and reset to Read mode
  useEffect(() => {
    if (node) {
      setFormData({ ...node });
      setIsFullProofExpanded(Boolean(node.full_proof));
      setErrorMessage(null);
      setMode('read'); // Always open in read mode by default
      setShowUnsavedPrompt(false);
    }
  }, [node?.id, isOpen]);

  // 计算编辑表单是否被修改
  const isDirty = useMemo(() => {
    if (!node || !formData || mode !== 'edit') return false;
    return (
      formData.title !== node.title ||
      formData.type !== node.type ||
      formData.status !== node.status ||
      formData.statement !== node.statement ||
      formData.proof_sketch !== node.proof_sketch ||
      (formData.full_proof || '') !== (node.full_proof || '') ||
      (formData.note || '') !== (node.note || '') ||
      JSON.stringify(formData.depends_on || []) !== JSON.stringify(node.depends_on || []) ||
      JSON.stringify(formData.examples || []) !== JSON.stringify(node.examples || [])
    );
  }, [node, formData, mode]);

  const recordCursor = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.SyntheticEvent) => {
    activeElementRef.current = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  };

  const handleInsertSymbol = (symbol: string) => {
    if (!formData) return;
    const el = activeElementRef.current;

    // Handle insertion for dynamic example fields (e.g. 'example_0')
    if (activeField.startsWith('example_')) {
      const idx = parseInt(activeField.replace('example_', ''), 10);
      const examples = [...(formData.examples || [])];
      const currentVal = examples[idx] || '';

      let start = currentVal.length;
      let end = currentVal.length;
      if (el && document.body.contains(el)) {
        start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
        end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
      }

      const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
      examples[idx] = newVal;
      setFormData(prev => prev ? ({ ...prev, examples }) : null);

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

    // Handle insertion for standard node fields
    const targetKey = activeField as 'title' | 'statement' | 'proof_sketch' | 'full_proof' | 'note';
    const currentVal = (formData[targetKey] as string) || '';

    let start = currentVal.length;
    let end = currentVal.length;
    if (el && document.body.contains(el)) {
      start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
      end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
    }

    const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
    setFormData(prev => prev ? ({
      ...prev,
      [targetKey]: newVal
    }) : null);

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
    if (!formData) return;
    const current = new Set(formData.depends_on);
    if (current.has(candId)) {
      current.delete(candId);
    } else {
      current.add(candId);
    }
    setFormData({
      ...formData,
      depends_on: Array.from(current)
    });
  };

  const handleSave = () => {
    if (!formData) return;
    const cleanTitle = formData.title.trim();
    if (!cleanTitle) {
      setErrorMessage(t('createModal.titleRequired'));
      return;
    }

    const cleanExamples = (formData.examples || [])
      .map(ex => ex.trim())
      .filter(Boolean);

    const updated: PropositionNode = {
      ...formData,
      title: cleanTitle,
      statement: formData.statement.trim(),
      proof_sketch: formData.proof_sketch.trim(),
      full_proof: formData.full_proof?.trim() || undefined,
      note: formData.note?.trim() || undefined,
      examples: cleanExamples.length > 0 ? cleanExamples : undefined
    };

    onUpdateNode(updated);
    setFormData(updated);
    setErrorMessage(null);
    setMode('read'); // Switch back to read mode after saving
  };

  const requestCancelEdit = () => {
    if (isDirty) {
      setPendingCloseAction('cancel_edit');
      setShowUnsavedPrompt(true);
    } else {
      if (node) {
        setFormData({ ...node });
        setErrorMessage(null);
      }
      setMode('read');
    }
  };

  const requestCloseModal = () => {
    if (mode === 'edit' && isDirty) {
      setPendingCloseAction('close_modal');
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedPrompt(false);
    if (node) {
      setFormData({ ...node });
      setErrorMessage(null);
    }
    if (pendingCloseAction === 'close_modal') {
      onClose();
    } else {
      setMode('read');
    }
  };

  const handleCancelStay = () => {
    setShowUnsavedPrompt(false);
  };

  // Keyboard shortcut routing inside NodeDetailModal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showUnsavedPrompt) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const isInputActive = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'edit') {
          requestCancelEdit();
        } else {
          onClose();
        }
      } else if (!isInputActive && (e.key === 'e' || e.key === 'E')) {
        // Toggle Read / Edit mode via 'E' when not typing
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'edit') {
          requestCancelEdit();
        } else {
          setMode('edit');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (mode === 'edit') {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode, formData, node, isDirty, showUnsavedPrompt, pendingCloseAction]);

  if (!isOpen || !node || !formData) return null;

  const typeConfig = NODE_TYPES[formData.type] || NODE_TYPES.theorem;

  const prereqNodes = (formData.depends_on || [])
    .map(id => allNodes.find(n => n.id === id))
    .filter((n): n is PropositionNode => !!n);

  const downstreamIds = downstreamMap[node.id] || [];
  const downstreamNodes = downstreamIds
    .map(id => allNodes.find(n => n.id === id))
    .filter((n): n is PropositionNode => !!n);

  return (
    <div
      {...backdropProps}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-100 select-none"
    >
      <div
        className={`border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans select-text ${
          isDark
            ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
            : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between shrink-0 gap-3 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          {/* Left: Type indicator / Selector */}
          <div className="flex items-center space-x-2 min-w-0">
            {mode === 'edit' ? (
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PropositionType })}
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
            ) : (
              <span
                className="px-2 py-0.5 text-xs font-serif font-semibold border inline-flex items-center"
                style={{
                  borderColor: isDark ? typeConfig.darkBorderColor : typeConfig.borderColor,
                  color: isDark ? typeConfig.darkBorderColor : typeConfig.borderColor,
                  backgroundColor: isDark ? `${typeConfig.darkBorderColor}18` : `${typeConfig.borderColor}15`
                }}
              >
                {t(`nodeTypes.${formData.type}`) || formData.type}
              </span>
            )}

            {/* Status Indicator / Selector */}
            {mode === 'edit' ? (
              <select
                value={formData.status || ''}
                onChange={e => setFormData({ ...formData, status: (e.target.value as PropositionStatus) || undefined })}
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
            ) : formData.status && PROPOSITION_STATUSES[formData.status] ? (
              <span
                className="px-2 py-0.5 text-xs font-serif font-semibold border inline-flex items-center space-x-1"
                style={{
                  borderColor: isDark ? PROPOSITION_STATUSES[formData.status].darkColor : PROPOSITION_STATUSES[formData.status].color,
                  color: isDark ? PROPOSITION_STATUSES[formData.status].darkColor : PROPOSITION_STATUSES[formData.status].color,
                  backgroundColor: isDark ? `${PROPOSITION_STATUSES[formData.status].darkBadgeBg}80` : PROPOSITION_STATUSES[formData.status].badgeBg
                }}
              >
                <span>{PROPOSITION_STATUSES[formData.status].icon}</span>
                <span>{PROPOSITION_STATUSES[formData.status].label}</span>
              </span>
            ) : null}

            <span className="text-[11px] font-mono opacity-40 truncate hidden sm:inline">#{node.id}</span>
          </div>

          {/* Center / Right: Read / Edit Mode Switch & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Segmented Control Switch */}
            <div className={`flex items-center border p-0.5 select-none ${
              isDark ? 'border-[#2E2E33] bg-[#121214]' : 'border-[#D4CDC0] bg-white'
            }`}>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'edit') {
                    requestCancelEdit();
                  }
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  mode === 'read'
                    ? isDark ? 'bg-[#27272A] text-white font-medium shadow-xs' : 'bg-[#E5E0D8] text-stone-900 font-medium shadow-xs'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="阅读模式 (按 E 切换)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>阅读</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  mode === 'edit'
                    ? isDark ? 'bg-[#27272A] text-white font-medium shadow-xs' : 'bg-[#E5E0D8] text-stone-900 font-medium shadow-xs'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="编辑模式 (按 E 切换)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>编辑</span>
              </button>
            </div>

            {/* AI Assistant */}
            {onTriggerCopilot && (
              <button
                type="button"
                onClick={() => {
                  onTriggerCopilot(`请结合命题【${node.title}】的陈述与上下文，补充严谨的分步数学证明。`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:border-blue-500 text-zinc-300 hover:text-white bg-[#121214]'
                    : 'border-[#D4CDC0] hover:border-blue-600 text-stone-700 hover:text-blue-600 bg-white'
                }`}
                title="呼叫 Copilot 助手生成或完善推导"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">AI 辅助</span>
              </button>
            )}

            {/* Delete Node */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('drawer.deleteConfirm', { title: node.title }))) {
                  onDeleteNode(node.id);
                  onClose();
                }
              }}
              className="p-1.5 opacity-60 hover:opacity-100 hover:text-red-500 transition-colors cursor-pointer"
              title="删除命题"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={requestCloseModal}
              className="p-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LaTeX Symbols Quick Insert Toolbar (Only visible in Edit Mode) */}
        {mode === 'edit' && <MathSymbolToolbar onInsert={handleInsertSymbol} theme={theme} />}

        {/* Modal Body: Read Mode vs Edit Mode */}
        {mode === 'read' ? (
          <NodeReadView
            formData={formData}
            isDark={isDark}
            isFullProofExpanded={isFullProofExpanded}
            onToggleFullProof={() => setIsFullProofExpanded(!isFullProofExpanded)}
            prereqNodes={prereqNodes}
            downstreamNodes={downstreamNodes}
            onNavigateToNode={onNavigateToNode}
            onTriggerCopilot={onTriggerCopilot}
            onSwitchToEdit={field => {
              setMode('edit');
              if (field) setActiveField(field);
            }}
          />
        ) : (
          <NodeEditView
            formData={formData}
            setFormData={setFormData}
            isDark={isDark}
            errorMessage={errorMessage}
            activeField={activeField}
            setActiveField={setActiveField}
            recordCursor={recordCursor}
            allNodes={allNodes}
            downstreamNodes={downstreamNodes}
            onNavigateToNode={onNavigateToNode}
            onTogglePrereq={handleTogglePrerequisite}
            isFullProofExpanded={isFullProofExpanded}
            onToggleFullProof={() => setIsFullProofExpanded(!isFullProofExpanded)}
            onTriggerCopilot={onTriggerCopilot}
          />
        )}

        {/* Footer */}
        {mode === 'read' ? (
          <div
            className={`px-5 py-3 border-t flex items-center justify-between shrink-0 select-none ${
              isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
            }`}
          >
            <span className="text-[11px] opacity-50 font-mono hidden sm:inline">
              按 E 切换至编辑模式 · Esc 退出
            </span>
            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-1.5 text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:bg-white/5 text-zinc-300'
                    : 'border-[#D4CDC0] hover:bg-black/5 text-stone-700'
                }`}
              >
                {t('common.close')} (Esc)
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>编辑命题 (E)</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-5 py-3 border-t flex items-center justify-between shrink-0 select-none ${
              isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
            }`}
          >
            <span className="text-[11px] opacity-50 font-mono hidden sm:inline">
              Ctrl + Enter 保存 · Esc 取消编辑
            </span>
            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={requestCancelEdit}
                className={`px-3 py-1.5 text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2E2E33] hover:bg-white/5 text-zinc-300'
                    : 'border-[#D4CDC0] hover:bg-black/5 text-stone-700'
                }`}
              >
                取消编辑 (Esc)
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存修改 (Ctrl+Enter)</span>
              </button>
            </div>
          </div>
        )}
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
