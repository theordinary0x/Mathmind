import { GraphDataset, Project } from '../types';

export const PEANO_DATASET: GraphDataset = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'peano-1',
      type: 'axiom',
      title: 'P1: 零元存在公理',
      statement: '$0$ 是一个自然数，即 $0 \\in \\mathbb{N}$。',
      proof_sketch: '形式系统的初始对象设定。',
      note: '自然数递归生成的起点。',
      full_proof: '公理本身作为初始真理接受，无需且无法进一步推导。',
      depends_on: []
    },
    {
      id: 'peano-2',
      type: 'axiom',
      title: 'P2: 后继映射公理',
      statement: '每个自然数 $n$ 都有一个唯一的后继数 $S(n)$，且 $S(n) \\in \\mathbb{N}$。',
      proof_sketch: '定义了后继算子 $S: \\mathbb{N} \\to \\mathbb{N}$。',
      note: '数学上直观对应“加一”的本源抽象。',
      depends_on: ['peano-1']
    },
    {
      id: 'peano-3',
      type: 'axiom',
      title: 'P3: 零无前驱公理',
      statement: '对任意自然数 $n$，均有 $S(n) \\neq 0$。即 $0$ 不是任何数的后继。',
      proof_sketch: '防止自然数序列闭合成环。',
      depends_on: ['peano-1', 'peano-2']
    },
    {
      id: 'peano-4',
      type: 'axiom',
      title: 'P4: 后继单射公理',
      statement: '若 $S(m) = S(n)$，则必有 $m = n$。',
      proof_sketch: '保证后继算子为单射，自然数不会产生分支合并。',
      depends_on: ['peano-2']
    },
    {
      id: 'peano-5',
      type: 'axiom',
      title: 'P5: 数学归纳法原理',
      statement: '设性质 $P(n)$ 满足：(1) $P(0)$ 为真；(2) 若 $P(k)$ 为真能推出 $P(S(k))$ 为真。则对所有 $n \\in \\mathbb{N}$，$P(n)$ 皆为真。',
      proof_sketch: '自然数集合的最小性与无限推进证明的核心杠杆。',
      note: '所有未知变量定理推导的终极引擎。',
      depends_on: ['peano-1', 'peano-2']
    },
    {
      id: 'def-add-0',
      type: 'definition',
      title: 'D1: 加法零元基底定义',
      statement: '对任意自然数 $a$，规定 $a + 0 = a$。',
      proof_sketch: '给出两数相加在递归起点处的定义。',
      depends_on: ['peano-1']
    },
    {
      id: 'def-add-s',
      type: 'definition',
      title: 'D2: 加法后继递推定义',
      statement: '对任意自然数 $a, b$，规定 $a + S(b) = S(a + b)$。',
      proof_sketch: '利用后继算子 $S$ 将加法沿第二个参数递推。',
      depends_on: ['peano-2', 'def-add-0']
    },
    {
      id: 'thm-left-zero',
      type: 'theorem',
      title: 'T1: 零左单位元引理 (0 + a = a)',
      statement: '对任意自然数 $a$，恒有 $0 + a = a$。',
      proof_sketch: '对变量 $a$ 施加数学归纳法。',
      note: '定义 D1 仅规定了右加零，左加零需归纳法严格证明。',
      full_proof: '设性质 $P(a)$ 为 $0 + a = a$：\n\n1. **基础步 ($a = 0$)**：由定义 D1，有 $0 + 0 = 0$。故 $P(0)$ 成立。\n2. **归纳步**：假设 $P(k)$ 成立，即 $0 + k = k$。考虑 $a = S(k)$：\n   由定义 D2，左边 $= 0 + S(k) = S(0 + k)$；\n   代入归纳假设，$= S(k)$。\n   因此 $P(S(k))$ 成立。\n\n由公理 P5，对所有 $a \\in \\mathbb{N}$，$0 + a = a$ 恒成立。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-succ-left',
      type: 'theorem',
      title: 'T2: 加法后继移位定理 (S(a) + b = S(a+b))',
      statement: '对任意自然数 $a, b$，恒有 $S(a) + b = S(a + b)$。',
      proof_sketch: '固定 $a$，对 $b$ 进行数学归纳法。',
      full_proof: '固定 $a$，对 $b$ 实施归纳：\n\n1. **基础步 ($b = 0$)**：\n   左边 $= S(a) + 0 = S(a)$；右边 $= S(a + 0) = S(a)$。等式成立。\n2. **归纳步**：假设对 $k$ 成立，即 $S(a) + k = S(a + k)$。\n   当 $b = S(k)$ 时：\n   左边 $= S(a) + S(k) = S(S(a) + k) = S(S(a + k))$；\n   右边 $= S(a + S(k)) = S(S(a + k))$。两端相等。\n\n由公理 P5，定理获证。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-add-comm',
      type: 'theorem',
      title: 'T3: 加法交换律 (a + b = b + a)',
      statement: '对任意自然数 $a, b$，加法满足交换律：$a + b = b + a$。',
      proof_sketch: '固定 $a$，对 $b$ 归纳，并结合引理 T1 与 T2。',
      note: '形式算术中的核心里程碑！',
      full_proof: '固定 $a$，对 $b$ 实施数学归纳法：\n\n1. **基础步 ($b = 0$)**：\n   左边 $= a + 0 = a$；右边 $= 0 + a = a$ (由 T1)。故成立。\n2. **归纳步**：假设 $a + k = k + a$。\n   考虑 $b = S(k)$：\n   左边 $= a + S(k) = S(a + k) = S(k + a)$；\n   右边 $= S(k) + a = S(k + a)$ (由 T2)。两端相等！\n\n由公理 P5，加法交换律恒成立。',
      examples: [
        '初等算术验证：设 $a = 2, b = 3$。则 $2 + 3 = 5$ 且 $3 + 2 = 5$，等式 $2 + 3 = 3 + 2$ 成立。',
        '符号后继演算：设 $a = S(0), b = S(S(0))$。由展开知 $S(0) + S(S(0)) = S(S(S(0))) = S(S(0)) + S(0)$。'
      ],
      depends_on: ['peano-5', 'thm-left-zero', 'thm-succ-left']
    },
    {
      id: 'thm-add-assoc',
      type: 'theorem',
      title: 'T4: 加法结合律 ((a+b)+c = a+(b+c))',
      statement: '对任意自然数 $a, b, c$，恒有 $(a + b) + c = a + (b + c)$。',
      proof_sketch: '对最右边的参数 $c$ 实施数学归纳法。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'cor-succ-plus-one',
      type: 'corollary',
      title: 'C1: 后继即加一推论 (S(a) = a + 1)',
      statement: '记自然数 $1 = S(0)$，则对任意自然数 $a$，恒有 $S(a) = a + 1$。',
      proof_sketch: '由加法递推定义 D2 及基底 D1 展开即得。',
      depends_on: ['def-add-0', 'def-add-s']
    }
  ]
};

