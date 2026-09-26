import { toGtp, fromGtp } from "../coords";
import { applyAction, colorActor, createRecord, resultOf, waitingOn, type Action } from "../record";
import { replay, type IllegalReason } from "../state";
import { describeGo } from "../text";
import type { GameRecord } from "../types";
import type { Actor, GameModule } from "../match/types";

export type GoState = GameRecord;

const ILLEGAL_ZH: Record<IllegalReason | string, string> = {
  occupied: "这里已经有子了",
  suicide: "不能自杀：落下去就没气了",
  ko: "打劫：先在别处下一手",
  wrong_turn: "还没轮到你",
  not_playing: "现在不能落子",
  off_board: "不在棋盘上",
  not_scoring: "现在不是数子阶段",
  no_stone: "那里没有棋子",
  finished: "对局已经结束",
};

function parse(r: GoState, move: string): Action | string {
  const m = move.trim().toLowerCase();
  if (m === "pass") return { type: "pass" };
  if (m === "accept") return { type: "accept" };
  if (m === "resume") return { type: "resume" };
  const dead = /^(?:dead|toggle)\s+(\S+)$/.exec(m);
  if (dead) {
    const p = fromGtp(dead[1]!, r.size);
    return p === null ? "坐标不对" : { type: "toggle_dead", point: p };
  }
  const p = fromGtp(m, r.size);
  return p === null ? `看不懂这步：${move}` : { type: "play", point: p };
}

export const go: GameModule<GoState, GoState> = {
  kind: "go",
  name: { zh: "围棋", en: "Go" },
  family: "棋",
  blurb: "黑白落子，围地多者胜。相连的棋子融成一滴水。",
  ready: true,
  options: [
    {
      key: "size",
      label: "棋盘",
      default: "9",
      choices: [
        { value: "9", label: "9 路" },
        { value: "13", label: "13 路" },
        { value: "19", label: "19 路" },
      ],
    },
  ],
  rules:
    "Go with Chinese area scoring, komi 7.5, positional superko, suicide forbidden. Black moves first. " +
    'Moves: a GTP coordinate such as "D4" (columns A-T skip I, row 1 is the bottom) or "pass". ' +
    'After two passes the game enters scoring: "dead C3" marks or unmarks the chain at C3 as dead, "accept" agrees to the marking, "resume" goes back to playing. ' +
    "The game ends when both accept.",
  moveHelp: '"D4" | "pass" | scoring: "dead C3", "accept", "resume"',
  create({ humanFirst, options }) {
    return createRecord({ id: "", size: Number(options.size ?? 9), humanColor: humanFirst ? 1 : 2, now: 0 });
  },
  apply(state, actor, move) {
    const action = parse(state, move);
    if (typeof action === "string") return { ok: false, error: action };
    const res = applyAction(state, actor, action, Date.now());
    if (!res.ok) return { ok: false, error: ILLEGAL_ZH[res.error] ?? res.message };
    const log = action.type === "play" ? toGtp(action.point, state.size) : action.type === "toggle_dead" ? `dead ${toGtp(action.point, state.size)}` : action.type;
    return { ok: true, state: res.record, log };
  },
  waitingOn(state) {
    return waitingOn(state, replay(state.size, state.moves));
  },
  outcome(state) {
    const res = resultOf(state, replay(state.size, state.moves));
    if (!res) return null;
    if (res.winner === 0) return { winner: "draw", text: "和棋" };
    const side = res.winner === 1 ? "黑" : "白";
    const text = res.reason === "resign" ? `${side}中盘胜` : `${side} +${res.text.split("+")[1]}`;
    return { winner: colorActor(state, res.winner), text };
  },
  seats(state) {
    const h = state.humanColor === 1 ? "黑" : "白";
    return { human: h, ai: h === "黑" ? "白" : "黑" } as Record<Actor, string>;
  },
  view(state) {
    return state;
  },
  describe(state, names) {
    return describeGo({ ...state, humanName: names.human, aiName: names.ai });
  },
};
