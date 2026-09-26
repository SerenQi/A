import type { Action, GameRecord } from "@rain-go/engine";

const TOKEN_KEY = "rain-go:token";
const BG_KEY = "rain-go:bg";
const LAST_GAME_KEY = "rain-go:last-game";
const NAMES_KEY = "rain-go:names";
const LAST_NAMES_KEY = "rain-go:last-names";

const readJson = <T,>(k: string, fallback: T): T => {
  try {
    const v = JSON.parse(read(k) || "null") as T | null;
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const read = (k: string) => {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
};
const write = (k: string, v: string) => {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    // Storage unavailable (private mode); settings last for this visit only.
  }
};

export const prefs = {
  token: () => read(TOKEN_KEY),
  setToken: (v: string) => write(TOKEN_KEY, v.trim()),
  background: () => read(BG_KEY),
  setBackground: (v: string) => write(BG_KEY, v.trim()),
  lastGame: () => read(LAST_GAME_KEY),
  setLastGame: (v: string) => write(LAST_GAME_KEY, v),
  /** Recently used player names, newest first. */
  recentNames: (): string[] => readJson<string[]>(NAMES_KEY, []).filter((n) => typeof n === "string"),
  rememberNames: (...names: (string | undefined)[]) => {
    const add = names.map((n) => n?.trim()).filter((n): n is string => Boolean(n));
    if (!add.length) return;
    const list = [...add, ...prefs.recentNames().filter((n) => !add.includes(n))].slice(0, 10);
    write(NAMES_KEY, JSON.stringify(list));
  },
  forgetName: (name: string) => write(NAMES_KEY, JSON.stringify(prefs.recentNames().filter((n) => n !== name))),
  lastNames: () => readJson<{ human: string; ai: string }>(LAST_NAMES_KEY, { human: "", ai: "" }),
  setLastNames: (human: string, ai: string) => write(LAST_NAMES_KEY, JSON.stringify({ human: human.trim(), ai: ai.trim() })),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = prefs.token();
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body) headers.set("content-type", "application/json");
  const res = await fetch(path, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, String(body.error ?? res.status), String(body.message ?? body.error ?? res.statusText));
  return body as T;
}

export interface GameMeta {
  id: string;
  size: number;
  humanName: string;
  aiName: string;
  humanColor: 1 | 2;
  phase: "playing" | "scoring" | "finished";
  waitingOn: ("human" | "ai")[];
  moves: number;
  result?: string;
  createdAt: number;
  updatedAt: number;
}

export const api = {
  config: () => request<{ authRequired: boolean; sizes: number[] }>("/api/config"),
  checkAuth: () => request<{ ok: true }>("/api/auth"),
  listGames: () => request<{ games: GameMeta[] }>("/api/games").then((r) => r.games),
  createGame: (o: { size: number; humanColor: "black" | "white"; komi: number; humanName?: string; aiName?: string }) =>
    request<{ record: GameRecord }>("/api/games", { method: "POST", body: JSON.stringify(o) }).then((r) => r.record),
  getGame: (id: string) => request<{ record: GameRecord }>(`/api/games/${id}`).then((r) => r.record),
  act: (id: string, action: Action) =>
    request<{ record: GameRecord }>(`/api/games/${id}/actions`, { method: "POST", body: JSON.stringify(action) }).then((r) => r.record),
};
