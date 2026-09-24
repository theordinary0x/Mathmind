import type { LayoutOptions } from 'cytoscape';
import type { AnimationFpsMode } from '../types';

export function getDagreLayoutConfig(fpsMode: AnimationFpsMode = 'standard'): LayoutOptions {
  const isOff = fpsMode === 'off';
  const durationMap = {
    high: 650,
    standard: 450,
    economy: 200,
    off: 0
  };

  return {
    name: 'dagre',
    rankDir: 'LR',
    nodeDimensionsIncludeLabels: true,
    nodeSep: 80,
    rankSep: 140,
    edgeSep: 40,
    animate: !isOff,
    animationDuration: durationMap[fpsMode] ?? 450,
    animationEasing: 'ease-out-cubic',
    fit: false,
    padding: 60
  } as LayoutOptions;
}

export function getCoseLayoutConfig(fpsMode: AnimationFpsMode = 'standard'): LayoutOptions {
  const isOff = fpsMode === 'off';
  const durationMap = {
    high: 700,
    standard: 500,
    economy: 200,
    off: 0
  };
  const refreshMap = {
    high: 10,
    standard: 20,
    economy: 40,
    off: 0
  };

  return {
    name: 'cose',
    animate: !isOff,
    animationDuration: durationMap[fpsMode] ?? 500,
    animationEasing: 'ease-out-cubic',
    refresh: refreshMap[fpsMode] ?? 20,
    fit: false,
    padding: 60,
    randomize: false,
    componentSpacing: 140,
    nodeRepulsion: () => 1200000,
    nodeOverlap: 10,
    idealEdgeLength: () => 160,
    edgeElasticity: () => 100,
    nestingFactor: 1.2,
    gravity: 0.25,
    numIter: isOff ? 500 : 1000,
    initialTemp: 200,
    coolingFactor: 0.95
  } as LayoutOptions;
}

export function getGraphLayoutConfig(type: 'dagre' | 'cose', fpsMode: AnimationFpsMode = 'standard'): LayoutOptions {
  return type === 'dagre' ? getDagreLayoutConfig(fpsMode) : getCoseLayoutConfig(fpsMode);
}
