import type { Actor, LegacyGameModule } from "../match/types";

/**
 * Standard chess. White moves first; `humanFirst` gives the human White.
 *
 * Board layout (state and view): a 64-character string in FEN order.
 * Index = row * 8 + col, row 0 is rank 8 (Black's back rank, the top from White's side),
 * col 0 is file a. So index 0 = a8, 7 = h8, 56 = a1, 63 = h1.
 * Uppercase "PNBRQK" are White, lowercase are Black, "." is empty.
 */
export type ChessColor = "w" | "b";

export interface ChessLastMove {
  from: number;
  to: number;
  uci: string;
  san: string;
}

export interface ChessResult {
  winner: ChessColor | "draw";
  /** "将死" | "逼和" | "五十步和棋" | "三次重复" | "子力不足" */
  text: string;
}

export interface ChessState {
  board: string;
  turn: ChessColor;
  /** Remaining castling rights, a subset of "KQkq" in that order ("" for none). */
  castling: string;
  /** En passant target square (the square the pawn skipped), or null. */
  ep: number | null;
  /** Plies since the last capture or pawn move (fifty-move rule at 100). */
  halfmove: number;
  /** Full-move number as in FEN: starts at 1, increases after Black moves. */
  fullmove: number;
  humanColor: ChessColor;
  plies: number;
  last?: ChessLastMove;
  /** Piece letters captured by each side: `w` holds black pieces White took, `b` the white pieces Black took. */
  captured: { w: string; b: string };
  /** Repetition keys of positions since the last capture or pawn move (current one last). */
  history: string[];
  result?: ChessResult;
}

export interface ChessView {
  /** 64 chars, see the layout note on ChessState. */
  board: string;
  turn: ChessColor;
  /** The viewer's colour. */
  you: ChessColor;
  humanColor: ChessColor;
  castling: string;
  ep: number | null;
  fen: string;
  plies: number;
  /** FEN full-move number. */
  moveNumber: number;
  halfmove: number;
  last?: ChessLastMove;
  /** The side to move is in check. */
  check: boolean;
  /** Square of the king in check, or null. */
  checkSquare: number | null;
  /** Legal moves of the side to move, as UCI strings ("e2e4", "e7e8q"). Empty when over. */
  legal: string[];
  captured: { w: string; b: string };
  /** Material on the board (P1 N3 B3 R5 Q9). */
  material: { w: number; b: number };
  result?: ChessResult;
}

// ---------------------------------------------------------------- core rules

const FILES = "abcdefgh";
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const chessSquareName = (sq: number) => `${FILES[sq & 7]}${8 - (sq >> 3)}`;
export function chessSquare(name: string): number | null {
  const m = /^([a-h])([1-8])$/i.exec(name.trim());
  return m ? (8 - Number(m[2])) * 8 + FILES.indexOf(m[1]!.toLowerCase()) : null;
}

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] as const;
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const;

const colorOfPiece = (p: string): ChessColor | null => (p === "." ? null : p < "a" ? "w" : "b");
const pc = (c: ChessColor, t: string) => (c === "w" ? t.toUpperCase() : t.toLowerCase());
const opp = (c: ChessColor): ChessColor => (c === "w" ? "b" : "w");

interface Pos {
  b: string[];
  turn: ChessColor;
  castling: string;
  ep: number | null;
}

/** flag: 1 double pawn push, 2 en passant, 4 castling. */
interface Mv {
  from: number;
  to: number;
  promo?: string;
  flag: number;
}

const uciOf = (m: Mv) => chessSquareName(m.from) + chessSquareName(m.to) + (m.promo ?? "");

