import React, { useState, useEffect } from 'react';
import { X, Check, Search, Eye, Edit3 } from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES } from '../../types';
import { NodeUpdateDiff } from '../../types/copilot';
import { MathRenderer } from '../MathRenderer';

export type EditableProposalItem =
  | { kind: 'add'; node: PropositionNode }
  | { kind: 'update'; node: NodeUpdateDiff };

interface DiffProposalEditorModalProps {
  isOpen: boolean;
  item: EditableProposalItem | null;
  allNodes: PropositionNode[];
  onSave: (updatedItem: EditableProposalItem) => void;
  onClose: () => void;
  isDark: boolean;
}

export const DiffProposalEditorModal: React.FC<DiffProposalEditorModalProps> = ({
  isOpen,
  item,
  allNodes,
  onSave,
  onClose,
  isDark
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropositionType>('theorem');
  const [statement, setStatement] = useState('');
  const [proofSketch, setProofSketch] = useState('');
  const [fullProof, setFullProof] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [searchPrereq, setSearchPrereq] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (isOpen && item) {
      if (item.kind === 'add') {
        setTitle(item.node.title || '');
        setType(item.node.type || 'theorem');
        setStatement(item.node.statement || '');
        setProofSketch(item.node.proof_sketch || '');
        setFullProof(item.node.full_proof || '');
        setDependsOn(item.node.depends_on || []);
        setChangeSummary('');
      } else {
        setTitle(item.node.title || '');
        setType(item.node.type || 'theorem');
        setStatement(item.node.statement || '');
        setProofSketch(item.node.proof_sketch || '');
        setFullProof(item.node.full_proof || '');
        setDependsOn(item.node.depends_on || []);
        setChangeSummary(item.node.change_summary || '');
      }
      setSearchPrereq('');
      setActiveTab('edit');
    }
  }, [isOpen, item]);

  // Keyboard shortcut: ESC to cancel, Ctrl+Enter to save
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
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, title, type, statement, proofSketch, fullProof, dependsOn, changeSummary]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      alert('命题标题不能为空');
      return;
    }

    if (item.kind === 'add') {
      const updatedNode: PropositionNode = {
        ...item.node,
        title: cleanTitle,
        type,
        statement: statement.trim() || cleanTitle,
        proof_sketch: proofSketch.trim(),
        full_proof: fullProof.trim() || undefined,
        depends_on: dependsOn
      };
      onSave({ kind: 'add', node: updatedNode });
    } else {
      const updatedDiff: NodeUpdateDiff = {
        ...item.node,
        title: cleanTitle,
        type,
        statement: statement.trim() || undefined,
        proof_sketch: proofSketch.trim() || undefined,
        full_proof: fullProof.trim() || undefined,
        depends_on: dependsOn,
        change_summary: changeSummary.trim() || undefined
      };
      onSave({ kind: 'update', node: updatedDiff });
    }
    onClose();
  };

  const toggleDependency = (nodeId: string) => {
    setDependsOn(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

  const filteredPrereqs = allNodes.filter(n => {
    if (item.kind === 'update' && n.id === item.node.id) return false;
    if (!searchPrereq.trim()) return true;
    const q = searchPrereq.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col border shadow-2xl overflow-hidden font-serif ${
          isDark
            ? 'bg-[#18181B] border-[#27272A] text-zinc-100 shadow-black/80'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-inherit flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 bg-blue-600 text-white shadow-xs">
              <Edit3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                微调命题方案 {item.kind === 'add' ? '(新增命题)' : '(重构修改)'}
              </h3>
              <p className="text-[11px] opacity-60 font-sans">
                修改后的数学内容与依赖将在应用至画布时直接生效
              </p>
            </div>
          </div>

          {/* Desktop/Mobile Mode Switcher */}
          <div className="flex items-center space-x-2">
            <div className={`flex md:hidden p-0.5 border border-inherit ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-2 py-1 text-xs font-sans ${
                  activeTab === 'edit' ? 'bg-blue-600 text-white font-medium' : 'opacity-60'
                }`}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 text-xs font-sans ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white font-medium' : 'opacity-60'
                }`}
              >
                公式预览
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-colors"
              title="取消 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View on MD/LG */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-inherit">
          {/* Form Editor Pane */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 ${
              activeTab === 'preview' ? 'hidden md:block' : 'block'
            }`}
          >
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  命题标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="如：欧拉示性数定理"
                  className={`w-full px-3 py-1.5 text-xs border focus:outline-none transition-colors font-serif ${
                    isDark
                      ? 'bg-white/5 border-white/10 focus:border-blue-500 focus:bg-white/10 text-white'
                      : 'bg-black/5 border-black/10 focus:border-blue-500 focus:bg-white text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  命题类型
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as PropositionType)}
                  className={`w-full px-2.5 py-1.5 text-xs border focus:outline-none transition-colors font-serif cursor-pointer ${
                    isDark
                      ? 'bg-[#27272A] border-white/10 text-white focus:border-blue-500'
                      : 'bg-stone-50 border-black/10 text-stone-900 focus:border-blue-500'
                  }`}
                >
                  {Object.entries(NODE_TYPES).map(([k, cfg]) => (
                    <option key={k} value={k}>
                      {cfg.label} ({k})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Change summary if updating */}
            {item.kind === 'update' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  优化摘要 / 理由说明
                </label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder="简述修改重点..."
                  className={`w-full px-3 py-1.5 text-xs border focus:outline-none transition-colors font-serif ${
                    isDark
                      ? 'bg-white/5 border-white/10 focus:border-blue-500 text-white'
                      : 'bg-black/5 border-black/10 focus:border-blue-500 text-stone-900'
                  }`}
                />
              </div>
            )}

            {/* Statement (LaTeX) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  数学陈述 (Statement) · 支持 LaTeX 公式
                </label>
                <span className="text-[10px] font-mono opacity-50">行内 $...$，行间 $$...$$</span>
              </div>
              <textarea
                rows={4}
                value={statement}
                onChange={e => setStatement(e.target.value)}
                placeholder="输入严格数学定义或定理陈述，例如：设 $G=(V, E)$ 为连通平面图，则 $V - E + F = 2$。"
                className={`w-full p-3 text-xs border focus:outline-none transition-colors font-mono leading-relaxed resize-y ${
                  isDark
                    ? 'bg-white/5 border-white/10 focus:border-blue-500 text-white'
                    : 'bg-black/5 border-black/10 focus:border-blue-500 text-stone-900'
                }`}
              />
            </div>

            {/* Proof Sketch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                证明核心思路 (Proof Sketch)
              </label>
              <textarea
                rows={2}
                value={proofSketch}
                onChange={e => setProofSketch(e.target.value)}
                placeholder="直观启发式思路或关键归纳法设定..."
                className={`w-full p-2.5 text-xs border focus:outline-none transition-colors font-mono leading-relaxed resize-y ${
                  isDark
                    ? 'bg-white/5 border-white/10 focus:border-blue-500 text-white'
                    : 'bg-black/5 border-black/10 focus:border-blue-500 text-stone-900'
                }`}
              />
            </div>

            {/* Full Proof (LaTeX) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                严格分步证明 (Full Proof) · 支持详细推导与公式
              </label>
              <textarea
                rows={4}
                value={fullProof}
                onChange={e => setFullProof(e.target.value)}
                placeholder="分步骤的严格论证，支持包含多个公式块..."
                className={`w-full p-3 text-xs border focus:outline-none transition-colors font-mono leading-relaxed resize-y ${
                  isDark
                    ? 'bg-white/5 border-white/10 focus:border-blue-500 text-white'
                    : 'bg-black/5 border-black/10 focus:border-blue-500 text-stone-900'
                }`}
              />
            </div>

            {/* Dependencies */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                前置依赖设定 ({dependsOn.length} 项)
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchPrereq}
                  onChange={e => setSearchPrereq(e.target.value)}
                  placeholder="搜索现有命题并勾选连线..."
                  className={`w-full pl-8 pr-3 py-1 text-xs border focus:outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-stone-900'
                  }`}
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 p-1 border border-inherit">
                {filteredPrereqs.length === 0 ? (
                  <div className="p-2 text-center text-xs opacity-50">未找到匹配的命题</div>
                ) : (
                  filteredPrereqs.map(n => {
                    const isChecked = dependsOn.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex items-center space-x-2 px-2 py-1 text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDependency(n.id)}
                          className="border-gray-400 text-blue-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-serif truncate flex-1">{n.title}</span>
                        <span className="text-[10px] font-mono opacity-50 truncate max-w-[80px]">{n.id}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Real-time Math Preview Pane */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-3.5 bg-black/[0.02] dark:bg-white/[0.02] ${
              activeTab === 'edit' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>实时 KaTeX 公式预览效果</span>
            </div>

            {/* Preview Proposition Card Container */}
            <div
              className={`p-4 border transition-all shadow-xs ${
                isDark ? 'bg-[#1F1F23] border-[#333338]' : 'bg-white border-stone-200'
              }`}
            >
              {/* Header Badge & Title */}
              <div className="flex items-center space-x-2 mb-3">
                <span
                  className="text-[10px] px-2 py-0.5 font-mono uppercase font-semibold text-white"
                  style={{
                    backgroundColor: NODE_TYPES[type]?.borderColor || '#2563EB'
                  }}
                >
                  {NODE_TYPES[type]?.label || type}
                </span>
                <h4 className="font-serif font-bold text-sm truncate flex-1">
                  {title || '（未命名命题）'}
                </h4>
              </div>

              {/* Statement Preview */}
              <div className="space-y-1 mb-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                  【命题陈述】
                </div>
                <div className="p-2.5 bg-black/5 dark:bg-black/30 font-serif leading-relaxed text-xs overflow-x-auto break-words border border-black/5 dark:border-white/5 min-h-[40px]">
                  {statement ? (
                    <MathRenderer content={statement} />
                  ) : (
                    <span className="opacity-40 italic">暂无公式陈述</span>
                  )}
                </div>
              </div>

              {/* Proof Sketch Preview */}
              {proofSketch && (
                <div className="space-y-1 mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                    【证明思路】
                  </div>
                  <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-[11px] font-serif leading-relaxed opacity-90 overflow-x-auto break-words">
                    <MathRenderer content={proofSketch} />
                  </div>
                </div>
              )}

              {/* Full Proof Preview */}
              {fullProof && (
                <div className="space-y-1 mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                    【严格分步推导】
                  </div>
                  <div className="p-2.5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-serif leading-relaxed overflow-x-auto break-words">
                    <MathRenderer content={fullProof} />
                  </div>
                </div>
              )}

              {/* Dependencies Badges */}
              {dependsOn.length > 0 && (
                <div className="pt-2 border-t border-inherit">
                  <div className="text-[10px] opacity-60 mb-1.5 font-mono">前置依赖：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {dependsOn.map(depId => {
                      const matched = allNodes.find(n => n.id === depId);
                      return (
                        <span
                          key={depId}
                          className="px-2 py-0.5 text-[10px] font-serif bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20"
                        >
                          &larr; {matched?.title || depId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-inherit flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
          <span className="text-[11px] opacity-50 font-mono hidden sm:inline">
            Ctrl + Enter 立即保存
          </span>
          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-inherit hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存微调并更新提案</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
