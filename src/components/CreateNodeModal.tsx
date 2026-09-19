import React, { useState, useEffect } from 'react';
import { X, Plus, Search, ChevronDown, ChevronRight, BookMarked } from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES, AppTheme } from '../types';
import { MathRenderer } from './MathRenderer';
import { useTranslation } from '../i18n/LanguageContext';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  onCreateNode: (newNode: PropositionNode) => void;
  theme: AppTheme;
  initialPosition?: { x: number; y: number } | null;
  initialNodeData?: Partial<PropositionNode> | null;
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  allNodes,
  onCreateNode,
  theme,
  initialPosition,
  initialNodeData,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropositionType>('theorem');
  const [statement, setStatement] = useState('');
  const [proofSketch, setProofSketch] = useState('');
  const [note, setNote] = useState('');
  const [fullProof, setFullProof] = useState('');
  const [isFullProofExpanded, setIsFullProofExpanded] = useState(false);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [searchPrereq, setSearchPrereq] = useState('');

  const { t } = useTranslation();
  const isDark = theme === 'dark';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialNodeData) {
        setTitle(initialNodeData.title || '');
        setType(initialNodeData.type || 'theorem');
        setStatement(initialNodeData.statement || '');
        setProofSketch(initialNodeData.proof_sketch || '');
        setNote(initialNodeData.note || '');
        setFullProof(initialNodeData.full_proof || '');
        setIsFullProofExpanded(Boolean(initialNodeData.full_proof));
        setDependsOn(initialNodeData.depends_on || []);
      } else {
        setTitle('');
        setType('theorem');
        setStatement('');
        setProofSketch('');
        setNote('');
        setFullProof('');
        setIsFullProofExpanded(false);
        setDependsOn([]);
      }
      setSearchPrereq('');
    }
  }, [isOpen, initialNodeData]);

  // Handle keyboard shortcuts: ESC to close, Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        submitFormRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitFormRef = React.useRef<() => void>(() => {});

  const doSubmit = () => {
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        setErrorMessage(t('createModal.titleRequired'));
        return;
      }

      const newNode: PropositionNode = {
        id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        type,
        statement: statement.trim() || cleanTitle,
        proof_sketch: proofSketch.trim(),
        note: note.trim() || undefined,
        full_proof: fullProof.trim() || undefined,
        depends_on: Array.isArray(dependsOn) ? dependsOn : [],
        position: initialPosition || undefined
      };

      onCreateNode(newNode);
      onClose();
    } catch (err: any) {
      console.error('Failed to create node:', err);
      setErrorMessage(`创建命题失败: ${err?.message || '未知错误'}`);
    }
  };

  submitFormRef.current = doSubmit;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const filteredNodes = (allNodes || []).filter(n => {
    if (!n || !n.title) return false;
    if (!searchPrereq) return true;
    return n.title.toLowerCase().includes(searchPrereq.toLowerCase());
  });

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100"
    >
      <div
        className={`border shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden backdrop-blur-md ${
          isDark
            ? 'bg-[#18181B] border-white/10 text-zinc-100'
            : 'bg-white border-black/10 text-stone-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-zinc-900/60 border-white/10' : 'bg-[#FAF8F5] border-black/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <h3 className="font-serif font-bold text-sm">{initialNodeData ? t('createModal.modalTitleEdit') : t('createModal.modalTitleCreate')}</h3>
            {initialPosition && (
              <span className="text-[10px] font-mono px-2 py-0.5 border text-blue-500 border-blue-500/30 bg-blue-500/10">
                ({Math.round(initialPosition.x)}, {Math.round(initialPosition.y)})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-500 font-serif">
              {errorMessage}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold opacity-75 mb-1 font-serif flex items-center justify-between">
                <span>
                  命题标题 <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] font-normal opacity-50 font-sans">
                  Enter 或 \\ 换行 · 支持 LaTeX
                </span>
              </label>
              <textarea
                required
                autoFocus
                rows={Math.min(3, Math.max(1, (title.match(/\n/g) || []).length + 1))}
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    doSubmit();
                  }
                }}
                placeholder="如: T5: 加法消去律 ($a+c=b+c \implies a=b$)"
                className={`w-full text-xs font-serif p-2 border transition-colors focus:outline-none resize-none leading-relaxed ${
                  isDark
                    ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                    : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
                }`}
              />
              {title && (title.includes('$') || title.includes('\\')) && (
                <div className="mt-1.5 p-2 border border-dashed border-black/10 dark:border-white/10 text-xs font-serif font-bold bg-black/5 dark:bg-white/5">
                  <span className="text-[9px] opacity-40 block mb-0.5 font-sans font-normal">标题实时预览：</span>
                  <MathRenderer content={title.replace(/\\\\|\\n|<br\s*\/?>/gi, '\n')} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold opacity-75 mb-1 font-serif">类型</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PropositionType)}
                className={`w-full text-xs p-2 border transition-colors focus:outline-none font-serif ${
                  isDark
                    ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                    : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
                }`}
              >
                <option value="axiom">公理</option>
                <option value="definition">定义</option>
                <option value="proposition">命题</option>
                <option value="theorem">定理</option>
                <option value="corollary">推论</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold opacity-75 mb-1 font-serif">
              命题陈述 (支持 LaTeX)
            </label>
            <textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={2}
              placeholder="如: 对任意 $a, b, c \in \mathbb{N}$，若 $a + c = b + c$，则 $a = b$"
              className={`w-full text-xs font-serif p-2 border transition-colors focus:outline-none leading-relaxed ${
                isDark
                  ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                  : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
              }`}
            />
            {statement && (statement.includes('$') || statement.includes('\\')) && (
              <div
                className={`mt-1.5 p-2 text-xs font-serif border ${
                  isDark ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-stone-100 border-black/10 text-stone-800'
                }`}
              >
                <div className="text-[10px] font-mono opacity-50 mb-0.5">LaTeX 实时渲染预览:</div>
                <MathRenderer content={statement} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold opacity-75 mb-1 font-serif">
              证明思路
            </label>
            <input
              type="text"
              value={proofSketch}
              onChange={e => setProofSketch(e.target.value)}
              placeholder="简要概括推导思路..."
              className={`w-full text-xs p-2 border transition-colors focus:outline-none ${
                isDark
                  ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                  : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
              }`}
            />
            {proofSketch && (proofSketch.includes('$') || proofSketch.includes('\\')) && (
              <div
                className={`mt-1.5 p-2 text-xs font-serif border ${
                  isDark ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-stone-100 border-black/10 text-stone-800'
                }`}
              >
                <div className="text-[10px] font-mono opacity-50 mb-0.5">LaTeX 实时渲染预览:</div>
                <MathRenderer content={proofSketch} />
              </div>
            )}
          </div>

          {/* Full Proof (Optional Collapsible) */}
          <div className={`border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <button
              type="button"
              onClick={() => setIsFullProofExpanded(!isFullProofExpanded)}
              className={`w-full px-3 py-2 flex items-center justify-between text-xs font-serif font-bold transition-colors ${
                isDark ? 'bg-zinc-800/60 hover:bg-zinc-800' : 'bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <BookMarked className="w-3.5 h-3.5 opacity-60" />
                <span>完整证明正文 (可选)</span>
                {fullProof.trim() && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-mono">
                    已填写
                  </span>
                )}
              </div>
              {isFullProofExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>

            {isFullProofExpanded && (
              <div className={`p-3 border-t ${isDark ? 'bg-zinc-900/40 border-white/10' : 'bg-white border-black/10'}`}>
                <textarea
                  value={fullProof}
                  onChange={e => setFullProof(e.target.value)}
                  rows={5}
                  placeholder="详细分步证明推导（支持 Markdown 与 LaTeX 公式，如 $...$ 或 $$...$$）..."
                  className={`w-full text-xs font-mono p-2 border transition-colors focus:outline-none leading-relaxed ${
                    isDark
                      ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                      : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
                  }`}
                />
                {fullProof && (fullProof.includes('$') || fullProof.includes('\\')) && (
                  <div
                    className={`mt-2 p-2.5 text-xs font-serif border ${
                      isDark ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-stone-100 border-black/10 text-stone-800'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-50 mb-1">完整证明实时渲染预览:</div>
                    <MathRenderer content={fullProof} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prerequisite selection */}
          <div>
            <label className="block text-[11px] font-semibold opacity-75 mb-1 font-serif">
              前置依赖 ({dependsOn.length})
            </label>
            <div className="relative mb-2">
              <Search className="w-3 h-3 opacity-50 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPrereq}
                onChange={e => setSearchPrereq(e.target.value)}
                placeholder="搜索前置命题..."
                className={`w-full pl-7 pr-3 py-1.5 text-xs border transition-colors focus:outline-none font-serif ${
                  isDark
                    ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                    : 'bg-[#FAF8F5] border-black/10 text-stone-900 focus:border-stone-800'
                }`}
              />
            </div>
            <div
              className={`max-h-32 overflow-y-auto space-y-1 border p-1.5 ${
                isDark ? 'bg-zinc-900/40 border-white/10' : 'bg-[#FAF8F5] border-black/10'
              }`}
            >
              {filteredNodes.length === 0 ? (
                <p className="text-[11px] opacity-50 p-2">未找到匹配的前置命题</p>
              ) : (
                filteredNodes.map(cand => {
                  const isChecked = dependsOn.includes(cand.id);
                  const candType = NODE_TYPES[cand.type] || NODE_TYPES.theorem;
                  return (
                    <label
                      key={cand.id}
                      className={`flex items-center space-x-2 p-1.5 text-xs cursor-pointer border transition-colors ${
                        isChecked
                          ? isDark
                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                            : 'bg-stone-100 border-stone-300 text-stone-900'
                          : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setDependsOn(dependsOn.filter(id => id !== cand.id));
                          } else {
                            setDependsOn([...dependsOn, cand.id]);
                          }
                        }}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ backgroundColor: isDark ? candType.darkBorderColor : candType.borderColor }}
                      />
                      <span className="font-serif truncate">{cand.title}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              取消 (Esc)
            </button>
            <button
              type="submit"
              className={`flex items-center space-x-1 px-4 py-1.5 text-xs font-medium transition-colors shadow-xs ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
              title="创建 (Ctrl+Enter)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>创建 (Ctrl+Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
