import { describe, expect, it } from "vitest";
import {
  POKER_DECK,
  applyMatchAction,
  createMatch,
  describeMatch,
  poker,
  pokerBestHand,
  pokerBlinds,
  pokerCompare,
  pokerHandNameZh,
  statusOf,
  viewMatch,
  type Match,
  type PokerState,
  type PokerView,
} from "../src";

type Who = "human" | "ai";

const newMatch = (opts: { humanFirst?: boolean; seed?: number; hands?: string } = {}) =>
  createMatch({
    id: "p1",
    kind: "poker",
    humanFirst: opts.humanFirst ?? true,
    humanName: "Seren",
    aiName: "Claude",
    seed: opts.seed ?? 42,
    now: 0,
    options: opts.hands ? { hands: opts.hands } : undefined,
  });

const S = (m: Match) => m.state as PokerState;
const V = (m: Match, who: Who = "human") => viewMatch<PokerView>(m, who).view;

function play(m: Match, who: Who, move: string): Match {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  if (!res.ok) throw new Error(`${who} ${move}: ${res.message}`);
  return res.match;
}
function run(m: Match, steps: [Who, string][]): Match {
  for (const [who, mv] of steps) m = play(m, who, mv);
  return m;
}
function errorOf(m: Match, who: Who, move: string): string {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  expect(res.ok).toBe(false);
  return res.ok ? "" : res.message;
}
/** Sets the current hand's hole cards and the upcoming board cards (next cards in the deck). */
function rig(m: Match, human: string[], ai: string[], board: string[], stacks?: { human?: number; ai?: number }): Match {
  const s = structuredClone(S(m));
  const used = new Set([...human, ...ai, ...board]);
  s.hole = { human, ai };
  s.deck = [...board, ...POKER_DECK.filter((c) => !used.has(c))];
  if (stacks?.human !== undefined) s.stacks.human = stacks.human;
  if (stacks?.ai !== undefined) s.stacks.ai = stacks.ai;
  return { ...m, state: s };
}
const total = (s: PokerState) => s.stacks.human + s.stacks.ai + s.committed.human + s.committed.ai;
const wait = (m: Match) => statusOf(m).waitingOn;
/** Whoever is to act folds (or checks when fold is not allowed). */
function foldHand(m: Match): Match {
  const who = wait(m)[0]!;
  return play(m, who, V(m, who).toCall > 0 ? "fold" : "check");
}

describe("poker dealing", () => {
  it("is deterministic for a seed and deals 52 distinct cards", () => {
    const a = S(newMatch({ seed: 7 }));
    const b = S(newMatch({ seed: 7 }));
    const c = S(newMatch({ seed: 8 }));
    expect(a).toEqual(b);
    expect(a.hole).not.toEqual(c.hole);
    const all = [...a.hole.human, ...a.hole.ai, ...a.deck];
    expect(all.length).toBe(52);
    expect(new Set(all).size).toBe(52);
    expect([...all].sort()).toEqual([...POKER_DECK].sort());
    // Next hand is reshuffled from the RNG in state, still deterministic.
    const a2 = S(foldHand(newMatch({ seed: 7 })));
    const b2 = S(foldHand(newMatch({ seed: 7 })));
    expect(a2.hole).toEqual(b2.hole);
    expect(a2.rng).not.toBe(a.rng);
    expect(new Set([...a2.hole.human, ...a2.hole.ai, ...a2.deck]).size).toBe(52);
  });

  it("posts blinds and alternates the button", () => {
    let m = newMatch();
    let s = S(m);
    expect(s.button).toBe("human");
    expect(s.bets).toEqual({ human: 10, ai: 20 });
    expect(s.stacks).toEqual({ human: 990, ai: 980 });
    expect(poker.seats(s)).toEqual({ human: "玩家一", ai: "玩家二" });
    m = foldHand(m);
    s = S(m);
    expect(s.hand).toBe(2);
    expect(s.button).toBe("ai");
    expect(s.bets).toEqual({ human: 20, ai: 10 });
    expect(s.stacks).toEqual({ human: 970, ai: 1000 });
    expect(poker.seats(S(newMatch({ humanFirst: false })))).toEqual({ human: "玩家二", ai: "玩家一" });
    expect(S(newMatch({ humanFirst: false })).button).toBe("ai");
  });

  it("doubles the blinds every 10 hands", () => {
    expect(pokerBlinds(1)).toEqual([10, 20]);
    expect(pokerBlinds(10)).toEqual([10, 20]);
    expect(pokerBlinds(11)).toEqual([20, 40]);
    expect(pokerBlinds(21)).toEqual([40, 80]);
    let m = newMatch();
    for (let i = 0; i < 10; i++) m = foldHand(m);
    const s = S(m);
    expect(s.hand).toBe(11);
    expect([s.sb, s.bb]).toEqual([20, 40]);
    expect(s.bets[s.button]).toBe(20);
    expect(total(s)).toBe(2000);
  });
});

