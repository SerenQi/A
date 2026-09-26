import { describe, expect, it } from "vitest";
import {
  MONOPOLY_CARDS,
  applyMatchAction,
  createMatch,
  describeMatch,
  monopoly,
  monopolyPatch,
  monopolyRigDice,
  statusOf,
  viewMatch,
  type Actor,
  type Match,
  type MonopolyState,
  type MonopolyView,
} from "../src";

const newMatch = (o: { humanFirst?: boolean; rounds?: string; seed?: number } = {}) =>
  createMatch({
    id: "m1",
    kind: "monopoly",
    humanFirst: o.humanFirst ?? true,
    humanName: "Seren",
    aiName: "Claude",
    seed: o.seed ?? 42,
    now: 0,
    options: o.rounds ? { rounds: o.rounds } : {},
  });

const st = (m: Match) => m.state as MonopolyState;
const withState = (m: Match, patch: Partial<MonopolyState>, dice?: [number, number][]): Match => {
  let s = monopolyPatch(st(m), patch);
  if (dice) s = monopolyRigDice(s, dice);
  return { ...m, state: s };
};
const players = (m: Match, h: Partial<MonopolyState["players"]["human"]>, a: Partial<MonopolyState["players"]["ai"]> = {}) => ({
  human: { ...st(m).players.human, ...h },
  ai: { ...st(m).players.ai, ...a },
});
const own = (m: Match, spaces: Record<number, Actor | null>) => st(m).owner.map((o, i) => (i in spaces ? spaces[i]! : o));
const houses = (m: Match, h: Record<number, number>) => st(m).houses.map((x, i) => h[i] ?? x);

function play(m: Match, who: Actor, move: string): Match {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  if (!res.ok) throw new Error(`${who} ${move}: ${res.message}`);
  return res.match;
}
function fail(m: Match, who: Actor, move: string): string {
  const res = applyMatchAction(m, who, { type: "move", move }, 1);
  expect(res.ok).toBe(false);
  return res.ok ? "" : res.message;
}

describe("monopoly setup", () => {
  it("starts both players with 1500 on 起点, human first", () => {
    const m = newMatch();
    expect(st(m).players.human).toMatchObject({ cash: 1500, pos: 0, inJail: false });
    expect(st(m).players.ai.cash).toBe(1500);
    expect(statusOf(m).waitingOn).toEqual(["human"]);
    expect(monopoly.seats(st(m))).toEqual({ human: "先手", ai: "后手" });
    const m2 = newMatch({ humanFirst: false });
    expect(statusOf(m2).waitingOn).toEqual(["ai"]);
    expect(monopoly.seats(st(m2))).toEqual({ human: "后手", ai: "先手" });
    expect(st(m).rounds).toBe(20);
    expect(st(newMatch({ rounds: "0" })).rounds).toBe(0);
    expect(st(newMatch({ rounds: "40" })).rounds).toBe(40);
  });

  it("board has 24 spaces with 16 properties in 8 pairs", () => {
    const v = viewMatch<MonopolyView>(newMatch(), "human").view;
    expect(v.spaces).toHaveLength(24);
    expect(v.spaces.map((s) => s.name).filter((n, i) => [0, 6, 12, 18].includes(i))).toEqual(["起点", "拘留所", "茶馆", "去拘留所"]);
    const props = v.spaces.filter((s) => s.kind === "property");
    expect(props).toHaveLength(16);
    for (let g = 0; g < 8; g++) expect(props.filter((p) => p.group === g)).toHaveLength(2);
    expect(v.spaces.filter((s) => s.kind === "chance")).toHaveLength(2);
    expect(v.spaces[9]).toMatchObject({ name: "税", kind: "tax", tax: 100 });
  });
});

