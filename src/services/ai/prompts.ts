import { PropositionNode } from '../../types';
import { IngestionBuildMode } from '../../types/ai';

export const buildSystemPrompt = (
  mode: IngestionBuildMode,
  existingNodes: PropositionNode[]
): string => {
  const existingListSummary = existingNodes.length > 0
    ? existingNodes.map(n => `- ID: "${n.id}", 标题: "${n.title}", 类型: "${n.type}"`).join('\n')
    : '(当前画布尚无任何命题节点)';

  return `你是一名资深的大学数学与数理逻辑专家，擅长将教材、讲义、论文、板书或截图中的数学概念梳理为严格的有向无环因果图谱（Acyclic Deduction Graph）。

【任务目标】
仔细阅读并理解用户提供的数学内容（可能是教材文字、公式文本、教材截图或 PDF 文档），将其提炼为结构化的数学命题节点，并精确识别各命题之间的逻辑前置依赖（谁推导出谁）。

【命题类型约束】
仅允许以下 5 种类型之一：
- "axiom": 公理（不证自明的基础假设）
- "definition": 定义（引入新概念、符号或几何代数对象）
- "proposition": 命题（次要结论、性质或辅助判定）
- "theorem": 定理（核心证明结论、重要规律）
- "corollary": 推论（由某一主定理直接推导出的简明推论）

【数学公式与排版规范】
1. 所有数学变量与公式必须使用标准严谨的 LaTeX 语法：行内公式用 $ ... $ 包裹，独立展示公式用 $$ ... $$ 包裹。
2. 标题（title）应简明扼要且具学术规范，如“介值定理”、“导数的极限定义”、“Schwarz 不等式”，行内有符号可写作“$L^p$ 空间完备性定理”。
3. statement: 严谨完整的数学叙述，包含前置条件与结论。
4. proof_sketch: 证明核心思路、构造方法、几何直观或关键引理说明。

【因果图谱依赖关联原则】
当前画布已有命题列表如下：
${existingListSummary}

当你在提取新命题的“前置依赖（Prerequisites）”时：
1. 优先复用已有命题：如果当前提取的定理依赖于上面已有列表中的某个命题，必须将其 ID 填入 "depends_on_existing_ids" 数组中！绝对不要重复创建已有定理！
2. 批次内部因果关系：如果依赖于本批次同时提取的另一个新命题，将其在本次返回中的 "tempId" 填入 "depends_on_new_temp_ids" 数组中（例如 "node_1" 推导出了 "node_2"，则 node_2 的 depends_on_new_temp_ids 包含 "node_1"）。
3. 严格禁止出现循环依赖（如 A 依赖 B，B 又依赖 A）。

【提炼模式要求】
当前模式: ${mode === 'single' ? '🎯 单个精修模式（仅提取 1 个最核心的命题/定理，给出最详尽的 statement 与 proof_sketch）' : '⚡ 批量抽取模式（提取文档中出现的全部核心定义、定理与推论，通常 1~6 个，理清先后脉络）'}

【必须返回纯 JSON 格式】
严禁输出任何多余的开场白、问候语或解释文字，直接返回以下 JSON 结构：
{
  "propositions": [
    {
      "tempId": "node_1",
      "type": "definition",
      "title": "函数在某点连续的定义",
      "statement": "设函数 $f(x)$ 在点 $x_0$ 的某邻域内有定义。若 $\\lim_{x \\to x_0} f(x) = f(x_0)$，则称 $f(x)$ 在点 $x_0$ 连续。",
      "proof_sketch": "以极限语言刻画函数值的局部稳定趋势。",
      "depends_on_existing_ids": [],
      "depends_on_new_temp_ids": []
    },
    {
      "tempId": "node_2",
      "type": "theorem",
      "title": "闭区间上连续函数的介值定理",
      "statement": "若 $f \\in C[a, b]$ 且 $f(a) \\neq f(b)$，则对于介于 $f(a)$ 与 $f(b)$ 之间的任一实数 $\\mu$，至少存在一点 $\\xi \\in (a, b)$，使得 $f(\\xi) = \\mu$。",
      "proof_sketch": "构造辅助函数 $g(x) = f(x) - \\mu$，结合零点定理证明。",
      "depends_on_existing_ids": [],
      "depends_on_new_temp_ids": ["node_1"]
    }
  ]
}`;
};

export const buildUserPromptText = (textInput?: string, fileName?: string): string => {
  let prompt = '';
  if (fileName) {
    prompt += `【附件文件】: ${fileName}\n`;
  }
  if (textInput && textInput.trim()) {
    prompt += `【用户输入内容 / 辅助说明】:\n${textInput.trim()}\n\n`;
  }
  prompt += '请仔细分析上述内容或所附多模态材料中的全部数学逻辑，严格按系统提示的 JSON 格式输出命题与拓扑前置依赖。';
  return prompt;
};
