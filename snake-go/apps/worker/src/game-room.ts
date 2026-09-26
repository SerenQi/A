import { DurableObject } from "cloudflare:workers";
import {
  applyAction,
  createRecord,
  phaseOf,
  replay,
  resultOf,
  waitingOn,
  type Action,
  type Actor,
  type GameRecord,
  type NewGameOptions,
} from "@snake-go/engine";
import { lobbyOf, type Env } from "./env";
import type { GameMeta } from "./lobby";

export type ActResult = { ok: true; record: GameRecord } | { ok: false; error: string; message: string };

/** One Durable Object per game: stores the record, pushes updates over WebSockets, and lets the AI wait. */
export class GameRoom extends DurableObject<Env> {
  private record: GameRecord | null | undefined;
  private waiters = new Set<() => void>();

  private async load(): Promise<GameRecord | null> {
    if (this.record === undefined) this.record = (await this.ctx.storage.get<GameRecord>("record")) ?? null;
    return this.record;
  }

  private async save(r: GameRecord): Promise<void> {
    this.record = r;
    await this.ctx.storage.put("record", r);
    const payload = JSON.stringify({ type: "record", record: r });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Socket already closing.
      }
    }
    for (const wake of this.waiters) wake();
    this.waiters.clear();
    await lobbyOf(this.env).upsert(metaOf(r));
  }

  async create(o: NewGameOptions): Promise<GameRecord> {
    if (await this.load()) throw new Error("Game already exists");
    const r = createRecord(o);
    await this.save(r);
    return r;
  }

  async get(): Promise<GameRecord | null> {
    return this.load();
  }

  async act(actor: Actor, action: Action): Promise<ActResult> {
    const r = await this.load();
    if (!r) return { ok: false, error: "not_found", message: "Game not found." };
    const res = applyAction(r, actor, action, Date.now());
    if (!res.ok) return res;
    await this.save(res.record);
    return { ok: true, record: res.record };
  }

  /**
   * Resolves once the game waits on `actor` (their turn, or scoring needs their accept),
   * the game ends, or the timeout passes. `timedOut` tells which.
   */
  async waitFor(actor: Actor, timeoutMs: number): Promise<{ record: GameRecord | null; timedOut: boolean }> {
    const deadline = Date.now() + Math.min(Math.max(timeoutMs, 0), 58_000);
    for (;;) {
      const r = await this.load();
      if (!r) return { record: null, timedOut: false };
      const s = replay(r.size, r.moves);
      if (phaseOf(r, s) === "finished" || waitingOn(r, s).includes(actor)) return { record: r, timedOut: false };
      const left = deadline - Date.now();
      if (left <= 0) return { record: r, timedOut: true };
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
    const r = await this.load();
    server.send(JSON.stringify(r ? { type: "record", record: r } : { type: "error", message: "Game not found." }));
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

export function metaOf(r: GameRecord): GameMeta {
  const s = replay(r.size, r.moves);
  return {
    id: r.id,
    size: r.size,
    humanName: r.humanName,
    aiName: r.aiName,
    humanColor: r.humanColor,
    phase: phaseOf(r, s),
    waitingOn: waitingOn(r, s),
    moves: r.moves.filter((m) => m.k === "play" || m.k === "pass").length,
    result: resultOf(r, s)?.text,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
