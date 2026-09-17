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

【必须严格区分的四大结构化字段】
1. title: 标题。学术规范的简练名称（如“闭区间连续函数的介值定理”）。
2. statement: 命题陈述。严谨完整的数学叙述，清晰交代前提条件与最终结论（公式需用 LaTeX）。
3. proof_sketch: 证明思路。直观思考图景、关键技巧、构造法或引理要点（1~3 句话直击证明核心）。
4. full_proof: 命题证明。详尽严密的分步推导与论证过程；若为公理或定义，写“根据定义本身成立”或“不证自明的基础公理”。

【因果图谱依赖关联原则】
当前画布已有命题列表如下：
${existingListSummary}

当你在提取新命题的“前置依赖（Prerequisites）”时：
1. 优先复用已有命题：如果当前提取的定理依赖于上面已有列表中的某个命题，必须将其 ID 填入 "depends_on_existing_ids" 数组中！绝对不要重复创建已有定理！
2. 批次内部因果关系：如果依赖于本批次同时提取的另一个新命题，将其在本次返回中的 "tempId" 填入 "depends_on_new_temp_ids" 数组中（例如 "node_1" 推导出了 "node_2"，则 node_2 的 depends_on_new_temp_ids 包含 "node_1"）。
3. 严格禁止出现循环依赖（如 A 依赖 B，B 又依赖 A）。

【提炼模式要求】
当前模式: ${mode === 'single' ? '🎯 单个精修模式（仅提取 1 个最核心的命题/定理，给出最详尽的 statement 与 proof_sketch、full_proof）' : '⚡ 批量抽取模式（提取文档中出现的全部核心定义、定理与推论，通常 1~6 个，理清先后脉络）'}

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
      "full_proof": "根据极限与局部邻域连续性的原始定义，无需进一步推导。",
      "depends_on_existing_ids": [],
      "depends_on_new_temp_ids": []
    },
    {
      "tempId": "node_2",
      "type": "theorem",
      "title": "闭区间上连续函数的介值定理",
      "statement": "若 $f \\in C[a, b]$ 且 $f(a) \\neq f(b)$，则对于介于 $f(a)$ 与 $f(b)$ 之间的任一实数 $\\mu$，至少存在一点 $\\xi \\in (a, b)$，使得 $f(\\xi) = \\mu$。",
      "proof_sketch": "构造辅助函数 $g(x) = f(x) - \\mu$，结合连续函数的零点定理完成证明。",
      "full_proof": "不妨设 $f(a) < \\mu < f(b)$。构造连续辅助函数 $g(x) = f(x) - \\mu$。\\n由条件可知 $g(a) = f(a) - \\mu < 0$，$g(b) = f(b) - \\mu > 0$。\\n根据根的存在定理（零点定理），连续函数 $g(x)$ 在区间 $(a, b)$ 内至少存在一个零点 $\\xi$，使得 $g(\\xi) = 0$。\\n即 $f(\\xi) - \\mu = 0$，也就是 $f(\\xi) = \\mu$。定理获证。",
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
  prompt += '请仔细分析上述内容或所附多模态材料中的全部数学逻辑，严格按系统提示的 JSON 格式输出命题与拓扑前置依赖。确保 title、statement、proof_sketch、full_proof 四大字段明确拆分。';
  return prompt;
};

export const buildRefineUserPromptText = (
  currentNodes: any[],
  userInstruction: string,
  textInput?: string,
  fileName?: string
): string => {
  let prompt = '';
  if (fileName) {
    prompt += `【参考附件文件】: ${fileName}\n`;
  }
  if (textInput && textInput.trim()) {
    prompt += `【原始输入背景】:\n${textInput.trim()}\n\n`;
  }

  prompt += `【上一轮提炼出的命题结构 (JSON)】:
${JSON.stringify(currentNodes, null, 2)}

【用户针对上述结果的微调与调整指令】:
"${userInstruction.trim()}"

【任务要求】:
请以上一轮提炼结果为基础，严格根据用户的微调指令进行针对性修改、增删、补充证明或优化拓扑依赖。
必须保持纯 JSON 格式输出，返回完整的 propositions 数组，每个命题必须继续清晰区分包含 tempId, type, title, statement, proof_sketch, full_proof, depends_on_existing_ids, depends_on_new_temp_ids。`;

  return prompt;
};
