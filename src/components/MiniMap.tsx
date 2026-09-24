import React, { useEffect, useState, useRef } from 'react';
import { Core } from 'cytoscape';
import { AppTheme, NODE_TYPES } from '../types';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';

interface MiniMapProps {
  cy: Core | null;
  theme: AppTheme;
}

interface MiniNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({ cy, theme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nodes, setNodes] = useState<MiniNode[]>([]);
  const [viewport, setViewport] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 100, h: 100 });
  const [bounds, setBounds] = useState<{ minX: number; minY: number; maxX: number; maxY: number }>({
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 600
  });

  const isDark = theme === 'dark';
  const MAP_W = 160;
  const MAP_H = 100;

  useEffect(() => {
    if (!cy) return;

    const updateMiniMap = () => {
      const cyNodes = cy.nodes();
      if (cyNodes.length === 0) {
        setNodes([]);
        return;
      }

      const extent = cy.extent(); // Current visible viewport in model coordinates
      const bb = cy.elements().boundingBox();

      // Expand bounding box slightly to include viewport
      const minX = Math.min(bb.x1, extent.x1) - 60;
      const minY = Math.min(bb.y1, extent.y1) - 60;
      const maxX = Math.max(bb.x2, extent.x2) + 60;
      const maxY = Math.max(bb.y2, extent.y2) + 60;

      setBounds({ minX, minY, maxX, maxY });

      // Viewport in model coordinates
      setViewport({
        x: extent.x1,
        y: extent.y1,
        w: extent.w,
        h: extent.h
      });

      // Update nodes positions
      const miniNodes: MiniNode[] = cyNodes.map(n => {
        const pos = n.position();
        const type = n.data('type');
        const conf = NODE_TYPES[type] || NODE_TYPES.theorem;
        return {
          id: n.id(),
          x: pos.x,
          y: pos.y,
          w: n.outerWidth() || 80,
          h: n.outerHeight() || 40,
          color: isDark ? conf.darkColor : conf.color
        };
      });

      setNodes(miniNodes);
    };

    updateMiniMap();

    // Listen to Cytoscape viewport and position changes
    cy.on('pan zoom position add remove render', updateMiniMap);

    return () => {
      cy.removeListener('pan zoom position add remove render', updateMiniMap);
    };
  }, [cy, isDark]);

  // Transform model coordinates to MiniMap SVG coordinates
  const scaleX = (x: number) => {
    const totalW = Math.max(bounds.maxX - bounds.minX, 1);
    return ((x - bounds.minX) / totalW) * MAP_W;
  };

  const scaleY = (y: number) => {
    const totalH = Math.max(bounds.maxY - bounds.minY, 1);
    return ((y - bounds.minY) / totalH) * MAP_H;
  };

  const scaleW = (w: number) => {
    const totalW = Math.max(bounds.maxX - bounds.minX, 1);
    return (w / totalW) * MAP_W;
  };

  const scaleH = (h: number) => {
    const totalH = Math.max(bounds.maxY - bounds.minY, 1);
    return (h / totalH) * MAP_H;
  };

  // Click on minimap to pan canvas to that location
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!cy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const totalW = bounds.maxX - bounds.minX;
    const totalH = bounds.maxY - bounds.minY;

    const targetModelX = bounds.minX + (clickX / MAP_W) * totalW;
    const targetModelY = bounds.minY + (clickY / MAP_H) * totalH;

    const zoom = cy.zoom();
    const pan = {
      x: cy.width() / 2 - targetModelX * zoom,
      y: cy.height() / 2 - targetModelY * zoom
    };

    cy.animate({
      pan,
      duration: 200
    });
  };

  return (
    <div
      className={`absolute bottom-6 right-6 border shadow-xl select-none z-10 font-serif transition-colors rounded-xl overflow-hidden glass-panel ${
        isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
      }`}
    >
      {/* Header */}
      <div
        className={`px-2 py-1 flex items-center justify-between text-[10px] border-b cursor-pointer ${
          isDark ? 'bg-[#222226] border-[#2E2E33] text-[#A1A1AA]' : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#78756E]'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-1">
          <Map className="w-3 h-3" />
          <span>导航</span>
        </div>
        <button className="p-0.5">
          {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* SVG Canvas Map */}
      {!isCollapsed && (
        <svg
          width={MAP_W}
          height={MAP_H}
          onClick={handleMapClick}
          className={`cursor-crosshair block ${isDark ? 'bg-[#121214]' : 'bg-[#FAF8F5]'}`}
        >
          {/* Nodes */}
          {nodes.map(n => (
            <rect
              key={n.id}
              x={scaleX(n.x - n.w / 2)}
              y={scaleY(n.y - n.h / 2)}
              width={Math.max(scaleW(n.w), 3)}
              height={Math.max(scaleH(n.h), 2)}
              fill={n.color}
              opacity={0.85}
            />
          ))}

          {/* Current Camera Viewport Bounding Box */}
          <rect
            x={scaleX(viewport.x)}
            y={scaleY(viewport.y)}
            width={Math.min(Math.max(scaleW(viewport.w), 8), MAP_W)}
            height={Math.min(Math.max(scaleH(viewport.h), 6), MAP_H)}
            fill="none"
            stroke={isDark ? '#60A5FA' : '#1E3A5F'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity={0.9}
          />
        </svg>
      )}
    </div>
  );
};
