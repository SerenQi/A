import { describe, expect, it } from "vitest";
import {
  applyMatchAction,
  createMatch,
  describeMatch,
  paodekuai,
  pdkBeats,
  pdkCardText,
  pdkCheckPlay,
  pdkClassify,
  pdkDeck,
  pdkHints,
  pdkParseCards,
  pdkRank,
  pdkStateFrom,
  statusOf,
  viewMatch,
  type Match,
  type PaodekuaiState,
  type PaodekuaiView,
  type PdkCombo,
} from "../src";

const R = (s: string) => s.split(" ").map((t) => pdkRank(`S${t === "T" ? "10" : t}`));
const kinds = (s: string) => pdkClassify(R(s)).map((c) => `${c.type}:${c.key}:${c.len}`);
const first = (s: string) => pdkClassify(R(s))[0];

const newMatch = (humanFirst = true, seed = 7) =>
  createMatch({ id: "p1", kind: "paodekuai", humanFirst, humanName: "Seren", aiName: "Claude", seed, now: 0 });
const withState = (st: PaodekuaiState): Match => ({ ...newMatch(), state: st });

function play(m: Match, who: "human" | "ai", move: string): Match {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  if (!res.ok) throw new Error(`${who} ${move}: ${res.message}`);
  return res.match;
}
function fail(m: Match, who: "human" | "ai", move: string): string {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  expect(res.ok).toBe(false);
  return res.ok ? "" : res.message;
}
const st = (m: Match) => m.state as PaodekuaiState;

describe("paodekuai deck and deal", () => {
  it("has 48 cards without ♥2 ♣2 ♦2 and ♠A", () => {
    const d = pdkDeck();
    expect(d.length).toBe(48);
    expect(new Set(d).size).toBe(48);
    for (const c of ["H2", "C2", "D2", "SA"]) expect(d).not.toContain(c);
    for (const c of ["S2", "HA", "CA", "DA", "S3", "D10", "CK"]) expect(d).toContain(c);
    expect(d.filter((c) => c.endsWith("2")).length).toBe(1);
    expect(d.filter((c) => c.endsWith("A")).length).toBe(3);
  });

  it("deals 16/16 with 16 unused, deterministically per seed", () => {
    const a = st(newMatch(true, 99));
    const b = st(newMatch(true, 99));
    const c = st(newMatch(true, 100));
    expect(a.hands).toEqual(b.hands);
    expect(a.hands).not.toEqual(c.hands);
    expect(a.hands.human.length).toBe(16);
    expect(a.hands.ai.length).toBe(16);
    expect(a.unused.length).toBe(16);
    expect(new Set([...a.hands.human, ...a.hands.ai, ...a.unused]).size).toBe(48);
    expect(a.toPlay).toBe("human");
    expect(st(newMatch(false)).toPlay).toBe("ai");
  });

  it("labels seats by who goes first", () => {
    expect(viewMatch(newMatch(true), "human").seats).toEqual({ human: "先手", ai: "后手" });
    expect(viewMatch(newMatch(false), "human").seats).toEqual({ human: "后手", ai: "先手" });
    expect(statusOf(newMatch(false)).waitingOn).toEqual(["ai"]);
  });
});

