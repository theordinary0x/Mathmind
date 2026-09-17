import { PropositionNode, PropositionType } from '../types';

/**
 * 修改节点的字段差异
 */
export interface NodeUpdateDiff {
  id: string;
  type?: PropositionType;
  title?: string;
  statement?: string;
  proof_sketch?: string;
  note?: string;
  full_proof?: string;
  depends_on?: string[];
  change_summary?: string;
}

/**
 * 删除节点的意图声明
 */
export interface NodeDeleteDiff {
  id: string;
  title: string;
  reason: string;
}

/**
 * 连线增删重构声明
 */
export interface EdgeRewireDiff {
  from: string;
  to: string;
  action: 'add' | 'remove';
  reason?: string;
}

/**
 * 统一的图变更集 (Graph Mutation Diff)
 * 将新增命题、修改命题、删除冗余、重构依赖线化归为单一原子变更集
 */
export interface GraphMutationDiff {
  summary?: string;
  add_nodes?: PropositionNode[];
  update_nodes?: NodeUpdateDiff[];
  delete_nodes?: NodeDeleteDiff[];
  rewire_edges?: EdgeRewireDiff[];
}

/**
 * 变更提案状态与应用记录
 */
export interface DiffProposalState {
  diff: GraphMutationDiff;
  applied: boolean;
  appliedAt?: number;
  selectedActionIds?: string[];
}

/**
 * Copilot 消息对象
 */
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextSnapshot?: {
    nodeIds: string[];
    nodeTitles: string[];
    attachmentName?: string;
  };
  diffProposal?: DiffProposalState;
  isStreaming?: boolean;
  error?: string;
}

/**
 * 选区警示等级定义
 * 3-6: 舒适区 (normal - 绿灯)
 * 7-12: 预警区 (warn - 黄灯)
 * >12: 强警示区 (danger - 红灯)
 */
export type SelectionWarningLevel = 'empty' | 'normal' | 'warn' | 'danger';

export interface CopilotContextInfo {
  selectedNodes: PropositionNode[];
  warningLevel: SelectionWarningLevel;
  warningMessage: string | null;
}