export const EUCLID_DATASET: GraphDataset = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'euclid-post-1',
      type: 'axiom',
      title: '公设1: 两点连线公设',
      statement: '从任一点到另一任一点可以引一直线段。',
      proof_sketch: '直尺作图的基本许可。',
      depends_on: []
    },
    {
      id: 'euclid-post-2',
      type: 'axiom',
      title: '公设2: 线段延展公设',
      statement: '一条有限直线可以沿直线方向无限延长。',
      proof_sketch: '空间的连续性假定。',
      depends_on: ['euclid-post-1']
    },
    {
      id: 'euclid-post-3',
      type: 'axiom',
      title: '公设3: 圆的作图公设',
      statement: '以任意点为圆心，任意长为半径，可以作一圆。',
      proof_sketch: '圆规作图的基本许可。',
      depends_on: ['euclid-post-1']
    },
    {
      id: 'euclid-post-4',
      type: 'axiom',
      title: '公设4: 直角相等公设',
      statement: '所有直角彼此相等。',
      proof_sketch: '空间各向同性度量标准。',
      depends_on: []
    },
    {
      id: 'euclid-def-circle',
      type: 'definition',
      title: '定义: 圆与等长半径',
      statement: '圆是由一条曲线构成的平面图形，其内部有一点，从该点向曲线上引的所有线段彼此相等。',
      proof_sketch: '圆周上任意点到圆心距离相等。',
      depends_on: ['euclid-post-3']
    },
    {
      id: 'euclid-def-equilateral',
      type: 'definition',
      title: '定义: 等边三角形',
      statement: '三边均相等的平面封闭三边形称为等边三角形。',
      proof_sketch: '边长全等的特征定义。',
      depends_on: []
    },
    {
      id: 'euclid-prop-1',
      type: 'theorem',
      title: '命题1: 作等边三角形定理',
      statement: '在一条给定的已知线段 $AB$ 上，可以作出一个等边三角形 $\\triangle ABC$。',
      proof_sketch: '以 $A$ 和 $B$ 分别为圆心、线段 $AB$ 为半径作两圆，两圆相交于 $C$，连结 $AC$ 与 $BC$。',
      full_proof: '1. 设已知线段为 $AB$。\n2. 由公设3，以点 $A$ 为圆心、$AB$ 为半径作圆 $\\odot A$；\n3. 同理以点 $B$ 为圆心、$BA$ 为半径作圆 $\\odot B$；\n4. 设两圆交于点 $C$，由公设1引线段 $AC$ 与 $BC$；\n5. 根据圆的定义：$AC = AB$（同为圆 $\\odot A$ 的半径），$BC = AB$（同为圆 $\\odot B$ 的半径）；\n6. 由等量公理（公理1）：$AC = BC$；\n7. 故 $AB = BC = CA$，根据等边三角形定义，$\\triangle ABC$ 为等边三角形。\n证毕。',
      depends_on: ['euclid-post-1', 'euclid-post-3', 'euclid-def-circle', 'euclid-def-equilateral']
    }
  ]
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-peano',
    name: '皮亚诺公理体系 (自然数与加法)',
    description: '从 5 条皮亚诺公理出发，推导加法的定义、引理、结合律与交换律。',
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    dataset: PEANO_DATASET
  },
  {
    id: 'proj-euclid',
    name: '欧几里得几何五大公设 (尺规作图)',
    description: '《几何原本》卷一基础，由几何公设推导命题1：等边三角形的存在性。',
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    dataset: EUCLID_DATASET
  }
];
