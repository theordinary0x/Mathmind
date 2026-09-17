import React from 'react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';
import { THEOREM_ENV_CONFIG } from '../utils/theoremConfig';

export { THEOREM_ENV_CONFIG };

export interface MathRendererProps {
  content: string;
  className?: string;
  isNested?: boolean;
}

/**
 * 通用数学与 Markdown 复合渲染器
 * 统一委托至基于 marked 与 KaTeX 的混合渲染引擎，
 * 全面支持公式 ($...$, $$...$$)、代码块（带复制按钮）、多级标题、列表、粗斜体与表格。
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = ''
}) => {
  return <MarkdownMathRenderer content={content} className={className} />;
};
