import { randomInt } from "../match/rng";
import type { Actor, LegacyGameModule } from "../match/types";
import {
  AEROPLANE_CENTRE,
  AEROPLANE_ENTRY,
  AEROPLANE_FLY_FROM,
  AEROPLANE_FLY_TO,
  AEROPLANE_HANGAR,
  AEROPLANE_LOOP,
  aeroplaneGlobal,
} from "./aeroplane-board";

export * from "./aeroplane-board";

/**
 * 飞行棋 (Aeroplane Chess), two players on opposite colours, four planes each.
 * Board geometry and the square numbering are documented in ./aeroplane-board.ts.
 *
 * Seats: seat 0 is 先手 (moves first, ink, colour 0, bottom-left hangar); seat 1 is 后手 (milk,
 * colour 2, top-right hangar). Planes are numbered 1..4 per seat and keep their number.
 * A turn: `roll`, then (if any plane can use it) `move N` or `launch N`. A 6 earns another roll;
 * the plane moved on a third 6 in a row goes back to its hangar and the turn ends.
 */
export type AeroplaneSeat = 0 | 1;

export type AeroplaneEvent =
  | { k: "roll"; seat: AeroplaneSeat; value: number }
  | { k: "launch"; seat: AeroplaneSeat; plane: number }
  | { k: "move"; seat: AeroplaneSeat; plane: number; from: number; to: number; bounce: boolean }
  | { k: "jump"; seat: AeroplaneSeat; plane: number; to: number }
  | { k: "fly"; seat: AeroplaneSeat; plane: number; to: number }
  | { k: "capture"; seat: AeroplaneSeat; plane: number; victims: number[] }
  | { k: "sentBack"; seat: AeroplaneSeat; plane: number }
  | { k: "pass"; seat: AeroplaneSeat; again: boolean };

export interface AeroplaneState {
  /** RNG state for the die. Never shown to anyone. */
  rng: number;
  /** Rolls that let a plane leave the hangar: [6] or [5, 6]. */
  takeoff: number[];
  humanSeat: AeroplaneSeat;
  toMove: AeroplaneSeat;
  phase: "roll" | "choose" | "over";
  /** Progress of planes 1..4 for each seat (see aeroplane-board.ts). */
  planes: [number[], number[]];
  /** The latest roll (the one to use while phase is "choose") and who rolled it. */
  roll: number | null;
  rollBy: AeroplaneSeat | null;
  /** Consecutive 6s rolled in the current turn. */
  sixes: number;
  turn: number;
  /** What happened in the current turn, and in the turn before it. */
  events: AeroplaneEvent[];
  prev: { seat: AeroplaneSeat; events: AeroplaneEvent[] } | null;
  last: { seat: AeroplaneSeat; plane: number } | null;
  winner: AeroplaneSeat | null;
}

export type AeroplaneWhere = "hangar" | "start" | "loop" | "column" | "done";

export interface AeroplanePlaneView {
  n: number;
  progress: number;
  where: AeroplaneWhere;
  /** Loop square number 1..52 when on the loop. */
  square: number | null;
  /** Home column step 1..6 when in the home column. */
  step: number | null;
  /** Steps left to the centre once out of the hangar (not counting jumps). */
  toGo: number | null;
}

export interface AeroplaneChoice {
  /** The move string to send, e.g. "move 2" or "launch 3". */
  move: string;
  plane: number;
  kind: "launch" | "move";
  from: number;
  /** Where the die takes the plane (after any bounce), before jump or fly. */
  land: number;
  jump: number | null;
  fly: number | null;
  /** Final progress (-1 when a third 6 sends it back to the hangar). */
  to: number;
  /** Opponent plane numbers sent back to their hangar. */
  captures: number[];
  bounce: boolean;
  home: boolean;
  sentBack: boolean;
}

export interface AeroplanePlayerView {
  seat: AeroplaneSeat;
  colour: number;
  planes: AeroplanePlaneView[];
  home: number;
}

export interface AeroplaneView extends Omit<AeroplaneState, "rng"> {
  /** The viewer's seat. */
  you: AeroplaneSeat;
  players: [AeroplanePlayerView, AeroplanePlayerView];
  /** Legal choices for the player to move (empty unless phase is "choose"). */
  choices: AeroplaneChoice[];
}