describe("monopoly dice and movement", () => {
  it("rolls deterministically per seed", () => {
    const a = play(newMatch({ seed: 5 }), "human", "roll");
    const b = play(newMatch({ seed: 5 }), "human", "roll");
    expect(st(a).dice).toEqual(st(b).dice);
    expect(st(a).players.human.pos).toBe(st(b).players.human.pos);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) seen.add(JSON.stringify(st(play(newMatch({ seed }), "human", "roll")).dice));
    expect(seen.size).toBeGreaterThan(3);
    for (const d of seen) for (const x of JSON.parse(d) as number[]) expect(x >= 1 && x <= 6).toBe(true);
  });

  it("pays 200 when passing or landing on 起点", () => {
    let m = withState(newMatch(), { players: players(newMatch(), { pos: 22 }) }, [[1, 2]]);
    m = play(m, "human", "roll");
    expect(st(m).players.human).toMatchObject({ pos: 1, cash: 1700 });
    expect(st(m).phase).toBe("buy");
    expect(m.log.at(-1)!.move).toBe("掷出 1+2，经过起点，领 200，到巴山");

    let m2 = withState(newMatch(), { players: players(newMatch(), { pos: 20 }) }, [[1, 3]]);
    m2 = play(m2, "human", "roll");
    expect(st(m2).players.human).toMatchObject({ pos: 0, cash: 1700 });
    expect(st(m2).phase).toBe("end");
  });

  it("buys or refuses an unowned property", () => {
    const m = withState(newMatch(), {}, [[3, 4]]);
    const rolled = play(m, "human", "roll");
    expect(st(rolled).phase).toBe("buy");
    expect(viewMatch<MonopolyView>(rolled, "human").view.offer).toEqual({ index: 7, price: 140 });
    const bought = play(rolled, "human", "buy");
    expect(st(bought).owner[7]).toBe("human");
    expect(st(bought).players.human.cash).toBe(1360);
    expect(st(bought).phase).toBe("end");
    expect(bought.log.at(-1)!.move).toBe("买下夜雨，花 140");

    const skipped = play(rolled, "human", "不买");
    expect(st(skipped).owner[7]).toBeNull();
    expect(st(skipped).phase).toBe("end");

    const poor = withState(newMatch(), { players: players(newMatch(), { cash: 100 }) }, [[3, 4]]);
    const r2 = play(poor, "human", "掷骰");
    expect(fail(r2, "human", "buy")).toBe("钱不够买夜雨");
    expect(viewMatch<MonopolyView>(r2, "human").view.legal).toEqual(["skip"]);
    expect(fail(bought, "human", "buy")).toBe("这里没有可买的地");
  });

  it("charges base rent, double for a full group, and the house table", () => {
    const start = newMatch();
    const rentFor = (owner: Record<number, Actor | null>, h: Record<number, number> = {}) => {
      let m = withState(start, { owner: own(start, owner), houses: houses(start, h) }, [[3, 4]]);
      m = play(m, "human", "roll");
      return { paid: 1500 - st(m).players.human.cash, got: st(m).players.ai.cash - 1500, log: m.log.at(-1)!.move, phase: st(m).phase };
    };
    expect(rentFor({ 7: "ai" })).toEqual({ paid: 14, got: 14, log: "掷出 3+4，到夜雨，付租 14", phase: "end" });
    expect(rentFor({ 7: "ai", 8: "ai" }).paid).toBe(28);
    expect(rentFor({ 7: "ai", 8: "ai" }, { 7: 1 }).paid).toBe(70);
    expect(rentFor({ 7: "ai", 8: "ai" }, { 7: 2 }).paid).toBe(200);
    expect(rentFor({ 7: "ai", 8: "ai" }, { 7: 3 }).paid).toBe(450);
    // Own property: nothing to pay.
    expect(rentFor({ 7: "human" }).paid).toBe(0);
  });
});