describe("paodekuai combinations", () => {
  it("classifies every basic type", () => {
    expect(kinds("8")).toEqual(["single:5:1"]);
    expect(kinds("8 8")).toEqual(["pair:5:1"]);
    expect(kinds("8 8 8")).toEqual(["triple:5:1"]);
    expect(kinds("8 8 8 3")).toEqual(["triple1:5:1"]);
    expect(kinds("8 8 8 3 3")).toEqual(["triple2:5:1"]);
    expect(kinds("J J J J")).toEqual(["bomb:8:1"]);
    expect(kinds("3 4 5 6 7")).toEqual(["straight:4:5"]);
    expect(kinds("10 J Q K A")).toEqual(["straight:11:5"]);
    expect(kinds("3 4 5 6 7 8 9 10 J Q K A")).toEqual(["straight:11:12"]);
    expect(kinds("3 3 4 4")).toEqual(["pairs:1:2"]);
    expect(kinds("Q Q K K A A")).toEqual(["pairs:11:3"]);
  });

  it("classifies planes with and without wings", () => {
    expect(kinds("3 3 3 4 4 4")).toEqual(["plane:1:2"]);
    expect(kinds("3 3 3 4 4 4 9 J")).toEqual(["plane1:1:2"]);
    expect(kinds("3 3 3 4 4 4 9 9")).toEqual(["plane1:1:2"]);
    expect(kinds("3 3 3 4 4 4 9 9 J J")).toEqual(["plane2:1:2"]);
    expect(kinds("K K K A A A 2 5")).toEqual(["plane1:11:2"]);
    // Twelve cards: a bare four-triple plane, or three triples with three wings.
    expect(kinds("3 3 3 4 4 4 5 5 5 6 6 6")).toEqual(["plane:3:4", "plane1:3:3", "plane1:2:3"]);
  });

  it("rejects invalid shapes", () => {
    expect(kinds("J Q K A 2")).toEqual([]); // 2 in a straight
    expect(kinds("3 4 5 6 8")).toEqual([]); // broken
    expect(kinds("3 4 5 6")).toEqual([]); // too short
    expect(kinds("3 3 5 5")).toEqual([]); // broken pairs
    expect(kinds("3 3 3 5 5 5")).toEqual([]); // broken plane
    expect(kinds("A A A 2 2 2")).toEqual([]); // impossible anyway, never a plane
    expect(kinds("8 8 8 8 3")).toEqual([]); // no four-with-one
    expect(kinds("8 8 8 3 4")).toEqual([]); // triple with two singles
    expect(kinds("3 3 3 4 4 4 9")).toEqual([]); // wrong wing count
    expect(kinds("3 3 3 4 4 4 9 9 J Q")).toEqual([]); // pair wings must be pairs
    expect(kinds("8 9")).toEqual([]);
  });

  it("only allows a bare triple as the final cards", () => {
    const hand = ["S8", "H8", "C8", "S4"];
    expect(pdkCheckPlay(hand, ["S8", "H8", "C8"], null)).toEqual({ ok: false, error: "三张不带只能作为最后一手出" });
    expect(pdkCheckPlay(["S8", "H8", "C8"], ["S8", "H8", "C8"], null).ok).toBe(true);
  });

  it("compares same type and length, bombs over everything", () => {
    const pair8 = first("8 8")!;
    expect(pdkBeats(first("9 9")!, pair8)).toBe(true);
    expect(pdkBeats(first("7 7")!, pair8)).toBe(false);
    expect(pdkBeats(first("8 8")!, pair8)).toBe(false);
    expect(pdkBeats(first("9")!, pair8)).toBe(false);
    expect(pdkBeats(first("2")!, first("A")!)).toBe(true);
    const s37 = first("3 4 5 6 7")!;
    expect(pdkBeats(first("4 5 6 7 8")!, s37)).toBe(true);
    expect(pdkBeats(first("4 5 6 7 8 9")!, s37)).toBe(false);
    expect(pdkBeats(first("9 9 9 3")!, first("8 8 8 K")!)).toBe(true);
    expect(pdkBeats(first("9 9 9 3 3")!, first("8 8 8 K")!)).toBe(false);
    expect(pdkBeats(first("4 4 4 5 5 5 3 3")!, first("3 3 3 4 4 4 9 J")!)).toBe(true);
    expect(pdkBeats(first("4 4 4 5 5 5")!, first("3 3 3 4 4 4 9 J")!)).toBe(false);
    const bomb3 = first("3 3 3 3")!;
    expect(pdkBeats(bomb3, first("10 J Q K A")!)).toBe(true);
    expect(pdkBeats(bomb3, first("2")!)).toBe(true);
    expect(pdkBeats(first("2")!, bomb3)).toBe(false);
    expect(pdkBeats(first("K K K K")!, bomb3)).toBe(true);
    expect(pdkBeats(bomb3, first("K K K K")!)).toBe(false);
  });

  it("reads an ambiguous plane the way that beats the trick", () => {
    const hand = ["S3", "H3", "C3", "S4", "H4", "C4", "S5", "H5", "C5", "S6", "H6", "C6"];
    const last: PdkCombo = { type: "plane1", key: 2, len: 3, size: 12 }; // 3-5 with wings
    const res = pdkCheckPlay(hand, hand, last);
    expect(res).toEqual({ ok: true, combo: { type: "plane1", key: 3, len: 3, size: 12 } });
    expect(pdkCheckPlay(hand, hand, null)).toEqual({ ok: true, combo: { type: "plane", key: 3, len: 4, size: 12 } });
  });
});