describe("poker betting", () => {
  it("button acts first pre-flop and last after the flop", () => {
    let m = newMatch();
    expect(wait(m)).toEqual(["human"]);
    expect(errorOf(m, "ai", "call")).toBe("还没轮到你");
    m = play(m, "human", "call");
    expect(wait(m)).toEqual(["ai"]); // big blind option
    expect(V(m, "ai").legal).toEqual(["check", "raise", "allin"]);
    m = play(m, "ai", "check");
    expect(S(m).street).toBe("flop");
    expect(S(m).board.length).toBe(3);
    expect(wait(m)).toEqual(["ai"]);
    m = run(m, [["ai", "check"], ["human", "check"]]);
    expect(S(m).street).toBe("turn");
    expect(wait(m)).toEqual(["ai"]);

    let n = newMatch({ humanFirst: false });
    expect(wait(n)).toEqual(["ai"]);
    n = run(n, [["ai", "call"], ["human", "check"]]);
    expect(wait(n)).toEqual(["human"]);
  });

  it("validates check, bet, call, raise and min-raise", () => {
    let m = newMatch();
    expect(errorOf(m, "human", "check")).toBe("要跟注 10 或者弃牌");
    expect(errorOf(m, "human", "raise 30")).toBe("加注至少要到 40");
    expect(errorOf(m, "human", "raise 5000")).toBe("筹码不够，最多到 1000");
    expect(errorOf(m, "human", "hello")).toBe("看不懂这步：hello");
    expect(errorOf(m, "human", "raise 0")).toBe("加注至少要到 40");
    const v = V(m);
    expect([v.toCall, v.minRaiseTo, v.maxRaiseTo]).toEqual([10, 40, 1000]);
    expect(v.legal).toEqual(["fold", "call", "raise", "allin"]);

    m = play(m, "human", "加注 60"); // raise to 60: increment 40
    expect(S(m).bets.human).toBe(60);
    expect(V(m, "ai").minRaiseTo).toBe(100);
    expect(errorOf(m, "ai", "raise 90")).toBe("加注至少要到 100");
    m = play(m, "ai", "Raise to 100");
    expect(V(m).minRaiseTo).toBe(140);
    m = play(m, "human", "跟注");
    expect(S(m).street).toBe("flop");
    expect(S(m).stacks).toEqual({ human: 900, ai: 900 });
    expect(errorOf(m, "ai", "fold")).toBe("现在可以过牌，不用弃牌");
    expect(errorOf(m, "ai", "bet 10")).toBe("下注至少 20");
    m = play(m, "ai", "下注 40");
    expect(errorOf(m, "human", "raise 70")).toBe("加注至少要到 80");
    m = play(m, "human", "raise 80");
    m = play(m, "ai", "call");
    expect(S(m).street).toBe("turn");
    m = run(m, [["ai", "过牌"], ["human", "check"]]);
    expect(S(m).street).toBe("river");
    expect(total(S(m))).toBe(2000);
    m = run(m, [["ai", "x"], ["human", "CHECK"]]);
    expect(S(m).hand).toBe(2);
    expect(S(m).lastHand?.pot).toBe(360);
  });

  it("fold awards the pot and returns the uncalled bet", () => {
    let m = run(newMatch(), [["human", "raise 60"], ["ai", "弃牌"]]);
    const lh = S(m).lastHand!;
    expect(lh.folded).toBe("ai");
    expect(lh.winners).toEqual(["human"]);
    expect(lh.pot).toBe(40);
    expect(lh.net).toEqual({ human: 20, ai: -20 });
    expect(lh.shown).toEqual({});
    // Next hand already dealt: human is now the big blind.
    expect(S(m).hand).toBe(2);
    expect(S(m).stacks).toEqual({ human: 1000, ai: 970 });
    expect(wait(m)).toEqual(["ai"]);
    m = foldHand(m);
    expect(S(m).stacks.human + S(m).stacks.ai + S(m).committed.human + S(m).committed.ai).toBe(2000);
  });

  it("an all-in for less than a raise does not reopen betting", () => {
    // AI (big blind) has only 70 in total.
    let m = rig(newMatch(), ["2c", "7d"], ["3h", "8s"], ["Kd", "Qd", "9c", "5h", "4s"], { ai: 50 });
    m = play(m, "human", "raise 60");
    m = play(m, "ai", "allin"); // to 70: an increment of 10 < 40
    expect(S(m).bets.ai).toBe(70);
    expect(S(m).lastRaise).toBe(40);
    const v = V(m);
    expect(v.legal).toEqual(["fold", "call", "allin"]);
    expect(v.toCall).toBe(10);
    expect(errorOf(m, "human", "raise 200")).toBe("对方已经全下，只能跟注或弃牌");
    m = play(m, "human", "call");
    const lh = S(m).lastHand!;
    expect(lh.board.length).toBe(5);
    expect(lh.pot).toBe(140);
    expect(lh.winners).toEqual(["ai"]); // 8 high beats 7 high
  });

  it("a short all-in call returns the uncalled part", () => {
    let m = rig(newMatch(), ["Ac", "Ad"], ["Kh", "Ks"], ["2d", "7c", "9h", "Js", "3c"], { ai: 30 });
    m = play(m, "human", "raise 300");
    expect(V(m, "ai").legal).toEqual(["fold", "call", "allin"]);
    m = play(m, "ai", "call"); // all-in for 50 total
    const lh = S(m).lastHand!;
    expect(lh.pot).toBe(100);
    expect(lh.winners).toEqual(["human"]);
    expect(statusOf(m).outcome).toEqual({ winner: "human", text: "赢光筹码" });
    expect(S(m).stacks.human).toBe(1000 + 50);
  });

  it("runs out the board when both are all-in and splits a tie", () => {
    let m = rig(newMatch(), ["2c", "3d"], ["4h", "5c"], ["As", "Ks", "Qs", "Js", "Ts"]);
    m = run(m, [["human", "全下"], ["ai", "call"]]);
    const lh = S(m).lastHand!;
    expect(lh.board).toEqual(["As", "Ks", "Qs", "Js", "Ts"]);
    expect(lh.winners).toEqual(["human", "ai"]);
    expect(lh.won).toEqual({ human: 1000, ai: 1000 });
    expect(lh.names).toEqual({ human: "皇家同花顺", ai: "皇家同花顺" });
    expect(lh.shown).toEqual({ human: ["2c", "3d"], ai: ["4h", "5c"] });
    expect(S(m).hand).toBe(2);
    expect(S(m).stacks).toEqual({ human: 980, ai: 990 });
  });

  it("runs out the board after a post-flop all-in", () => {
    let m = rig(newMatch(), ["Ah", "Kh"], ["Qc", "Qd"], ["Qh", "2h", "7h", "9s", "3d"]);
    m = run(m, [["human", "call"], ["ai", "check"], ["ai", "bet 100"], ["human", "allin"], ["ai", "call"]]);
    const lh = S(m).lastHand!;
    expect(lh.board.length).toBe(5);
    expect(lh.names).toEqual({ human: "同花 A 高", ai: "三条 Q" });
    expect(statusOf(m).outcome?.winner).toBe("human");
  });
});