describe("monopoly doubles and jail", () => {
  it("doubles roll again and end is refused while a double is pending", () => {
    let m = withState(newMatch(), {}, [[2, 2], [1, 2]]);
    expect(fail(m, "human", "end")).toBe("先掷骰子");
    m = play(m, "human", "roll");
    expect(st(m).players.human.pos).toBe(4);
    expect(fail(m, "human", "end")).toBe("先决定买不买长亭");
    m = play(m, "human", "skip");
    expect(st(m).phase).toBe("roll");
    expect(st(m).rollAgain).toBe(true);
    expect(fail(m, "human", "end")).toBe("掷出对子，要再掷一次");
    expect(viewMatch<MonopolyView>(m, "human").view.legal).toContain("roll");
    m = play(m, "human", "roll");
    expect(st(m).players.human.pos).toBe(7);
    m = play(m, "human", "skip");
    expect(st(m).phase).toBe("end");
    m = play(m, "human", "结束");
    expect(statusOf(m).waitingOn).toEqual(["ai"]);
    expect(st(m).lastTurn?.actor).toBe("human");
    expect(st(m).events).toEqual([]);
  });

  it("three doubles in a row send you to jail", () => {
    let m = withState(newMatch(), {}, [[1, 1], [2, 2], [3, 3]]);
    m = play(m, "human", "roll"); // 2 秋池
    m = play(m, "human", "skip");
    m = play(m, "human", "roll"); // 6 拘留所, just visiting
    expect(st(m).players.human.inJail).toBe(false);
    expect(st(m).phase).toBe("roll");
    m = play(m, "human", "roll");
    expect(st(m).players.human).toMatchObject({ pos: 6, inJail: true });
    expect(st(m).phase).toBe("end");
    expect(fail(m, "human", "roll")).toBe("这回合已经掷过了，可以结束回合");
    expect(m.log.at(-1)!.move).toBe("掷出 3+3，连掷三次对子，进拘留所");
  });

  it("the 去拘留所 space jails you without the 起点 bonus, even on a double", () => {
    const base = newMatch();
    let m = withState(base, { players: players(base, { pos: 13 }) }, [[2, 3]]);
    m = play(m, "human", "roll");
    expect(st(m).players.human).toMatchObject({ pos: 6, inJail: true, cash: 1500 });
    expect(st(m).phase).toBe("end");
    let m2 = withState(base, { players: players(base, { pos: 16 }) }, [[1, 1]]);
    m2 = play(m2, "human", "roll");
    expect(st(m2).players.human.inJail).toBe(true);
    expect(st(m2).rollAgain).toBe(false);
    expect(st(m2).phase).toBe("end");
  });

  const jailed = (extra: Partial<MonopolyState["players"]["human"]> = {}, dice?: [number, number][]) => {
    const base = newMatch();
    return withState(base, { players: players(base, { pos: 6, inJail: true, ...extra }) }, dice);
  };

  it("pay 50 to leave jail, then roll normally", () => {
    let m = jailed({}, [[1, 2]]);
    expect(viewMatch<MonopolyView>(m, "human").view.legal).toEqual(["roll", "pay"]);
    m = play(m, "human", "交钱");
    expect(st(m).players.human).toMatchObject({ inJail: false, cash: 1450 });
    expect(st(m).phase).toBe("roll");
    expect(fail(m, "human", "pay")).toBe("你不在拘留所");
    m = play(m, "human", "roll");
    expect(st(m).players.human.pos).toBe(9);
    expect(st(m).players.human.cash).toBe(1350);
  });

  it("a get-out card frees you", () => {
    expect(fail(jailed(), "human", "card")).toBe("你没有出狱卡");
    let m = jailed({ cards: 1 });
    expect(viewMatch<MonopolyView>(m, "human").view.legal).toContain("card");
    m = play(m, "human", "用卡");
    expect(st(m).players.human).toMatchObject({ inJail: false, cards: 0, cash: 1500 });
    expect(st(m).phase).toBe("roll");
  });

  it("doubles free you and move you, without an extra roll", () => {
    let m = jailed({}, [[2, 2]]);
    m = play(m, "human", "roll");
    expect(st(m).players.human).toMatchObject({ inJail: false, pos: 10 });
    m = play(m, "human", "skip");
    expect(st(m).phase).toBe("end");
  });

  it("a failed try keeps you in jail; the third failure forces the fine and moves", () => {
    let m = jailed({}, [[1, 2]]);
    m = play(m, "human", "roll");
    expect(st(m).players.human).toMatchObject({ inJail: true, jailTries: 1, pos: 6 });
    expect(st(m).phase).toBe("end");
    expect(fail(m, "human", "pay")).toBe("这回合已经掷过了");

    let m3 = jailed({ jailTries: 2 }, [[1, 2]]);
    m3 = play(m3, "human", "roll");
    // Pays 50, moves 3 to 税 (9) and pays 100 tax.
    expect(st(m3).players.human).toMatchObject({ inJail: false, jailTries: 0, pos: 9, cash: 1350 });
    expect(m3.log.at(-1)!.move).toBe("掷出 1+2，三次没掷出对子，交 50 出狱，到税，交税 100");
  });
});

