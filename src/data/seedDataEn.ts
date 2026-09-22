import { GraphDataset, Project } from '../types';

export const PEANO_DATASET_EN: GraphDataset = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'peano-1',
      type: 'axiom',
      title: 'P1: Existence of Zero',
      statement: '$0$ is a natural number, i.e., $0 \\in \\mathbb{N}$.',
      proof_sketch: 'Initial primitive element definition of the formal system.',
      note: 'Starting point of recursive natural number generation.',
      full_proof: 'Accepted as an initial postulate; cannot be derived from simpler terms.',
      depends_on: []
    },
    {
      id: 'peano-2',
      type: 'axiom',
      title: 'P2: Successor Mapping',
      statement: 'Every natural number $n$ has a unique successor $S(n) \\in \\mathbb{N}$.',
      proof_sketch: 'Defines the successor operator $S: \\mathbb{N} \\to \\mathbb{N}$.',
      note: 'Formal mathematical abstraction of the intuition of adding one.',
      depends_on: ['peano-1']
    },
    {
      id: 'peano-3',
      type: 'axiom',
      title: 'P3: Zero is not a Successor',
      statement: 'For all $n \\in \\mathbb{N}$, $S(n) \\neq 0$. Zero has no predecessor.',
      proof_sketch: 'Prevents natural numbers from looping into a cycle.',
      depends_on: ['peano-1', 'peano-2']
    },
    {
      id: 'peano-4',
      type: 'axiom',
      title: 'P4: Injectivity of Successor',
      statement: 'If $S(m) = S(n)$, then $m = n$.',
      proof_sketch: 'Guarantees the successor operator is injective; branches never merge.',
      depends_on: ['peano-2']
    },
    {
      id: 'peano-5',
      type: 'axiom',
      title: 'P5: Principle of Mathematical Induction',
      statement: 'If predicate $P(n)$ satisfies: (1) $P(0)$ is true; (2) $P(k) \\implies P(S(k))$, then $P(n)$ is true for all $n \\in \\mathbb{N}$.',
      proof_sketch: 'Core axiom guaranteeing minimality and inductive reasoning on $\\mathbb{N}$.',
      note: 'Ultimate deductive engine for all general natural number theorems.',
      depends_on: ['peano-1', 'peano-2']
    },
    {
      id: 'def-add-0',
      type: 'definition',
      title: 'D1: Base Case of Addition',
      statement: 'For every $a \\in \\mathbb{N}$, define $a + 0 = a$.',
      proof_sketch: 'Base step definition of addition at the recursive boundary.',
      depends_on: ['peano-1']
    },
    {
      id: 'def-add-s',
      type: 'definition',
      title: 'D2: Inductive Step of Addition',
      statement: 'For all $a, b \\in \\mathbb{N}$, define $a + S(b) = S(a + b)$.',
      proof_sketch: 'Propagates addition along the second parameter via successor $S$.',
      depends_on: ['peano-2', 'def-add-0']
    },
    {
      id: 'thm-left-zero',
      type: 'theorem',
      title: 'T1: Left Identity of Zero (0 + a = a)',
      statement: 'For all $a \\in \\mathbb{N}$, $0 + a = a$.',
      proof_sketch: 'Proof by mathematical induction on $a$.',
      note: 'Definition D1 only specifies right-addition of zero; left-addition requires proof.',
      full_proof: 'Let predicate $P(a)$ be $0 + a = a$:\\n\\n1. **Base ($a = 0$)**: By D1, $0 + 0 = 0$. Hence $P(0)$ holds.\\n2. **Inductive step**: Assume $P(k)$, i.e., $0 + k = k$. Consider $a = S(k)$:\\n   Left side $= 0 + S(k) = S(0 + k)$ (by D2)\\n   $= S(k)$ (by inductive hypothesis).\\n   Hence $P(S(k))$ holds.\\n\\nBy Axiom P5, $0 + a = a$ holds for all $a \\in \\mathbb{N}$.',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-succ-left',
      type: 'theorem',
      title: 'T2: Left Successor Shift (S(a) + b = S(a+b))',
      statement: 'For all $a, b \\in \\mathbb{N}$, $S(a) + b = S(a + b)$.',
      proof_sketch: 'Fix $a$, apply induction on $b$.',
      full_proof: 'Fix $a$, induct on $b$:\\n\\n1. **Base ($b = 0$)**:\\n   $S(a) + 0 = S(a)$ (by D1); $S(a + 0) = S(a)$. True.\\n2. **Inductive step**: Assume $S(a) + k = S(a + k)$. For $b = S(k)$:\\n   $S(a) + S(k) = S(S(a) + k) = S(S(a + k))$ (by D2 and IH)\\n   Right side $= S(a + S(k)) = S(S(a + k))$. Both sides match.\\n\\nBy Axiom P5, the theorem is proved.',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    },
    {
      id: 'thm-add-comm',
      type: 'theorem',
      title: 'T3: Commutativity of Addition (a + b = b + a)',
      statement: 'For all $a, b \\in \\mathbb{N}$, addition is commutative: $a + b = b + a$.',
      proof_sketch: 'Fix $a$, apply induction on $b$, utilizing Lemmas T1 and T2.',
      note: 'Crucial structural milestone in formal arithmetic!',
      full_proof: 'Fix $a$, induct on $b$:\\n\\n1. **Base ($b = 0$)**: $a + 0 = a$ (by D1); $0 + a = a$ (by T1). Hence $a + 0 = 0 + a$.\\n2. **Inductive step**: Assume $a + k = k + a$. For $b = S(k)$:\\n   $a + S(k) = S(a + k) = S(k + a)$ (by D2 and IH)\\n   Right side: $S(k) + a = S(k + a)$ (by T2). Both sides are equal!\\n\\nBy Axiom P5, commutativity holds for all natural numbers.',
      examples: [
        'Elementary arithmetic demonstration: Let $a = 2, b = 3$. Then $2 + 3 = 5$ and $3 + 2 = 5$, verifying $2 + 3 = 3 + 2$.',
        'Formal successor calculus: For $a = S(0), b = S(S(0))$, expansion yields $S(0) + S(S(0)) = S(S(S(0))) = S(S(0)) + S(0)$.'
      ],
      depends_on: ['peano-5', 'thm-left-zero', 'thm-succ-left']
    },
    {
      id: 'thm-add-assoc',
      type: 'theorem',
      title: 'T4: Associativity of Addition ((a+b)+c = a+(b+c))',
      statement: 'For all $a, b, c \\in \\mathbb{N}$, $(a + b) + c = a + (b + c)$.',
      proof_sketch: 'Fix $a, b$, apply induction on $c$.',
      note: 'Foundational algebra theorem allowing parenthesis-free additions.',
      full_proof: 'Fix $a$ and $b$, induct on variable $c$:\\n\\n1. **Base ($c = 0$)**: Left $= (a + b) + 0 = a + b$; Right $= a + (b + 0) = a + b$. Holds.\\n2. **Inductive step**: Assume $(a + b) + k = a + (b + k)$. For $c = S(k)$:\\n   $(a + b) + S(k) = S((a + b) + k) = S(a + (b + k))$ (by D2 and IH)\\n   Right side: $a + (b + S(k)) = a + S(b + k) = S(a + (b + k))$.\\n   Both sides equal $S(a + (b + k))$.\\n\\nBy Axiom P5, addition on natural numbers is strictly associative.',
      depends_on: ['peano-5', 'def-add-0', 'def-add-s']
    }
  ]
};