export const aeroplaneColour = (seat: AeroplaneSeat) => (seat === 0 ? 0 : 2);
const other = (s: AeroplaneSeat): AeroplaneSeat => (s === 0 ? 1 : 0);
const seatOf = (s: AeroplaneState, a: Actor): AeroplaneSeat => (a === "human" ? s.humanSeat : other(s.humanSeat));
const actorOf = (s: AeroplaneState, seat: AeroplaneSeat): Actor => (seat === s.humanSeat ? "human" : "ai");
const homeCount = (planes: number[]) => planes.filter((p) => p === AEROPLANE_CENTRE).length;

export function aeroplaneWhere(p: number): AeroplaneWhere {
  if (p < 0) return "hangar";
  if (p === 0) return "start";
  if (p <= AEROPLANE_LOOP) return "loop";
  return p < AEROPLANE_CENTRE ? "column" : "done";
}

/** Loop square number 1..52 for a seat's progress, or null off the loop. */
export const aeroplaneSquare = (seat: AeroplaneSeat, p: number) =>
  p >= 1 && p <= AEROPLANE_LOOP ? aeroplaneGlobal(aeroplaneColour(seat), p) + 1 : null;

/** Short Chinese name of a position, from the mover's side. */
export function aeroplanePlaceZh(seat: AeroplaneSeat, p: number): string {
  const w = aeroplaneWhere(p);
  if (w === "hangar") return "机场";
  if (w === "start") return "起飞点";
  if (w === "loop") return String(aeroplaneSquare(seat, p));
  if (w === "column") return `跑道第 ${p - AEROPLANE_LOOP} 格`;
  return "终点";
}

function placeEn(seat: AeroplaneSeat, p: number): string {
  const w = aeroplaneWhere(p);
  if (w === "hangar") return "the hangar";
  if (w === "start") return "the take-off square";
  if (w === "loop") return `square ${aeroplaneSquare(seat, p)}`;
  if (w === "column") return `home column step ${p - AEROPLANE_LOOP}`;
  return "the centre (home)";
}

const isOwnColour = (p: number) => p >= 1 && p <= AEROPLANE_LOOP && p % 4 === 0;

/** What using `roll` on plane n would do, or an error message. */
function plan(s: AeroplaneState, seat: AeroplaneSeat, n: number, roll: number): AeroplaneChoice | string {
  const from = s.planes[seat][n - 1];
  if (from === undefined) return "飞机编号是 1 到 4";
  if (from === AEROPLANE_CENTRE) return `${n} 号飞机已经到家了`;
  const sentBack = roll === 6 && s.sixes >= 3;
  if (from === AEROPLANE_HANGAR) {
    if (!s.takeoff.includes(roll)) return s.takeoff.length > 1 ? "要掷到 5 或 6 才能起飞" : "要掷到 6 才能起飞";
    return { move: `launch ${n}`, plane: n, kind: "launch", from, land: 0, jump: null, fly: null, to: sentBack ? AEROPLANE_HANGAR : 0, captures: [], bounce: false, home: false, sentBack };
  }
  let land = from + roll;
  const bounce = land > AEROPLANE_CENTRE;
  if (bounce) land = 2 * AEROPLANE_CENTRE - land;
  let to = land;
  let jump: number | null = null;
  let fly: number | null = null;
  if (isOwnColour(land) && land !== AEROPLANE_ENTRY) {
    if (land === AEROPLANE_FLY_FROM) fly = AEROPLANE_FLY_TO;
    else {
      jump = land + 4;
      if (jump === AEROPLANE_FLY_FROM) fly = AEROPLANE_FLY_TO;
    }
    to = fly ?? jump ?? land;
  }
  let captures: number[] = [];
  if (sentBack) {
    to = AEROPLANE_HANGAR;
    jump = null;
    fly = null;
  } else if (to >= 1 && to <= AEROPLANE_LOOP) {
    const g = aeroplaneGlobal(aeroplaneColour(seat), to);
    const opp = other(seat);
    captures = s.planes[opp].flatMap((q, i) => (q >= 1 && q <= AEROPLANE_LOOP && aeroplaneGlobal(aeroplaneColour(opp), q) === g ? [i + 1] : []));
  }
  return { move: `move ${n}`, plane: n, kind: "move", from, land, jump, fly, to, captures, bounce, home: to === AEROPLANE_CENTRE, sentBack };
}