/** True when square `sq` is attacked by any piece of colour `by`. */
function attacked(b: string[], sq: number, by: ChessColor): boolean {
  const r = sq >> 3;
  const f = sq & 7;
  const P = pc(by, "p");
  const pr = by === "w" ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    if (f > 0 && b[pr * 8 + f - 1] === P) return true;
    if (f < 7 && b[pr * 8 + f + 1] === P) return true;
  }
  const N = pc(by, "n");
  for (const [dr, df] of KNIGHT) {
    const rr = r + dr;
    const ff = f + df;
    if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === N) return true;
  }
  const K = pc(by, "k");
  for (const [dr, df] of KING) {
    const rr = r + dr;
    const ff = f + df;
    if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === K) return true;
  }
  const Q = pc(by, "q");
  const R = pc(by, "r");
  const B = pc(by, "b");
  for (const [dirs, S] of [[ORTH, R], [DIAG, B]] as const) {
    for (const [dr, df] of dirs) {
      let rr = r + dr;
      let ff = f + df;
      while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
        const p = b[rr * 8 + ff]!;
        if (p !== ".") {
          if (p === S || p === Q) return true;
          break;
        }
        rr += dr;
        ff += df;
      }
    }
  }
  return false;
}

const kingSq = (b: string[], c: ChessColor) => b.indexOf(pc(c, "k"));
const inCheck = (p: Pos) => {
  const k = kingSq(p.b, p.turn);
  return k >= 0 && attacked(p.b, k, opp(p.turn));
};

function pseudoMoves(p: Pos): Mv[] {
  const { b, turn } = p;
  const out: Mv[] = [];
  const enemy = opp(turn);
  const push = (from: number, to: number, flag = 0) => out.push({ from, to, flag });
  const pushPawn = (from: number, to: number, flag = 0) => {
    const tr = to >> 3;
    if (tr === 0 || tr === 7) for (const promo of ["q", "r", "b", "n"]) out.push({ from, to, promo, flag });
    else out.push({ from, to, flag });
  };
  for (let sq = 0; sq < 64; sq++) {
    const piece = b[sq]!;
    if (colorOfPiece(piece) !== turn) continue;
    const r = sq >> 3;
    const f = sq & 7;
    const t = piece.toLowerCase();
    if (t === "p") {
      const dir = turn === "w" ? -1 : 1;
      const r1 = r + dir;
      if (r1 < 0 || r1 > 7) continue;
      if (b[r1 * 8 + f] === ".") {
        pushPawn(sq, r1 * 8 + f);
        const startRow = turn === "w" ? 6 : 1;
        if (r === startRow && b[(r + 2 * dir) * 8 + f] === ".") push(sq, (r + 2 * dir) * 8 + f, 1);
      }
      for (const df of [-1, 1]) {
        const ff = f + df;
        if (ff < 0 || ff > 7) continue;
        const to = r1 * 8 + ff;
        if (colorOfPiece(b[to]!) === enemy) pushPawn(sq, to);
        else if (to === p.ep) push(sq, to, 2);
      }
    } else if (t === "n" || t === "k") {
      for (const [dr, df] of t === "n" ? KNIGHT : KING) {
        const rr = r + dr;
        const ff = f + df;
        if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
        const to = rr * 8 + ff;
        if (colorOfPiece(b[to]!) !== turn) push(sq, to);
      }
      if (t === "k") {
        const home = turn === "w" ? 60 : 4;
        if (sq === home && p.castling) {
          const [KS, QS] = turn === "w" ? ["K", "Q"] : ["k", "q"];
          const R = pc(turn, "r");
          if (p.castling.includes(KS) && b[home + 1] === "." && b[home + 2] === "." && b[home + 3] === R) {
            if (!attacked(b, home, enemy) && !attacked(b, home + 1, enemy) && !attacked(b, home + 2, enemy)) push(sq, home + 2, 4);
          }
          if (p.castling.includes(QS) && b[home - 1] === "." && b[home - 2] === "." && b[home - 3] === "." && b[home - 4] === R) {
            if (!attacked(b, home, enemy) && !attacked(b, home - 1, enemy) && !attacked(b, home - 2, enemy)) push(sq, home - 2, 4);
          }
        }
      }
    } else {
      const dirs = t === "r" ? ORTH : t === "b" ? DIAG : [...ORTH, ...DIAG];
      for (const [dr, df] of dirs) {
        let rr = r + dr;
        let ff = f + df;
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const to = rr * 8 + ff;
          const c = colorOfPiece(b[to]!);
          if (c === turn) break;
          push(sq, to);
          if (c) break;
          rr += dr;
          ff += df;
        }
      }
    }
  }
  return out;
}

