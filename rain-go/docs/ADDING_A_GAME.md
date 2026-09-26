# Adding a game

Every game is two pieces: a pure rules module in `packages/engine` and a React UI in `apps/web`.
The match layer, the Worker, the MCP tools and the page shell are shared and need no changes.
`gomoku` is the reference example for both pieces; `reversi` shows a square-cell board and a per-viewer view.

## 1. Rules module: `packages/engine/src/games/<kind>.ts`

Export `const <kind>: GameModule<State, View>` (contract in `packages/engine/src/match/types.ts`).

- **Pure and JSON-only.** `create` and `apply` return new plain objects (no classes, Maps, Sets, Dates or functions). `apply` never mutates its input.
- **Randomness.** `create` gets `ctx.seed`. Keep an RNG state number inside your state and advance it with `nextRandom`, `randomInt` or `shuffled` from `../match/rng`. Never call `Math.random`.
- **Seats.** `ctx.humanFirst` means the human takes the first seat (black in go, white in chess, red in xiangqi, first to act in cards and dice). `seats()` returns short Chinese labels such as `{ human: "红方", ai: "黑方" }`.
- **Moves are strings.** The human UI and the AI both send the same syntax. Parse leniently (trim, case-insensitive). `apply` errors are short Chinese sentences; they are shown to the human as toasts and to the AI verbatim.
- **Turn order.** `waitingOn` returns who must act now (`[]` when over). `outcome` returns `{ winner, text }` with a short Chinese detail such as `"将死"` or `"剩 5 张"`. Resigning is handled by the match layer; do not implement it.
- **Hidden information.** `view(state, viewer)` must remove everything that viewer may not see: the opponent's hand, the deck order, the RNG state. The Worker sends `view(state, "human")` to the browser and `describe` is the AI's only view, so `describe` must not leak the human's cards either.
- **AI text.** `describe` is English plain text: the board or table, the AI's own cards, whose turn, and — whenever it is the AI's turn — the list of legal moves (or a compact summary when there are many). Being explicit here makes the AI play better.
- **Metadata.** `name`, `family` (`棋` / `牌` / `骰`), a one-line Chinese `blurb`, `rules` (full English rules and move syntax), `moveHelp` (one line), at most one entry in `options`, and `ready: true`.
- **Exports.** The engine index already re-exports your file. Prefix every exported type or helper with the game name (`ChessState`, `pokerHandRank`) so names never collide across games.

Tests go in `packages/engine/test/<kind>.test.ts`. Drive games through `createMatch` and `applyMatchAction` like `test/match.test.ts` does, and cover every special rule, illegal moves, the end of the game, and that `view` and `describe` hide what they should.

## 2. UI: `apps/web/src/games/<kind>/index.tsx`

Export `const <kind>UI: GameUI<View>` (contract in `apps/web/src/games/types.ts`).

- `shape: "square"` gives your `Board` a square glass box; `"fill"` gives a flexible box. Either way the Board must fill it (`h-full w-full`) and never overflow: on phones the whole page is one screen with no scrolling.
- `Board` gets `{ match, view, canAct, send, toast, compact }`. Call `send(move)` with the module's move syntax; it resolves `false` and toasts on error. Only allow input when `canAct` is true.
- `Actions` (optional) renders buttons for the action row under the board: `<button className="btn btn-glass flex-1">`. It cannot share React state with `Board`, so games whose controls depend on a selection (cards, raise amounts) put their controls inside `Board` instead.
- `status`, `badge`, `stats` (optional) customise the header line, the number on the right of the black pill, and the desktop stats card.
- For SVG boards use `usePlacement` from `hooks/usePlacement` for tap handling (mouse: hover then click; touch: tap to preview, tap again to confirm) and the drop pieces from `components/drops` (`<DropDefs />`, `<Bead />`, `<LastMark />`).

### Look

Monochrome glass, serif type, water-drop pieces. Match the existing boards.

- Colors: ink `#0b0b0b`, milk white, greys from `text-muted` / `text-faint`; the only accent is `var(--color-accent)` (`#a8433f`), used sparingly (red suits, 红方 characters, winning line, last-move highlights).
- Surfaces: `glass` cards, board background `rgb(255 255 255 / 0.26)` with a `rgb(255 255 255 / 0.6)` edge, grid lines `rgb(20 20 20 / 0.42)`.
- Pieces: glossy discs from `components/drops` (ink for dark, milk for light) with the `drop-shadow` filter. Glyph pieces (chess, xiangqi) sit on or inside such discs. Cards are small white glass rectangles with a serif rank and suit.
- Controls: `btn btn-ink` for the main action, `btn btn-glass` otherwise, `seg` for segmented choices, `chip` for small labels. Chinese labels.
- Motion: reuse `drop-in`, `ripple`, `evaporate`, `drop-atari` from `styles.css`. Do not add new global CSS; use Tailwind classes or inline styles in your files.

## 3. Checks

```bash
pnpm --filter @rain-go/engine exec vitest run test/<kind>.test.ts
pnpm --filter @rain-go/engine typecheck
pnpm --filter @rain-go/web typecheck
```

Try it in the browser without a server: `pnpm --filter @rain-go/web exec vite --port <port> --strictPort`, then open `/sandbox/<kind>`.
The sandbox plays both sides on one screen ("扮演" switches sides), and "AI 视角" shows exactly what `describe` sends the AI.
Check phone sizes 375×548 and 390×664 and desktop 1280×900: the page must not scroll on phones (`document.documentElement.scrollHeight <= innerHeight`) and nothing may be cut off.