describe("paodekuai move parsing", () => {
  const hand = ["S3", "H3", "C3", "D10", "S10", "HJ", "SQ", "CK", "HA", "S2"];
  it("resolves rank-only input deterministically", () => {
    expect(pdkParseCards(hand, "3 3")).toEqual({ ok: true, cards: ["S3", "H3"] });
    expect(pdkParseCards(hand, "10 J Q K A")).toEqual({ ok: true, cards: ["S10", "HJ", "SQ", "CK", "HA"] });
    expect(pdkParseCards(hand, "t j q k a")).toEqual({ ok: true, cards: ["S10", "HJ", "SQ", "CK", "HA"] });
    expect(pdkParseCards(hand, "2")).toEqual({ ok: true, cards: ["S2"] });
  });
  it("accepts suits as letters or symbols", () => {
    expect(pdkParseCards(hand, "H3 C3")).toEqual({ ok: true, cards: ["H3", "C3"] });
    expect(pdkParseCards(hand, "♣3 ♥3")).toEqual({ ok: true, cards: ["H3", "C3"] });
    expect(pdkParseCards(hand, "d10")).toEqual({ ok: true, cards: ["D10"] });
    expect(pdkParseCards(hand, "C3 3")).toEqual({ ok: true, cards: ["S3", "C3"] });
  });
  it("errors in Chinese", () => {
    expect(pdkParseCards(hand, "J J")).toEqual({ ok: false, error: "你手里没有两张 J" });
    expect(pdkParseCards(hand, "4")).toEqual({ ok: false, error: "你手里没有 4" });
    expect(pdkParseCards(hand, "D3")).toEqual({ ok: false, error: "你手里没有 ♦3" });
    expect(pdkParseCards(hand, "hello")).toEqual({ ok: false, error: "看不懂这步：hello" });
  });
});

