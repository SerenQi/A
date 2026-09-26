import { shuffled } from "../match/rng";
import { otherActor, type Actor, type GameModule } from "../match/types";
import { POKER_DECK, pokerBestHand, pokerCompare, pokerHandNameEn, pokerHandNameZh } from "./poker-hand";

export * from "./poker-hand";

/**
 * Heads-up No-Limit Texas Hold'em. 1000 chips each, blinds 10/20 doubling every 10 hands.
 * The button posts the small blind, acts first pre-flop and last after the flop.
 * A finished hand is summarised in `lastHand` and the next hand is dealt in the same step.
 */
export type PokerStreet = "preflop" | "flop" | "turn" | "river" | "showdown";
export type PokerMoveKind = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export interface PokerActionEntry {
  actor: Actor;
  street: PokerStreet;
  kind: PokerMoveKind | "sb" | "bb";
  /** Chips put in by this action. */
  amount: number;
  /** The actor's total bet on this street afterwards. */
  to: number;
}

export interface PokerLastHand {
  hand: number;
  board: string[];
  /** Hole cards revealed at showdown. Empty when the hand ended with a fold. */
  shown: Partial<Record<Actor, string[]>>;
  /** Chinese hand names of the shown hands, e.g. "一对 K". */
  names: Partial<Record<Actor, string>>;
  winners: Actor[];
  pot: number;
  /** Chips each side took from the pot. */
  won: Record<Actor, number>;
  /** Net chip change over the hand. */
  net: Record<Actor, number>;
  folded: Actor | null;
}

export interface PokerState {
  rng: number;
  /** 0 = no limit. */
  handLimit: number;
  hand: number;
  /** Button on hand 1 (seat 玩家一). */
  firstButton: Actor;
  button: Actor;
  sb: number;
  bb: number;
  stacks: Record<Actor, number>;
  /** Undealt cards; the next card is deck[0]. */
  deck: string[];
  hole: Record<Actor, string[]>;
  board: string[];
  street: PokerStreet;
  /** Bets on the current street. */
  bets: Record<Actor, number>;
  /** Chips put in this hand, including the current street. */
  committed: Record<Actor, number>;
  /** Has acted since the last full bet or raise (false means they may still raise). */
  acted: Record<Actor, boolean>;
  /** Size of the last full bet/raise increment on this street (min raise). */
  lastRaise: number;
  toAct: Actor | null;
  actions: PokerActionEntry[];
  lastHand: PokerLastHand | null;
  result: { winner: Actor | "draw"; text: string } | null;
}

export interface PokerView {
  viewer: Actor;
  hand: number;
  handLimit: number;
  sb: number;
  bb: number;
  button: Actor;
  firstButton: Actor;
  street: PokerStreet;
  board: string[];
  /** The viewer's own hole cards only. */
  hole: string[];
  stacks: Record<Actor, number>;
  bets: Record<Actor, number>;
  /** Everything in the middle, including this street's bets. */
  pot: number;
  toAct: Actor | null;
  /** Chips the viewer needs to call (capped by their stack). */
  toCall: number;
  /** Smallest legal bet/raise-to for the viewer (0 when they cannot raise). */
  minRaiseTo: number;
  /** All-in raise-to for the viewer. */
  maxRaiseTo: number;
  /** Legal move kinds for the viewer, empty when it is not their turn. */
  legal: PokerMoveKind[];
  actions: PokerActionEntry[];
  lastHand: PokerLastHand | null;
  over: boolean;
}

export const POKER_START_STACK = 1000;
const ACTORS: Actor[] = ["human", "ai"];
const pair = <T>(h: T, a: T): Record<Actor, T> => ({ human: h, ai: a });

/** Small and big blind for a hand number (1-based): 10/20 doubling every 10 hands. */
export function pokerBlinds(hand: number): [number, number] {
  const m = 2 ** Math.floor((hand - 1) / 10);
  return [10 * m, 20 * m];
}