describe("monopoly chance deck", () => {
  const onChance = (deck: number[], extra: Partial<MonopolyState> = {}) => withState(newMatch(), { deck, ...extra }, [[1, 2]]);

  it("draws the top card and applies it", () => {
    let m = onChance([5, 6, 7]);
    m = play(m, "human", "roll");
    expect(st(m).players.human.cash).toBe(1600);
    expect(st(m).deck).toEqual([6, 7]);
    expect(m.log.at(-1)!.move).toBe("掷出 1+2，到命运，命运：卖出一幅雨景，收 100");

    const back = play(onChance([2]), "human", "roll");
    expect(st(back).players.human).toMatchObject({ pos: 0, cash: 1700 });

    const jail = play(onChance([3]), "human", "roll");
    expect(st(jail).players.human).toMatchObject({ pos: 6, inJail: true });

    const card = play(onChance([4]), "human", "roll");
    expect(st(card).players.human.cards).toBe(1);

    const gift = play(onChance([7]), "human", "roll");
    expect(st(gift).players.human.cash).toBe(1550);
    expect(st(gift).players.ai.cash).toBe(1450);

    const west = play(onChance([9]), "human", "roll");
    expect(st(west).players.human.pos).toBe(13);
    expect(st(west).phase).toBe("buy");

    const fwd = play(onChance([1]), "human", "roll");
    expect(st(fwd).players.human.pos).toBe(6);

    const base = newMatch();
    const rep = play(onChance([8], { owner: own(base, { 1: "human", 2: "human" }), houses: houses(base, { 1: 2, 2: 1 }) }), "human", "roll");
    expect(st(rep).players.human.cash).toBe(1500 - 75);
  });

  it("reshuffles when empty, leaving out a held get-out card", () => {
    const m = play(onChance([]), "human", "roll");
    expect(st(m).deck).toHaveLength(MONOPOLY_CARDS.length - 1);
    expect(st(m).events.some((e) => e.kind === "shuffle")).toBe(true);

    const held = play(onChance([], { players: players(newMatch(), {}, { cards: 1 }) }), "human", "roll");
    expect(st(held).deck).toHaveLength(MONOPOLY_CARDS.length - 2);
    expect(st(held).deck).not.toContain(4);
  });

  it("the starting deck is a seeded shuffle of all cards", () => {
    expect([...st(newMatch()).deck].sort((a, b) => a - b)).toEqual(MONOPOLY_CARDS.map((c) => c.id));
    expect(st(newMatch({ seed: 1 })).deck).toEqual(st(newMatch({ seed: 1 })).deck);
  });
});

