import { GraphDataset } from '../types';

export const PEANO_DATASET: GraphDataset = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'peano-1',
      type: 'axiom',
      title: 'P1: 零元存在公理',
      statement: '$0$ 是一个自然数，即 $0 \\in \\mathbb{N}$。',
      proof_sketch: '作为形式算术系统的初始对象公理，不加证明直接确立起点。',
      note: '自然数递归生成的起点标杆。',
      full_proof: '公理本身作为初始真理接受，无需且无法进一步推导。',
      depends_on: []
    },
    {
      id: 'peano-2',
      type: 'axiom',
      title: 'P2: 后继映射公理',
      statement: '每个自然数 $n$ 都有一个唯一的后继数 $S(n)$，且 $S(n) \\in \\mathbb{N}$。',
      proof_sketch: '定义了后继算子 $S: \\mathbb{N} \\to \\mathbb{N}$，确立无限生成的链条。',
      note: '数学上直观对应“加一”的本源抽象。',
      depends_on: ['peano-1']
    },
    {
      id: 'peano-3',
      type: 'axiom',
      title: 'P3: 零无前驱公理',
      statement: '对任意自然数 $n$，均有 $S(n) \\neq 0$。即 $0$ 不是任何数的后继。',
      proof_sketch: '防止自然数序列像时钟指针一样向前卷曲闭合。',
      depends_on: ['peano-1', 'peano-2']
    },
    {
      id: 'peano-4',
      type: 'axiom',
      title: 'P4: 后继单射公理',
      statement: '若 $S(m) = S(n)$，则必有 $m = n$。',
      proof_sketch: '保证后继算子是单射（一对一映射），自然数不会分支合并。',
      depends_on: ['peano-2']
    },
    {
      id: 'peano-5',
      type: 'axiom',
      title: 'P5: 数学归纳法原理',
      statement: '设命题性质 $P(n)$ 满足：(1) $P(0)$ 为真；(2) 若 $P(k)$ 为真能推出 $P(S(k))$ 为真。则对所有 $n \\in \\mathbb{N}$，$P(n)$ 皆为真。',
      proof_sketch: '自然数集合的最小性与无限推进证明的核心杠杆。',
      note: '所有涉及未知任意数定理推导的终极引擎。',
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
      proof_sketch: '利用后继算子 $S$ 将加法沿第二个参数递归推进。',
      depends_on: ['peano-2', 'def-add-0']
    },
    {
      id: 'thm-left-zero',
      type: 'theorem',
      title: 'T1: 零左单位元引理 ($0 + a = a$)',
      statement: '对任意自然数 $a$，恒有 $0 + a = a$。',
      proof_sketch: '对变量 $a$ 施加数学归纳法。',
      note: '定义 D1 只规定了 $a + 0 = a$（右加零），左加零必须通过归纳法证明。',
      full_proof: '设性质 $P(a)$ 为 $0 + a = a$：\n\n1. **基础步 ($a = 0$)**：由定义 D1，有 $0 + 0 = 0$。故 $P(0)$ 成立。\n2. **归纳步**：假设 $P(k)$ 成立，即 $0 + k = k$。考虑 $a = S(k)$：\n   由定义 D2，左边 $= 0 + S(k) = S(0 + k)$；\n   代入归纳假设，$= S(k)$。\n   因此 $P(S(k))$ 成立。\n\n由数学归纳公理 P5，对所有 $a \\in \\mathbb{N}$，$0 + a = a$ 恒成立。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-succ-left',
      type: 'theorem',
      title: 'T2: 加法前驱后继交换 ($S(a) + b = S(a+b)$)',
      statement: '对任意自然数 $a, b$，恒有 $S(a) + b = S(a + b)$。',
      proof_sketch: '固定 $a$，对 $b$ 进行数学归纳法。',
      full_proof: '固定 $a$，对 $b$ 实施归纳：\n\n1. **基础步 ($b = 0$)**：\n   左边 $= S(a) + 0 = S(a)$ (依据 D1)；\n   右边 $= S(a + 0) = S(a)$ (依据 D1)。等式成立。\n2. **归纳步**：假设对 $k$ 成立，即 $S(a) + k = S(a + k)$。\n   当 $b = S(k)$ 时：\n   左边 $= S(a) + S(k) = S(S(a) + k)$ (依据 D2) = $S(S(a + k))$ (依据归纳假设)；\n   右边 $= S(a + S(k)) = S(S(a + k))$ (依据 D2)。两端相等。\n\n由公理 P5，定理获证。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-add-comm',
      type: 'theorem',
      title: 'T3: 加法交换律 ($a + b = b + a$)',
      statement: '对任意自然数 $a, b$，加法满足交换律：$a + b = b + a$。',
      proof_sketch: '固定 $a$，对 $b$ 归纳，并结合 T1 (左加零) 与 T2 (后继移位)。',
      note: '中小学理所当然的常识，在形式公理体系中需要依赖两条引理与归纳法严格证明！',
      full_proof: '固定 $a$，对 $b$ 实施数学归纳法：\n\n1. **基础步 ($b = 0$)**：\n   左边 $= a + 0 = a$ (依据 D1)；\n   右边 $= 0 + a = a$ (依据引理 T1)。\n   故 $a + 0 = 0 + a$ 成立。\n2. **归纳步**：假设 $a + k = k + a$。\n   考虑 $b = S(k)$：\n   左边 $= a + S(k) = S(a + k)$ (依据 D2) = $S(k + a)$ (由归纳假设)；\n   右边 $= S(k) + a = S(k + a)$ (依据引理 T2)。\n   两端完全相等！\n\n由公理 P5，对一切自然数 $a, b$，加法交换律恒成立。',
      depends_on: ['peano-5', 'thm-left-zero', 'thm-succ-left']
    },
    {
      id: 'thm-add-assoc',
      type: 'theorem',
      title: 'T4: 加法结合律 ($(a + b) + c = a + (b + c)$)',
      statement: '对任意自然数 $a, b, c$，恒有 $(a + b) + c = a + (b + c)$。',
      proof_sketch: '对最右边的参数 $c$ 实施数学归纳法。',
      full_proof: '固定 $a, b$，对 $c$ 施加数学归纳法：\n\n1. **基础步 ($c = 0$)**：\n   左边 $= (a + b) + 0 = a + b$ (依据 D1)；\n   右边 $= a + (b + 0) = a + b$ (依据 D1)。等式成立。\n2. **归纳步**：假设 $(a + b) + k = a + (b + k)$。当 $c = S(k)$ 时：\n   左边 $= (a + b) + S(k) = S((a + b) + k) = S(a + (b + k))$；\n   右边 $= a + (b + S(k)) = a + S(b + k) = S(a + (b + k))$。\n   两端相等。由 P5 证毕。',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'cor-succ-plus-one',
      type: 'corollary',
      title: 'C1: 后继即加一推论 ($S(a) = a + 1$)',
      statement: '记自然数 $1 = S(0)$，则对任意自然数 $a$，恒有 $S(a) = a + 1$。',
      proof_sketch: '由加法递推定义 D2 及基底 D1 展开即得。',
      full_proof: '根据加法定义 D2：\n$a + 1 = a + S(0) = S(a + 0)$。\n再根据基底定义 D1，内部 $a + 0 = a$。\n因此 $a + 1 = S(a)$，即 $S(a) = a + 1$。',
      depends_on: ['def-add-0', 'def-add-s']
    }
  ]
};