/** Legal choices for the side to move with its current roll. */
export function aeroplaneChoices(s: AeroplaneState): AeroplaneChoice[] {
  if (s.phase !== "choose" || s.roll === null) return [];
  const out: AeroplaneChoice[] = [];
  for (let n = 1; n <= 4; n++) {
    const c = plan(s, s.toMove, n, s.roll);
    if (typeof c !== "string") out.push(c);
  }
  return out;
}

function endTurn(s: AeroplaneState): AeroplaneState {
  return { ...s, prev: { seat: s.toMove, events: s.events }, events: [], toMove: other(s.toMove), phase: "roll", sixes: 0, turn: s.turn + 1 };
}

/** One Chinese clause for an event, from the mover's side ("撞回对手 1 号"). */
export function aeroplaneEventZh(e: AeroplaneEvent): string {
  switch (e.k) {
    case "roll":
      return `掷出 ${e.value}`;
    case "launch":
      return `${e.plane} 号飞机起飞`;
    case "move":
      if (e.to === AEROPLANE_CENTRE) return `${e.plane} 号飞机到家`;
      if (e.bounce) return `${e.plane} 号飞机到终点反弹，退到${aeroplanePlaceZh(e.seat, e.to)}`;
      if (e.to > AEROPLANE_LOOP) return `${e.plane} 号飞机进入${aeroplanePlaceZh(e.seat, e.to)}`;
      return `${e.plane} 号飞机前进到 ${aeroplanePlaceZh(e.seat, e.to)}`;
    case "jump":
      return `跳到 ${aeroplanePlaceZh(e.seat, e.to)}`;
    case "fly":
      return `飞到 ${aeroplanePlaceZh(e.seat, e.to)}`;
    case "capture":
      return `撞回对手 ${e.victims.join("、")} 号`;
    case "sentBack":
      return `连掷三个 6，${e.plane} 号飞机退回机场`;
    case "pass":
      return e.again ? "没有飞机能动，再掷一次" : "没有飞机能动，轮到对手";
  }
}

function eventEn(e: AeroplaneEvent, who: string): string {
  switch (e.k) {
    case "roll":
      return `${who} rolled ${e.value}`;
    case "launch":
      return `${who} launched plane ${e.plane} to the take-off square`;
    case "move":
      if (e.to === AEROPLANE_CENTRE) return `plane ${e.plane} reached home`;
      return `plane ${e.plane} moved to ${placeEn(e.seat, e.to)}${e.bounce ? " (bounced back from the centre)" : ""}`;
    case "jump":
      return `jumped to ${placeEn(e.seat, e.to)}`;
    case "fly":
      return `flew the shortcut to ${placeEn(e.seat, e.to)}`;
    case "capture":
      return `captured opponent plane${e.victims.length > 1 ? "s" : ""} ${e.victims.join(", ")} (sent to hangar)`;
    case "sentBack":
      return `third 6 in a row: plane ${e.plane} went back to the hangar`;
    case "pass":
      return e.again ? "no plane could move; rolls again" : "no plane could move; turn passed";
  }
}

function parse(move: string): { k: "roll" } | { k: "move" | "launch" | "any"; n: number | null } | null {
  const m = move.trim().toLowerCase().replace(/\s+/g, " ");
  if (/^(roll|r|掷|掷骰|掷骰子|投骰子|摇骰子)$/.test(m)) return { k: "roll" };
  const r = /^(move|m|go|走|前进|launch|l|takeoff|take off|起飞|飞)?\s*(?:plane\s*)?([1-4])?\s*(?:号)?(?:飞机)?$/.exec(m);
  if (!r || (!r[1] && !r[2])) return null;
  const word = r[1] ?? "";
  const k = ["move", "m", "go", "走", "前进"].includes(word) ? "move" : word ? "launch" : "any";
  return { k, n: r[2] ? Number(r[2]) : null };
}

function doRoll(s: AeroplaneState): { state: AeroplaneState; log: string } {
  const [r, rng] = randomInt(s.rng, 6);
  const value = r + 1;
  const seat = s.toMove;
  const sixes = value === 6 ? s.sixes + 1 : 0;
  let next: AeroplaneState = { ...s, rng, roll: value, rollBy: seat, sixes, phase: "choose", events: [...s.events, { k: "roll", seat, value }] };
  if (aeroplaneChoices(next).length) return { state: next, log: `掷出 ${value}${sixes === 3 ? "（第三个 6）" : ""}` };
  const again = value === 6 && sixes < 3;
  next = { ...next, phase: "roll", events: [...next.events, { k: "pass", seat, again }] };
  if (!again) next = endTurn(next);
  return { state: next, log: `掷出 ${value}，${again ? "没有飞机能动，再掷一次" : "没有飞机能动，轮到对手"}` };
}