describe("monopoly building", () => {
  const base = newMatch();
  it("needs the whole group, costs per group, and stops at 3 levels", () => {
    const half = withState(base, { owner: own(base, { 1: "human" }) });
    expect(fail(half, "human", "build 1")).toBe("要先凑齐一组才能盖房");
    expect(fail(half, "human", "build 7")).toBe("夜雨不是你的");
    expect(fail(half, "human", "build 0")).toBe("起点不能盖房");
    expect(fail(half, "human", "build 潇湘")).toBe("没有这个地方：潇湘");
    expect(fail(half, "human", "build")).toBe("盖在哪里？比如 盖房 夜雨");

    let m = withState(base, { owner: own(base, { 1: "human", 2: "human" }) });
    expect(viewMatch<MonopolyView>(m, "human").view.buildable).toEqual([
      { index: 1, cost: 50 },
      { index: 2, cost: 50 },
    ]);
    m = play(m, "human", "盖房 巴山");
    expect(st(m).houses[1]).toBe(1);
    expect(st(m).players.human.cash).toBe(1450);
    expect(m.log.at(-1)!.move).toBe("在巴山盖第 1 层房，花 50");
    m = play(m, "human", "build 1");
    m = play(m, "human", "build 1");
    expect(st(m).houses[1]).toBe(3);
    expect(st(m).houses[2]).toBe(0); // building evenly is not required
    expect(fail(m, "human", "build 巴山")).toBe("巴山已经盖满三层");
    expect(st(m).players.human.cash).toBe(1350);

    const poor = withState(base, { owner: own(base, { 1: "human", 2: "human" }), players: players(base, { cash: 40 }) });
    expect(fail(poor, "human", "build 1")).toBe("钱不够盖房，要 50");
    expect(fail(m, "ai", "build 1")).toBe("还没轮到你");
  });

  it("is refused while a buy decision is pending", () => {
    let m = withState(base, { owner: own(base, { 1: "human", 2: "human" }) }, [[3, 4]]);
    m = play(m, "human", "roll");
    expect(fail(m, "human", "build 1")).toBe("先决定买不买夜雨");
    m = play(m, "human", "skip");
    m = play(m, "human", "build 1");
    expect(st(m).houses[1]).toBe(1);
  });
});

describe("monopoly money trouble and game end", () => {
  const base = newMatch();

  it("sells house levels at half cost to cover a debt", () => {
    let m = withState(
      base,
      {
        players: players(base, { pos: 10, cash: 20 }),
        owner: own(base, { 1: "human", 2: "human", 13: "ai", 14: "ai" }),
        houses: houses(base, { 1: 3, 2: 3, 13: 1 }),
      },
      [[1, 2]],
    );
    m = play(m, "human", "roll"); // 13 西窗, rent 110
    expect(st(m).players.ai.cash).toBe(1610);
    expect(st(m).houses[1]).toBe(0);
    expect(st(m).houses[2]).toBe(2);
    expect(st(m).players.human.cash).toBe(10);
    expect(st(m).owner[1]).toBe("human");
    expect(statusOf(m).outcome).toBeNull();
  });

  it("returns properties cheapest first, then goes bankrupt", () => {
    const setup = (cash: number) =>
      withState(
        base,
        {
          players: players(base, { pos: 20, cash }),
          owner: own(base, { 1: "human", 2: "human", 7: "human", 22: "ai", 23: "ai" }),
          houses: houses(base, { 1: 1, 23: 3 }),
        },
        [[1, 2]],
      );
    // Rent 1200 at 长安. 1100 + 25 (house) + 30 + 30 = 1185, + 70 (夜雨) = 1255.
    const saved = play(setup(1100), "human", "roll");
    expect(st(saved).owner[1]).toBeNull();
    expect(st(saved).owner[2]).toBeNull();
    expect(st(saved).owner[7]).toBeNull();
    expect(st(saved).players.human.cash).toBe(55);
    expect(statusOf(saved).outcome).toBeNull();

    const broke = play(setup(10), "human", "roll");
    const status = statusOf(broke);
    expect(status.outcome).toEqual({ winner: "ai", text: "破产" });
    expect(status.resultText).toBe("Claude 胜 · 破产");
    expect(status.waitingOn).toEqual([]);
    expect(fail(broke, "human", "end")).toBe("对局已经结束");
  });

  it("counts rounds and ends on the limit by net worth", () => {
    let m = withState(base, { phase: "end" });
    m = play(m, "human", "end");
    expect(st(m).round).toBe(1);
    m = withState(m, { phase: "end" });
    m = play(m, "ai", "end");
    expect(st(m).round).toBe(2);

    let last = withState(base, {
      round: 20,
      phase: "end",
      players: players(base, { cash: 3000 }, { cash: 2440 }),
      owner: own(base, { 1: "human", 22: "ai" }),
      houses: houses(base, { 22: 0 }),
    });
    last = play(last, "human", "end");
    expect(statusOf(last).outcome).toBeNull();
    last = withState(last, { phase: "end" });
    last = play(last, "ai", "end");
    expect(statusOf(last).outcome).toEqual({ winner: "human", text: "身家 3060 : 2840" });
    expect(statusOf(last).resultText).toBe("Seren 胜 · 身家 3060 : 2840");

    const even = play(withState(base, { round: 20, phase: "end", turn: "ai" }), "ai", "end");
    expect(statusOf(even).outcome).toEqual({ winner: "draw", text: "身家 1500 : 1500" });

    const endless = withState(newMatch({ rounds: "0" }), { round: 500, phase: "end", turn: "ai" });
    expect(statusOf(play(endless, "ai", "end")).outcome).toBeNull();
  });
});

