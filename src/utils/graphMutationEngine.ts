import { PropositionNode } from '../types';
import { GraphMutationDiff } from '../types/copilot';

export interface GraphValidationResult {
  isValid: boolean;
  cycleNodeIds?: string[];
  errorMessage?: string;
}

/**
 * 使用拓扑排序 (Kahn 算法) 检验命题依赖图是否为合法有向无环图 (DAG)
 * 依赖方向：Node -> depends_on (前置命题)
 * 即有向边为: Prereq -> Node (前置推导后置)
 */
export function validateGraphDag(nodes: PropositionNode[]): GraphValidationResult {
  const nodeMap = new Map<string, PropositionNode>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>(); // u (prereq) -> v (dependent)

  // 初始化
  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  // 构建邻接表与入度
  for (const node of nodes) {
    const prereqs = node.depends_on || [];
    for (const prereqId of prereqs) {
      if (nodeMap.has(prereqId)) {
        // 存在一条边 prereqId -> node.id
        adjList.get(prereqId)!.push(node.id);
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
    }
  }

  // 将所有入度为 0 的节点推入队列 (没有任何前提的公理或基础命题)
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  let visitedCount = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    visitedCount++;

    const neighbors = adjList.get(u) || [];
    for (const v of neighbors) {
      const currentDeg = inDegree.get(v)! - 1;
      inDegree.set(v, currentDeg);
      if (currentDeg === 0) {
        queue.push(v);
      }
    }
  }

  if (visitedCount === nodes.length) {
    return { isValid: true };
  }

  // 存在环路，收集处于环中的节点 (入度 > 0)
  const cycleNodeIds: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg > 0) {
      cycleNodeIds.push(id);
    }
  });

  const cycleTitles = cycleNodeIds
    .map(id => nodeMap.get(id)?.title || id)
    .slice(0, 4)
    .join(' -> ');

  return {
    isValid: false,
    cycleNodeIds,
    errorMessage: `检测到循环论证 (Circular Dependency)：[${cycleTitles} ...] 互相作为前提，违反数理逻辑的 DAG 单向推导链！`
  };
}

export interface ApplyMutationOptions {
  /**
   * 勾选要应用的单项 action ID 集合。若未指定，则默认应用全部变更。
   */
  enabledActionIds?: Set<string>;
}

export interface ApplyMutationResult {
  success: boolean;
  newNodes: PropositionNode[];
  error?: string;
  appliedCount: number;
  summary: string;
}

/**
 * 将 AI 提议的图变更集原子化应用到当前节点集合中
 * 具备自动级联悬空依赖清理与 DAG 拓扑无环性硬性拦截
 */
export function applyGraphMutation(
  currentNodes: PropositionNode[],
  diff: GraphMutationDiff,
  options?: ApplyMutationOptions
): ApplyMutationResult {
  const enabled = options?.enabledActionIds;
  const isActionEnabled = (actionId: string) => !enabled || enabled.has(actionId);

  // 深度克隆现有节点数组，以确保不可变性
  let workingNodes: PropositionNode[] = currentNodes.map(n => ({
    ...n,
    depends_on: [...(n.depends_on || [])]
  }));

  let appliedCount = 0;

  // 1. 处理删除节点 (Delete Nodes)
  const deleteIds = new Set<string>();
  if (diff.delete_nodes) {
    for (const item of diff.delete_nodes) {
      const actionId = `del_${item.id}`;
      if (isActionEnabled(actionId)) {
        deleteIds.add(item.id);
        appliedCount++;
      }
    }
  }

  if (deleteIds.size > 0) {
    // 过滤掉被删除的节点
    workingNodes = workingNodes.filter(n => !deleteIds.has(n.id));
    // 级联清理：其它节点的 depends_on 中若引用了被删除的节点，自动予以剔除
    workingNodes = workingNodes.map(n => ({
      ...n,
      depends_on: n.depends_on.filter(depId => !deleteIds.has(depId))
    }));
  }

  // 2. 处理修改节点 (Update Nodes)
  if (diff.update_nodes) {
    for (const update of diff.update_nodes) {
      const actionId = `upd_${update.id}`;
      if (!isActionEnabled(actionId)) continue;

      const idx = workingNodes.findIndex(n => n.id === update.id);
      if (idx !== -1) {
        const target = workingNodes[idx];
        workingNodes[idx] = {
          ...target,
          ...(update.type ? { type: update.type } : {}),
          ...(update.title ? { title: update.title } : {}),
          ...(update.statement !== undefined ? { statement: update.statement } : {}),
          ...(update.proof_sketch !== undefined ? { proof_sketch: update.proof_sketch } : {}),
          ...(update.note !== undefined ? { note: update.note } : {}),
          ...(update.full_proof !== undefined ? { full_proof: update.full_proof } : {}),
          ...(update.examples !== undefined ? { examples: [...update.examples] } : {}),
          ...(update.depends_on !== undefined ? { depends_on: [...update.depends_on] } : {})
        };
        appliedCount++;
      }
    }
  }

  // 3. 处理连线重构 (Rewire Edges)
  if (diff.rewire_edges) {
    for (const edge of diff.rewire_edges) {
      const actionId = `edge_${edge.from}_${edge.to}_${edge.action}`;
      if (!isActionEnabled(actionId)) continue;

      // 拓扑规范：from 是前提，to 是后置推论，所以 to 的 depends_on 包含 from
      const targetNode = workingNodes.find(n => n.id === edge.to);
      if (targetNode) {
        if (edge.action === 'add') {
          if (!targetNode.depends_on.includes(edge.from)) {
            targetNode.depends_on.push(edge.from);
            appliedCount++;
          }
        } else if (edge.action === 'remove') {
          targetNode.depends_on = targetNode.depends_on.filter(id => id !== edge.from);
          appliedCount++;
        }
      }
    }
  }

  // 4. 处理新增节点 (Add Nodes)
  if (diff.add_nodes) {
    for (const newNode of diff.add_nodes) {
      const actionId = `add_${newNode.id}`;
      if (!isActionEnabled(actionId)) continue;

      // 避免重复 ID 碰撞
      const exists = workingNodes.some(n => n.id === newNode.id);
      const nodeToAdd: PropositionNode = {
        ...newNode,
        id: exists ? `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` : newNode.id,
        depends_on: [...(newNode.depends_on || [])]
      };
      workingNodes.push(nodeToAdd);
      appliedCount++;
    }
  }

  // 5. 校验有向无环图 (DAG) 拓扑完整性
  const dagCheck = validateGraphDag(workingNodes);
  if (!dagCheck.isValid) {
    return {
      success: false,
      newNodes: currentNodes, // 拒绝落盘，完全回滚
      error: dagCheck.errorMessage || '操作将导致图中产生循环依赖，已自动拦截',
      appliedCount: 0,
      summary: '应用失败：拦截到循环依赖'
    };
  }

  return {
    success: true,
    newNodes: workingNodes,
    appliedCount,
    summary: `成功应用 ${appliedCount} 项图谱变更`
  };
}