function doMove(s: AeroplaneState, c: AeroplaneChoice): { state: AeroplaneState; log: string } {
  const seat = s.toMove;
  const opp = other(seat);
  const planes: [number[], number[]] = [s.planes[0].slice(), s.planes[1].slice()];
  const ev: AeroplaneEvent[] = [];
  if (c.sentBack) {
    ev.push({ k: "sentBack", seat, plane: c.plane });
  } else if (c.kind === "launch") {
    ev.push({ k: "launch", seat, plane: c.plane });
  } else {
    ev.push({ k: "move", seat, plane: c.plane, from: c.from, to: c.land, bounce: c.bounce });
    if (c.jump !== null) ev.push({ k: "jump", seat, plane: c.plane, to: c.jump });
    if (c.fly !== null) ev.push({ k: "fly", seat, plane: c.plane, to: c.fly });
    if (c.captures.length) ev.push({ k: "capture", seat, plane: c.plane, victims: c.captures });
  }
  planes[seat][c.plane - 1] = c.to;
  for (const v of c.captures) planes[opp][v - 1] = AEROPLANE_HANGAR;
  const log = [`掷出 ${s.roll}`, ...ev.map(aeroplaneEventZh)].join("，");
  let next: AeroplaneState = { ...s, planes, events: [...s.events, ...ev], last: { seat, plane: c.plane } };
  if (homeCount(planes[seat]) === 4) return { state: { ...next, phase: "over", winner: seat }, log: `${log}，四架全部到家` };
  if (c.sentBack || s.roll !== 6) next = endTurn(next);
  else next = { ...next, phase: "roll" };
  return { state: next, log: s.roll === 6 && !c.sentBack ? `${log}，再掷一次` : log };
}

function planeView(seat: AeroplaneSeat, p: number, i: number): AeroplanePlaneView {
  const where = aeroplaneWhere(p);
  return {
    n: i + 1,
    progress: p,
    where,
    square: aeroplaneSquare(seat, p),
    step: where === "column" ? p - AEROPLANE_LOOP : null,
    toGo: p < 0 ? null : AEROPLANE_CENTRE - p,
  };
}

function planeEn(seat: AeroplaneSeat, pv: AeroplanePlaneView): string {
  switch (pv.where) {
    case "hangar":
      return "in the hangar";
    case "start":
      return `on the take-off square (${pv.toGo} steps to home)`;
    case "loop":
      return `on square ${pv.square} (own step ${pv.progress}, ${pv.toGo} steps to home${isOwnColour(pv.progress) ? ", own-colour square" : ""})`;
    case "column":
      return `in the home column, step ${pv.step} of 6 (${pv.toGo} to the centre, exact roll needed)`;
    case "done":
      return "home";
  }
}

function choiceEn(seat: AeroplaneSeat, c: AeroplaneChoice): string {
  if (c.sentBack) return `${c.move} → third 6 in a row: plane ${c.plane} goes back to the hangar and your turn ends`;
  if (c.kind === "launch") return `${c.move} → takes off to your take-off square`;
  const parts: string[] = [];
  if (c.home) parts.push("reaches home");
  else parts.push(`${c.bounce ? "bounces back to" : "lands on"} ${placeEn(seat, c.land)}`);
  if (c.jump !== null) parts.push(`jumps to ${placeEn(seat, c.jump)}`);
  if (c.fly !== null) parts.push(`flies to ${placeEn(seat, c.fly)}`);
  if (c.captures.length) parts.push(`captures opponent plane${c.captures.length > 1 ? "s" : ""} ${c.captures.join(", ")}`);
  return `${c.move} → ${parts.join(", ")}`;
}

/** Opponent planes that are 1..12 loop squares behind each of `seat`'s loop planes (and could reach them). */
function threats(s: AeroplaneState, seat: AeroplaneSeat): string[] {
  const opp = other(seat);
  const out: string[] = [];
  s.planes[seat].forEach((p, i) => {
    if (p < 1 || p > AEROPLANE_LOOP) return;
    const g = aeroplaneGlobal(aeroplaneColour(seat), p);
    const near: string[] = [];
    s.planes[opp].forEach((q, j) => {
      if (q < 0 || q > AEROPLANE_LOOP) return;
      const gq = q === 0 ? aeroplaneGlobal(aeroplaneColour(opp), 1) - 1 : aeroplaneGlobal(aeroplaneColour(opp), q);
      const d = (((g - gq) % AEROPLANE_LOOP) + AEROPLANE_LOOP) % AEROPLANE_LOOP;
      if (d >= 1 && d <= 12 && q + d <= AEROPLANE_ENTRY) near.push(`opponent plane ${j + 1} is ${d} behind`);
    });
    if (near.length) out.push(`your plane ${i + 1}: ${near.join(", ")}`);
  });
  return out;
}

