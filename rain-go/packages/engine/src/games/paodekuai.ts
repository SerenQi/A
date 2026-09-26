import { shuffled } from "../match/rng";
import { otherActor, type Actor, type GameModule } from "../match/types";
import {
  PDK_RANKS,
  PDK_TYPE_EN,
  pdkCardText,
  pdkCheckPlay,
  pdkComboName,
  pdkComboNameEn,
  pdkDeck,
  pdkHints,
  pdkParseCards,
  pdkRank,
  pdkRankText,
  pdkSortCards,
  type PdkCombo,
  type PdkHint,
} from "./paodekuai-cards";

export * from "./paodekuai-cards";

/** 跑得快, two-player version: 48-card deck, 16 cards each, 16 set aside unseen. */

/** One play or pass. `combo` is null for a pass. */
export interface PdkPlay {
  by: Actor;
  cards: string[];
  combo: PdkCombo | null;
  /** Sequence number of this action (1-based). */
  n: number;
}

export interface PaodekuaiState {
  hands: Record<Actor, string[]>;
  /** The 16 cards set aside, never shown. */
  unused: string[];
  rng: number;
  first: Actor;
  toPlay: Actor;
  /** The combination to beat, or null when `toPlay` leads a new trick. */
  trick: PdkPlay | null;
  /** Who passed last, cleared by the next play. */
  lastPass: Actor | null;
  /** The play that won the previous trick (shown faded while the next one is led). */
  lastTrick: PdkPlay | null;
  /** Recent actions, newest last. */
  plays: PdkPlay[];
  /** Completed tricks. */
  tricks: number;
  moves: number;
  /** Cards each side has played so far (0 at the end means 春天). */
  played: Record<Actor, number>;
  winner: Actor | null;
}

export interface PdkPlayView {
  by: Actor;
  cards: string[];
  combo: PdkCombo | null;
  /** "对子 8", "不要". */
  name: string;
  n: number;
}

export interface PaodekuaiView {
  viewer: Actor;
  /** The viewer's own hand, sorted. */
  hand: string[];
  opponentCount: number;
  toPlay: Actor | null;
  myTurn: boolean;
  /** The viewer is to lead a new trick. */
  leading: boolean;
  trick: PdkPlayView | null;
  lastTrick: PdkPlayView | null;
  lastPass: Actor | null;
  recent: PdkPlayView[];
  /** Viewer's playable combinations, cheapest first (only on the viewer's turn). */
  hints: PdkHint[];
  tricks: number;
  moves: number;
  winner: Actor | null;
}

const HISTORY = 12;
const PASS_RE = /^(pass|p|不要|过|要不起|不出)$/i;

function playView(p: PdkPlay): PdkPlayView {
  return { by: p.by, cards: p.cards.slice(), combo: p.combo, name: p.combo ? pdkComboName(p.combo, p.cards) : "不要", n: p.n };
}

/** Test helper: a state starting from given hands (cards like "S3"). */
export function pdkStateFrom(o: { human: string[]; ai: string[]; first?: Actor; unused?: string[] }): PaodekuaiState {
  const first = o.first ?? "human";
  return {
    hands: { human: pdkSortCards(o.human), ai: pdkSortCards(o.ai) },
    unused: o.unused ?? [],
    rng: 1,
    first,
    toPlay: first,
    trick: null,
    lastPass: null,
    lastTrick: null,
    plays: [],
    tricks: 0,
    moves: 0,
    played: { human: 0, ai: 0 },
    winner: null,
  };
}