describe("poker hand evaluator", () => {
  const best = (s: string) => pokerBestHand(s.split(" "));
  const name = (s: string) => pokerHandNameZh(best(s));
  const cmp = (a: string, b: string) => Math.sign(pokerCompare(best(a), best(b)));

  it("names every category", () => {
    expect(name("As Kd 9c 7h 4s 3d 2c")).toBe("高牌 A");
    expect(name("Ks Kd 9c 7h 4s 3d 2c")).toBe("一对 K");
    expect(name("Ks Kd 9c 9h 4s 3d 2c")).toBe("两对 K 和 9");
    expect(name("7s 7d 7c Kh 4s 3d 2c")).toBe("三条 7");
    expect(name("5s 6d 7c 8h 9s Kd 2c")).toBe("顺子 5-9");
    expect(name("Ah 2d 3c 4h 5s Kd 9c")).toBe("顺子 A-5");
    expect(name("Ts Jd Qc Kh As 2d 2c")).toBe("顺子 10-A");
    expect(name("2h 7h 9h Jh Kh As 3c")).toBe("同花 K 高");
    expect(name("Ks Kd Kc 9h 9s 3d 2c")).toBe("葫芦 K 带 9");
    expect(name("9s 9d 9c 9h 4s 3d 2c")).toBe("四条 9");
    expect(name("5h 6h 7h 8h 9h Kd 2c")).toBe("同花顺 9 高");
    expect(name("Ah 2h 3h 4h 5h Kd 9c")).toBe("同花顺 5 高");
    expect(name("Th Jh Qh Kh Ah 2d 2c")).toBe("皇家同花顺");
    expect(best("Ah 2h 3h 4h 5h Kd 9c").cat).toBe(8);
  });

  it("ranks categories and compares kickers exactly", () => {
    const ladder = [
      "As Kd 9c 7h 4s 3d 2c",
      "2s 2d 9c 7h 4s 3d Kc",
      "2s 2d 3c 3h 9s Td Kc",
      "2s 2d 2c 7h 9s Td Kc",
      "Ah 2d 3c 4h 5s Kd 9c",
      "2h 7h 9h Jh Kh As 3c",
      "2s 2d 2c 3h 3s Td Kc",
      "2s 2d 2c 2h 9s Td Kc",
      "Ah 2h 3h 4h 5h Kd 9c",
    ];
    for (let i = 1; i < ladder.length; i++) expect(cmp(ladder[i]!, ladder[i - 1]!)).toBe(1);
    // Wheel is the lowest straight.
    expect(cmp("2h 3d 4c 5h 6s Kd 9c", "Ah 2d 3c 4h 5s Kd 9c")).toBe(1);
    // Pair kickers.
    expect(cmp("As Ad Kc 7h 4s", "Ah Ac Qc 7d 4d")).toBe(1);
    expect(cmp("As Ad Kc 7h 4s", "Ah Ac Kd 7d 3d")).toBe(1);
    // Two pair: the fifth card decides.
    expect(cmp("Ks Kd 9c 9h As 3d 2c", "Kh Kc 9s 9d Qs 3h 2h")).toBe(1);
    // Flush compares all five cards.
    expect(cmp("2h 7h 9h Jh Kh", "3d 6d 9d Jd Kd")).toBe(1);
    expect(cmp("2h 7h 9h Jh Kh", "3d 7d 9d Jd Kd")).toBe(-1);
    // Board plays: tie.
    expect(cmp("2c 3d As Ks Qs Js Ts", "4h 5c As Ks Qs Js Ts")).toBe(0);
    // Full house: trips first.
    expect(cmp("3s 3d 3c 2h 2s", "2d 2c 2h Ah As")).toBe(1);
    // Two players share trips on board, kicker decides.
    expect(cmp("Ac 4d 9s 9h 9d 7c 2s", "Kc 4h 9s 9h 9d 7c 2s")).toBe(1);
  });
});

