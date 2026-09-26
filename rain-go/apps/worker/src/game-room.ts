import { DurableObject } from "cloudflare:workers";
import {
  GAMES,
  applyMatchAction,
  createMatch,
  statusOf,
  viewMatch,
  type Actor,
  type Match,
  type MatchAction,
  type NewMatchOptions,
} from "@rain-go/engine";
import { lobbyOf, type Env } from "./env";
import type { GameMeta } from "./lobby";

export type ActResult = { ok: true; match: Match } | { ok: false; error: string; message: string };

/** One Durable Object per game: stores the match, pushes the human's view over WebSockets, and lets the AI wait. */
export class GameRoom extends DurableObject<Env> {
  private match: Match | null | undefined;
  private waiters = new Set<() => void>();

  private async load(): Promise<Match | null> {
    if (this.match === undefined) this.match = (await this.ctx.storage.get<Match>("match")) ?? null;
    return this.match;
  }

  private async save(m: Match): Promise<void> {
    this.match = m;
    await this.ctx.storage.put("match", m);
    // WebSocket watchers see the human's view: the AI's hidden cards never leave the server.
    const payload = JSON.stringify({ type: "match", match: viewMatch(m, "human") });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Socket already closing.
      }
    }
    for (const wake of this.waiters) wake();
    this.waiters.clear();
    await lobbyOf(this.env).upsert(metaOf(m));
  }

  async create(o: NewMatchOptions): Promise<Match> {
    if (await this.load()) throw new Error("Game already exists");
    const m = createMatch(o);
    await this.save(m);
    return m;
  }

  async get(): Promise<Match | null> {
    return this.load();
  }

  async act(actor: Actor, action: MatchAction): Promise<ActResult> {
    const m = await this.load();
    if (!m) return { ok: false, error: "not_found", message: "找不到这局" };
    const res = applyMatchAction(m, actor, action, Date.now());
    if (!res.ok) return res;
    await this.save(res.match);
    return { ok: true, match: res.match };
  }

  /** Resolves once the game waits on `actor`, the game ends, or the timeout passes. */
  async waitFor(actor: Actor, timeoutMs: number): Promise<{ match: Match | null; timedOut: boolean }> {
    const deadline = Date.now() + Math.min(Math.max(timeoutMs, 0), 58_000);
    for (;;) {
      const m = await this.load();
      if (!m) return { match: null, timedOut: false };
      const st = statusOf(m);
      if (st.outcome || st.waitingOn.includes(actor)) return { match: m, timedOut: false };
      const left = deadline - Date.now();
      if (left <= 0) return { match: m, timedOut: true };
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, left);
        this.waiters.add(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") return new Response("Expected WebSocket", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    const m = await this.load();
    server.send(JSON.stringify(m ? { type: "match", match: viewMatch(m, "human") } : { type: "error", message: "找不到这局" }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === "ping") ws.send("pong");
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try {
      ws.close(code, "bye");
    } catch {
      // Already closed.
    }
  }
}

export function metaOf(m: Match): GameMeta {
  const st = statusOf(m);
  return {
    id: m.id,
    kind: m.kind,
    humanName: m.humanName,
    aiName: m.aiName,
    seats: GAMES[m.kind].seats(m.state),
    over: Boolean(st.outcome),
    waitingOn: st.waitingOn,
    moves: m.log.length,
    result: st.resultText ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}
