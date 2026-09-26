import { describe, expect, it } from "vitest";
import {
  XIANGQI_START_FEN,
  applyMatchAction,
  createMatch,
  describeMatch,
  statusOf,
  viewMatch,
  xiangqiFromFen,
  xiangqiLegalMoves,
  xiangqiNotation,
  xiangqiParseFen,
  xiangqiParseIccs,
  xiangqiToFen,
  type Match,
  type XiangqiState,
  type XiangqiView,
} from "../src";

const newMatch = (humanFirst = true) =>
  createMatch({ id: "x1", kind: "xiangqi", humanFirst, humanName: "Seren", aiName: "Claude", seed: 1, now: 0 });
const fromFen = (fen: string, humanColor: "r" | "b" = "r"): Match => ({ ...newMatch(humanColor === "r"), state: xiangqiFromFen(fen, humanColor) });

function play(m: Match, ...moves: [who: "human" | "ai", move: string][]): Match {
  for (const [who, move] of moves) {
    const res = applyMatchAction(m, who, { type: "move", move }, 1);
    if (!res.ok) throw new Error(`${who} ${move}: ${res.message}`);
    m = res.match;
  }
  return m;
}
function reject(m: Match, who: "human" | "ai", move: string): string {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  expect(res.ok).toBe(false);
  return res.ok ? "" : res.message;
}
const legalFrom = (m: Match, from: string) => {
  const s = m.state as XiangqiState;
  return xiangqiLegalMoves(s.board, s.toPlay).filter((mv) => mv.startsWith(from)).sort();
};

describe("xiangqi setup", () => {
  it("starts with Red to move and 44 legal moves", () => {
    const m = newMatch();
    const s = m.state as XiangqiState;
    expect(xiangqiToFen(s.board, s.toPlay)).toBe(XIANGQI_START_FEN);
    expect(xiangqiLegalMoves(s.board, "r").length).toBe(44);
    expect(xiangqiLegalMoves(s.board, "b").length).toBe(44);
    expect(statusOf(m).waitingOn).toEqual(["human"]);
    expect(viewMatch(m, "human").seats).toEqual({ human: "红方", ai: "黑方" });
    expect(viewMatch(newMatch(false), "human").seats).toEqual({ human: "黑方", ai: "红方" });
    expect(statusOf(newMatch(false)).waitingOn).toEqual(["ai"]);
  });

  it("round-trips FEN and parses ICCS with or without a dash", () => {
    const fen = "3k5/9/R8/9/9/9/9/9/9/4K4 b";
    const { board, toPlay } = xiangqiParseFen(fen);
    expect(xiangqiToFen(board, toPlay)).toBe(fen);
    expect(xiangqiParseIccs("h2e2")).toEqual({ from: 25, to: 22 });
    expect(xiangqiParseIccs(" H2-E2 ")).toEqual({ from: 25, to: 22 });
    expect(xiangqiParseIccs("h2h2")).toBeNull();
    expect(xiangqiParseIccs("j2e2")).toBeNull();
  });

  it("generates moves quickly", () => {
    const s = newMatch().state as XiangqiState;
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) xiangqiLegalMoves(s.board, i % 2 ? "b" : "r");
    expect((performance.now() - t0) / 200).toBeLessThan(5);
  });
});