describe("paodekuai trick flow", () => {
  const hands = () =>
    pdkStateFrom({
      human: ["S8", "H8", "S3", "S4", "S5", "S6", "S7", "CK"],
      ai: ["S9", "H9", "C5", "DQ", "SJ", "HJ", "CJ", "DJ"],
    });

  it("follows, passes and gives the lead to the last player", () => {
    let m = withState(hands());
    expect(fail(m, "ai", "9 9")).toBe("还没轮到你");
    expect(fail(m, "human", "pass")).toBe("你先出，不能不要");
    expect(fail(m, "human", "8 K")).toBe("这不是有效的牌型");
    m = play(m, "human", "8 8");
    expect(m.log.at(-1)?.move).toBe("对子 8");
    expect(fail(m, "ai", "5")).toBe("要出比对子 8 大的对子");
    m = play(m, "ai", "9 9");
    expect(st(m).toPlay).toBe("human");
    m = play(m, "human", "不要");
    expect(m.log.at(-1)?.move).toBe("不要");
    let s = st(m);
    expect(s.trick).toBeNull();
    expect(s.toPlay).toBe("ai");
    expect(s.tricks).toBe(1);
    // AI leads anything, human can answer with anything of that shape.
    m = play(m, "ai", "5");
    m = play(m, "human", "K");
    expect(fail(m, "ai", "Q")).toBe("要出比单张 K 大的单张");
    m = play(m, "ai", "J J J J");
    expect(m.log.at(-1)?.move).toBe("炸弹 J");
    m = play(m, "human", "过");
    s = st(m);
    expect(s.toPlay).toBe("ai");
    expect(s.tricks).toBe(2);
  });

  it("logs straights and wings readably and requires the same length", () => {
    let m = withState(pdkStateFrom({ human: ["S3", "S4", "S5", "S6", "S7", "HQ"], ai: ["H4", "H5", "H6", "H7", "H8", "H9", "D3"] }));
    m = play(m, "human", "3 4 5 6 7");
    expect(m.log.at(-1)?.move).toBe("顺子 3-7");
    expect(fail(m, "ai", "4 5 6 7 8 9")).toBe("要出比顺子 3-7 大的顺子（5 张）");
    m = play(m, "ai", "5 6 7 8 9");
    expect(st(m).trick?.combo).toEqual({ type: "straight", key: pdkRank("S9"), len: 5, size: 5 });
    const w = withState(pdkStateFrom({ human: ["S8", "H8", "C8", "S5", "SK"], ai: ["S3"] }));
    expect(play(w, "human", "8 8 8 5").log.at(-1)?.move).toBe("三带一 8 带 5");
  });

  it("ends when a hand is empty, with 春天 when the loser never played", () => {
    let m = withState(pdkStateFrom({ human: ["S8", "H8", "S3"], ai: ["S9", "H9", "C5", "D5"] }));
    m = play(m, "human", "8 8");
    m = play(m, "ai", "pass");
    m = play(m, "human", "3");
    let status = statusOf(m);
    expect(status.outcome).toEqual({ winner: "human", text: "对手剩 4 张 · 春天" });
    expect(status.resultText).toBe("Seren 胜 · 对手剩 4 张 · 春天");
    expect(status.waitingOn).toEqual([]);
    expect(fail(m, "ai", "5")).toBe("对局已经结束");

    m = withState(pdkStateFrom({ human: ["S8", "S3", "S4"], ai: ["S9", "H9", "C5"] }));
    m = play(m, "human", "8");
    m = play(m, "ai", "9");
    m = play(m, "human", "pass");
    m = play(m, "ai", "9");
    m = play(m, "human", "pass");
    m = play(m, "ai", "5");
    status = statusOf(m);
    expect(status.outcome).toEqual({ winner: "ai", text: "对手剩 2 张" });
  });

  it("lets a bare triple go out as the last cards", () => {
    let m = withState(pdkStateFrom({ human: ["S8", "H8", "C8", "S4"], ai: ["S9", "H9"] }));
    expect(fail(m, "human", "8 8 8")).toBe("三张不带只能作为最后一手出");
    m = play(m, "human", "4");
    m = play(m, "ai", "pass");
    m = play(m, "human", "8 8 8");
    expect(m.log.at(-1)?.move).toBe("三张 8");
    expect(statusOf(m).outcome?.winner).toBe("human");
  });
});

