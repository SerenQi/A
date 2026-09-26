import type { Actor, GameModule } from "../match/types";

/** Reversi / Othello on 8x8. Black first. A player with no legal move passes automatically. */
export interface ReversiState {
  /** 0 empty, 1 black, 2 white. Index = row * 8 + col, row 0 is the top. */
  cells: number[];
  toPlay: 1 | 2;
  humanColor: 1 | 2;
  moves: number;
  last?: number;
  flipped: number[];
  /** Color that had to pass after the last move. */
  passed?: 1 | 2;
  over: boolean;
}

export interface ReversiView extends ReversiState {
  /** Legal points for the side to move, with how many discs each flips. */
  legal: Record<number, number>;
}

const N = 8;
const DIRS = [-9, -8, -7, -1, 1, 7, 8, 9];
export const reversiName = (p: number) => `${"abcdefgh"[p % N]}${Math.floor(p / N) + 1}`;
export function reversiPoint(s: string): number | null {
  const m = /^\s*([a-h])\s*([1-8])\s*$/i.exec(s);
  return m ? (Number(m[2]) - 1) * N + "abcdefgh".indexOf(m[1]!.toLowerCase()) : null;
}

function flipsFor(cells: number[], p: number, color: number): number[] {
  if (cells[p] !== 0) return [];
  const enemy = color === 1 ? 2 : 1;
  const out: number[] = [];
  for (const d of DIRS) {
    const run: number[] = [];
    let q = p;
    for (;;) {
      const col = q % N;
      q += d;
      if (q < 0 || q >= N * N) break;
      // Stop when stepping wrapped around a row edge.
      if (Math.abs((q % N) - col) > 1) break;
      if (cells[q] === enemy) run.push(q);
      else {
        if (cells[q] === color && run.length) out.push(...run);
        break;
      }
    }
  }
  return out;
}

export function reversiLegal(cells: number[], color: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (let p = 0; p < N * N; p++) {
    const f = flipsFor(cells, p, color);
    if (f.length) out[p] = f.length;
  }
  return out;
}

const colorOf = (s: ReversiState, a: Actor): 1 | 2 => (a === "human" ? s.humanColor : s.humanColor === 1 ? 2 : 1);
const actorOf = (s: ReversiState, c: 1 | 2): Actor => (c === s.humanColor ? "human" : "ai");
const count = (s: ReversiState, c: number) => s.cells.filter((x) => x === c).length;

export const reversi: GameModule<ReversiState, ReversiView> = {
  kind: "reversi",
  name: { zh: "黑白棋", en: "Reversi" },
  family: "棋",
  blurb: "夹住对方就翻面，最后子多者胜。",
  ready: true,
  options: [],
  rules:
    'Reversi (Othello) on 8x8. Black moves first. A move must outflank at least one opposing disc in a straight line; all outflanked discs flip. If a player has no legal move they pass automatically; when neither can move the game ends and the player with more discs wins. Moves: "d3" (columns a-h left to right, rows 1-8 top to bottom).',
  moveHelp: '"d3" (columns a-h, rows 1-8 from the top)',
  create({ humanFirst }) {
    const cells = Array(N * N).fill(0);
    cells[27] = 2;
    cells[28] = 1;
    cells[35] = 1;
    cells[36] = 2;
    return { cells, toPlay: 1, humanColor: humanFirst ? 1 : 2, moves: 0, flipped: [], over: false };
  },
  apply(s, actor, move) {
    if (s.over) return { ok: false, error: "对局已经结束" };
    const color = colorOf(s, actor);
    if (color !== s.toPlay) return { ok: false, error: "还没轮到你" };
    const p = reversiPoint(move);
    if (p === null) return { ok: false, error: `看不懂这步：${move}` };
    const flips = flipsFor(s.cells, p, color);
    if (!flips.length) return { ok: false, error: "这里不能下：要夹住对方的棋子" };
    const cells = s.cells.slice();
    cells[p] = color;
    for (const q of flips) cells[q] = color;
    const enemy = color === 1 ? 2 : 1;
    let toPlay: 1 | 2 = enemy;
    let passed: 1 | 2 | undefined;
    let over = false;
    if (!Object.keys(reversiLegal(cells, enemy)).length) {
      if (Object.keys(reversiLegal(cells, color)).length) {
        toPlay = color;
        passed = enemy;
      } else over = true;
    }
    return { ok: true, state: { ...s, cells, toPlay, passed, over, last: p, flipped: flips, moves: s.moves + 1 }, log: reversiName(p) };
  },
  waitingOn(s) {
    return s.over ? [] : [actorOf(s, s.toPlay)];
  },
  outcome(s) {
    if (!s.over) return null;
    const b = count(s, 1);
    const w = count(s, 2);
    const text = `黑 ${b} : 白 ${w}`;
    if (b === w) return { winner: "draw", text };
    return { winner: actorOf(s, b > w ? 1 : 2), text };
  },
  seats(s) {
    const h = s.humanColor === 1 ? "黑" : "白";
    return { human: h, ai: h === "黑" ? "白" : "黑" };
  },
  view(s) {
    return { ...s, legal: s.over ? {} : reversiLegal(s.cells, s.toPlay) };
  },
  describe(s, names) {
    const ai = colorOf(s, "ai");
    const sym = (c: number) => (c === 1 ? "X (black)" : "O (white)");
    const legal = s.over ? {} : reversiLegal(s.cells, s.toPlay);
    const out = [
      `You are ${sym(ai)}. ${names.human} is ${sym(ai === 1 ? 2 : 1)}. Discs: black ${count(s, 1)}, white ${count(s, 2)}.`,
    ];
    if (s.last !== undefined) out.push(`Last move: ${reversiName(s.last)} flipped ${s.flipped.length}.`);
    if (s.passed) out.push(`${s.passed === ai ? "You" : names.human} had no legal move and passed.`);
    if (!s.over && s.toPlay === ai) {
      out.push(
        `Your legal moves (discs flipped): ${Object.entries(legal)
          .map(([p, n]) => `${reversiName(Number(p))}(${n})`)
          .join(" ")}`,
      );
    }
    out.push("", "   a b c d e f g h");
    for (let r = 0; r < N; r++) {
      const row = Array.from({ length: N }, (_, c) => {
        const p = r * N + c;
        const v = s.cells[p];
        return v === 1 ? "X" : v === 2 ? "O" : !s.over && s.toPlay === ai && legal[p] ? "*" : ".";
      });
      out.push(`${r + 1}  ${row.join(" ")}`);
    }
    if (!s.over && s.toPlay === ai) out.push("(* marks your legal moves)");
    return out.join("\n");
  },
};