describe("poker match end", () => {
  it("ends when a player busts", () => {
    let m = rig(newMatch(), ["As", "Ah"], ["7c", "2d"], ["Kd", "9s", "4h", "Jc", "3s"]);
    m = run(m, [["human", "allin"], ["ai", "call"]]);
    const st = statusOf(m);
    expect(st.outcome).toEqual({ winner: "human", text: "赢光筹码" });
    expect(st.waitingOn).toEqual([]);
    expect(st.resultText).toBe("Seren 胜 · 赢光筹码");
    expect(S(m).stacks).toEqual({ human: 2000, ai: 0 });
    expect(V(m).over).toBe(true);
    expect(applyMatchAction(m, "human", { type: "move", move: "check" }, 2).ok).toBe(false);
  });

  it("ends at the hand limit with the chip leader winning", () => {
    let m = newMatch({ hands: "20" });
    m = run(m, [["human", "raise 60"], ["ai", "fold"]]);
    while (!statusOf(m).outcome) m = foldHand(m);
    expect(S(m).hand).toBe(20);
    expect(statusOf(m).outcome).toEqual({ winner: "human", text: "筹码 1030 : 970" });

    let d = newMatch({ hands: "20" });
    let hands = 0;
    while (!statusOf(d).outcome) {
      d = foldHand(d);
      hands++;
    }
    expect(hands).toBe(20);
    expect(statusOf(d).outcome).toEqual({ winner: "draw", text: "筹码 1000 : 1000" });
  });

  it("keeps dealing without a limit", () => {
    let m = newMatch({ hands: "0" });
    for (let i = 0; i < 25; i++) m = foldHand(m);
    expect(S(m).hand).toBe(26);
    expect(statusOf(m).outcome).toBeNull();
  });
});

