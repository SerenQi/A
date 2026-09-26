import { GAMES } from "../games";
import { MAX_CHAT_LENGTH, cleanName } from "../record";
import type { ChatMessage } from "../types";
import { otherActor, type Actor, type GameKind, type Outcome } from "./types";

export interface LogEntry {
  actor: Actor;
  move: string;
  t: number;
}

export interface Match {
  id: string;
  kind: GameKind;
  humanName: string;
  aiName: string;
  createdAt: number;
  updatedAt: number;
  /** Bumped on every change, used for waiting and sync. */
  version: number;
  state: unknown;
  resignedBy?: Actor;
  log: LogEntry[];
  chat: ChatMessage[];
}

export type MatchAction =
  | { type: "move"; move: string }
  | { type: "resign" }
  | { type: "say"; text: string }
  | { type: "rename"; humanName?: string; aiName?: string };

export type MatchResult = { ok: true; match: Match } | { ok: false; error: string; message: string };

export interface NewMatchOptions {
  id: string;
  kind: GameKind;
  options?: Record<string, unknown>;
  humanFirst?: boolean;
  humanName?: string;
  aiName?: string;
  seed: number;
  now: number;
}

export function moduleOf(kind: GameKind) {
  return GAMES[kind];
}

/** Keeps only known options with allowed values, filling defaults. */
export function cleanOptions(kind: GameKind, raw: Record<string, unknown> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of GAMES[kind].options) {
    const v = raw[o.key] === undefined ? undefined : String(raw[o.key]);
    out[o.key] = v !== undefined && o.choices.some((c) => c.value === v) ? v : o.default;
  }
  return out;
}

export function createMatch(o: NewMatchOptions): Match {
  const mod = GAMES[o.kind];
  if (!mod?.ready) throw new Error(`Game "${o.kind}" is not available.`);
  const state = mod.create({ seed: o.seed >>> 0, humanFirst: o.humanFirst ?? true, options: cleanOptions(o.kind, o.options) });
  return {
    id: o.id,
    kind: o.kind,
    humanName: cleanName(o.humanName) ?? "Human",
    aiName: cleanName(o.aiName) ?? "AI",
    createdAt: o.now,
    updatedAt: o.now,
    version: 1,
    state,
    log: [],
    chat: [],
  };
}

export interface MatchStatus {
  waitingOn: Actor[];
  outcome: Outcome | null;
  /** Chinese result line with names, e.g. "Seren 胜 · 黑 +3.5". */
  resultText: string | null;
}

export function statusOf(m: Match): MatchStatus {
  const mod = GAMES[m.kind];
  if (m.resignedBy) {
    const winner = otherActor(m.resignedBy);
    const loserName = m.resignedBy === "human" ? m.humanName : m.aiName;
    return { waitingOn: [], outcome: { winner, text: "认输" }, resultText: `${loserName} 认输` };
  }
  const outcome = mod.outcome(m.state);
  if (!outcome) return { waitingOn: mod.waitingOn(m.state), outcome: null, resultText: null };
  const name = outcome.winner === "draw" ? "和局" : `${outcome.winner === "human" ? m.humanName : m.aiName} 胜`;
  return { waitingOn: [], outcome, resultText: `${name} · ${outcome.text}` };
}

const fail = (error: string, message: string): MatchResult => ({ ok: false, error, message });

export function applyMatchAction(m: Match, actor: Actor, action: MatchAction, now: number): MatchResult {
  const bump = (patch: Partial<Match>): Match => ({ ...m, ...patch, updatedAt: now, version: m.version + 1 });
  const status = statusOf(m);
  switch (action.type) {
    case "move": {
      if (status.outcome) return fail("game_over", "对局已经结束");
      const move = String(action.move ?? "").trim();
      if (!move) return fail("empty_move", "没有写这步棋");
      const res = GAMES[m.kind].apply(m.state, actor, move);
      if (!res.ok) return fail("illegal", res.error);
      const log = [...m.log, { actor, move: res.log ?? move, t: now }].slice(-500);
      return { ok: true, match: bump({ state: res.state, log }) };
    }
    case "resign": {
      if (status.outcome) return fail("game_over", "对局已经结束");
      return { ok: true, match: bump({ resignedBy: actor, log: [...m.log, { actor, move: "resign", t: now }].slice(-500) }) };
    }
    case "say": {
      const text = String(action.text ?? "").trim().slice(0, MAX_CHAT_LENGTH);
      if (!text) return fail("empty", "消息是空的");
      return { ok: true, match: bump({ chat: [...m.chat, { from: actor, text, t: now, at: m.log.length }].slice(-100) }) };
    }
    case "rename": {
      const patch: Partial<Match> = {};
      for (const key of ["humanName", "aiName"] as const) {
        if (action[key] === undefined) continue;
        const name = cleanName(action[key]);
        if (!name) return fail("bad_name", "名字要 1 到 40 个字");
        patch[key] = name;
      }
      if (!Object.keys(patch).length) return fail("bad_name", "没有新名字");
      return { ok: true, match: bump(patch) };
    }
  }
}

/** What one side's client receives: the redacted game view plus status. */
export interface MatchView<V = unknown> extends Omit<Match, "state"> {
  view: V;
  status: MatchStatus;
  seats: Record<Actor, string>;
}

export function viewMatch<V = unknown>(m: Match, viewer: Actor): MatchView<V> {
  const { state, ...rest } = m;
  const mod = GAMES[m.kind];
  return { ...rest, view: mod.view(state, viewer) as V, status: statusOf(m), seats: mod.seats(state) };
}

/** Full text description for the AI player. */
export function describeMatch(m: Match, url?: string): string {
  const mod = GAMES[m.kind];
  const seats = mod.seats(m.state);
  const st = statusOf(m);
  const out = [`Game ${m.id} · ${mod.name.en} (${mod.name.zh})`];
  if (url) out.push(`Board page: ${url}`);
  out.push(`You are ${m.aiName} (${seats.ai}). Opponent: ${m.humanName} (${seats.human}).`);
  if (st.resultText) out.push(`GAME OVER: ${st.resultText}.`);
  else if (st.waitingOn.includes("ai")) out.push(`Status: YOUR TURN. Call play. Move syntax: ${mod.moveHelp}`);
  else out.push(`Status: waiting for ${m.humanName}. Call wait_for_opponent.`);
  out.push("", mod.describe(m.state, { human: m.humanName, ai: m.aiName }));
  const recent = m.chat.slice(-5);
  if (recent.length) {
    out.push("", "Recent messages:");
    for (const c of recent) out.push(`- ${c.from === "ai" ? `${m.aiName} (you)` : m.humanName}: ${c.text}`);
  }
  return out.join("\n");
}