export const pokerStreetZh: Record<PokerStreet, string> = { preflop: "翻牌前", flop: "翻牌", turn: "转牌", river: "河牌", showdown: "摊牌" };
const streetEn: Record<PokerStreet, string> = { preflop: "Pre-flop", flop: "Flop", turn: "Turn", river: "River", showdown: "Showdown" };

const currentBet = (s: PokerState) => Math.max(s.bets.human, s.bets.ai);

function put(s: PokerState, a: Actor, chips: number): number {
  const c = Math.max(0, Math.min(chips, s.stacks[a]));
  s.stacks[a] -= c;
  s.bets[a] += c;
  s.committed[a] += c;
  return c;
}

function needsAction(s: PokerState, a: Actor): boolean {
  if (s.stacks[a] === 0) return false;
  if (s.bets[a] < currentBet(s)) return true;
  if (s.stacks[otherActor(a)] === 0) return false;
  return !s.acted[a];
}

/** Whether `a` may bet or raise now (ignoring whether their stack reaches a full raise). */
function mayRaise(s: PokerState, a: Actor): boolean {
  return s.stacks[otherActor(a)] > 0 && !s.acted[a] && s.bets[a] + s.stacks[a] > currentBet(s);
}

interface Limits {
  toCall: number;
  minTo: number;
  maxTo: number;
  canRaise: boolean;
  legal: PokerMoveKind[];
}

function limits(s: PokerState, a: Actor): Limits {
  const cb = currentBet(s);
  const toCall = Math.min(cb - s.bets[a], s.stacks[a]);
  const maxTo = s.bets[a] + s.stacks[a];
  const canRaise = mayRaise(s, a);
  const fullMin = cb === 0 ? s.bb : cb + s.lastRaise;
  const minTo = canRaise ? Math.min(fullMin, maxTo) : 0;
  const legal: PokerMoveKind[] = [];
  if (s.toAct === a && !s.result) {
    if (toCall > 0) legal.push("fold", "call");
    else legal.push("check");
    if (canRaise && maxTo > fullMin) legal.push(cb === 0 ? "bet" : "raise");
    legal.push("allin");
  }
  return { toCall, minTo, maxTo, canRaise, legal };
}

function dealHand(s: PokerState, hand: number, button: Actor) {
  const bbSeat = otherActor(button);
  const [deck, rng] = shuffled(POKER_DECK, s.rng);
  s.rng = rng;
  s.hand = hand;
  s.button = button;
  [s.sb, s.bb] = pokerBlinds(hand);
  s.hole = pair<string[]>([], []);
  s.hole[bbSeat] = [deck[0]!, deck[2]!];
  s.hole[button] = [deck[1]!, deck[3]!];
  s.deck = deck.slice(4);
  s.board = [];
  s.street = "preflop";
  s.bets = pair(0, 0);
  s.committed = pair(0, 0);
  s.acted = pair(false, false);
  s.lastRaise = s.bb;
  s.actions = [];
  s.toAct = null;
  const sbPaid = put(s, button, s.sb);
  s.actions.push({ actor: button, street: "preflop", kind: "sb", amount: sbPaid, to: s.bets[button] });
  const bbPaid = put(s, bbSeat, s.bb);
  s.actions.push({ actor: bbSeat, street: "preflop", kind: "bb", amount: bbPaid, to: s.bets[bbSeat] });
  startStreet(s);
}

function startStreet(s: PokerState) {
  const first = s.street === "preflop" ? s.button : otherActor(s.button);
  if (needsAction(s, first)) s.toAct = first;
  else if (needsAction(s, otherActor(first))) s.toAct = otherActor(first);
  else endStreet(s);
}

/** Returns the part of a bet the other side could not match. */
function returnUncalled(s: PokerState) {
  const hi: Actor = s.bets.human >= s.bets.ai ? "human" : "ai";
  const diff = s.bets[hi] - s.bets[otherActor(hi)];
  if (diff > 0) {
    s.stacks[hi] += diff;
    s.bets[hi] -= diff;
    s.committed[hi] -= diff;
  }
}