describe("paodekuai hints", () => {
  const legal = (hand: string[], last: PdkCombo | null) => {
    const hints = pdkHints(hand, last);
    for (const h of hints) {
      expect(h.cards.every((c) => hand.includes(c))).toBe(true);
      const res = pdkCheckPlay(hand, h.cards, last);
      expect(res.ok).toBe(true);
      expect(pdkParseCards(hand, h.move)).toEqual({ ok: true, cards: h.cards });
    }
    // Cheapest first: non-bombs by rising key, then bombs by rising key.
    const bombs = hints.map((h) => h.combo.type === "bomb");
    expect(bombs).toEqual([...bombs].sort((a, b) => Number(a) - Number(b)));
    for (let i = 1; i < hints.length; i++) if (bombs[i] === bombs[i - 1]) expect(hints[i]!.combo.key).toBeGreaterThanOrEqual(hints[i - 1]!.combo.key);
    expect(new Set(hints.map((h) => h.move)).size).toBe(hints.length);
    return hints;
  };

  it("are all legal and cheapest first for a full random hand", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = st(newMatch(true, seed));
      const lead = legal(s.hands.human, null);
      expect(lead.length).toBeGreaterThan(5);
      expect(lead[0]!.combo.key).toBe(pdkRank(s.hands.human.slice().sort((a, b) => pdkRank(a) - pdkRank(b))[0]!));
      legal(s.hands.human, { type: "pair", key: 3, len: 1, size: 2 });
      legal(s.hands.human, { type: "single", key: 7, len: 1, size: 1 });
      legal(s.hands.human, { type: "straight", key: 6, len: 5, size: 5 });
    }
  });

  it("find follows, planes with wings and bombs", () => {
    const hand = ["S3", "H3", "C3", "S4", "H4", "C4", "S9", "SJ", "HJ", "S7", "H7", "C7", "D7"];
    const pairHints = legal(hand, { type: "pair", key: pdkRank("S6"), len: 1, size: 2 }).map((h) => h.move);
    expect(pairHints).toEqual(["7 7", "J J", "7 7 7 7"]);
    const planes = legal(hand, { type: "plane1", key: 0, len: 2, size: 8 }).map((h) => h.name);
    expect(planes).toContain("飞机带单 3-4 带 9 J");
    expect(planes.at(-1)).toBe("炸弹 7");
    expect(legal(hand, { type: "bomb", key: 8, len: 1, size: 4 })).toEqual([]);
    expect(legal(["S3", "H3", "C3"], null).map((h) => h.name)).toEqual(["单张 3", "对子 3", "三张 3"]);
  });
});

describe("paodekuai hidden information", () => {
  it("view shows only the viewer's own cards", () => {
    const m = newMatch();
    const s = st(m);
    const v = viewMatch<PaodekuaiView>(m, "human").view;
    expect(v.hand).toEqual(s.hands.human);
    expect(v.opponentCount).toBe(16);
    expect(v.leading).toBe(true);
    expect(v.hints.length).toBeGreaterThan(0);
    const json = JSON.stringify(v);
    for (const c of [...s.hands.ai, ...s.unused]) expect(json).not.toContain(`"${c}"`);
    expect(json).not.toContain("rng");
    const av = viewMatch<PaodekuaiView>(m, "ai").view;
    expect(av.hints).toEqual([]);
    expect(av.myTurn).toBe(false);
    for (const c of [...s.hands.human, ...s.unused]) expect(JSON.stringify(av)).not.toContain(`"${c}"`);
  });

  it("describe lists the AI's hand and legal plays but never the human's cards", () => {
    let m = withState(
      pdkStateFrom({
        human: ["S8", "H8", "D3", "D4", "D5", "D6"],
        ai: ["S9", "H9", "C5", "S5", "SJ", "HJ", "CJ", "DJ"],
        unused: ["HK", "CK"],
      }),
    );
    m = play(m, "human", "8 8");
    const t = describeMatch(m);
    expect(t).toContain("Status: YOUR TURN");
    expect(t).toContain("Seren played pair 8");
    expect(t).toContain('"9 9"  pair 9');
    expect(t).toContain('"J J J J"  bomb J');
    expect(t).toContain('"pass"');
    expect(t).toContain("Seren has 4 cards left.");
    expect(t).toMatch(/J x4|Jx4/);
    for (const c of ["♦3", "♦4", "♦6", "♥K", "♣K"]) expect(t).not.toContain(c);
    // After the AI passes, the human leads; describe for the waiting AI has no legal list.
    m = play(m, "ai", "pass");
    const t2 = paodekuai.describe(st(m), { human: "Seren", ai: "Claude" });
    expect(t2).toContain("Seren leads the next trick.");
    expect(t2).not.toContain("Legal plays");
  });

  it("caps the AI's legal list when leading a full hand", () => {
    const m = newMatch(false);
    const t = describeMatch(m);
    expect(t).toContain("You lead a new trick");
    const n = (t.match(/^- "/gm) ?? []).length;
    expect(n).toBeLessThanOrEqual(40);
    expect(t).not.toContain('- "pass"');
    for (const c of st(m).hands.human) expect(t).not.toContain(pdkCardText(c));
  });
});
