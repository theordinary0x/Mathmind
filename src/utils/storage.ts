import { GraphDataset, PropositionNode } from '../types';
import { PEANO_DATASET } from '../data/seedData';

const STORAGE_KEY = 'mathmind_propositions_dataset_v1';

export function loadDataset(): GraphDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return PEANO_DATASET;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.nodes)) {
      return parsed;
    }
    return PEANO_DATASET;
  } catch (err) {
    console.error('Failed to load dataset from localStorage:', err);
    return PEANO_DATASET;
  }
}

export function saveDataset(dataset: GraphDataset): void {
  try {
    const updated = {
      ...dataset,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save dataset to localStorage:', err);
  }
}

export function exportDatasetToJson(dataset: GraphDataset): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `mathmind-export-${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseImportedJson(jsonString: string): GraphDataset {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error('无效的数据格式：必须包含 nodes 数组');
  }
  
  // Basic validation of nodes
  for (const node of parsed.nodes) {
    if (!node.id || !node.title) {
      throw new Error('数据项缺少必要的 id 或 title 字段');
    }
    if (!Array.isArray(node.depends_on)) {
      node.depends_on = [];
    }
  }

  return {
    version: parsed.version || '1.0.0',
    updatedAt: new Date().toISOString(),
    nodes: parsed.nodes
  };
}

/**
 * Computes the downstream dependents for all nodes.
 * Returns a map: nodeId -> list of node IDs that depend on this node.
 */
export function computeDownstreamMap(nodes: PropositionNode[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const node of nodes) {
    map[node.id] = [];
  }

  for (const node of nodes) {
    for (const upstreamId of node.depends_on) {
      if (!map[upstreamId]) {
        map[upstreamId] = [];
      }
      map[upstreamId].push(node.id);
    }
  }

  return map;
}
