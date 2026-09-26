import { COLUMNS, fromGtp, neighbors, toGtp } from "../coords";
import type { Actor, GameModule } from "../match/types";

/**
 * Gomoku (freestyle): 15x15, black first, five or more in a row wins.
 * This module is the reference example for writing new games.
 */
export interface GomokuState {
  size: number;
  /** 0 empty, 1 black, 2 white. Index = y * size + x, y = 0 is the top row. */
  cells: number[];
  toPlay: 1 | 2;
  humanColor: 1 | 2;
  moves: number;
  last?: number;
  winLine?: number[];
  full?: boolean;
}

const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

/** Stones in the longest line through `p` for `color`, if it reaches five. */
function fiveThrough(cells: number[], size: number, p: number, color: number): number[] | null {
  const x0 = p % size;
  const y0 = Math.floor(p / size);
  for (const [dx, dy] of DIRS) {
    const line = [p];
    for (const sgn of [1, -1]) {
      let x = x0 + dx * sgn;
      let y = y0 + dy * sgn;
      while (x >= 0 && y >= 0 && x < size && y < size && cells[y * size + x] === color) {
        line.push(y * size + x);
        x += dx * sgn;
        y += dy * sgn;
      }
    }
    if (line.length >= 5) return line.sort((a, b) => a - b);
  }
  return null;
}

const colorOf = (s: GomokuState, a: Actor): 1 | 2 => (a === "human" ? s.humanColor : s.humanColor === 1 ? 2 : 1);
const actorOf = (s: GomokuState, c: 1 | 2): Actor => (c === s.humanColor ? "human" : "ai");

export function gomokuBoardText(s: GomokuState): string {
  const cols = COLUMNS.slice(0, s.size).split("").join(" ");
  const rows = [`    ${cols}`];
  for (let y = 0; y < s.size; y++) {
    const n = String(s.size - y).padStart(2, " ");
    const cells = Array.from({ length: s.size }, (_, x) => {
      const c = s.cells[y * s.size + x];
      return c === 1 ? "X" : c === 2 ? "O" : ".";
    });
    rows.push(`${n}  ${cells.join(" ")}  ${n}`);
  }
  rows.push(`    ${cols}`);
  return rows.join("\n");
}

/** Empty points where `color` would complete five. */
function winningPoints(s: GomokuState, color: number): number[] {
  const out: number[] = [];
  const nb = neighbors(s.size);
  for (let p = 0; p < s.cells.length; p++) {
    if (s.cells[p] !== 0 || !nb[p]!.some((q) => s.cells[q] !== 0)) continue;
    const cells = s.cells.slice();
    cells[p] = color;
    if (fiveThrough(cells, s.size, p, color)) out.push(p);
  }
  return out;
}

export const gomoku: GameModule<GomokuState, GomokuState> = {
  kind: "gomoku",
  name: { zh: "五子棋", en: "Gomoku" },
  family: "棋",
  blurb: "横竖斜连成五子即胜。",
  ready: true,
  options: [],
  rules: 'Freestyle gomoku on a 15x15 board. Black moves first. Five or more stones in a row (horizontal, vertical or diagonal) wins. Full board is a draw. Moves: a coordinate like "H8" (columns A-P skip I, row 1 is the bottom).',
  moveHelp: '"H8" (columns A-P skip I, row 1 at the bottom)',
  create({ humanFirst }) {
    const size = 15;
    return { size, cells: Array(size * size).fill(0), toPlay: 1, humanColor: humanFirst ? 1 : 2, moves: 0 };
  },
  apply(s, actor, move) {
    if (s.winLine || s.full) return { ok: false, error: "对局已经结束" };
    if (colorOf(s, actor) !== s.toPlay) return { ok: false, error: "还没轮到你" };
    const p = fromGtp(move, s.size);
    if (p === null) return { ok: false, error: `看不懂这步：${move}` };
    if (s.cells[p] !== 0) return { ok: false, error: "这里已经有子了" };
    const cells = s.cells.slice();
    cells[p] = s.toPlay;
    const winLine = fiveThrough(cells, s.size, p, s.toPlay) ?? undefined;
    const full = !winLine && cells.every((c) => c !== 0);
    return {
      ok: true,
      state: { ...s, cells, last: p, moves: s.moves + 1, toPlay: s.toPlay === 1 ? 2 : 1, winLine, full: full || undefined },
      log: toGtp(p, s.size),
    };
  },
  waitingOn(s) {
    return s.winLine || s.full ? [] : [actorOf(s, s.toPlay)];
  },
  outcome(s) {
    if (s.winLine) {
      const winner = s.cells[s.winLine[0]!] as 1 | 2;
      return { winner: actorOf(s, winner), text: `${winner === 1 ? "黑" : "白"}连五` };
    }
    return s.full ? { winner: "draw", text: "棋盘下满" } : null;
  },
  seats(s) {
    const h = s.humanColor === 1 ? "黑" : "白";
    return { human: h, ai: h === "黑" ? "白" : "黑" };
  },
  view(s) {
    return s;
  },
  describe(s, names) {
    const ai = colorOf(s, "ai");
    const sym = (c: number) => (c === 1 ? "X (black)" : "O (white)");
    const out = [`You are ${sym(ai)}. ${names.human} is ${sym(ai === 1 ? 2 : 1)}. Moves so far: ${s.moves}.`];
    if (s.last !== undefined) out.push(`Last move: ${toGtp(s.last, s.size)}.`);
    if (!s.winLine && !s.full) {
      const mine = winningPoints(s, ai);
      const theirs = winningPoints(s, ai === 1 ? 2 : 1);
      if (mine.length) out.push(`You can win now at: ${mine.map((p) => toGtp(p, s.size)).join(" ")}.`);
      if (theirs.length) out.push(`Opponent threatens five at: ${theirs.map((p) => toGtp(p, s.size)).join(" ")}. Block it unless you can win.`);
    }
    out.push("", gomokuBoardText(s));
    return out.join("\n");
  },
};
