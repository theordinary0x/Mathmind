import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  BookMarked
} from 'lucide-react';
import { PropositionNode, NODE_TYPES, PropositionType } from '../types';
import { MathRenderer } from './MathRenderer';

interface NodeDetailDrawerProps {
  node: PropositionNode | null;
  allNodes: PropositionNode[];
  downstreamMap: Record<string, string[]>;
  onClose: () => void;
  onUpdateNode: (updatedNode: PropositionNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onNavigateToNode: (nodeId: string) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  allNodes,
  downstreamMap,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onNavigateToNode,
}) => {
  if (!node) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PropositionNode>(node);
  const [isFullProofExpanded, setIsFullProofExpanded] = useState(false);
  const [prereqSearch, setPrereqSearch] = useState('');

  // Sync formData whenever selected node changes
  useEffect(() => {
    setFormData(node);
    setIsEditing(false);
    setIsFullProofExpanded(false);
    setPrereqSearch('');
  }, [node]);

  const typeConfig = NODE_TYPES[formData.type] || NODE_TYPES.theorem;

  // Upstream nodes (Prerequisites)
  const upstreamNodes = useMemo(() => {
    return formData.depends_on
      .map(id => allNodes.find(n => n.id === id))
      .filter((n): n is PropositionNode => !!n);
  }, [formData.depends_on, allNodes]);

  // Downstream nodes (Who depends on this node - automatically computed!)
  const downstreamNodes = useMemo(() => {
    const depIds = downstreamMap[node.id] || [];
    return depIds
      .map(id => allNodes.find(n => n.id === id))
      .filter((n): n is PropositionNode => !!n);
  }, [node.id, downstreamMap, allNodes]);

  // Candidates for prerequisites (excluding self)
  const candidatePrereqs = useMemo(() => {
    const q = prereqSearch.trim().toLowerCase();
    return allNodes
      .filter(n => n.id !== node.id)
      .filter(n => {
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.statement.toLowerCase().includes(q);
      });
  }, [allNodes, node.id, prereqSearch]);

  const handleTogglePrerequisite = (candId: string) => {
    const current = new Set(formData.depends_on);
    if (current.has(candId)) {
      current.delete(candId);
    } else {
      current.add(candId);
    }
    const updated = {
      ...formData,
      depends_on: Array.from(current)
    };
    setFormData(updated);
    if (!isEditing) {
      // Auto-save prerequisite toggle even when not in full edit mode!
      onUpdateNode(updated);
    }
  };

  const handleSave = () => {
    onUpdateNode(formData);
    setIsEditing(false);
  };

  return (
    <aside className="fixed top-16 right-0 bottom-0 w-96 md:w-[480px] bg-white border-l border-[#E8E3D9] shadow-xl z-30 flex flex-col transition-all duration-300">
      {/* Drawer Header */}
      <div className="px-6 py-4 border-b border-[#E8E3D9] flex items-center justify-between bg-[#FAF8F5]/80">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as PropositionType })}
              className="text-xs px-2.5 py-1 rounded border border-[#E8E3D9] bg-white font-medium focus:outline-none"
            >
              <option value="axiom">公理 (Axiom)</option>
              <option value="definition">定义 (Definition)</option>
              <option value="theorem">定理 (Theorem)</option>
              <option value="corollary">推论 (Corollary)</option>
            </select>
          ) : (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
                border: `1px solid ${typeConfig.borderColor}40`
              }}
            >
              {typeConfig.label}
            </span>
          )}
          <span className="text-xs font-mono text-[#8C887E]">#{node.id}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1 bg-[#2C2B29] text-white rounded text-xs hover:bg-[#43413E] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-[#78756E] hover:text-[#2C2B29] hover:bg-white rounded transition-colors"
              title="编辑命题内容"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm(`确定要删除命题「${node.title}」吗？`)) {
                onDeleteNode(node.id);
                onClose();
              }
            }}
            className="p-1.5 text-[#78756E] hover:text-[#A8423F] hover:bg-white rounded transition-colors"
            title="删除命题"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#78756E] hover:text-[#2C2B29] hover:bg-white rounded transition-colors"
            title="关闭面板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Title */}
        <div>
          {isEditing ? (
            <div>
              <label className="block text-xs font-medium text-[#78756E] mb-1">命题简短名称</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-base font-serif font-bold p-2 bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
              />
            </div>
          ) : (
            <h2 className="font-serif font-bold text-xl text-[#2C2B29] leading-snug">
              {formData.title}
            </h2>
          )}
        </div>

        {/* Statement (自然语言陈述，支持 LaTeX) */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C887E] mb-2">
            命题陈述 (Statement)
          </label>
          {isEditing ? (
            <textarea
              value={formData.statement}
              onChange={e => setFormData({ ...formData, statement: e.target.value })}
              rows={3}
              placeholder="支持 LaTeX 语法，如 $x \in \mathbb{N}$ 或 $$a+b=b+a$$"
              className="w-full p-2.5 text-sm font-serif bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none leading-relaxed"
            />
          ) : (
            <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E8E3D9]">
              <MathRenderer content={formData.statement} className="text-sm font-serif" />
            </div>
          )}
        </div>

        {/* Proof Sketch (证明思路概括) */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C887E] mb-2">
            证明思路概括 (Proof Sketch)
          </label>
          {isEditing ? (
            <textarea
              value={formData.proof_sketch}
              onChange={e => setFormData({ ...formData, proof_sketch: e.target.value })}
              rows={2}
              placeholder="一两句概述推导核心思路..."
              className="w-full p-2.5 text-sm bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
            />
          ) : (
            <div className="text-sm text-[#5C5A55] leading-relaxed italic border-l-2 border-[#D4CDC0] pl-3 py-1">
              <MathRenderer content={formData.proof_sketch || '暂无思路概括'} />
            </div>
          )}
        </div>

        {/* Personal Note (批注，可选) */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C887E] mb-1">
            个人批注 (Personal Note)
          </label>
          {isEditing ? (
            <textarea
              value={formData.note || ''}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              placeholder="记录您自己的理解或解题技巧..."
              className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
            />
          ) : (
            formData.note && (
              <div className="text-xs bg-[#FFFDF5] text-[#7A6B3D] border border-[#F0E6C8] p-2.5 rounded-lg">
                <MathRenderer content={formData.note} />
              </div>
            )
          )}
        </div>

        {/* Full Proof (完整证明，默认折叠，纯文本记录) */}
        <div className="border border-[#E8E3D9] rounded-lg overflow-hidden">
          <button
            onClick={() => setIsFullProofExpanded(!isFullProofExpanded)}
            className="w-full px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] flex items-center justify-between text-xs font-semibold text-[#5C5A55] transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <BookMarked className="w-3.5 h-3.5 text-[#8C887E]" />
              <span>完整证明正文 (Full Proof)</span>
            </div>
            {isFullProofExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#8C887E]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#8C887E]" />
            )}
          </button>

          {isFullProofExpanded && (
            <div className="p-4 bg-white border-t border-[#E8E3D9]">
              {isEditing ? (
                <textarea
                  value={formData.full_proof || ''}
                  onChange={e => setFormData({ ...formData, full_proof: e.target.value })}
                  rows={8}
                  placeholder="详细证明步骤（支持 Markdown 与 LaTeX 公式）..."
                  className="w-full p-2.5 text-xs font-mono bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none leading-relaxed"
                />
              ) : formData.full_proof ? (
                <MathRenderer content={formData.full_proof} className="text-xs leading-relaxed" />
              ) : (
                <p className="text-xs text-[#8C887E] italic">暂未填写完整证明正文</p>
              )}
            </div>
          )}
        </div>

        {/* Prerequisite Management (方式二：点选勾选前提，不打字建关系) */}
        <div className="border-t border-[#E8E3D9] pt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C887E]">
              直接依赖前提 (Depends On: {formData.depends_on.length})
            </label>
            <span className="text-[11px] text-[#8C887E]">方式二：勾选建立关系</span>
          </div>

          {/* Search box for prerequisites */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[#8C887E] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prereqSearch}
              onChange={e => setPrereqSearch(e.target.value)}
              placeholder="搜索可依赖的前置命题..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
            />
          </div>

          {/* Prerequisite Checklist */}
          <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E8E3D9] rounded-lg p-2 bg-[#FAF8F5]">
            {candidatePrereqs.map(cand => {
              const isChecked = formData.depends_on.includes(cand.id);
              const candType = NODE_TYPES[cand.type] || NODE_TYPES.theorem;

              return (
                <label
                  key={cand.id}
                  className={`flex items-start space-x-2 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                    isChecked ? 'bg-white shadow-xs' : 'hover:bg-[#F0ECE1]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTogglePrerequisite(cand.id)}
                    className="mt-0.5 rounded text-[#26547C] focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: candType.borderColor }}
                      />
                      <span className="font-serif font-medium text-[#2C2B29] truncate">
                        {cand.title}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Downstream Dependents (自动反向推导展示，免手动维护) */}
        <div className="border-t border-[#E8E3D9] pt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C887E]">
              下游推论应用 (Used By: {downstreamNodes.length})
            </label>
            <span className="text-[11px] text-[#2A7B62] font-medium">系统反向自动计算</span>
          </div>

          {downstreamNodes.length === 0 ? (
            <p className="text-xs text-[#8C887E] italic">暂无下游节点依赖该命题</p>
          ) : (
            <div className="space-y-1.5">
              {downstreamNodes.map(down => (
                <button
                  key={down.id}
                  onClick={() => onNavigateToNode(down.id)}
                  className="w-full text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E8E3D9] flex items-center justify-between text-xs group transition-colors"
                >
                  <span className="font-serif font-medium text-[#2C2B29] truncate">
                    {down.title}
                  </span>
                  <ArrowDownRight className="w-3.5 h-3.5 text-[#8C887E] group-hover:text-[#2C2B29] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