function boardAfter(b: string[], m: Mv): string[] {
  const nb = b.slice();
  const piece = nb[m.from]!;
  const c = colorOfPiece(piece)!;
  nb[m.to] = m.promo ? pc(c, m.promo) : piece;
  nb[m.from] = ".";
  if (m.flag & 2) nb[(m.from & ~7) | (m.to & 7)] = ".";
  if (m.flag & 4) {
    const kingSide = m.to > m.from;
    const rookFrom = kingSide ? m.from + 3 : m.from - 4;
    const rookTo = kingSide ? m.from + 1 : m.from - 1;
    nb[rookTo] = nb[rookFrom]!;
    nb[rookFrom] = ".";
  }
  return nb;
}

/** Pseudo-legal move that leaves the mover's own king safe. */
function isSafe(p: Pos, m: Mv): boolean {
  const nb = boardAfter(p.b, m);
  const k = kingSq(nb, p.turn);
  return k < 0 || !attacked(nb, k, opp(p.turn));
}

function legalMoves(p: Pos): Mv[] {
  return pseudoMoves(p).filter((m) => isSafe(p, m));
}

function hasLegal(p: Pos): boolean {
  return pseudoMoves(p).some((m) => isSafe(p, m));
}

const CORNER_RIGHT: Record<number, string> = { 63: "K", 56: "Q", 7: "k", 0: "q" };

function play(p: Pos, m: Mv): Pos {
  const piece = p.b[m.from]!;
  let castling = p.castling;
  if (piece === "K") castling = castling.replace(/[KQ]/g, "");
  if (piece === "k") castling = castling.replace(/[kq]/g, "");
  for (const sq of [m.from, m.to]) if (CORNER_RIGHT[sq]) castling = castling.replace(CORNER_RIGHT[sq]!, "");
  return { b: boardAfter(p.b, m), turn: opp(p.turn), castling, ep: m.flag & 1 ? (m.from + m.to) >> 1 : null };
}

function sanBase(p: Pos, m: Mv, legal: Mv[]): string {
  if (m.flag & 4) return m.to > m.from ? "O-O" : "O-O-O";
  const piece = p.b[m.from]!;
  const t = piece.toUpperCase();
  const capture = p.b[m.to] !== "." || (m.flag & 2) !== 0;
  const dest = chessSquareName(m.to);
  if (t === "P") return (capture ? `${FILES[m.from & 7]}x` : "") + dest + (m.promo ? `=${m.promo.toUpperCase()}` : "");
  const rivals = legal.filter((o) => o.to === m.to && o.from !== m.from && p.b[o.from] === piece);
  let dis = "";
  if (rivals.length) {
    if (!rivals.some((o) => (o.from & 7) === (m.from & 7))) dis = FILES[m.from & 7]!;
    else if (!rivals.some((o) => o.from >> 3 === m.from >> 3)) dis = String(8 - (m.from >> 3));
    else dis = chessSquareName(m.from);
  }
  return t + dis + (capture ? "x" : "") + dest;
}

function sanOf(p: Pos, m: Mv, legal: Mv[]): string {
  const next = play(p, m);
  const suffix = inCheck(next) ? (hasLegal(next) ? "+" : "#") : "";
  return sanBase(p, m, legal) + suffix;
}

/** True when neither side can possibly mate. */
function insufficient(b: string[]): boolean {
  const minors: { t: string; sq: number }[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const t = b[sq]!.toLowerCase();
    if (t === "." || t === "k") continue;
    if (t !== "b" && t !== "n") return false;
    minors.push({ t, sq });
  }
  if (minors.length === 0) return true;
  if (minors.length === 1) return true;
  // Only bishops, all on squares of one colour.
  if (minors.every((m) => m.t === "b")) {
    const shade = (sq: number) => ((sq >> 3) + (sq & 7)) & 1;
    return minors.every((m) => shade(m.sq) === shade(minors[0]!.sq));
  }
  return false;
}

