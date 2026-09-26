// End-to-end check against a running server: `pnpm dev` in another shell, then `pnpm smoke`.
// Env: BASE (default http://127.0.0.1:8787), TOKEN (default devtoken).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.TOKEN ?? "devtoken";
const assert = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
};

const unauth = await fetch(`${BASE}/mcp`, { method: "POST", body: "{}" });
assert(unauth.status === 401, "MCP rejects requests without a token");

const client = new Client({ name: "smoke", version: "0" });
await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${TOKEN}`)));
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { text: r.content.map((c) => c.text).join("\n"), isError: Boolean(r.isError) };
};
const humanAs = (id) => async (action) => {
  const r = await fetch(`${BASE}/api/games/${id}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(action),
  });
  return { status: r.status, body: await r.json() };
};

const { tools } = await client.listTools();
assert(tools.length === 9, `lists 9 tools (${tools.map((t) => t.name).join(", ")})`);
const types = await call("list_game_types");
assert(types.text.includes("## go ·") && types.text.includes("## gomoku ·") && types.text.includes("## reversi ·"), "list_game_types describes the games");

// --- Go through the generic tools ---
const created = await call("new_game", { kind: "go", options: { size: "9" }, human_first: true, human_name: "Seren", ai_name: "Claude" });
const id = /Game (\w+) ·/.exec(created.text)?.[1];
assert(id, `creates a go game (${id})`);
const human = humanAs(id);

const early = await call("play", { game_id: id, move: "E5" });
assert(early.isError && early.text.includes("还没轮到你"), "AI cannot move out of turn");
const noAuth = await fetch(`${BASE}/api/games/${id}/actions`, { method: "POST", body: JSON.stringify({ type: "move", move: "pass" }) });
assert(noAuth.status === 401, "human actions need the token");

assert((await human({ type: "move", move: "E5" })).status === 200, "human plays E5");
const w1 = await call("wait_for_opponent", { game_id: id, timeout_seconds: 5 });
assert(w1.text.includes("Status: YOUR TURN") && !w1.text.includes("timed out"), "wait returns at once on the AI's turn");
const p1 = await call("play", { game_id: id, move: "E6", say: "hello there" });
assert(!p1.isError && p1.text.includes("Last: white E6") && p1.text.includes("Claude (you): hello there"), "AI plays E6 with a message");

const t0 = Date.now();
const w2 = await call("wait_for_opponent", { game_id: id, timeout_seconds: 2 });
assert(w2.text.includes("timed out") && Date.now() - t0 >= 1900, "wait times out after the requested seconds");
const pending = call("wait_for_opponent", { game_id: id, timeout_seconds: 20 });
await new Promise((r) => setTimeout(r, 800));
await human({ type: "move", move: "E4" });
const w3 = await pending;
assert(w3.text.includes("Last: black E4") && !w3.text.includes("timed out"), "blocked wait wakes up when the human moves");

const ren = await call("rename", { game_id: id, ai_name: "Lunare" });
assert(!ren.isError && ren.text.includes("You are Lunare (白)"), "AI renames itself");
const hren = await human({ type: "rename", humanName: "Seren Qi", aiName: "Claude" });
assert(hren.status === 200 && hren.body.match.humanName === "Seren Qi", "human renames both sides");
const badName = await human({ type: "rename", humanName: "  " });
assert(badName.status === 409 && badName.body.error === "bad_name", "blank names are rejected");

const occ = await call("play", { game_id: id, move: "E4" });
assert(occ.isError && occ.text.includes("已经有子"), "occupied point is rejected");
await call("play", { move: "pass" });
await human({ type: "move", move: "pass" });
const sc = await call("get_state", { game_id: id });
assert(sc.text.includes("Phase: scoring"), "two passes enter scoring");
const td = await call("play", { game_id: id, move: "dead E6" });
assert(td.text.includes(" o "), "AI marks its own stone dead");
await human({ type: "move", move: "accept" });
const fin = await call("play", { game_id: id, move: "accept" });
assert(fin.text.includes("GAME OVER: Seren Qi 胜 · 黑 +73.5"), "both accept and the game is scored");

// --- Gomoku and resign ---
const g2 = await call("new_game", { kind: "gomoku", human_first: false });
const id2 = /Game (\w+) ·/.exec(g2.text)?.[1];
assert(g2.text.includes("Status: YOUR TURN"), "AI moves first when human_first is false");
await call("play", { game_id: id2, move: "H8" });
const view = await fetch(`${BASE}/api/games/${id2}`).then((r) => r.json());
assert(view.match.kind === "gomoku" && view.match.view.cells.filter(Boolean).length === 1, "web view shows the AI's stone");
await humanAs(id2)({ type: "resign" });
const g2s = await call("get_state", { game_id: id2 });
assert(g2s.text.includes("GAME OVER: Human 认输"), "resign ends the game");

const list = await fetch(`${BASE}/api/games`, { headers: { authorization: `Bearer ${TOKEN}` } }).then((r) => r.json());
assert(list.games.some((g) => g.id === id && g.over && g.result.includes("73.5")), "lobby lists the finished game");

await client.close();
console.log("\nall smoke checks passed");