describe("xiangqi piece rules", () => {
  it("blocks the horse's leg (蹩马腿)", () => {
    const m = newMatch();
    // b0: leg c0 is occupied by the elephant, so d1 is out; a2 and c2 are fine.
    expect(legalFrom(m, "b0")).toEqual(["b0a2", "b0c2"]);
    expect(reject(m, "human", "b0d1")).toContain("蹩马腿");
    // An open horse in the middle reaches all eight points.
    const open = fromFen("3k5/9/9/9/9/4N4/9/9/9/4K4 w");
    expect(legalFrom(open, "e4").length).toBe(8);
    const hobbled = fromFen("3k5/9/9/9/4p4/4N4/9/9/9/4K4 w");
    expect(legalFrom(hobbled, "e4")).not.toContain("e4d6");
    expect(legalFrom(hobbled, "e4")).not.toContain("e4f6");
    expect(legalFrom(hobbled, "e4")).toContain("e4c5");
    expect(reject(hobbled, "human", "e4f6")).toContain("蹩马腿");
  });

  it("blocks the elephant's eye (塞象眼) and keeps it on its side of the river", () => {
    const m = fromFen("3k5/9/9/p8/9/4B4/9/9/3A5/2B1K4 w");
    expect(legalFrom(m, "c0")).toEqual(["c0a2"]);
    expect(reject(m, "human", "c0e2")).toContain("塞象眼");
    expect(legalFrom(m, "e4")).toEqual(["e4c2", "e4g2"]);
    expect(reject(m, "human", "e4c6")).toContain("不能过河");
    expect(reject(m, "human", "e4e6")).toContain("田");
    // Black's elephant cannot cross either.
    const b = fromFen("3k5/9/9/9/4b4/9/P8/9/9/4K4 b", "b");
    expect(legalFrom(b, "e5")).toEqual(["e5c7", "e5g7"]);
  });

  it("moves the cannon like a chariot but captures only over one screen", () => {
    const m = newMatch();
    const cannon = legalFrom(m, "h2");
    expect(cannon).toContain("h2h9"); // over the black cannon on h7 onto the horse
    expect(cannon).toContain("h2h6");
    expect(cannon).not.toContain("h2h7");
    expect(cannon).not.toContain("h2h8");
    expect(reject(m, "human", "h2h7")).toContain("隔一个子");
    const after = play(m, ["human", "h2h9"]);
    expect((after.state as XiangqiState).captured).toEqual(["n"]);
    expect(after.log[0]!.move).toBe("炮二進七");
    // Two pieces as screens is not a capture.
    const two = fromFen("3k5/9/9/9/9/9/9/9/C1p1p1r2/5K3 w");
    expect(legalFrom(two, "a1")).toEqual(["a1a0", "a1a2", "a1a3", "a1a4", "a1a5", "a1a6", "a1a7", "a1a8", "a1a9", "a1b1", "a1e1"]);
    expect(reject(two, "human", "a1g1")).toContain("隔一个子");
  });

  it("lets soldiers move sideways only after crossing the river, never back", () => {
    const m = newMatch();
    expect(legalFrom(m, "e3")).toEqual(["e3e4"]);
    expect(reject(m, "human", "e3d3")).toContain("过河以后才能横走");
    expect(reject(m, "human", "e3e2")).toContain("不能后退");
    const crossed = fromFen("3k5/9/9/9/4P4/9/9/9/9/5K3 w");
    expect(legalFrom(crossed, "e5")).toEqual(["e5d5", "e5e6", "e5f5"]);
    expect(reject(crossed, "human", "e5e4")).toContain("不能后退");
    // On the last rank a soldier can only step sideways.
    const last = fromFen("P2k5/9/9/9/9/9/9/9/9/5K3 w");
    expect(legalFrom(last, "a9")).toEqual(["a9b9"]);
  });

  it("keeps generals and advisors inside the palace", () => {
    const m = fromFen("4k4/9/9/p8/9/9/9/3K5/4A4/3A5 w");
    // d2e2 would face Black's general on the open e-file.
    expect(legalFrom(m, "d2")).toEqual(["d2d1"]);
    expect(reject(m, "human", "d2d3")).toContain("九宫");
    expect(reject(m, "human", "d2c2")).toContain("九宫");
    expect(legalFrom(m, "e1")).toEqual(["e1f0", "e1f2"]);
    expect(legalFrom(m, "d0")).toEqual([]);
    expect(reject(m, "human", "d0c1")).toContain("九宫");
    expect(reject(m, "human", "d0d1")).toContain("斜");
  });

  it("forbids the flying general", () => {
    // Red's horse on e5 is the only piece between the generals, so it may not leave the file.
    const m = fromFen("4k4/9/9/9/4N4/9/9/9/9/4K4 w");
    expect(legalFrom(m, "e5")).toEqual([]);
    expect(reject(m, "human", "e5c6")).toBe("将帅不能照面");
    // A general may not step onto an open file facing the other general.
    const k = fromFen("4k4/9/9/p8/9/9/9/9/9/3K5 w");
    expect(legalFrom(k, "d0")).toEqual(["d0d1"]);
    expect(reject(k, "human", "d0e0")).toBe("将帅不能照面");
  });

  it("rejects moves that leave the general in check", () => {
    // Black chariot on e7 checks Red's general on e0.
    // e0d0 would face Black's general on d9; the chariot on i1 can block on e1.
    const m = fromFen("3k5/9/4r4/9/9/9/9/9/8R/4K4 w");
    const legal = xiangqiLegalMoves((m.state as XiangqiState).board, "r").sort();
    expect(legal).toEqual(["e0f0", "i1e1"]);
    expect(reject(m, "human", "i1i2")).toBe("走完帅会被将军");
    const v = viewMatch<XiangqiView>(m, "human").view;
    expect(v.check).toBe(true);
    expect(v.checkSq).toBe(4);
  });
});