const RULES = [
  "Aeroplane Chess (飞行棋), two players, 4 planes each, one six-sided die.",
  "Board: a 52-square loop numbered 1-52 clockwise. Squares cycle through four colours, so every 4th square has your colour. Each player has a hangar, a take-off square next to it, and a 6-step home column that branches off the loop at the player's own entrance square and leads to the centre.",
  "Progress: a plane on the take-off square is at step 0; your loop squares are your steps 1-52 (step 52 is your entrance square); the home column is steps 53-58; the centre (home) is step 59. Your own-colour loop squares are your steps 4, 8, ..., 52.",
  "Turn: \"roll\" the die, then pick a plane with \"move N\" (a plane already out) or \"launch N\" (take a plane out of the hangar); planes are numbered 1-4. If no plane can use the roll the turn passes automatically.",
  "Take-off: a plane leaves the hangar only on a 6 (or on a 5 or 6 if the game uses that option); launching puts it on the take-off square and uses the roll.",
  "Sixes: a 6 gives another roll after moving. On the third 6 in a row, the plane you pick goes straight back to its hangar and the turn ends.",
  "Jump (跳子): ending a move on a loop square of your own colour jumps 4 more steps to the next own-colour square (not from your entrance square, step 52).",
  "Fly (飞棋): landing on your fly square (your step 20) flies along the dashed shortcut to your step 32. A jump that lands on step 20 then flies; a fly never jumps again. At most one jump and one fly per move. No jumps or flies in the home column.",
  "Capture (撞子): if your plane finishes its move on a loop square with opponent planes, all of them go back to their hangar. Your own planes may share squares; nothing blocks.",
  "Home: reaching the centre needs the exact number; extra steps bounce back from the centre. First to bring all 4 planes home wins.",
  'Moves: "roll", "move 2", "launch 3" (also 掷骰, 走 2, 起飞 3).',
].join("\n");

