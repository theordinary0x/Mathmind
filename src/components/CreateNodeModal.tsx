import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES } from '../types';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNodes: PropositionNode[];
  onCreateNode: (newNode: PropositionNode) => void;
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  allNodes,
  onCreateNode,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropositionType>('theorem');
  const [statement, setStatement] = useState('');
  const [proofSketch, setProofSketch] = useState('');
  const [note, setNote] = useState('');
  const [fullProof, setFullProof] = useState('');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [searchPrereq, setSearchPrereq] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入命题名称');
      return;
    }

    const newNode: PropositionNode = {
      id: `prop-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      type,
      statement: statement.trim(),
      proof_sketch: proofSketch.trim(),
      note: note.trim() || undefined,
      full_proof: fullProof.trim() || undefined,
      depends_on: dependsOn
    };

    onCreateNode(newNode);
    onClose();
  };

  const filteredNodes = allNodes.filter(n => {
    if (!searchPrereq) return true;
    return n.title.toLowerCase().includes(searchPrereq.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E8E3D9] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E3D9] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="font-serif font-bold text-base text-[#2C2B29]">新建数学命题</h3>
            <p className="text-xs text-[#8C887E]">录入公理、定义或待推导的定理</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C887E] hover:text-[#2C2B29] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#5C5A55] mb-1">
                命题标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="如: T5: 乘法对加法的分配律"
                className="w-full text-sm font-serif p-2 bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C5A55] mb-1">命题类型</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PropositionType)}
                className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none font-medium"
              >
                <option value="axiom">公理 (Axiom)</option>
                <option value="definition">定义 (Definition)</option>
                <option value="theorem">定理 (Theorem)</option>
                <option value="corollary">推论 (Corollary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5A55] mb-1">
              命题陈述 (Statement，支持 LaTeX)
            </label>
            <textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={2}
              placeholder="例如: 对任意 $a, b, c \in \mathbb{N}$，有 $a \cdot (b + c) = a \cdot b + a \cdot c$"
              className="w-full text-sm font-serif p-2 bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5A55] mb-1">
              证明思路概括 (Proof Sketch)
            </label>
            <input
              type="text"
              value={proofSketch}
              onChange={e => setProofSketch(e.target.value)}
              placeholder="一两句话概括核心思路..."
              className="w-full text-xs p-2 bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
            />
          </div>

          {/* Prerequisite selection */}
          <div>
            <label className="block text-xs font-semibold text-[#5C5A55] mb-1">
              选择依赖的前置命题 ({dependsOn.length} 已选)
            </label>
            <div className="relative mb-1.5">
              <Search className="w-3.5 h-3.5 text-[#8C887E] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPrereq}
                onChange={e => setSearchPrereq(e.target.value)}
                placeholder="搜索前置命题..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-[#FAF8F5] border border-[#E8E3D9] rounded focus:bg-white focus:outline-none"
              />
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 border border-[#E8E3D9] rounded-lg p-2 bg-[#FAF8F5]">
              {filteredNodes.map(cand => {
                const isChecked = dependsOn.includes(cand.id);
                const candType = NODE_TYPES[cand.type] || NODE_TYPES.theorem;
                return (
                  <label
                    key={cand.id}
                    className={`flex items-center space-x-2 p-1 rounded text-xs cursor-pointer ${
                      isChecked ? 'bg-white shadow-xs' : 'hover:bg-[#F0ECE1]'
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
                      className="rounded text-[#26547C]"
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: candType.borderColor }}
                    />
                    <span className="font-serif truncate">{cand.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#E8E3D9] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-[#5C5A55] hover:bg-[#F5F2EB] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#2C2B29] hover:bg-[#43413E] text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>确认创建</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
