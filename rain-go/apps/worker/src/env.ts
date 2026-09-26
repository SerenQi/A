import type { Actor, Match, MatchAction, NewMatchOptions } from "@rain-go/engine";
import type { ActResult, GameRoom } from "./game-room";
import type { Lobby } from "./lobby";

export interface Env {
  GAME: DurableObjectNamespace<GameRoom>;
  LOBBY: DurableObjectNamespace<Lobby>;
  ASSETS: Fetcher;
  /** Shared secret for the MCP endpoint and for acting as the human player. Unset means open access. */
  ACCESS_TOKEN?: string;
}

export const lobbyOf = (env: Env) => env.LOBBY.get(env.LOBBY.idFromName("main"));
/**
 * Typed handle to a game's Durable Object. Match.state is `unknown`, which the RPC type
 * mapping cannot express, so results are re-typed here once.
 */
export function roomOf(env: Env, id: string) {
  const stub = env.GAME.get(env.GAME.idFromName(id));
  return {
    create: (o: NewMatchOptions) => stub.create(o) as unknown as Promise<Match>,
    get: () => stub.get() as unknown as Promise<Match | null>,
    act: (actor: Actor, action: MatchAction) => stub.act(actor, action) as unknown as Promise<ActResult>,
    waitFor: (actor: Actor, ms: number) => stub.waitFor(actor, ms) as unknown as Promise<{ match: Match | null; timedOut: boolean }>,
    fetch: (req: Request) => stub.fetch(req),
  };
}

export function newGameId(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

export const isGameId = (s: string) => /^[a-z0-9]{6,32}$/.test(s);

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Accepts the token as a Bearer header, a `token` query parameter, or an explicit value. */
export function authorized(env: Env, req: Request, explicit?: string): boolean {
  const expected = env.ACCESS_TOKEN;
  if (!expected) return true;
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
  const query = new URL(req.url).searchParams.get("token") ?? undefined;
  return [explicit, bearer, query].some((t) => t !== undefined && safeEqual(t, expected));
}