function material(b: string): { w: number; b: number } {
  const out = { w: 0, b: 0 };
  for (const p of b) if (p !== ".") out[colorOfPiece(p)!] += VALUE[p.toLowerCase()]!;
  return out;
}

const toPos = (s: ChessState): Pos => ({ b: s.board.split(""), turn: s.turn, castling: s.castling, ep: s.ep });

/** Position key for repetition: placement, side to move, castling, and the ep square only when a capture there is legal. */
function repKey(p: Pos, legal: Mv[]): string {
  const ep = p.ep !== null && legal.some((m) => m.flag & 2) ? chessSquareName(p.ep) : "-";
  return `${p.b.join("")} ${p.turn} ${p.castling || "-"} ${ep}`;
}

function fenOf(s: Pick<ChessState, "board" | "turn" | "castling" | "ep" | "halfmove" | "fullmove">): string {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let row = "";
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = s.board[r * 8 + f]!;
      if (p === ".") empty++;
      else {
        if (empty) row += empty;
        empty = 0;
        row += p;
      }
    }
    rows.push(row + (empty || ""));
  }
  return `${rows.join("/")} ${s.turn} ${s.castling || "-"} ${s.ep === null ? "-" : chessSquareName(s.ep)} ${s.halfmove} ${s.fullmove}`;
}

export const chessToFen = (s: ChessState) => fenOf(s);

/** Builds a game state from a FEN string (used by tests and for custom starts). */
export function chessFromFen(fen: string, humanColor: ChessColor = "w"): ChessState {
  const parts = fen.trim().split(/\s+/);
  const rows = (parts[0] ?? "").split("/");
  if (rows.length !== 8) throw new Error(`Bad FEN: ${fen}`);
  let board = "";
  for (const row of rows) {
    let line = "";
    for (const ch of row) line += /[1-8]/.test(ch) ? ".".repeat(Number(ch)) : /[pnbrqk]/i.test(ch) ? ch : "?";
    if (line.length !== 8 || line.includes("?")) throw new Error(`Bad FEN: ${fen}`);
    board += line;
  }
  const turn: ChessColor = parts[1] === "b" ? "b" : "w";
  const castling = (parts[2] ?? "-").replace(/[^KQkq]/g, "");
  const ep = parts[3] && parts[3] !== "-" ? chessSquare(parts[3]) : null;
  const s: ChessState = {
    board,
    turn,
    castling: ["K", "Q", "k", "q"].filter((c) => castling.includes(c)).join(""),
    ep,
    halfmove: Number(parts[4] ?? 0) || 0,
    fullmove: Number(parts[5] ?? 1) || 1,
    humanColor,
    plies: 0,
    captured: { w: "", b: "" },
    history: [],
  };
  const pos = toPos(s);
  const legal = legalMoves(pos);
  s.history = [repKey(pos, legal)];
  const result = resultOf(pos, legal, s.halfmove, s.history);
  if (result) s.result = result;
  return s;
}

function resultOf(p: Pos, legal: Mv[], halfmove: number, history: string[]): ChessResult | undefined {
  if (!legal.length) return inCheck(p) ? { winner: opp(p.turn), text: "将死" } : { winner: "draw", text: "逼和" };
  if (insufficient(p.b)) return { winner: "draw", text: "子力不足" };
  if (halfmove >= 100) return { winner: "draw", text: "五十步和棋" };
  const key = history[history.length - 1];
  if (history.filter((k) => k === key).length >= 3) return { winner: "draw", text: "三次重复" };
  return undefined;
}

/** Legal moves of the side to move, in UCI. */
export const chessLegalMoves = (s: ChessState): string[] => (s.result ? [] : legalMoves(toPos(s)).map(uciOf));

/** Counts leaf nodes to `depth` from a FEN (move-generator check). */
export function chessPerft(fen: string, depth: number): number {
  const walk = (p: Pos, d: number): number => {
    const moves = legalMoves(p);
    if (d === 1) return moves.length;
    let n = 0;
    for (const m of moves) n += walk(play(p, m), d - 1);
    return n;
  };
  return depth <= 0 ? 1 : walk(toPos(chessFromFen(fen)), depth);
}