describe("poker hidden information", () => {
  it("view never contains the opponent's hole cards before showdown", () => {
    let m = newMatch({ seed: 99 });
    for (let step = 0; step < 40; step++) {
      const s = S(m);
      for (const who of ["human", "ai"] as Who[]) {
        const v = V(m, who);
        const other = who === "human" ? "ai" : "human";
        expect(v.hole).toEqual(s.hole[who]);
        // The previous hand's summary is public; everything else must not mention the current hole cards.
        const json = JSON.stringify({ ...v, lastHand: null });
        for (const c of s.hole[other]) expect(json).not.toContain(`"${c}"`);
        if (v.lastHand && !v.lastHand.folded) expect(Object.keys(v.lastHand.shown).sort()).toEqual(["ai", "human"]);
        expect(json).not.toContain("deck");
        expect(json).not.toContain("rng");
      }
      const who = wait(m)[0]!;
      m = play(m, who, V(m, who).toCall > 0 ? "call" : "check");
    }
  });

  it("describe never contains the human's hole cards before showdown", () => {
    let m = newMatch({ seed: 5 });
    for (let step = 0; step < 40; step++) {
      const s = S(m);
      // Drop the public summary of the previous hand, which may share cards with this one.
      const text = describeMatch(m)
        .split("\n")
        .filter((l) => !l.startsWith("Last hand"))
        .join("\n");
      for (const c of s.hole.human) expect(text).not.toMatch(new RegExp(`\\b${c}\\b`));
      for (const c of s.hole.ai) expect(text).toContain(c);
      const who = wait(m)[0]!;
      m = play(m, who, V(m, who).toCall > 0 ? "call" : "check");
    }
  });

  it("describe lists the AI's legal moves on its turn", () => {
    const m = play(newMatch(), "human", "raise 60");
    const t = describeMatch(m);
    expect(t).toContain("Status: YOUR TURN");
    expect(t).toContain("To call: 40");
    expect(t).toContain("raise N (raise TO a street total N) with N from 100 to 1000");
    expect(t).toContain("Seren raises to 60");
    expect(t).toContain("You post BB 20");
    expect(t).toContain("Hand 1 of 50 · blinds 10/20");
  });

  it("lastHand reveals only shown-down hands", () => {
    let m = rig(newMatch(), ["Ah", "Kh"], ["Qc", "Jd"], ["2s", "5d", "9c", "Th", "3c"]);
    m = run(m, [["human", "call"], ["ai", "raise 100"], ["human", "fold"]]);
    const folded = S(m).lastHand!;
    expect(folded.shown).toEqual({});
    expect(JSON.stringify(V(m))).not.toContain('"Qc"');
    expect(describeMatch(m)).not.toMatch(/\bAh\b/);
    expect(describeMatch(m)).toContain("Seren folded; you won 40");

    m = rig(m, ["Ac", "Ad"], ["Ks", "Kd"], ["2h", "5c", "9d", "Tc", "3h"]);
    m = run(m, [["ai", "call"], ["human", "check"], ["human", "check"], ["ai", "check"], ["human", "check"], ["ai", "check"], ["human", "check"], ["ai", "check"]]);
    const shown = S(m).lastHand!;
    expect(shown.shown).toEqual({ human: ["Ac", "Ad"], ai: ["Ks", "Kd"] });
    expect(shown.names).toEqual({ human: "一对 A", ai: "一对 K" });
    expect(V(m, "ai").lastHand?.shown.human).toEqual(["Ac", "Ad"]);
    expect(describeMatch(m)).toContain("Seren showed Ac Ad (Pair of A (kickers T 9 5))");
  });
});
