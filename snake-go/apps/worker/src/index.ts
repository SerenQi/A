import { SUPPORTED_SIZES, parseColor, type Action } from "@snake-go/engine";
import { Hono } from "hono";
import { authorized, isGameId, lobbyOf, newGameId, roomOf, type Env } from "./env";
import { handleMcp } from "./mcp";

export { GameRoom } from "./game-room";
export { Lobby } from "./lobby";

const app = new Hono<{ Bindings: Env }>();

const unauthorized = () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });

app.get("/api/config", (c) => c.json({ authRequired: Boolean(c.env.ACCESS_TOKEN), sizes: SUPPORTED_SIZES }));

app.get("/api/auth", (c) => (authorized(c.env, c.req.raw) ? c.json({ ok: true }) : unauthorized()));

app.get("/api/games", async (c) => {
  if (!authorized(c.env, c.req.raw)) return unauthorized();
  return c.json({ games: await lobbyOf(c.env).list(50, true) });
});

app.post("/api/games", async (c) => {
  if (!authorized(c.env, c.req.raw)) return unauthorized();
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const size = Number(body.size ?? 9);
  if (!(SUPPORTED_SIZES as readonly number[]).includes(size)) return c.json({ error: "bad_size" }, 400);
  const humanColor = parseColor(String(body.humanColor ?? "black")) ?? 1;
  const komi = Number(body.komi ?? 7.5);
  if (!Number.isFinite(komi) || Math.abs(komi) > 50) return c.json({ error: "bad_komi" }, 400);
  const id = newGameId();
  const record = await roomOf(c.env, id).create({
    id,
    size,
    komi,
    humanColor,
    humanName: typeof body.humanName === "string" ? body.humanName.slice(0, 40) : undefined,
    aiName: typeof body.aiName === "string" ? body.aiName.slice(0, 40) : undefined,
    now: Date.now(),
  });
  return c.json({ record }, 201);
});

app.get("/api/games/:id", async (c) => {
  const id = c.req.param("id");
  if (!isGameId(id)) return c.json({ error: "bad_id" }, 400);
  const record = await roomOf(c.env, id).get();
  return record ? c.json({ record }) : c.json({ error: "not_found" }, 404);
});

const ACTION_TYPES = new Set(["play", "pass", "resign", "toggle_dead", "accept", "resume", "say"]);

app.post("/api/games/:id/actions", async (c) => {
  if (!authorized(c.env, c.req.raw)) return unauthorized();
  const id = c.req.param("id");
  if (!isGameId(id)) return c.json({ error: "bad_id" }, 400);
  const action = await c.req.json<Action>().catch(() => null);
  if (!action || typeof action !== "object" || !ACTION_TYPES.has(action.type)) return c.json({ error: "bad_action" }, 400);
  const res = await roomOf(c.env, id).act("human", action);
  return res.ok ? c.json({ record: res.record }) : c.json(res, 409);
});

app.get("/api/games/:id/ws", async (c) => {
  const id = c.req.param("id");
  if (!isGameId(id)) return c.json({ error: "bad_id" }, 400);
  return roomOf(c.env, id).fetch(c.req.raw);
});

const mcp = async (req: Request, env: Env, token?: string) => {
  if (!authorized(env, req, token)) return unauthorized();
  return handleMcp(req, env, new URL(req.url).origin);
};
app.all("/mcp", (c) => mcp(c.req.raw, c.env));
app.all("/mcp/:token", (c) => mcp(c.req.raw, c.env, c.req.param("token")));

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
