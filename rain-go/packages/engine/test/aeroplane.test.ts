import { describe, expect, it } from "vitest";
import {
  AEROPLANE_LOOP_CELLS,
  aeroplane,
  aeroplaneCell,
  aeroplaneGlobal,
  aeroplaneSquareColour,
  applyMatchAction,
  createMatch,
  describeMatch,
  randomInt,
  statusOf,
  viewMatch,
  type AeroplaneState,
  type AeroplaneView,
  type Match,
} from "../src";

const newMatch = (humanFirst = true, options: Record<string, string> = {}, seed = 42) =>
  createMatch({ id: "a1", kind: "aeroplane", humanFirst, options, humanName: "Seren", aiName: "Claude", seed, now: 0 });

const st = (m: Match) => m.state as AeroplaneState;

/** Test helper: an RNG state whose next rolls are exactly `rolls`. */
function aeroplaneRigRng(rolls: number[]): number {
  for (let seed = 1_000_003; seed < 9_000_000; seed++) {
    let s = seed;
    let ok = true;
    for (const want of rolls) {
      const [r, next] = randomInt(s, 6);
      s = next;
      if (r + 1 !== want) {
        ok = false;
        break;
      }
    }
    if (ok) return seed;
  }
  throw new Error("no seed found");
}

/** Test helper: the match with crafted plane positions and forced upcoming rolls. */
function aeroplaneCraft(m: Match, patch: Partial<AeroplaneState>, rolls: number[] = []): Match {
  const s = { ...st(m), ...patch };
  if (rolls.length) s.rng = aeroplaneRigRng(rolls);
  return { ...m, state: s };
}

function play(m: Match, who: "human" | "ai", move: string): Match {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  if (!res.ok) throw new Error(`${who} ${move}: ${res.message}`);
  return res.match;
}

function reject(m: Match, who: "human" | "ai", move: string): string {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  expect(res.ok).toBe(false);
  return res.ok ? "" : res.message;
}

const H = -1;

describe("aeroplane board", () => {
  it("has 52 distinct loop squares cycling four colours, with the geometry the rules rely on", () => {
    const keys = new Set(AEROPLANE_LOOP_CELLS.map(([x, y]) => `${x},${y}`));
    expect(keys.size).toBe(52);
    // Neighbouring loop squares are one step apart (diagonal at the inner corners).
    for (let g = 0; g < 52; g++) {
      const [x1, y1] = AEROPLANE_LOOP_CELLS[g]!;
      const [x2, y2] = AEROPLANE_LOOP_CELLS[(g + 1) % 52]!;
      expect(Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))).toBe(1);
    }
    for (const colour of [0, 2]) {
      for (let p = 4; p <= 52; p += 4) expect(aeroplaneSquareColour(aeroplaneGlobal(colour, p))).toBe(colour);
      // The fly shortcut is a straight line of length 2 across the opposite home column.
      const [a, b] = [aeroplaneCell(colour, 20), aeroplaneCell(colour, 32)];
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBe(2);
      // The entrance square leads straight into the home column and on to the centre.
      expect(aeroplaneCell(colour, 59)).not.toEqual([7, 7]);
      const e = aeroplaneCell(colour, 52);
      const c1 = aeroplaneCell(colour, 53);
      expect(Math.abs(e[0] - c1[0]) + Math.abs(e[1] - c1[1])).toBe(1);
    }
  });
});