const RULES = [
  "Run Fast (跑得快), two-player version. Deck of 48: a standard deck without jokers, without ♥2 ♣2 ♦2 (♠2 stays) and without ♠A. Each player gets 16 cards; the other 16 are set aside unseen for the whole game.",
  "Ranks low to high: 3 4 5 6 7 8 9 10 J Q K A 2. Suits never matter for strength. (So A has only 3 cards and 2 only one: bombs exist for 3..K.)",
  "The first seat leads the first trick. (In the four-suit table game the holder of ♠3 starts; here the seat decides.)",
  "Combinations: single; pair; triple alone (only allowed as your final cards); triple with one (三带一); triple with a pair (三带二); straight of 5+ consecutive ranks from 3 up to A (2 may not be in a straight); consecutive pairs of 2+ pairs (e.g. 3 3 4 4); plane of 2+ consecutive triples (3..A), bare or with exactly as many single cards or as many pairs as it has triples as wings; bomb = four of a kind.",
  "A bomb beats any non-bomb; a higher bomb beats a lower bomb. Otherwise you must follow with the same combination type and the same length/shape (same number of cards), with a higher key rank (the triple rank for triples with wings, the highest rank of a chain).",
  "Trick flow: the leader plays any valid combination. The other player must beat it or pass; play alternates until someone passes, then the last player to have played leads a new trick with anything. There is no 'must beat if you can' rule: you may always pass when following (it is not enforced). You cannot pass when leading.",
  "The first player to empty their hand wins. 春天 (spring) means the loser never played a card.",
  'Moves: "pass" (also 不要 / 过), or the cards to play separated by spaces. By rank only ("3 3", "10 J Q K A", "T J Q K A" with T for 10; the exact cards are picked from your hand) or with suits ("S3 H3" or "♠3 ♥3"; suits S H C D).',
].join("\n");

