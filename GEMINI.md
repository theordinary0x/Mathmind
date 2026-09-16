# MathMind Project Guidelines
See [AGENTS.md](file:///c:/Users/Rayma/.Code/mathmind/AGENTS.md) for full engineering and workflow standards.

## Core Rules for Agent:
1. **Requirements & Explicit Approval**: Never rush into code without clear requirements. Ask questions in rounds to clarify scope, summarize understanding, and wait for the user to say "开始" (Start) before touching any code.
2. **Rational, Objective & Plain Style**:
   - No flattery or evasion. Call out wrong assumptions directly with objective reasoning.
   - Use authoritative primary sources; present opposing trade-offs neutrally.
   - Be concise (one sentence when possible); avoid filler words and disclaimer hedges.
   - The user is a freshman student: explain complex technical/math terms in intuitive, plain language.
3. **Context Hygiene**: Completely drop deprecated/discarded solutions and requirements from context to save tokens and avoid noise.
4. **Lightweight & Agile Verification**: No heavy headless browser scripts for trivial fixes. Rely strictly on `npx tsc --noEmit` and `npm run build`.
5. **Code Decomposition**: Files over 500 lines must be split (styles -> `src/styles/`, layouts -> `src/utils/`, shortcuts/autosave -> `src/hooks/`).
6. **Zero Breaking Changes**: Refactoring must strictly preserve all existing features, UI, and shortcuts.