describe("aeroplane rules", () => {
  it("is ready with one option and seats by humanFirst", () => {
    expect(aeroplane.ready).toBe(true);
    expect(aeroplane.options.length).toBe(1);
    expect(viewMatch(newMatch(true), "human").seats).toEqual({ human: "先手", ai: "后手" });
    const m = newMatch(false);
    expect(viewMatch(m, "human").seats).toEqual({ human: "后手", ai: "先手" });
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
  });

  it("rolls deterministically per seed", () => {
    const rolls = (seed: number) => {
      let m = newMatch(true, {}, seed);
      const out: number[] = [];
      for (let i = 0; i < 12; i++) {
        const who = statusOf(m).waitingOn[0]!;
        // Keep everyone in the hangar so every non-6 roll passes and the next side rolls.
        m = aeroplaneCraft(m, { planes: [[H, H, H, H], [H, H, H, H]], phase: "roll", sixes: 0 });
        m = play(m, who, "roll");
        out.push(st(m).roll!);
      }
      return out;
    };
    expect(rolls(7)).toEqual(rolls(7));
    expect(rolls(7)).not.toEqual(rolls(8));
    for (const r of rolls(9)) expect(r >= 1 && r <= 6).toBe(true);
  });

  it("takes off only on a 6 by default", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[5, H, H, H], [H, H, H, H]] }, [5]);
    m = play(m, "human", "roll");
    expect(reject(m, "human", "launch 2")).toBe("要掷到 6 才能起飞");
    expect(reject(m, "human", "move 2")).toBe("要掷到 6 才能起飞");
    expect(viewMatch<AeroplaneView>(m, "human").view.choices.map((c) => c.move)).toEqual(["move 1"]);

    m = aeroplaneCraft(newMatch(), {}, [6]);
    m = play(m, "human", "roll");
    m = play(m, "human", "起飞 2");
    expect(st(m).planes[0]).toEqual([H, 0, H, H]);
    expect(m.log.at(-1)!.move).toBe("掷出 6，2 号飞机起飞，再掷一次");
  });

  it("takes off on a 5 with the 56 option", () => {
    let m = aeroplaneCraft(newMatch(true, { takeoff: "56" }), {}, [5]);
    expect(st(m).takeoff).toEqual([5, 6]);
    m = play(m, "human", "roll");
    m = play(m, "human", "launch 3");
    expect(st(m).planes[0]).toEqual([H, H, 0, H]);
    // A 5 is not a 6: no extra roll.
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    let m2 = aeroplaneCraft(newMatch(true, { takeoff: "56" }), { planes: [[3, H, H, H], [H, H, H, H]] }, [4]);
    m2 = play(m2, "human", "roll");
    expect(reject(m2, "human", "launch 2")).toBe("要掷到 5 或 6 才能起飞");
  });

  it("gives another roll after a 6", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[1, H, H, H], [H, H, H, H]] }, [6, 2]);
    m = play(m, "human", "roll");
    m = play(m, "human", "move 1");
    expect(st(m).planes[0][0]).toBe(7);
    expect(st(m).phase).toBe("roll");
    expect(statusOf(m).waitingOn).toEqual(["human"]);
    m = play(m, "human", "roll");
    m = play(m, "human", "走 1");
    expect(st(m).planes[0][0]).toBe(9);
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    expect(st(m).prev!.events.map((e) => e.k)).toEqual(["roll", "move", "roll", "move"]);
    expect(st(m).events).toEqual([]);
  });

  it("sends the plane moved on the third 6 back to its hangar and ends the turn", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[1, 30, H, H], [H, H, H, H]] }, [6, 6, 6]);
    m = play(m, "human", "roll");
    m = play(m, "human", "move 1");
    m = play(m, "human", "roll");
    m = play(m, "human", "move 1");
    expect(st(m).planes[0][0]).toBe(13);
    m = play(m, "human", "roll");
    expect(st(m).sixes).toBe(3);
    const v = viewMatch<AeroplaneView>(m, "human").view;
    expect(v.choices.every((c) => c.sentBack && c.to === H)).toBe(true);
    expect(describeMatch(aeroplaneCraft(m, { humanSeat: 1 }))).toContain("third 6 in a row");
    m = play(m, "human", "move 1");
    expect(st(m).planes[0]).toEqual([H, 30, H, H]);
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    expect(m.log.at(-1)!.move).toContain("连掷三个 6，1 号飞机退回机场");
  });

  it("jumps to the next square of its own colour", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[2, H, H, H], [H, H, H, H]] }, [2]);
    m = play(m, "human", "roll");
    const c = viewMatch<AeroplaneView>(m, "human").view.choices[0]!;
    expect(c).toMatchObject({ move: "move 1", land: 4, jump: 8, fly: null, to: 8, captures: [] });
    m = play(m, "human", "move 1");
    expect(st(m).planes[0][0]).toBe(8);
    expect(m.log.at(-1)!.move).toBe("掷出 2，1 号飞机前进到 4，跳到 8");
    // The entrance square (step 52) does not jump.
    let e = aeroplaneCraft(newMatch(), { planes: [[49, H, H, H], [H, H, H, H]] }, [3]);
    e = play(e, "human", "roll");
    e = play(e, "human", "move 1");
    expect(st(e).planes[0][0]).toBe(52);
  });

  it("flies along the shortcut, and a jump onto the fly square then flies", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[17, 14, 28, H], [H, H, H, H]] }, [3]);
    m = play(m, "human", "roll");
    const byPlane = Object.fromEntries(viewMatch<AeroplaneView>(m, "human").view.choices.map((c) => [c.plane, c]));
    // Straight onto the fly square: fly 20 -> 32, and no jump after the fly.
    expect(byPlane[1]).toMatchObject({ land: 20, jump: null, fly: 32, to: 32 });
    // 14 + 3 = 17 is not an own-colour square: a plain move.
    expect(byPlane[2]).toMatchObject({ land: 17, jump: null, fly: null, to: 17 });
    m = play(m, "human", "move 1");
    expect(st(m).planes[0][0]).toBe(32);
    expect(m.log.at(-1)!.move).toBe("掷出 3，1 号飞机前进到 20，飞到 32");

    let j = aeroplaneCraft(newMatch(), { planes: [[14, 26, H, H], [H, H, H, H]] }, [2]);
    j = play(j, "human", "roll");
    const jc = Object.fromEntries(viewMatch<AeroplaneView>(j, "human").view.choices.map((c) => [c.plane, c]));
    expect(jc[1]).toMatchObject({ land: 16, jump: 20, fly: 32, to: 32 });
    // A jump onto 32 does not fly.
    expect(jc[2]).toMatchObject({ land: 28, jump: 32, fly: null, to: 32 });
    j = play(j, "human", "move 1");
    expect(st(j).planes[0][0]).toBe(32);
    expect(st(j).events.map((e) => e.k)).toEqual([]);
    expect(st(j).prev!.events.map((e) => e.k)).toEqual(["roll", "move", "jump", "fly"]);
    expect(describeMatch(aeroplaneCraft(j, { humanSeat: 1, toMove: 1, phase: "roll" }))).toContain("jumped to square 20; flew the shortcut to square 32");
  });

  it("captures every opponent plane on the final square", () => {
    // Seat 0 step 7 is loop index 6; seat 1 (colour 2) reaches the same square at its step 33.
    expect(aeroplaneGlobal(0, 7)).toBe(aeroplaneGlobal(2, 33));
    let m = aeroplaneCraft(newMatch(), { planes: [[5, H, H, H], [33, 33, 10, H]] }, [2]);
    m = play(m, "human", "roll");
    expect(viewMatch<AeroplaneView>(m, "human").view.choices[0]!.captures).toEqual([1, 2]);
    m = play(m, "human", "move 1");
    expect(st(m).planes[1]).toEqual([H, H, 10, H]);
    expect(m.log.at(-1)!.move).toBe("掷出 2，1 号飞机前进到 7，撞回对手 1、2 号");

    // Capture after a jump: 2 + 2 = 4, jumps to 8 where the opponent sits.
    const q = [...Array(53).keys()].find((k) => k > 0 && aeroplaneGlobal(2, k) === aeroplaneGlobal(0, 8))!;
    let j = aeroplaneCraft(newMatch(), { planes: [[2, H, H, H], [q, H, H, H]] }, [2]);
    j = play(j, "human", "roll");
    j = play(j, "human", "1");
    expect(st(j).planes[1][0]).toBe(H);
    expect(m.log.length).toBe(2);
    // Own planes share squares without harm.
    let s = aeroplaneCraft(newMatch(), { planes: [[5, 7, H, H], [H, H, H, H]] }, [2]);
    s = play(s, "human", "roll");
    s = play(s, "human", "move 1");
    expect(st(s).planes[0]).toEqual([7, 7, H, H]);
  });

  it("needs the exact roll to reach the centre and bounces back the excess", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[56, 57, H, H], [H, H, H, H]] }, [3]);
    m = play(m, "human", "roll");
    const cs = viewMatch<AeroplaneView>(m, "human").view.choices;
    expect(cs[0]).toMatchObject({ to: 59, home: true, bounce: false });
    expect(cs[1]).toMatchObject({ to: 58, bounce: true, home: false });
    m = play(m, "human", "move 1");
    expect(st(m).planes[0][0]).toBe(59);
    expect(reject(m, "ai", "move 1")).toBe("先掷骰子");

    let b = aeroplaneCraft(newMatch(), { planes: [[57, H, H, H], [H, H, H, H]] }, [5]);
    b = play(b, "human", "roll");
    b = play(b, "human", "move 1");
    expect(st(b).planes[0][0]).toBe(56);
    expect(b.log.at(-1)!.move).toBe("掷出 5，1 号飞机到终点反弹，退到跑道第 4 格");
    // No jumping in the home column even on steps divisible by 4.
    let c = aeroplaneCraft(newMatch(), { planes: [[53, H, H, H], [H, H, H, H]] }, [3]);
    c = play(c, "human", "roll");
    c = play(c, "human", "move 1");
    expect(st(c).planes[0][0]).toBe(56);
  });

  it("passes automatically when no plane can move", () => {
    let m = aeroplaneCraft(newMatch(), {}, [4]);
    m = play(m, "human", "roll");
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    expect(st(m).phase).toBe("roll");
    expect(st(m).prev).toEqual({ seat: 0, events: [{ k: "roll", seat: 0, value: 4 }, { k: "pass", seat: 0, again: false }] });
    expect(m.log.at(-1)!.move).toBe("掷出 4，没有飞机能动，轮到对手");
    // Planes that are home do not count as movable either.
    let d = aeroplaneCraft(newMatch(), { planes: [[59, 59, H, H], [H, H, H, H]] }, [2]);
    d = play(d, "human", "roll");
    expect(statusOf(d).waitingOn).toEqual(["ai"]);
  });

  it("wins with all four planes home", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[59, 59, 55, 59], [59, 59, 3, H]] }, [4]);
    m = play(m, "human", "roll");
    m = play(m, "human", "move");
    const s = statusOf(m);
    expect(s.outcome).toEqual({ winner: "human", text: "4 架全部到家 · 对手到家 2 架" });
    expect(s.waitingOn).toEqual([]);
    expect(s.resultText).toBe("Seren 胜 · 4 架全部到家 · 对手到家 2 架");
    expect(reject(m, "ai", "roll")).toBe("对局已经结束");
  });

  it("rejects out-of-turn and invalid moves in Chinese", () => {
    let m = aeroplaneCraft(newMatch(), { planes: [[10, 20, 59, H], [H, H, H, H]] }, [3]);
    expect(reject(m, "ai", "roll")).toBe("还没轮到你");
    expect(reject(m, "human", "move 1")).toBe("先掷骰子");
    expect(reject(m, "human", "fly to the moon")).toBe("看不懂这步：fly to the moon");
    m = play(m, "human", "掷骰");
    expect(reject(m, "human", "roll")).toBe("已经掷出 3，先选一架飞机");
    expect(reject(m, "human", "move 3")).toBe("3 号飞机已经到家了");
    expect(reject(m, "human", "launch 1")).toBe("1 号飞机已经起飞了");
    expect(reject(m, "human", "move")).toBe("要说是几号飞机");
    expect(reject(m, "human", "move 5")).toBe("看不懂这步：move 5");
    expect(reject(m, "ai", "move 1")).toBe("还没轮到你");
    let h = aeroplaneCraft(newMatch(), { planes: [[10, H, H, H], [H, H, H, H]] }, [6]);
    h = play(h, "human", "roll");
    expect(reject(h, "human", "move 2")).toBe("2 号飞机还在机场，用「起飞 2」");
  });

  it("keeps the RNG out of view and describe, and lists the AI's legal moves", () => {
    let m = aeroplaneCraft(newMatch(false), { planes: [[H, H, H, H], [5, 29, H, 59]] }, [2]);
    const rng = st(m).rng;
    // humanFirst=false: the AI is seat 0 and moves first. Swap seats so the AI plays seat 1 now.
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    m = aeroplaneCraft(m, { humanSeat: 0, toMove: 1 });
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    m = play(m, "ai", "roll");
    for (const who of ["human", "ai"] as const) {
      const v = viewMatch<AeroplaneView>(m, who).view as unknown as Record<string, unknown>;
      expect("rng" in v).toBe(false);
      expect(JSON.stringify(v)).not.toContain(String(st(m).rng));
    }
    expect(viewMatch<AeroplaneView>(m, "ai").view.you).toBe(1);
    expect(viewMatch<AeroplaneView>(m, "human").view.you).toBe(0);
    const text = describeMatch(m);
    expect(text).not.toContain(String(st(m).rng));
    expect(text).not.toContain(String(rng));
    expect(text).toContain("Status: YOUR TURN");
    expect(text).toContain("Your turn: you rolled 2. Legal moves:");
    // Seat 1 step 7 is square 33 (26 + 7); step 31 is square 57 - 52 = 5.
    expect(text).toContain("move 1 → lands on square 33");
    expect(text).toContain("move 2 → lands on square 5");
    expect(text).toContain("plane 4: home");
    expect(text).toContain("Last roll: 2 (by you).");
  });

  it("describes jump, fly and capture outcomes for the AI", () => {
    const q = [...Array(53).keys()].find((k) => k > 0 && aeroplaneGlobal(0, k) === aeroplaneGlobal(2, 32))!;
    let m = aeroplaneCraft(newMatch(), { planes: [[q, H, H, H], [14, H, H, H]], toMove: 1 }, [2]);
    m = play(m, "ai", "roll");
    expect(describeMatch(m)).toContain("move 1 → lands on square 42, jumps to square 46, flies to square 6, captures opponent plane 1");
  });
});