export const paodekuai: GameModule<PaodekuaiState, PaodekuaiView> = {
  kind: "paodekuai",
  name: { zh: "跑得快", en: "Run Fast" },
  family: "牌",
  blurb: "两人对战，谁先出完手里的牌谁赢。",
  ready: true,
  options: [],
  rules: RULES,
  moveHelp: '"pass", or cards by rank separated by spaces: "8 8", "10 J Q K A", "5 5 5 9" (suits optional: "S3 H3")',
  create({ seed, humanFirst }) {
    const [deck, rng] = shuffled(pdkDeck(), seed >>> 0);
    const first: Actor = humanFirst ? "human" : "ai";
    const a = deck.slice(0, 16);
    const b = deck.slice(16, 32);
    return { ...pdkStateFrom({ human: humanFirst ? a : b, ai: humanFirst ? b : a, first, unused: deck.slice(32) }), rng };
  },
  apply(s, actor, move) {
    if (s.winner) return { ok: false, error: "对局已经结束" };
    if (s.toPlay !== actor) return { ok: false, error: "还没轮到你" };
    const m = move.trim();
    const n = s.moves + 1;
    if (PASS_RE.test(m)) {
      if (!s.trick) return { ok: false, error: "你先出，不能不要" };
      const pass: PdkPlay = { by: actor, cards: [], combo: null, n };
      return {
        ok: true,
        state: {
          ...s,
          toPlay: otherActor(actor),
          trick: null,
          lastTrick: s.trick,
          lastPass: actor,
          plays: [...s.plays, pass].slice(-HISTORY),
          tricks: s.tricks + 1,
          moves: n,
        },
        log: "不要",
      };
    }
    const hand = s.hands[actor];
    const parsed = pdkParseCards(hand, m);
    if (!parsed.ok) return parsed;
    const check = pdkCheckPlay(hand, parsed.cards, s.trick?.combo ?? null);
    if (!check.ok) return check;
    const left = hand.filter((c) => !parsed.cards.includes(c));
    const play: PdkPlay = { by: actor, cards: parsed.cards, combo: check.combo, n };
    return {
      ok: true,
      state: {
        ...s,
        hands: { ...s.hands, [actor]: left },
        toPlay: otherActor(actor),
        trick: play,
        lastPass: null,
        plays: [...s.plays, play].slice(-HISTORY),
        moves: n,
        played: { ...s.played, [actor]: s.played[actor] + parsed.cards.length },
        winner: left.length ? null : actor,
      },
      log: pdkComboName(check.combo, parsed.cards),
    };
  },
  waitingOn(s) {
    return s.winner ? [] : [s.toPlay];
  },
  outcome(s) {
    if (!s.winner) return null;
    const loser = otherActor(s.winner);
    return { winner: s.winner, text: `对手剩 ${s.hands[loser].length} 张${s.played[loser] === 0 ? " · 春天" : ""}` };
  },
  seats(s) {
    return s.first === "human" ? { human: "先手", ai: "后手" } : { human: "后手", ai: "先手" };
  },
  view(s, viewer) {
    const myTurn = !s.winner && s.toPlay === viewer;
    const hand = pdkSortCards(s.hands[viewer]);
    return {
      viewer,
      hand,
      opponentCount: s.hands[otherActor(viewer)].length,
      toPlay: s.winner ? null : s.toPlay,
      myTurn,
      leading: myTurn && !s.trick,
      trick: s.trick ? playView(s.trick) : null,
      lastTrick: s.lastTrick ? playView(s.lastTrick) : null,
      lastPass: s.lastPass,
      recent: s.plays.slice(-6).map(playView),
      hints: myTurn ? pdkHints(hand, s.trick?.combo ?? null).slice(0, 120) : [],
      tricks: s.tricks,
      moves: s.moves,
      winner: s.winner,
    };
  },
  describe(s, names) {
    const hand = pdkSortCards(s.hands.ai);
    const who = (a: Actor) => (a === "ai" ? "You" : names.human);
    const cards = (cs: readonly string[]) => cs.map(pdkCardText).join(" ");
    const groups: string[] = [];
    for (let r = 0; r < PDK_RANKS.length; r++) {
      const cs = hand.filter((c) => pdkRank(c) === r);
      if (cs.length) groups.push(`${pdkRankText(r)}${cs.length > 1 ? `x${cs.length}` : ""} (${cards(cs)})`);
    }
    const out = [
      `You are the ${s.first === "ai" ? "first" : "second"} seat. 48-card deck; 16 cards each, 16 set aside unseen. Ranks low to high: 3 4 5 6 7 8 9 10 J Q K A 2.`,
      `Your hand (${hand.length} cards): ${groups.join(", ") || "(empty)"}`,
      `${names.human} has ${s.hands.human.length} card${s.hands.human.length === 1 ? "" : "s"} left.${!s.winner && s.hands.human.length <= 3 ? " They are close to going out!" : ""}`,
      `Tricks completed: ${s.tricks}.`,
    ];
    if (s.winner) out.push(`Game over: ${s.winner === "ai" ? "you" : names.human} emptied the hand first.`);
    else if (s.toPlay === "ai") {
      if (s.trick) {
        const c = s.trick.combo!;
        const shape = c.type === "bomb" ? "a higher bomb" : `a ${PDK_TYPE_EN[c.type]} of the same shape (${c.size} cards${c.len > 1 ? `, ${c.len} ranks long` : ""}) with key rank higher than ${pdkRankText(c.key)}, or any bomb`;
        out.push(`Current trick: ${who(s.trick.by)} played ${pdkComboNameEn(c, s.trick.cards)} [${cards(s.trick.cards)}]. To beat it play ${shape}; or "pass".`);
      } else out.push(`You lead a new trick${s.lastPass === "human" ? ` (${names.human} passed)` : ""}: play any valid combination (you cannot pass).`);
    } else if (s.trick) out.push(`${names.human} must answer your ${pdkComboNameEn(s.trick.combo!, s.trick.cards)}.`);
    else out.push(`${names.human} leads the next trick.`);
    const recent = s.plays.slice(-6);
    if (recent.length) {
      out.push("", "Recent plays (oldest first):");
      for (const p of recent) out.push(`- ${who(p.by)}: ${p.combo ? `${pdkComboNameEn(p.combo, p.cards)} [${cards(p.cards)}]` : "pass"}`);
    }
    if (!s.winner && s.toPlay === "ai") {
      const hints = pdkHints(hand, s.trick?.combo ?? null);
      const CAP = 40;
      out.push("", `Legal plays (cheapest first${hints.length > CAP ? `; showing ${CAP} of ${hints.length}, any valid combination from your hand is allowed` : ""}):`);
      for (const h of hints.slice(0, CAP)) out.push(`- "${h.move}"  ${pdkComboNameEn(h.combo, h.cards)}`);
      if (s.trick) out.push(`- "pass"${hints.length ? "" : "  (nothing in your hand beats it)"}`);
    }
    return out.join("\n");
  },
};