describe("xiangqi turns, notation and the end", () => {
  it("rejects out-of-turn, unreadable and wrong-piece moves in Chinese", () => {
    const m = newMatch();
    expect(reject(m, "ai", "h9g7")).toBe("还没轮到你");
    expect(reject(m, "human", "xyz")).toContain("看不懂这步");
    expect(reject(m, "human", "e5e6")).toContain("没有棋子");
    expect(reject(m, "human", "h7h0")).toBe("那不是你的棋子");
    expect(reject(m, "human", "a0a3")).toContain("不能吃自己的棋子");
  });

  it("logs moves in traditional notation", () => {
    const m = play(newMatch(), ["human", "h2e2"], ["ai", "h9-g7"], ["human", "h0g2"], ["ai", "i9h9"], ["human", "e3e4"]);
    expect(m.log.map((l) => l.move)).toEqual(["炮二平五", "馬8進7", "馬二進三", "車9平8", "兵五進一"]);
    const s = m.state as XiangqiState;
    expect(s.moves).toBe(5);
    expect(s.toPlay).toBe("b");
    // Two chariots on one file: 前車 / 後車.
    const { board } = xiangqiParseFen("3k5/9/9/R8/9/9/R8/9/9/4K4 w");
    expect(xiangqiNotation(board, 54, 56)).toBe("前車平七");
    expect(xiangqiNotation(board, 27, 28)).toBe("後車平八");
    expect(xiangqiNotation(board, 27, 9)).toBe("後車退二");
  });

  it("ends in checkmate (将死) with the right winner", () => {
    const m = fromFen("4k4/R8/1R7/9/9/9/9/9/9/3K5 w");
    const end = play(m, ["human", "b7b9"]);
    const st = statusOf(end);
    expect(st.outcome).toEqual({ winner: "human", text: "将死" });
    expect(st.resultText).toBe("Seren 胜 · 将死");
    expect(st.waitingOn).toEqual([]);
    expect(reject(end, "ai", "e9e8")).toBe("对局已经结束");
    expect(viewMatch<XiangqiView>(end, "human").view.legal).toEqual([]);
  });

  it("treats stalemate (困毙) as a loss", () => {
    // After a7a8 Black's lone general on d9 has no legal move and is not in check.
    const m = fromFen("3k5/9/R8/9/9/9/9/9/9/4K4 w");
    const end = play(m, ["human", "a7a8"]);
    expect(statusOf(end).outcome).toEqual({ winner: "human", text: "困毙" });
    // The same idea with the AI as Red.
    const ai = fromFen("3k5/9/R8/9/9/9/9/9/9/4K4 w", "b");
    expect(statusOf(play(ai, ["ai", "a7a8"])).outcome).toEqual({ winner: "ai", text: "困毙" });
  });

  it("draws after 120 plies without a capture", () => {
    const m = newMatch();
    const near: Match = { ...m, state: { ...(m.state as XiangqiState), quiet: 118 } };
    const once = play(near, ["human", "h2e2"]);
    expect(statusOf(once).outcome).toBeNull();
    const twice = play(once, ["ai", "h9g7"]);
    expect(statusOf(twice).outcome).toEqual({ winner: "draw", text: "和棋" });
    // A capture resets the counter.
    const cap = play({ ...m, state: { ...(m.state as XiangqiState), quiet: 119 } }, ["human", "h2h9"]);
    expect((cap.state as XiangqiState).quiet).toBe(0);
    expect(statusOf(cap).outcome).toBeNull();
  });

  it("draws when neither side has an attacking piece left", () => {
    const m = fromFen("3ak4/9/9/9/9/9/9/9/9/4KA3 w");
    expect(statusOf(m).outcome).toEqual({ winner: "draw", text: "和棋 · 双方无进攻子力" });
  });

  it("gives the UI legal moves, the last move and captures in the view", () => {
    const m = play(newMatch(), ["human", "h2h9"]);
    const v = viewMatch<XiangqiView>(m, "human").view;
    expect(v.last).toEqual({ from: 25, to: 88, text: "炮二進七" });
    expect(v.captured).toEqual(["n"]);
    expect(v.toPlay).toBe("b");
    expect(v.check).toBe(false);
    expect(v.legal).toContain("i9h9");
    expect(v.legal.every((mv) => /^[a-i][0-9][a-i][0-9]$/.test(mv))).toBe(true);
    expect(v.board.length).toBe(90);
    expect(v.board[88]).toBe("C");
  });

  it("describes the board and lists legal moves on the AI's turn", () => {
    const m = newMatch(false);
    const t = describeMatch(m);
    expect(t).toContain("You are Claude (红方)");
    expect(t).toContain("Status: YOUR TURN");
    expect(t).toContain("Your legal moves (44)");
    expect(t).toContain("h2e2");
    expect(t).toContain("9  r n b a k a b n r  9");
    expect(t).toContain("0  R N B A K A B N R  0");
    expect(t).toContain("Legend:");
    expect(t).toContain("Material: Red");
    const after = play(m, ["ai", "h2e2"]);
    const t2 = describeMatch(after);
    expect(t2).toContain("Last move: h2e2 (炮二平五)");
    expect(t2).not.toContain("Your legal moves");
    const t3 = describeMatch(play(after, ["human", "h9g7"]));
    expect(t3).toContain("Your legal moves");
    expect(t3).toContain("Captures:");
  });

  it("warns the AI about check and offers mate", () => {
    const m = fromFen("4k4/R8/1R7/9/9/9/9/9/9/3K5 w", "b");
    const t = describeMatch(m);
    expect(t).toContain("Moves that give check:");
    expect(t).toContain("CHECKMATE available:");
    expect(t).toContain("b7b9");
    const checked = describeMatch(fromFen("3k5/9/4R4/9/9/9/9/9/9/5K3 b", "r"));
    expect(checked).not.toContain("IN CHECK");
    const inCheck = describeMatch(fromFen("4k4/9/4R4/9/9/9/9/9/9/5K3 b", "r"));
    expect(inCheck).toContain("YOUR GENERAL IS IN CHECK");
  });
});
