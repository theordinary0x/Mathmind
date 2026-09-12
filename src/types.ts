export type PropositionType = 'axiom' | 'definition' | 'theorem' | 'corollary' | string;

export interface PropositionNode {
  id: string;
  type: PropositionType;
  title: string;
  statement: string;
  proof_sketch: string;
  note?: string;
  full_proof?: string;
  depends_on: string[]; // List of upstream proposition IDs this node directly relies on
}

export interface GraphDataset {
  version: string;
  updatedAt: string;
  nodes: PropositionNode[];
}

export interface TypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shape: 'round-rectangle' | 'ellipse' | 'diamond' | 'hexagon';
}

export const NODE_TYPES: Record<string, TypeConfig> = {
  axiom: {
    label: '公理 (Axiom)',
    color: '#26547C',
    bgColor: '#EEF4F8',
    borderColor: '#26547C',
    shape: 'ellipse'
  },
  definition: {
    label: '定义 (Definition)',
    color: '#2A7B62',
    bgColor: '#EDF6F3',
    borderColor: '#2A7B62',
    shape: 'round-rectangle'
  },
  theorem: {
    label: '定理 (Theorem)',
    color: '#A8423F',
    bgColor: '#FBF0EF',
    borderColor: '#A8423F',
    shape: 'round-rectangle'
  },
  corollary: {
    label: '推论 (Corollary)',
    color: '#C67D28',
    bgColor: '#FBF5EE',
    borderColor: '#C67D28',
    shape: 'round-rectangle'
  }
};