// ---------------------------------------------------------------- move parsing

type Parsed = { ok: true; mv: Mv } | { ok: false; error: string };

function parseMove(p: Pos, legal: Mv[], raw: string): Parsed {
  const text = raw
    .trim()
    .replace(/\s*e\.?p\.?$/i, "")
    .replace(/[+#!?]+$/, "")
    .trim();
  const unknown: Parsed = { ok: false, error: `看不懂这步：${raw.trim()}` };
  if (!text) return unknown;

  // Castling in SAN.
  if (/^[o0]-?[o0](-?[o0])?$/i.test(text)) {
    const long = text.replace(/-/g, "").length === 3;
    const m = legal.find((x) => x.flag & 4 && (x.to > x.from) !== long);
    return m ? { ok: true, mv: m } : { ok: false, error: long ? "现在不能长易位" : "现在不能短易位" };
  }

  // UCI / long algebraic: e2e4, e7e8q, e2-e4, Ng1-f3, e7e8=Q.
  const u = /^([KQRBNP])?([a-h][1-8])[-x:]?([a-h][1-8])=?([QRBN])?$/i.exec(text);
  if (u) {
    const from = chessSquare(u[2]!)!;
    const to = chessSquare(u[3]!)!;
    const promo = u[4]?.toLowerCase();
    const piece = p.b[from]!;
    if (piece === ".") return { ok: false, error: `${u[2]!.toLowerCase()} 上没有棋子` };
    if (colorOfPiece(piece) !== p.turn) return { ok: false, error: "那不是你的棋子" };
    const cands = legal.filter((m) => m.from === from && m.to === to);
    if (!cands.length) return { ok: false, error: whyIllegal(p, from, to) };
    if (cands[0]!.promo) {
      const m = cands.find((x) => x.promo === (promo ?? "q"));
      return m ? { ok: true, mv: m } : { ok: false, error: "升变只能选 q、r、b、n" };
    }
    if (promo) return { ok: false, error: "这步不是升变，不用加升变棋子" };
    return { ok: true, mv: cands[0]! };
  }

  // Short algebraic: Nf3, exd5, Nbd7, R1e2, e8=Q, e8Q.
  const trySan = (s: string): Mv[] | null => {
    const m = /^([KQRBN])?([a-h])?([1-8])?[x:]?([a-h][1-8])=?([QRBNqrbn])?$/.exec(s);
    if (!m) return null;
    const t = m[1] ?? "P";
    const to = chessSquare(m[4]!)!;
    const promo = m[5]?.toLowerCase();
    return legal.filter((x) => {
      if (x.to !== to || p.b[x.from]!.toUpperCase() !== t) return false;
      if (m[2] && FILES[x.from & 7] !== m[2]) return false;
      if (m[3] && String(8 - (x.from >> 3)) !== m[3]) return false;
      if (x.promo) return x.promo === (promo ?? "q");
      return !promo;
    });
  };
  let found = trySan(text);
  // Lenient: lowercase piece letters ("nf3", "bb5", "kxe2").
  if ((!found || !found.length) && /^[kqrbn]/.test(text)) {
    const alt = trySan(text[0]!.toUpperCase() + text.slice(1));
    if (alt && (alt.length || !found)) found = alt;
  }
  if (!found) return unknown;
  if (found.length === 1) return { ok: true, mv: found[0]! };
  if (found.length > 1) return { ok: false, error: `有不止一枚棋子能这样走，请写清楚起点，如 ${uciOf(found[0]!)}` };
  return { ok: false, error: inCheck(p) ? `正被将军，这步不行：${raw.trim()}` : `这步不合规则：${raw.trim()}` };
}

function whyIllegal(p: Pos, from: number, to: number): string {
  const pseudo = pseudoMoves(p).find((m) => m.from === from && m.to === to);
  if (pseudo) return inCheck(p) ? "正被将军，这步解不了将" : "这步会让自己的王被将军";
  const piece = p.b[from]!.toLowerCase();
  if (piece === "k" && Math.abs(to - from) === 2 && from >> 3 === to >> 3) return "现在不能易位";
  if (colorOfPiece(p.b[to]!) === p.turn) return "不能吃自己的棋子";
  return inCheck(p) ? "正被将军，这步解不了将" : "这枚棋子不能这样走";
}

// ---------------------------------------------------------------- module

const colorOf = (s: ChessState, a: Actor): ChessColor => (a === "human" ? s.humanColor : opp(s.humanColor));
const actorOf = (s: ChessState, c: ChessColor): Actor => (c === s.humanColor ? "human" : "ai");
const colorWord = (c: ChessColor) => (c === "w" ? "White" : "Black");

function boardText(board: string): string {
  const files = "    a b c d e f g h";
  const rows = [files];
  for (let r = 0; r < 8; r++) rows.push(` ${8 - r}  ${board.slice(r * 8, r * 8 + 8).split("").join(" ")}  ${8 - r}`);
  rows.push(files);
  return rows.join("\n");
}

const REASON_EN: Record<string, string> = {
  将死: "checkmate",
  逼和: "stalemate (draw)",
  五十步和棋: "fifty-move rule (draw)",
  三次重复: "threefold repetition (draw)",
  子力不足: "insufficient material (draw)",
};

export const chess: LegacyGameModule<ChessState, ChessView> = {
  kind: "chess",
  name: { zh: "国际象棋", en: "Chess" },
  family: "棋",
  blurb: "经典西洋棋，将死对方的王。",
  ready: true,
  options: [],
  rules: [
    "Standard chess (FIDE rules). White moves first. Pieces move as usual: king one square any direction, queen any distance straight or diagonal, rook straight, bishop diagonal, knight in an L and may jump, pawns forward one (two from their starting rank) and capture diagonally forward.",
    "Castling: move the king two squares toward an unmoved rook (e1g1 / e1c1 for White, e8g8 / e8c8 for Black); the king and that rook must not have moved, the squares between them must be empty, and the king may not be in check, pass through an attacked square or land in check.",
    "En passant: a pawn that just advanced two squares may be captured by an enemy pawn beside it as if it had moved one, on the very next move only.",
    "Promotion: a pawn reaching the last rank becomes a queen, rook, bishop or knight (queen if you do not say).",
    "No move may leave your own king in check. Checkmate wins. Stalemate, 100 plies without a capture or pawn move (fifty-move rule), the same position occurring three times (threefold repetition) and insufficient mating material are draws and end the game automatically.",
    'Moves: UCI "from-square to-square" such as "e2e4", "g1f3", castling as the king move "e1g1", promotion with a suffix "e7e8q" (q/r/b/n). Standard algebraic (SAN) such as "Nf3", "exd5", "O-O", "e8=Q" is also accepted.',
  ].join("\n"),
  moveHelp: 'UCI like "e2e4", "e1g1" (castle), "e7e8q" (promote); SAN like "Nf3" also works',
  create({ humanFirst }) {
    return chessFromFen(START_FEN, humanFirst ? "w" : "b");
  },
  apply(s, actor, move) {
    if (s.result) return { ok: false, error: "对局已经结束" };
    if (colorOf(s, actor) !== s.turn) return { ok: false, error: "还没轮到你" };
    const pos = toPos(s);
    const legal = legalMoves(pos);
    const parsed = parseMove(pos, legal, move);
    if (!parsed.ok) return parsed;
    const m = parsed.mv;
    const san = sanOf(pos, m, legal);
    const captured = m.flag & 2 ? pc(opp(s.turn), "p") : pos.b[m.to] !== "." ? pos.b[m.to]! : "";
    const reset = captured !== "" || pos.b[m.from]!.toLowerCase() === "p";
    const next = play(pos, m);
    const nextLegal = legalMoves(next);
    const key = repKey(next, nextLegal);
    const history = reset ? [key] : [...s.history, key];
    const halfmove = reset ? 0 : s.halfmove + 1;
    const state: ChessState = {
      ...s,
      board: next.b.join(""),
      turn: next.turn,
      castling: next.castling,
      ep: next.ep,
      halfmove,
      fullmove: s.turn === "b" ? s.fullmove + 1 : s.fullmove,
      plies: s.plies + 1,
      last: { from: m.from, to: m.to, uci: uciOf(m), san },
      captured: captured ? { ...s.captured, [s.turn]: s.captured[s.turn] + captured } : s.captured,
      history,
    };
    const result = resultOf(next, nextLegal, halfmove, history);
    if (result) state.result = result;
    else delete state.result;
    return { ok: true, state, log: san };
  },
  waitingOn(s) {
    return s.result ? [] : [actorOf(s, s.turn)];
  },
  outcome(s) {
    if (!s.result) return null;
    return { winner: s.result.winner === "draw" ? "draw" : actorOf(s, s.result.winner), text: s.result.text };
  },
  seats(s) {
    return s.humanColor === "w" ? { human: "白方", ai: "黑方" } : { human: "黑方", ai: "白方" };
  },
  view(s, viewer) {
    const pos = toPos(s);
    const check = inCheck(pos);
    return {
      board: s.board,
      turn: s.turn,
      you: colorOf(s, viewer),
      humanColor: s.humanColor,
      castling: s.castling,
      ep: s.ep,
      fen: fenOf(s),
      plies: s.plies,
      moveNumber: s.fullmove,
      halfmove: s.halfmove,
      last: s.last,
      check,
      checkSquare: check ? kingSq(pos.b, s.turn) : null,
      legal: s.result ? [] : legalMoves(pos).map(uciOf),
      captured: s.captured,
      material: material(s.board),
      result: s.result,
    };
  },
  describe(s, names) {
    const ai = colorOf(s, "ai");
    const hu = opp(ai);
    const pos = toPos(s);
    const out = [
      `You play ${colorWord(ai)} (${ai === "w" ? "uppercase" : "lowercase"} letters). ${names.human} plays ${colorWord(hu)} (${hu === "w" ? "uppercase" : "lowercase"} letters).`,
    ];
    if (s.result) {
      const who = s.result.winner === "draw" ? "Draw" : `${s.result.winner === ai ? "You" : names.human} (${colorWord(s.result.winner)}) won`;
      out.push(`Game over: ${REASON_EN[s.result.text] ?? s.result.text}. ${who}.`);
    } else {
      out.push(
        `Move ${s.fullmove}, ${colorWord(s.turn)} to move: ${s.turn === ai ? "YOUR TURN." : `waiting for ${names.human}.`}`,
      );
    }
    if (s.last) out.push(`Last move: ${s.last.san} (${s.last.uci}) by ${s.turn === ai ? names.human : "you"}.`);
    if (inCheck(pos) && !s.result) out.push(s.turn === ai ? `CHECK: your king on ${chessSquareName(kingSq(pos.b, ai))} is in check. You must get out of check.` : `You are giving check.`);
    const mat = material(s.board);
    const diff = mat[ai] - mat[hu];
    const list = (x: string) => (x ? x.split("").join(" ") : "none");
    out.push(
      `Material: White ${mat.w}, Black ${mat.b} (${diff === 0 ? "even" : diff > 0 ? `you are up ${diff}` : `you are down ${-diff}`}). Captured by White: ${list(s.captured.w)}. Captured by Black: ${list(s.captured.b)}.`,
    );
    out.push(`Castling rights: ${s.castling || "none"}. Halfmove clock: ${s.halfmove}/100.`);
    out.push(`FEN: ${fenOf(s)}`);
    out.push("", boardText(s.board), "(White at the bottom. Uppercase = White, lowercase = Black, . = empty.)");
    if (!s.result && s.turn === ai) {
      const legal = legalMoves(pos);
      out.push("", `Your legal moves (${legal.length}), UCI with SAN in brackets:`, legal.map((m) => `${uciOf(m)} (${sanOf(pos, m, legal)})`).join(", "));
      out.push('Reply with one move, e.g. "e2e4"; promotions take a suffix like "e7e8q".');
    }
    return out.join("\n");
  },
};