function endStreet(s: PokerState) {
  s.toAct = null;
  returnUncalled(s);
  s.bets = pair(0, 0);
  s.acted = pair(false, false);
  s.lastRaise = s.bb;
  if (s.stacks.human === 0 || s.stacks.ai === 0 || s.street === "river") {
    while (s.board.length < 5) s.board.push(s.deck.shift()!);
    showdown(s);
    return;
  }
  s.street = s.street === "preflop" ? "flop" : s.street === "flop" ? "turn" : "river";
  const n = s.street === "flop" ? 3 : 1;
  s.board.push(...s.deck.splice(0, n));
  startStreet(s);
}

function showdown(s: PokerState) {
  s.street = "showdown";
  const hv = pair(pokerBestHand([...s.hole.human, ...s.board]), pokerBestHand([...s.hole.ai, ...s.board]));
  const c = pokerCompare(hv.human, hv.ai);
  const winners: Actor[] = c > 0 ? ["human"] : c < 0 ? ["ai"] : ["human", "ai"];
  finishHand(s, winners, null, { human: s.hole.human.slice(), ai: s.hole.ai.slice() }, { human: pokerHandNameZh(hv.human), ai: pokerHandNameZh(hv.ai) });
}

function finishHand(s: PokerState, winners: Actor[], folded: Actor | null, shown: PokerLastHand["shown"], names: PokerLastHand["names"]) {
  s.toAct = null;
  const pot = s.committed.human + s.committed.ai;
  const won = pair(0, 0);
  if (winners.length === 1) won[winners[0]!] = pot;
  else {
    const half = Math.floor(pot / 2);
    won.human = half;
    won.ai = half;
    // Odd chip goes to the player out of position (the big blind).
    won[otherActor(s.button)] += pot - half * 2;
  }
  for (const a of ACTORS) s.stacks[a] += won[a];
  s.lastHand = {
    hand: s.hand,
    board: s.board.slice(),
    shown,
    names,
    winners,
    pot,
    won,
    net: pair(won.human - s.committed.human, won.ai - s.committed.ai),
    folded,
  };
  s.committed = pair(0, 0);
  s.bets = pair(0, 0);
  if (s.stacks.human === 0 || s.stacks.ai === 0) {
    s.result = { winner: s.stacks.human > 0 ? "human" : "ai", text: "赢光筹码" };
    return;
  }
  if (s.handLimit && s.hand >= s.handLimit) {
    const { human: h, ai } = s.stacks;
    s.result = h === ai ? { winner: "draw", text: `筹码 ${h} : ${ai}` } : { winner: h > ai ? "human" : "ai", text: `筹码 ${Math.max(h, ai)} : ${Math.min(h, ai)}` };
    return;
  }
  dealHand(s, s.hand + 1, otherActor(s.button));
}

type Parsed = { kind: PokerMoveKind; amount?: number };

/** Lenient move parser (English and Chinese). */
export function pokerParseMove(raw: string): Parsed | null {
  const m = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (/^(fold|f|弃牌|弃|盖牌)$/.test(m)) return { kind: "fold" };
  if (/^(check|x|k|过牌|过|让牌)$/.test(m)) return { kind: "check" };
  if (/^(call|c|跟注|跟)( ?\d+)?$/.test(m)) return { kind: "call" };
  if (/^(all ?-?in|allin|shove|jam|全下|梭哈|全押|全压)( ?\d+)?$/.test(m)) return { kind: "allin" };
  const b = /^(bet|b|下注)\s*(?:to\s*|到\s*|至\s*)?(\d+)$/.exec(m);
  if (b) return { kind: "bet", amount: Number(b[2]) };
  const r = /^(raise|r|加注)\s*(?:to\s*|到\s*|至\s*)?(\d+)$/.exec(m);
  if (r) return { kind: "raise", amount: Number(r[2]) };
  return null;
}

type Err = { ok: false; error: string };
const err = (error: string): Err => ({ ok: false, error });