describe("monopoly moves and text", () => {
  it("rejects bad moves in Chinese", () => {
    const m = newMatch();
    expect(fail(m, "ai", "roll")).toBe("还没轮到你");
    expect(fail(m, "human", "fly")).toBe("看不懂这步：fly");
    expect(fail(m, "human", "结束回合")).toBe("先掷骰子");
    expect(fail(m, "human", "买")).toBe("这里没有可买的地");
    expect(fail(m, "human", "用卡")).toBe("你不在拘留所");
  });

  it("view and describe hide the deck order and RNG", () => {
    const m = withState(newMatch(), {}, [[6, 6]]);
    const v = viewMatch<MonopolyView>(m, "human").view as unknown as Record<string, unknown>;
    expect("deck" in v).toBe(false);
    expect("rng" in v).toBe(false);
    expect("riggedDice" in v).toBe(false);
    const json = JSON.stringify(v);
    expect(json).not.toContain(JSON.stringify(st(m).deck));
    expect(json).not.toContain(String(st(m).rng));
    const text = describeMatch(m);
    const top = MONOPOLY_CARDS[st(m).deck[0]!]!;
    expect(text).not.toContain(top.en);
    expect(text).not.toContain(String(st(m).rng));
  });

  it("describes the board, players and legal moves for the AI", () => {
    const base = newMatch({ humanFirst: false });
    let m = withState(
      base,
      { players: players(base, {}, { pos: 10, cash: 900 }), owner: own(base, { 1: "ai", 2: "ai" }) },
      [[1, 2]],
    );
    m = play(m, "ai", "roll");
    const t = describeMatch(m);
    expect(t).toContain("Status: YOUR TURN");
    expect(t).toContain("13 西窗 | G5 | 220 | 150 | 22/110/330/700 | - | 0 | -  <- YOU");
    expect(t).toContain("buy (西窗, 220, you have 900)");
    expect(t).not.toContain("build 1 (");
    expect(t).toContain("This turn (you): rolled 1+2; moved to 西窗 (13).");
    m = play(m, "ai", "buy");
    const t2 = describeMatch(m);
    expect(t2).toContain("build 1 (巴山: level 1 for 50, rent 12 -> 30)");
    expect(t2).toContain("| end");
    expect(t2).toContain("You: cash 680, at 13 西窗");
    m = play(m, "ai", "end");
    const t3 = describeMatch(m);
    expect(t3).toContain("Previous turn (you): rolled 1+2; moved to 西窗 (13); bought 西窗 (13) for 220.");
    expect(t3).toContain("Waiting for Seren.");
    expect(t3).not.toContain("Legal moves");
  });

  it("plays a long random game without breaking invariants", () => {
    let m = newMatch({ seed: 9, rounds: "40" });
    for (let i = 0; i < 3000 && !statusOf(m).outcome; i++) {
      const who = statusOf(m).waitingOn[0]!;
      const legal = viewMatch<MonopolyView>(m, who).view.legal;
      const build = legal.find((x) => x.startsWith("build"));
      const pick = legal.includes("buy") ? "buy" : (build ?? (legal.includes("roll") ? "roll" : legal[0]!));
      m = play(m, who, pick);
      const s = st(m);
      for (const a of ["human", "ai"] as const) if (!s.over) expect(s.players[a].cash).toBeGreaterThanOrEqual(0);
      for (const h of s.houses) expect(h >= 0 && h <= 3).toBe(true);
    }
    expect(statusOf(m).outcome).not.toBeNull();
  });
});
