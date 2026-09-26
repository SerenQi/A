import type { Actor, GameModule, LegacyGameModule, Seat } from "../match/types";

const keyOf = (seat: Seat | null): Actor => (seat === 1 ? "ai" : "human");
const seatOf = (a: Actor): Seat => (a === "human" ? 0 : 1);

/** Adapts a legacy two-player module: the "human" key is seat 0 (moves first), "ai" is seat 1. */
export function fromLegacy<S, V>(m: LegacyGameModule<S, V>): GameModule<S, V> {
  return {
    kind: m.kind,
    name: m.name,
    family: m.family,
    blurb: m.blurb,
    ready: m.ready,
    players: { min: 2, max: 2, default: 2 },
    options: m.options,
    rules: m.rules,
    moveHelp: m.moveHelp,
    create: (ctx) => m.create({ seed: ctx.seed, humanFirst: true, options: ctx.options }),
    apply: (s, seat, move) => m.apply(s, keyOf(seat), move),
    waitingOn: (s) => m.waitingOn(s).map(seatOf),
    outcome: (s) => {
      const o = m.outcome(s);
      return o && { winners: o.winner === "draw" ? [] : [seatOf(o.winner)], text: o.text };
    },
    seatLabels: (s) => {
      const l = m.seats(s);
      return [l.human, l.ai];
    },
    view: (s, viewer) => m.view(s, keyOf(viewer)),
    // Legacy describe is written from the "ai" key's point of view.
    describe: (s, _seat, names) => m.describe(s, { human: names[0] ?? "", ai: names[1] ?? "" }),
  };
}

export const isLegacy = (m: GameModule | LegacyGameModule): m is LegacyGameModule => !("players" in m);
export const normalize = (m: GameModule | LegacyGameModule): GameModule => (isLegacy(m) ? fromLegacy(m) : m);