function act(s: PokerState, a: Actor, p: Parsed): { log: string } | Err {
  const o = otherActor(a);
  const cb = currentBet(s);
  const L = limits(s, a);
  let kind = p.kind;
  if (kind === "call" && L.toCall === 0) kind = "check";
  if (kind === "allin" && !L.canRaise) kind = L.toCall > 0 ? "call" : "check";
  const record = (k: PokerActionEntry["kind"], amount: number) => s.actions.push({ actor: a, street: s.street, kind: k, amount, to: s.bets[a] });

  switch (kind) {
    case "fold": {
      if (L.toCall === 0) return err("现在可以过牌，不用弃牌");
      record("fold", 0);
      returnUncalled(s);
      finishHand(s, [o], a, {}, {});
      return { log: "fold" };
    }
    case "check": {
      if (L.toCall > 0) return err(`要跟注 ${L.toCall} 或者弃牌`);
      s.acted[a] = true;
      record("check", 0);
      break;
    }
    case "call": {
      const c = put(s, a, L.toCall);
      s.acted[a] = true;
      const allIn = s.stacks[a] === 0;
      s.actions.push({ actor: a, street: s.street, kind: "call", amount: c, to: s.bets[a] });
      afterAction(s, a);
      return { log: allIn ? `call ${c} (allin)` : `call ${c}` };
    }
    case "bet":
    case "raise":
    case "allin": {
      if (!L.canRaise) {
        if (s.stacks[o] === 0) return err("对方已经全下，只能跟注或弃牌");
        if (L.maxTo <= cb) return err("筹码不够加注，只能跟注或弃牌");
        return err("这一轮不能再加注，只能跟注或弃牌");
      }
      const to = kind === "allin" ? L.maxTo : p.amount!;
      if (to > L.maxTo) return err(`筹码不够，最多到 ${L.maxTo}`);
      const fullMin = cb === 0 ? s.bb : cb + s.lastRaise;
      if (to < L.maxTo && to < fullMin) {
        if (L.maxTo < fullMin) return err(`筹码不够一次最小加注，只能全下（${L.maxTo}）`);
        return err(cb === 0 ? `下注至少 ${fullMin}` : `加注至少要到 ${fullMin}`);
      }
      const inc = to - cb;
      if (inc >= s.lastRaise) {
        // A full bet or raise reopens the betting for the opponent.
        s.lastRaise = inc;
        s.acted[o] = false;
      }
      const c = put(s, a, to - s.bets[a]);
      s.acted[a] = true;
      const k: PokerMoveKind = s.stacks[a] === 0 ? "allin" : cb === 0 ? "bet" : "raise";
      record(k, c);
      afterAction(s, a);
      return { log: `${k} ${to}` };
    }
  }
  afterAction(s, a);
  return { log: kind };
}

