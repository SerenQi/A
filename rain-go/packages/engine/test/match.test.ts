import { describe, expect, it } from "vitest";
import {
  GAMES,
  applyMatchAction,
  createMatch,
  describeMatch,
  reversiLegal,
  shuffled,
  statusOf,
  viewMatch,
  type Match,
  type MatchAction,
} from "../src";

const newMatch = (kind: Match["kind"], humanFirst = true) =>
  createMatch({ id: "m1", kind, humanFirst, humanName: "Seren", aiName: "Claude", seed: 42, now: 0 });

function run(m: Match, steps: [who: "human" | "ai", action: MatchAction | string][]): Match {
  for (const [who, a] of steps) {
    const res = applyMatchAction(m, who, typeof a === "string" ? { type: "move", move: a } : a, 1);
    if (!res.ok) throw new Error(`${who} ${JSON.stringify(a)}: ${res.message}`);
    m = res.match;
  }
  return m;
}

describe("rng", () => {
  it("shuffles deterministically", () => {
    const [a, s1] = shuffled([1, 2, 3, 4, 5, 6, 7, 8], 7);
    const [b] = shuffled([1, 2, 3, 4, 5, 6, 7, 8], 7);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(s1).not.toBe(7);
  });
});

describe("match layer", () => {
  it("every ready module declares consistent metadata", () => {
    for (const g of Object.values(GAMES)) {
      expect(g.name.zh.length).toBeGreaterThan(0);
      if (!g.ready) continue;
      expect(g.rules.length).toBeGreaterThan(20);
      for (const o of g.options) expect(o.choices.some((c) => c.value === o.default)).toBe(true);
    }
  });

  it("rejects placeholder games", () => {
    const stub = Object.values(GAMES).find((g) => !g.ready);
    if (stub) expect(() => newMatch(stub.kind)).toThrow();
  });

  it("plays Go through the generic layer", () => {
    let m = newMatch("go");
    m = run(m, [["human", "E5"], ["ai", "pass"], ["human", "pass"]]);
    expect(statusOf(m).waitingOn.sort()).toEqual(["ai", "human"]);
    m = run(m, [["human", "accept"], ["ai", "accept"]]);
    expect(statusOf(m).resultText).toBe("Seren 胜 · 黑 +73.5");
    expect(m.log.map((l) => l.move)).toEqual(["E5", "pass", "pass", "accept", "accept"]);
  });

  it("reports illegal moves with a Chinese message", () => {
    const m = newMatch("go");
    const res = applyMatchAction(m, "ai", { type: "move", move: "E5" }, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("还没轮到你");
  });

  it("handles resign, say and rename", () => {
    let m = newMatch("gomoku");
    m = run(m, [["ai", { type: "say", text: "hi" }], ["human", { type: "rename", aiName: "Lunare" }], ["ai", { type: "resign" }]]);
    expect(m.aiName).toBe("Lunare");
    expect(m.chat[0]?.text).toBe("hi");
    expect(statusOf(m).outcome?.winner).toBe("human");
    expect(statusOf(m).resultText).toBe("Lunare 认输");
    const again = applyMatchAction(m, "human", { type: "move", move: "H8" }, 2);
    expect(again.ok).toBe(false);
  });

  it("describes the match for the AI", () => {
    const m = run(newMatch("gomoku"), [["human", "H8"]]);
    const t = describeMatch(m, "https://x/g/m1");
    expect(t).toContain("Game m1 · Gomoku (五子棋)");
    expect(t).toContain("You are Claude (白)");
    expect(t).toContain("Status: YOUR TURN");
    expect(t).toContain("Last move: H8.");
  });

  it("builds a per-viewer view with status and seats", () => {
    const v = viewMatch(newMatch("reversi", false), "human");
    expect(v.seats).toEqual({ human: "白", ai: "黑" });
    expect(v.status.waitingOn).toEqual(["ai"]);
    expect("state" in v).toBe(false);
  });
});

describe("gomoku", () => {
  it("five in a row wins", () => {
    const m = run(newMatch("gomoku"), [
      ["human", "A1"], ["ai", "A2"], ["human", "B1"], ["ai", "B2"], ["human", "C1"], ["ai", "C2"], ["human", "D1"], ["ai", "D2"], ["human", "E1"],
    ]);
    expect(statusOf(m).resultText).toBe("Seren 胜 · 黑连五");
  });

  it("warns the AI about a four", () => {
    const m = run(newMatch("gomoku"), [["human", "A1"], ["ai", "A2"], ["human", "B1"], ["ai", "B2"], ["human", "C1"], ["ai", "C2"], ["human", "D1"]]);
    expect(describeMatch(m)).toContain("Opponent threatens five at: E1");
  });
});

describe("reversi", () => {
  it("starts with four legal moves and flips", () => {
    let m = newMatch("reversi");
    const s0 = m.state as { cells: number[] };
    expect(Object.keys(reversiLegal(s0.cells, 1)).length).toBe(4);
    m = run(m, [["human", "d3"]]);
    const s = m.state as { cells: number[]; flipped: number[]; toPlay: number };
    expect(s.flipped).toEqual([27]);
    expect(s.toPlay).toBe(2);
    const bad = applyMatchAction(m, "ai", { type: "move", move: "a1" }, 1);
    expect(bad.ok).toBe(false);
  });

  it("ends when neither side can move", () => {
    // Fastest known finish: black wins in 9 moves.
    const m = run(newMatch("reversi"), [
      ["human", "e6"], ["ai", "f4"], ["human", "e3"], ["ai", "f6"], ["human", "g5"], ["ai", "d6"], ["human", "e7"], ["ai", "f5"], ["human", "c5"],
    ]);
    const st = statusOf(m);
    expect(st.outcome?.winner).toBe("human");
    expect(st.waitingOn).toEqual([]);
  });
});
