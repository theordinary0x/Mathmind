import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Edit3, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  ArrowDownRight,
  BookMarked,
  Sparkles
} from 'lucide-react';
import { PropositionNode, NODE_TYPES, PropositionType, AppTheme } from '../types';
import { MathRenderer } from './MathRenderer';
import { MathSymbolToolbar } from './MathSymbolToolbar';
import { FieldLatexPreview } from './drawer/FieldLatexPreview';
import { PrerequisitePicker } from './drawer/PrerequisitePicker';
import { useTranslation } from '../i18n/LanguageContext';

interface NodeDetailDrawerProps {
  node: PropositionNode | null;
  allNodes: PropositionNode[];
  downstreamMap: Record<string, string[]>;
  onClose: () => void;
  onUpdateNode: (updatedNode: PropositionNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onNavigateToNode: (nodeId: string) => void;
  onTriggerCopilot?: (message: string) => void;
  theme: AppTheme;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  allNodes,
  downstreamMap,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onNavigateToNode,
  onTriggerCopilot,
  theme,
}) => {
  if (!node) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PropositionNode>(node);
  const [isFullProofExpanded, setIsFullProofExpanded] = useState(false);
  
  const [activeField, setActiveField] = useState<'title' | 'statement' | 'proof_sketch' | 'note' | 'full_proof'>('statement');

  const statementRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const activeElementRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const recordCursor = (e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    activeElementRef.current = e.currentTarget;
  };
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  useEffect(() => {
    setFormData(node);
    setIsEditing(false);
    setIsFullProofExpanded(false);
    
  }, [node]);

  const typeConfig = NODE_TYPES[formData.type] || NODE_TYPES.theorem;

  // Downstream nodes
  const downstreamNodes = useMemo(() => {
    const depIds = downstreamMap[node.id] || [];
    return depIds
      .map(id => allNodes.find(n => n.id === id))
      .filter((n): n is PropositionNode => !!n);
  }, [node.id, downstreamMap, allNodes]);

  

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
      onUpdateNode(updated);
    }
  };

  // Insert LaTeX symbol into active editing field at cursor position
  const handleInsertSymbol = (symbol: string) => {
    if (!isEditing) setIsEditing(true);

    const targetKey = activeField;
    const currentVal = (formData[targetKey] as string) || '';
    const el = activeElementRef.current;

    let start = currentVal.length;
    let end = currentVal.length;

    if (el && document.body.contains(el)) {
      start = typeof el.selectionStart === 'number' ? el.selectionStart : currentVal.length;
      end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentVal.length;
    }

    const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);
    setFormData(prev => ({
      ...prev,
      [targetKey]: newVal
    }));

    // Smart cursor repositioning: inside formula delimiters or directly after symbol
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

  const handleSave = () => {
    const cleanTitle = formData.title.trim();
    if (!cleanTitle) {
      alert(t('createModal.titleRequired'));
      return;
    }
    onUpdateNode(formData);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // If focus is outside drawer, do not intercept
      if (drawerRef.current && !drawerRef.current.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setFormData(node);
        setIsEditing(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, node, formData]);

  return (
    <aside
      ref={drawerRef}
      className={`fixed top-14 right-0 bottom-6 w-96 md:w-[480px] border-l shadow-2xl z-30 flex flex-col transition-colors duration-150 ${
        isDark
          ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
          : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
      }`}
    >
      {/* Drawer Header */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between ${
          isDark ? 'bg-[#27272A] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as PropositionType })}
              className={`text-xs px-2 py-1 border font-serif focus:outline-none ${
                isDark ? 'bg-[#18181B] border-[#3F3F46] text-white' : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            >
              <option value="axiom">{t('nodeTypes.axiom')}</option>
              <option value="definition">{t('nodeTypes.definition')}</option>
              <option value="proposition">{t('nodeTypes.proposition')}</option>
              <option value="theorem">{t('nodeTypes.theorem')}</option>
              <option value="corollary">{t('nodeTypes.corollary')}</option>
            </select>
          ) : (
            <div
              className="text-xs px-2 py-0.5 font-serif font-bold uppercase tracking-wider border"
              style={{
                backgroundColor: isDark ? typeConfig.darkBgColor : typeConfig.bgColor,
                color: isDark ? typeConfig.darkColor : typeConfig.color,
                borderColor: isDark ? typeConfig.darkBorderColor : typeConfig.borderColor
              }}
            >
              {typeConfig.label}
            </div>
          )}
          <span className="text-[11px] font-mono opacity-50">#{node.id}</span>
        </div>

        <div className="flex items-center space-x-1">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1 bg-[#3B82F6] text-white text-xs hover:bg-[#2563EB] transition-colors"
              title="保存修改 (Ctrl+Enter)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('drawer.saveChanges')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="编辑命题内容与批注"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm(t('drawer.deleteConfirm', { title: node.title }))) {
                onDeleteNode(node.id);
                onClose();
              }
            }}
            className="p-1.5 opacity-70 hover:opacity-100 hover:text-[#EF4444] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="删除命题"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="关闭面板"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* LaTeX Symbol Quick Toolbar */}
      {isEditing && (
        <MathSymbolToolbar onInsert={handleInsertSymbol} theme={theme} />
      )}

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Title */}
        <div>
          {isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold opacity-60 font-serif">
                  命题标题 <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] opacity-40 font-mono">Enter 或 \\ 换行 · 支持 LaTeX</span>
              </div>
              <textarea
                value={formData.title}
                rows={Math.min(4, Math.max(1, (formData.title.match(/\n/g) || []).length + 1))}
                onFocus={e => {
                  setActiveField('title');
                  recordCursor(e);
                }}
                onClick={recordCursor}
                onKeyUp={recordCursor}
                onSelect={recordCursor}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="如: T5: 加法消去律 ($a+c=b+c \implies a=b$)"
                className={`w-full text-base font-serif font-bold p-2 border focus:outline-none resize-none leading-relaxed ${
                  isDark
                    ? 'bg-[#27272A] border-[#3F3F46] text-white'
                    : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                }`}
              />
              <FieldLatexPreview
                label="标题实时渲染预览"
                content={formData.title}
                isDark={isDark}
                className="font-serif font-bold"
              />
            </div>
          ) : (
            <h2 className="font-serif font-bold text-lg leading-snug">
              <MathRenderer content={formData.title.replace(/\\\\|\\n|<br\s*\/?>/gi, '\n')} />
            </h2>
          )}
        </div>

        {/* Statement */}
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 mb-1.5 font-serif flex items-center justify-between">
            <span>命题陈述 (Statement)</span>
            {isEditing && <span className="text-[10px] text-blue-400">正在编辑</span>}
          </div>
          {isEditing ? (
            <>
              <textarea
                ref={statementRef}
                onFocus={e => {
                  setActiveField('statement');
                  recordCursor(e);
                }}
                onClick={recordCursor}
                onKeyUp={recordCursor}
                onSelect={recordCursor}
                value={formData.statement}
                onChange={e => setFormData({ ...formData, statement: e.target.value })}
                rows={3}
                placeholder="支持 LaTeX 语法，如 $x \in \mathbb{N}$ 或 $$a+b=b+a$$"
                className={`w-full p-2.5 text-xs font-serif border focus:outline-none leading-relaxed ${
                  isDark
                    ? 'bg-[#27272A] border-[#3F3F46] text-white'
                    : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                }`}
              />
              <FieldLatexPreview
                label="陈述实时渲染预览"
                content={formData.statement}
                isDark={isDark}
                className="font-serif"
              />
            </>
          ) : (
            <div
              className={`p-3.5 border ${
                isDark ? 'bg-[#222226] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
              }`}
            >
              <MathRenderer
                content={formData.statement}
                className={`text-sm font-serif ${isDark ? '!text-[#EDEDEB]' : ''}`}
              />
            </div>
          )}
        </div>

        {/* Proof Sketch */}
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 mb-1.5 font-serif">
            证明思路概括 (Proof Sketch)
          </div>
          {isEditing ? (
            <>
              <textarea
                onFocus={e => {
                  setActiveField('proof_sketch');
                  recordCursor(e);
                }}
                onClick={recordCursor}
                onKeyUp={recordCursor}
                onSelect={recordCursor}
                value={formData.proof_sketch}
                onChange={e => setFormData({ ...formData, proof_sketch: e.target.value })}
                rows={2}
                placeholder="一两句话概述推导核心思路..."
                className={`w-full p-2.5 text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#27272A] border-[#3F3F46] text-white'
                    : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                }`}
              />
              <FieldLatexPreview
                label="思路实时渲染预览"
                content={formData.proof_sketch}
                isDark={isDark}
                className="font-serif italic"
              />
            </>
          ) : (
            <div className="text-xs leading-relaxed italic border-l-2 border-inherit pl-3 py-1 opacity-80">
              <MathRenderer
                content={formData.proof_sketch || '暂无思路概括'}
                className={isDark ? '!text-[#D4D4D8]' : ''}
              />
            </div>
          )}
        </div>

        {/* Note / Annotation */}
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 mb-1 font-serif flex items-center justify-between">
            <span>个人批注 (Personal Note)</span>
            {!isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setActiveField('note');
                }}
                className="text-[10px] text-amber-500 hover:underline"
              >
                + 添加批注
              </button>
            )}
          </div>
          {isEditing ? (
            <>
              <textarea
                onFocus={e => {
                  setActiveField('note');
                  recordCursor(e);
                }}
                onClick={recordCursor}
                onKeyUp={recordCursor}
                onSelect={recordCursor}
                value={formData.note || ''}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                placeholder="记录您自己的学习心得或批注技巧..."
                className={`w-full p-2 text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#27272A] border-[#3F3F46] text-white'
                    : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                }`}
              />
              <FieldLatexPreview
                label="批注实时渲染预览"
                content={formData.note || ''}
                isDark={isDark}
                className={isDark ? '!bg-[#2B271E] !text-[#FDE68A] !border-[#594825]' : '!bg-[#FFFDF5] !text-[#7A6B3D] !border-[#E6DBBE]'}
              />
            </>
          ) : (
            formData.note && (
              <div
                className={`text-xs p-2.5 border ${
                  isDark
                    ? 'bg-[#2B271E] text-[#FDE68A] border-[#594825]'
                    : 'bg-[#FFFDF5] text-[#7A6B3D] border-[#E6DBBE]'
                }`}
              >
                <MathRenderer content={formData.note} />
              </div>
            )
          )}
        </div>

        {/* Full Proof */}
        <div className={`border ${isDark ? 'border-[#2E2E33]' : 'border-[#D4CDC0]'}`}>
          <button
            onClick={() => setIsFullProofExpanded(!isFullProofExpanded)}
            className={`w-full px-4 py-2 flex items-center justify-between text-xs font-serif font-bold transition-colors ${
              isDark ? 'bg-[#222226] hover:bg-[#27272A]' : 'bg-[#FAF8F5] hover:bg-[#F2EFE9]'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <BookMarked className="w-3.5 h-3.5 opacity-60" />
              <span>完整证明正文 (Full Proof)</span>
            </div>
            {isFullProofExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {isFullProofExpanded && (
            <div className={`p-4 border-t ${isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'}`}>
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] opacity-60 font-serif">详细证明推导步骤：</span>
                    {onTriggerCopilot && (
                      <button
                        type="button"
                        onClick={() => onTriggerCopilot(`请为命题【${formData.title || node.title}】补充完整严谨的分步数学推导证明，并更新其完整证明。`)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-serif border transition-all ${
                          isDark
                            ? 'border-[#E07A5F]/40 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#F28482]'
                            : 'border-[#E07A5F]/40 bg-[#FFF5F2] hover:bg-[#FFEAE5] text-[#C45D40]'
                        }`}
                        title="唤起 Copilot 为该命题生成完整证明提案"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI 生成证明初稿</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    onFocus={e => {
                      setActiveField('full_proof');
                      recordCursor(e);
                    }}
                    onClick={recordCursor}
                    onKeyUp={recordCursor}
                    onSelect={recordCursor}
                    value={formData.full_proof || ''}
                    onChange={e => setFormData({ ...formData, full_proof: e.target.value })}
                    rows={8}
                    placeholder="详细证明步骤（支持 Markdown 与 LaTeX 公式）..."
                    className={`w-full p-2 text-xs font-mono border focus:outline-none leading-relaxed ${
                      isDark
                        ? 'bg-[#27272A] border-[#3F3F46] text-white'
                        : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                    }`}
                  />
                  <FieldLatexPreview
                    label="完整证明实时渲染预览"
                    content={formData.full_proof || ''}
                    isDark={isDark}
                    className="p-3 leading-relaxed"
                  />
                </>
              ) : formData.full_proof ? (
                <div>
                  {onTriggerCopilot && (
                    <div className="flex items-center justify-end mb-2.5">
                      <button
                        onClick={() => onTriggerCopilot(`请审查并完善命题【${node.title}】的完整证明，提升论证严密性并补充必要的推导细节。`)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-serif border transition-all ${
                          isDark
                            ? 'border-[#3F3F46] bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white'
                            : 'border-[#D4CDC0] bg-[#FAF8F5] hover:bg-[#EAE5DC] text-[#6E695E] hover:text-[#2C2B29]'
                        }`}
                        title="呼叫 Copilot 审查并优化当前证明"
                      >
                        <Sparkles className="w-3 h-3 text-[#E07A5F]" />
                        <span>AI 完善证明</span>
                      </button>
                    </div>
                  )}
                  <MathRenderer
                    content={formData.full_proof}
                    className={`text-xs leading-relaxed ${isDark ? '!text-[#EDEDEB]' : ''}`}
                  />
                </div>
              ) : (
                <div className="py-2 flex flex-col items-start gap-2.5">
                  <p className="text-xs opacity-50 italic font-serif">暂未填写完整证明正文</p>
                  {onTriggerCopilot && (
                    <button
                      onClick={() => onTriggerCopilot(`请为命题【${node.title}】补充完整严谨的分步数学推导证明，并更新其完整证明。`)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-serif border transition-all ${
                        isDark
                          ? 'border-[#E07A5F]/40 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#F28482]'
                          : 'border-[#E07A5F]/40 bg-[#FFF5F2] hover:bg-[#FFEAE5] text-[#C45D40]'
                      }`}
                      title="唤起 Copilot 为该命题生成完整数学证明"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 补充完整证明</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prerequisites */}
        <PrerequisitePicker
          allNodes={allNodes}
          currentNodeId={node.id}
          selectedPrereqIds={formData.depends_on}
          onTogglePrereq={handleTogglePrerequisite}
          isDark={isDark}
        />

        {/* Downstream */}
        <div className="border-t border-inherit pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif">
              下游推论应用 (Used By: {downstreamNodes.length})
            </div>
            <span className="text-[10px] text-emerald-500 font-mono">系统反向自动计算</span>
          </div>

          {downstreamNodes.length === 0 ? (
            <p className="text-xs opacity-50 italic font-serif">暂无下游节点依赖该命题</p>
          ) : (
            <div className="space-y-1">
              {downstreamNodes.map(down => (
                <button
                  key={down.id}
                  onClick={() => onNavigateToNode(down.id)}
                  className={`w-full text-left p-2 border flex items-center justify-between text-xs group transition-colors ${
                    isDark
                      ? 'bg-[#222226] hover:bg-[#27272A] border-[#2E2E33] hover:border-[#60A5FA]'
                      : 'bg-[#FAF8F5] hover:bg-[#F2EFE9] border-[#D4CDC0] hover:border-[#2C2B29]'
                  }`}
                >
                  <span className="font-serif font-medium truncate">
                    {down.title}
                  </span>
                  <ArrowDownRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
