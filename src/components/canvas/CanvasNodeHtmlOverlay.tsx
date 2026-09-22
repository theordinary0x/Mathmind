import React, { useEffect, useRef } from 'react';
import { Core } from 'cytoscape';
import { PropositionNode, PropositionType, AppTheme, PROPOSITION_STATUSES } from '../../types';
import { MathRenderer } from '../MathRenderer';

interface CanvasNodeHtmlOverlayProps {
  cy: Core | null;
  nodes: PropositionNode[];
  theme: AppTheme;
}

import {
  cleanAndNormalizeLatex,
  ensureMathDelimiters,
  formatSingleLineFormulaTitle
} from '../../utils/latexToUnicode';

export {
  cleanAndNormalizeLatex,
  ensureMathDelimiters,
  formatSingleLineFormulaTitle
};



function getNodeTextColor(type: PropositionType, isDark: boolean): string {
  switch (type) {
    case 'axiom': return isDark ? '#D3E3F8' : '#1E3A5F';
    case 'definition': return isDark ? '#D0F0E2' : '#144A32';
    case 'proposition': return isDark ? '#E9D5FF' : '#4A154B';
    case 'theorem': return isDark ? '#FCE0E3' : '#5A1A24';
    case 'corollary': return isDark ? '#FDEBD9' : '#5A3A1A';
    default: return isDark ? '#EDECE8' : '#2C2B29';
  }
}

/**
 * 主画布 KaTeX 矢量排版覆盖层
 * 与 Cytoscape 节点几何视口保持 sub-pixel 级硬件加速同步，
 * 彻底消除 Unicode 近似，实现 100% 真实数学公式排版。
 */
export const CanvasNodeHtmlOverlay: React.FC<CanvasNodeHtmlOverlayProps> = ({
  cy,
  nodes,
  theme
}) => {
  const isDark = theme === 'dark';
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  const nodeElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // 视口平移与缩放直接由 CSS transform 驱动，不触发 React 全树重渲染
  useEffect(() => {
    if (!cy) return;

    const syncViewport = () => {
      if (!overlayContainerRef.current) return;
      const pan = cy.pan();
      const zoom = cy.zoom();
      overlayContainerRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    };

    const syncAllNodePositions = () => {
      cy.nodes().forEach(cyNode => {
        const id = cyNode.id();
        const pos = cyNode.position();
        const el = nodeElementsRef.current.get(id);
        if (el) {
          el.style.left = `${pos.x}px`;
          el.style.top = `${pos.y}px`;
          el.style.opacity = cyNode.hasClass('dimmed') ? '0.08' : '1';
        }
      });
    };

    const handleNodePosition = (e: cytoscape.EventObject) => {
      const target = e.target;
      const id = target.id();
      const pos = target.position();
      const el = nodeElementsRef.current.get(id);
      if (el) {
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
      }
    };

    // 初始同步
    syncViewport();
    syncAllNodePositions();

    // 绑定高频事件
    cy.on('pan zoom viewport', syncViewport);
    cy.on('position', 'node', handleNodePosition);
    cy.on('render layoutstop', () => {
      syncViewport();
      syncAllNodePositions();
    });

    return () => {
      cy.off('pan zoom viewport', syncViewport);
      cy.off('position', 'node', handleNodePosition);
      cy.off('render layoutstop');
    };
  }, [cy]);

  // 当 nodes 列表更新后，在下一个动画帧同步所有节点坐标与透明度
  useEffect(() => {
    if (!cy) return;
    const timer = requestAnimationFrame(() => {
      cy.nodes().forEach(cyNode => {
        const id = cyNode.id();
        const pos = cyNode.position();
        const el = nodeElementsRef.current.get(id);
        if (el) {
          el.style.left = `${pos.x}px`;
          el.style.top = `${pos.y}px`;
          el.style.opacity = cyNode.hasClass('dimmed') ? '0.08' : '1';
        }
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [cy, nodes]);

  return (
    <div
      ref={overlayContainerRef}
      className="absolute top-0 left-0 pointer-events-none overflow-visible z-10 select-none"
      style={{ transformOrigin: '0 0' }}
      aria-hidden="true"
    >
      {nodes.map(node => {
        const textColor = getNodeTextColor(node.type, isDark);
        const statusIcon = node.status ? PROPOSITION_STATUSES[node.status]?.icon : '';
        const titleWithStatus = statusIcon ? `${statusIcon} ${node.title}` : node.title;
        const formattedContent = ensureMathDelimiters(titleWithStatus);

        return (
          <div
            key={node.id}
            ref={el => {
              if (el) nodeElementsRef.current.set(node.id, el);
              else nodeElementsRef.current.delete(node.id);
            }}
            id={`node-katex-label-${node.id}`}
            className="absolute select-none pointer-events-none text-center font-serif text-[13px] font-semibold leading-[1.3] transition-opacity duration-150"
            style={{
              left: `${node.position?.x ?? 0}px`,
              top: `${node.position?.y ?? 0}px`,
              transform: 'translate(-50%, -50%)',
              width: 'max-content',
              maxWidth: '180px',
              color: textColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            <MathRenderer
              content={formattedContent}
              className="[&_p]:!m-0 [&_p]:!p-0 [&_p]:!leading-[1.3] text-center"
            />
          </div>
        );
      })}
    </div>
  );
};