export const EUCLID_DATASET_EN: GraphDataset = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'euc-post-1',
      type: 'axiom',
      title: 'Postulate 1: Straight Line between Points',
      statement: 'A straight line segment can be drawn joining any two distinct points.',
      proof_sketch: 'Straightedge construction postulate in Euclidean geometry.',
      note: 'Foundation of geometric connectivity.',
      depends_on: []
    },
    {
      id: 'euc-post-2',
      type: 'axiom',
      title: 'Postulate 2: Extension of a Segment',
      statement: 'Any given line segment can be extended continuously in a straight line.',
      proof_sketch: 'Assumes the continuous unboundedness of space.',
      depends_on: ['euc-post-1']
    },
    {
      id: 'euc-post-3',
      type: 'axiom',
      title: 'Postulate 3: Circle with Given Center and Radius',
      statement: 'A circle can be described with any center and any given radius.',
      proof_sketch: 'Compass construction postulate.',
      note: 'Together with Postulate 1, establishes the compass-and-straightedge framework.',
      depends_on: ['euc-post-1']
    },
    {
      id: 'euc-post-4',
      type: 'axiom',
      title: 'Postulate 4: Right Angles are Equal',
      statement: 'All right angles are congruent to one another.',
      proof_sketch: 'Ensures homogeneity and isotropy of Euclidean plane space.',
      depends_on: []
    },
    {
      id: 'euc-post-5',
      type: 'axiom',
      title: 'Postulate 5: Parallel Postulate',
      statement: 'If two lines intersect a third such that the interior angles on the same side sum to less than two right angles, the two lines intersect on that side if extended indefinitely.',
      proof_sketch: 'Classic parallel axiom dividing Euclidean and non-Euclidean geometries.',
      note: 'One of the most profound postulates in the history of mathematics.',
      depends_on: ['euc-post-1', 'euc-post-2', 'euc-post-4']
    },
    {
      id: 'euc-cn-1',
      type: 'axiom',
      title: 'Common Notion 1: Transitivity of Equality',
      statement: 'Things which are equal to the same thing are also equal to one another.',
      proof_sketch: 'Transitive law of mathematical equality.',
      depends_on: []
    },
    {
      id: 'euc-cn-2',
      type: 'axiom',
      title: 'Common Notion 2: Addition of Equals',
      statement: 'If equals be added to equals, the wholes are equal.',
      proof_sketch: 'Monotonicity/invariance of equality under addition.',
      depends_on: []
    },
    {
      id: 'euc-cn-3',
      type: 'axiom',
      title: 'Common Notion 3: Subtraction of Equals',
      statement: 'If equals be subtracted from equals, the remainders are equal.',
      proof_sketch: 'Monotonicity/invariance of equality under subtraction.',
      depends_on: []
    },
    {
      id: 'euc-cn-4',
      type: 'axiom',
      title: 'Common Notion 4: Superposition and Congruence',
      statement: 'Things which coincide with one another are equal to one another.',
      proof_sketch: 'Geometric foundation of rigid motion and superposition congruence.',
      depends_on: []
    },
    {
      id: 'euc-cn-5',
      type: 'axiom',
      title: 'Common Notion 5: Whole Greater than Part',
      statement: 'The whole is greater than any of its proper parts.',
      proof_sketch: 'Order axiom for geometric quantities.',
      depends_on: []
    },
    {
      id: 'euc-prop-1',
      type: 'proposition',
      title: 'Proposition 1: Equilateral Triangle on a Segment',
      statement: 'On a given finite straight line segment $AB$, to construct an equilateral triangle.',
      proof_sketch: 'Construct two circles with radius $AB$ centered at $A$ and $B$; their intersection $C$ forms equilateral $\\triangle ABC$.',
      note: 'The grand opening proposition of Euclid\'s Elements Book I!',
      full_proof: 'Let $AB$ be the given segment:\\n\\n1. Draw circle with center $A$ and radius $AB$ (Postulate 3).\\n2. Draw circle with center $B$ and radius $BA$ (Postulate 3).\\n3. Let $C$ be one of their intersection points; draw segments $CA$ and $CB$ (Postulate 1).\\n4. Since $A$ is center, $AC = AB$; since $B$ is center, $BC = BA$.\\n5. By Common Notion 1, $AC = BC = AB$. Thus $\\triangle ABC$ is equilateral. Q.E.F.',
      depends_on: ['euc-post-1', 'euc-post-3', 'euc-cn-1']
    },
    {
      id: 'euc-prop-2',
      type: 'proposition',
      title: 'Proposition 2: Transfer of a Segment',
      statement: 'To place a line segment equal to a given segment with one end at a given point.',
      proof_sketch: 'Utilize Proposition 1 equilateral triangle and concentric circle extensions to transfer length with collapsible compass.',
      depends_on: ['euc-prop-1', 'euc-post-2', 'euc-post-3', 'euc-cn-3']
    },
    {
      id: 'euc-prop-3',
      type: 'proposition',
      title: 'Proposition 3: Cut Lesser Segment from Greater',
      statement: 'Given two unequal straight lines, to cut off from the greater a segment equal to the lesser.',
      proof_sketch: 'Use Proposition 2 to transfer the lesser segment to an endpoint of the greater, then use a circle to mark the segment.',
      depends_on: ['euc-prop-2', 'euc-post-3', 'euc-cn-1']
    },
    {
      id: 'euc-prop-4',
      type: 'theorem',
      title: 'Proposition 4: SAS Congruence Criterion',
      statement: 'If two triangles have two sides equal to two sides respectively, and the included angles equal, then their third sides and remaining angles are equal, and the triangles are congruent.',
      proof_sketch: 'Superposition argument via Common Notion 4.',
      depends_on: ['euc-cn-4']
    },
    {
      id: 'euc-prop-5',
      type: 'theorem',
      title: 'Proposition 5: Isosceles Base Angles Equal (Pons Asinorum)',
      statement: 'In isosceles triangles, the angles at the base are equal to one another; and if the equal straight lines be produced further, the angles under the base are equal.',
      proof_sketch: 'Extend legs by equal lengths (Prop 3) and apply SAS congruence (Prop 4) twice.',
      note: 'Historically celebrated as the Bridge of Asses (Pons Asinorum).',
      depends_on: ['euc-prop-3', 'euc-prop-4', 'euc-cn-3']
    }
  ]
};

export const DEFAULT_PROJECTS_EN: Project[] = [
  {
    id: 'proj-peano',
    name: 'Peano Axiom System (Arithmetic Foundations)',
    description: 'Peano axiomatic foundation of natural numbers, addition definitions, and commutativity/associativity proofs.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataset: PEANO_DATASET_EN
  },
  {
    id: 'proj-euclid',
    name: "Euclid's Elements (First 5 Propositions)",
    description: "Book I of Euclid's Elements: five postulates, five common notions, and the first five geometric propositions.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataset: EUCLID_DATASET_EN
  }
];