function afterAction(s: PokerState, a: Actor) {
  const o = otherActor(a);
  if (needsAction(s, o)) s.toAct = o;
  else if (needsAction(s, a)) s.toAct = a;
  else endStreet(s);
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const cardsText = (cs: string[]) => (cs.length ? cs.join(" ") : "(none)");

function actionText(e: PokerActionEntry, who: string, you: boolean): string {
  const v = (verb: string) => `${who} ${you ? verb : verb === "is" ? "is" : `${verb}s`}`;
  switch (e.kind) {
    case "sb":
      return `${v("post")} SB ${e.amount}`;
    case "bb":
      return `${v("post")} BB ${e.amount}`;
    case "fold":
      return v("fold");
    case "check":
      return v("check");
    case "call":
      return `${v("call")} ${e.amount}`;
    case "bet":
      return `${v("bet")} ${e.to}`;
    case "raise":
      return `${v("raise")} to ${e.to}`;
    case "allin":
      return `${who} ${you ? "are" : "is"} ALL-IN (street total ${e.to})`;
  }
}

export const poker: GameModule<PokerState, PokerView> = {
  kind: "poker",
  name: { zh: "德州扑克", en: "Hold'em" },
  family: "牌",
  blurb: "两人单挑无限注德州，赢光对方的筹码。",
  ready: true,
  options: [
    {
      key: "hands",
      label: "手数",
      choices: [
        { value: "20", label: "20 手" },
        { value: "50", label: "50 手" },
        { value: "0", label: "不限" },
      ],
      default: "50",
    },
  ],
  rules: [
    "Heads-up No-Limit Texas Hold'em. Each player starts with 1000 chips. Blinds are 10/20 and double every 10 hands (20/40 from hand 11, 40/80 from hand 21, ...).",
    "The button alternates every hand. The button posts the small blind, acts FIRST pre-flop and LAST on the flop, turn and river.",
    "Each player gets two hole cards; five community cards come as flop (3), turn (1) and river (1). Best five of seven cards wins at showdown; equal hands split the pot. Hand ranks: high card < pair < two pair < three of a kind < straight (A-2-3-4-5 is the lowest) < flush < full house < four of a kind < straight flush.",
    "Betting: check when there is nothing to call; otherwise fold, call or raise. The minimum bet is the big blind; a raise must increase the bet by at least the previous bet/raise increment. An all-in for less than a full raise does not reopen the betting. Any uncalled chips are returned. If a player is all-in and called, the rest of the board is dealt automatically.",
    "The match ends when a player has no chips, or after the hand limit (if set), when the chip leader wins.",
    'Moves: "fold", "check", "call", "bet 60" (open the betting with 60), "raise 120" (raise TO a total of 120 on this street, not by 120), "allin". Cards are written rank+suit: ranks 2-9 T J Q K A, suits s h d c (e.g. "As Td").',
  ].join("\n"),
  moveHelp: '"fold", "check", "call", "bet 60", "raise 120" (raise TO a street total of 120), "allin"',
  create({ seed, humanFirst, options }) {
    const handLimit = Number(options.hands ?? "50") || 0;
    const first: Actor = humanFirst ? "human" : "ai";
    const s: PokerState = {
      rng: seed >>> 0,
      handLimit,
      hand: 0,
      firstButton: first,
      button: first,
      sb: 10,
      bb: 20,
      stacks: pair(POKER_START_STACK, POKER_START_STACK),
      deck: [],
      hole: pair<string[]>([], []),
      board: [],
      street: "preflop",
      bets: pair(0, 0),
      committed: pair(0, 0),
      acted: pair(false, false),
      lastRaise: 20,
      toAct: null,
      actions: [],
      lastHand: null,
      result: null,
    };
    dealHand(s, 1, first);
    return s;
  },
  apply(s0, actor, move) {
    if (s0.result) return err("对局已经结束");
    if (s0.toAct !== actor) return err("还没轮到你");
    const p = pokerParseMove(move);
    if (!p) return err(`看不懂这步：${move}`);
    const s = clone(s0);
    const r = act(s, actor, p);
    if ("ok" in r) return r;
    return { ok: true, state: s, log: r.log };
  },
  waitingOn(s) {
    return s.result || !s.toAct ? [] : [s.toAct];
  },
  outcome(s) {
    return s.result;
  },
  seats(s) {
    return s.firstButton === "human" ? { human: "玩家一", ai: "玩家二" } : { human: "玩家二", ai: "玩家一" };
  },
  view(s, viewer) {
    const L = limits(s, viewer);
    return {
      viewer,
      hand: s.hand,
      handLimit: s.handLimit,
      sb: s.sb,
      bb: s.bb,
      button: s.button,
      firstButton: s.firstButton,
      street: s.street,
      board: s.board.slice(),
      hole: s.hole[viewer].slice(),
      stacks: { ...s.stacks },
      bets: { ...s.bets },
      pot: s.committed.human + s.committed.ai,
      toAct: s.result ? null : s.toAct,
      toCall: s.toAct === viewer ? L.toCall : 0,
      minRaiseTo: s.toAct === viewer ? L.minTo : 0,
      maxRaiseTo: s.toAct === viewer ? L.maxTo : 0,
      legal: L.legal,
      actions: s.actions.map((e) => ({ ...e })),
      lastHand: s.lastHand ? clone(s.lastHand) : null,
      over: !!s.result,
    };
  },
  describe(s, names) {
    const who = (a: Actor) => (a === "ai" ? "You" : names.human);
    const out: string[] = [];
    const [nsb, nbb] = pokerBlinds(Math.floor((s.hand - 1) / 10) * 10 + 11);
    out.push(
      `Hand ${s.hand}${s.handLimit ? ` of ${s.handLimit}` : ""} · blinds ${s.sb}/${s.bb} (next level ${nsb}/${nbb} from hand ${Math.floor((s.hand - 1) / 10) * 10 + 11}).`,
    );
    out.push(`Button / small blind: ${s.button === "ai" ? "you" : names.human}. Big blind: ${s.button === "ai" ? names.human : "you"}.`);
    out.push(`Stacks: you ${s.stacks.ai} · ${names.human} ${s.stacks.human}.`);
    out.push(`Pot: ${s.committed.human + s.committed.ai} (including bets on this street).`);
    out.push(`Street: ${streetEn[s.street]}. Board: ${cardsText(s.board)}.`);
    out.push(`Your hole cards: ${cardsText(s.hole.ai)}.`);
    if (s.board.length >= 3) out.push(`Your best hand now: ${pokerHandNameEn(pokerBestHand([...s.hole.ai, ...s.board]))}.`);
    if (!s.result && s.street !== "showdown") out.push(`Bets this street: you ${s.bets.ai} · ${names.human} ${s.bets.human}.`);

    const byStreet: string[] = [];
    for (const st of ["preflop", "flop", "turn", "river"] as const) {
      const acts = s.actions.filter((e) => e.street === st);
      if (acts.length) byStreet.push(`  ${streetEn[st]}: ${acts.map((e) => actionText(e, who(e.actor), e.actor === "ai")).join(", ")}.`);
    }
    if (byStreet.length) out.push("Action this hand:", ...byStreet);

    const lh = s.lastHand;
    if (lh) {
      const line: string[] = [`Last hand (#${lh.hand}):`];
      const nameOf = (a: Actor) => (a === "ai" ? "you" : names.human);
      if (lh.folded) line.push(`${lh.folded === "ai" ? "you" : names.human} folded; ${nameOf(otherActor(lh.folded))} won ${lh.pot}.`);
      else {
        for (const a of ["ai", "human"] as Actor[]) {
          const cs = lh.shown[a];
          if (cs) line.push(`${nameOf(a)} showed ${cs.join(" ")} (${pokerHandNameEn(pokerBestHand([...cs, ...lh.board]))});`);
        }
        line.push(`board ${cardsText(lh.board)};`);
        line.push(lh.winners.length === 2 ? `split pot ${lh.pot}.` : `${nameOf(lh.winners[0]!)} won ${lh.pot}.`);
      }
      out.push(line.join(" "));
    }

    if (s.result) {
      out.push(`Match over: ${s.result.winner === "draw" ? "draw" : s.result.winner === "ai" ? "you win" : `${names.human} wins`} (${s.stacks.ai} : ${s.stacks.human}).`);
    } else if (s.toAct === "ai") {
      const L = limits(s, "ai");
      const opts: string[] = [];
      for (const k of L.legal) {
        if (k === "fold") opts.push("fold");
        else if (k === "check") opts.push("check");
        else if (k === "call") opts.push(`call (${L.toCall} more${L.toCall >= s.stacks.ai ? ", puts you all-in" : ""})`);
        else if (k === "bet") opts.push(`bet N with N from ${L.minTo} to ${L.maxTo}`);
        else if (k === "raise") opts.push(`raise N (raise TO a street total N) with N from ${L.minTo} to ${L.maxTo}`);
        else if (k === "allin") opts.push(L.canRaise ? `allin (street total ${L.maxTo})` : `allin (same as call)`);
      }
      out.push(`YOUR TURN. To call: ${L.toCall}. Legal moves: ${opts.join(" | ")}.`);
    } else {
      out.push(`Waiting for ${names.human} to act.`);
    }
    return out.join("\n");
  },
};
