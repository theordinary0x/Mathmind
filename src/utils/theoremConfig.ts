export const THEOREM_ENV_CONFIG: Record<
  string,
  { label: string; en: string; border: string; bg: string; text: string }
> = {
  theorem: {
    label: '定理',
    en: 'Theorem',
    border: 'border-rose-500/40 border-l-rose-500',
    bg: 'bg-rose-500/5',
    text: 'text-rose-600 dark:text-rose-400'
  },
  proposition: {
    label: '命题',
    en: 'Proposition',
    border: 'border-purple-500/40 border-l-purple-500',
    bg: 'bg-purple-500/5',
    text: 'text-purple-600 dark:text-purple-400'
  },
  lemma: {
    label: '引理',
    en: 'Lemma',
    border: 'border-indigo-500/40 border-l-indigo-500',
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  definition: {
    label: '定义',
    en: 'Definition',
    border: 'border-emerald-500/40 border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  corollary: {
    label: '推论',
    en: 'Corollary',
    border: 'border-amber-500/40 border-l-amber-500',
    bg: 'bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400'
  },
  axiom: {
    label: '公理',
    en: 'Axiom',
    border: 'border-blue-500/40 border-l-blue-500',
    bg: 'bg-blue-500/5',
    text: 'text-blue-600 dark:text-blue-400'
  },
  proof: {
    label: '证明',
    en: 'Proof',
    border: 'border-zinc-400/40 border-l-zinc-500',
    bg: 'bg-zinc-500/5',
    text: 'text-zinc-600 dark:text-zinc-400'
  },
  example: {
    label: '例',
    en: 'Example',
    border: 'border-cyan-500/40 border-l-cyan-500',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-600 dark:text-cyan-400'
  },
  remark: {
    label: '注记',
    en: 'Remark',
    border: 'border-stone-500/40 border-l-stone-500',
    bg: 'bg-stone-500/5',
    text: 'text-stone-600 dark:text-stone-400'
  },
  conjecture: {
    label: '猜想',
    en: 'Conjecture',
    border: 'border-pink-500/40 border-l-pink-500',
    bg: 'bg-pink-500/5',
    text: 'text-pink-600 dark:text-pink-400'
  }
};