export const aeroplane: LegacyGameModule<AeroplaneState, AeroplaneView> = {
  kind: "aeroplane",
  name: { zh: "飞行棋", en: "Aeroplane Chess" },
  family: "骰",
  blurb: "掷骰子起飞，四架飞机先回家者胜。",
  ready: true,
  options: [
    {
      key: "takeoff",
      label: "起飞",
      choices: [
        { value: "6", label: "掷 6 起飞" },
        { value: "56", label: "掷 5 或 6 起飞" },
      ],
      default: "6",
    },
  ],
  rules: RULES,
  moveHelp: '"roll", then "move N" or "launch N" (N = plane 1-4)',
  create({ seed, humanFirst, options }) {
    return {
      rng: seed >>> 0,
      takeoff: options.takeoff === "56" ? [5, 6] : [6],
      humanSeat: humanFirst ? 0 : 1,
      toMove: 0,
      phase: "roll",
      planes: [
        [-1, -1, -1, -1],
        [-1, -1, -1, -1],
      ],
      roll: null,
      rollBy: null,
      sixes: 0,
      turn: 1,
      events: [],
      prev: null,
      last: null,
      winner: null,
    };
  },
  apply(s, actor, move) {
    if (s.phase === "over") return { ok: false, error: "对局已经结束" };
    if (seatOf(s, actor) !== s.toMove) return { ok: false, error: "还没轮到你" };
    const m = parse(move);
    if (!m) return { ok: false, error: `看不懂这步：${move}` };
    if (m.k === "roll") {
      if (s.phase !== "roll") return { ok: false, error: `已经掷出 ${s.roll}，先选一架飞机` };
      const r = doRoll(s);
      return { ok: true, state: r.state, log: r.log };
    }
    if (s.phase !== "choose" || s.roll === null) return { ok: false, error: "先掷骰子" };
    const choices = aeroplaneChoices(s);
    let n = m.n;
    if (n === null) {
      const pool = choices.filter((c) => m.k === "any" || c.kind === m.k);
      if (pool.length === 1) n = pool[0]!.plane;
      else return { ok: false, error: m.k === "launch" && !pool.length ? "现在没有飞机能起飞" : "要说是几号飞机" };
    }
    const c = plan(s, s.toMove, n, s.roll);
    if (typeof c === "string") return { ok: false, error: c };
    if (m.k === "move" && c.kind === "launch") return { ok: false, error: `${n} 号飞机还在机场，用「起飞 ${n}」` };
    if (m.k === "launch" && c.kind === "move") return { ok: false, error: `${n} 号飞机已经起飞了` };
    const r = doMove(s, c);
    return { ok: true, state: r.state, log: r.log };
  },
  waitingOn(s) {
    return s.phase === "over" ? [] : [actorOf(s, s.toMove)];
  },
  outcome(s) {
    if (s.winner === null) return null;
    const theirs = homeCount(s.planes[other(s.winner)]);
    return { winner: actorOf(s, s.winner), text: `4 架全部到家 · 对手到家 ${theirs} 架` };
  },
  seats(s) {
    return s.humanSeat === 0 ? { human: "先手", ai: "后手" } : { human: "后手", ai: "先手" };
  },
  view(s, viewer) {
    const { rng: _rng, ...pub } = s;
    const player = (seat: AeroplaneSeat): AeroplanePlayerView => ({
      seat,
      colour: aeroplaneColour(seat),
      planes: s.planes[seat].map((p, i) => planeView(seat, p, i)),
      home: homeCount(s.planes[seat]),
    });
    return { ...pub, you: seatOf(s, viewer), players: [player(0), player(1)], choices: aeroplaneChoices(s) };
  },
  describe(s, names) {
    const ai = seatOf(s, "ai");
    const hu = other(ai);
    const colourName = (seat: AeroplaneSeat) =>
      seat === 0
        ? "Ink (dark, moves first; loop squares 1 → 52, own-colour squares 4, 8, ..., 52, fly square 20 → 32)"
        : "Milk (light, moves second; loop squares 27 → 52 → 26, own-colour squares 30, 34, ..., 26, fly square 46 → 6)";
    const who = (seat: AeroplaneSeat) => (seat === ai ? "you" : names.human);
    const out = [`You are ${colourName(ai)}. ${names.human} is ${colourName(hu)}. Take-off roll: ${s.takeoff.join(" or ")}.`];
    for (const seat of [ai, hu]) {
      out.push("", `${seat === ai ? "Your" : `${names.human}'s`} planes (${homeCount(s.planes[seat])}/4 home):`);
      s.planes[seat].forEach((p, i) => out.push(`  plane ${i + 1}: ${planeEn(seat, planeView(seat, p, i))}`));
    }
    out.push("");
    if (s.roll !== null && s.rollBy !== null) out.push(`Last roll: ${s.roll} (by ${who(s.rollBy)}).`);
    else out.push("No roll yet.");
    if (s.prev?.events.length) out.push(`Previous turn (${who(s.prev.seat)}): ${s.prev.events.map((e) => eventEn(e, who(e.seat))).join("; ")}.`);
    if (s.events.length) out.push(`This turn so far: ${s.events.map((e) => eventEn(e, who(e.seat))).join("; ")}.`);
    if (s.phase === "over") {
      out.push(`Game over: ${s.winner === ai ? "you" : names.human} brought all 4 planes home.`);
      return out.join("\n");
    }
    const t = threats(s, ai);
    if (t.length) out.push(`Danger: ${t.join("; ")}.`);
    if (s.toMove !== ai) {
      out.push(`${names.human}'s turn (${s.phase === "roll" ? "to roll" : `choosing a plane for a ${s.roll}`}).`);
      return out.join("\n");
    }
    if (s.phase === "roll") {
      out.push(`Your turn: roll the die with "roll".${s.sixes ? ` You have rolled ${s.sixes} six${s.sixes > 1 ? "es" : ""} in a row this turn${s.sixes === 2 ? "; a third 6 sends the plane you pick back to the hangar" : ""}.` : ""}`);
    } else {
      out.push(`Your turn: you rolled ${s.roll}${s.sixes === 3 ? " (third 6 in a row!)" : ""}. Legal moves:`);
      for (const c of aeroplaneChoices(s)) out.push(`  ${choiceEn(ai, c)}`);
    }
    return out.join("\n");
  },
};
