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

const { tools } = await client.listTools();
assert(tools.length === 9, `lists 9 tools (${tools.map((t) => t.name).join(", ")})`);

const created = await call("go_new_game", { size: 9, ai_color: "white", human_name: "Seren", ai_name: "Claude" });
const id = /Game (\w+) ·/.exec(created.text)?.[1];
assert(id, `creates a game (${id})`);

const human = async (action) => {
  const r = await fetch(`${BASE}/api/games/${id}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(action),
  });
  return { status: r.status, body: await r.json() };
};

const early = await call("go_play", { game_id: id, move: "E5" });
assert(early.isError && early.text.includes("black's turn"), "AI cannot move out of turn");

const noAuth = await fetch(`${BASE}/api/games/${id}/actions`, { method: "POST", body: JSON.stringify({ type: "pass" }) });
assert(noAuth.status === 401, "human actions need the token");

assert((await human({ type: "play", point: 4 * 9 + 4 })).status === 200, "human plays E5");
const w1 = await call("go_wait_for_opponent", { game_id: id, timeout_seconds: 5 });
assert(w1.text.includes("that's YOU") && !w1.text.includes("timed out"), "wait returns at once when it is the AI's turn");

const p1 = await call("go_play", { game_id: id, move: "E6", say: "hello there" });
assert(!p1.isError && p1.text.includes("Last: white E6"), "AI plays E6 with a message");
assert(p1.text.includes("Claude (you): hello there"), "message is recorded");

const t0 = Date.now();
const w2 = await call("go_wait_for_opponent", { game_id: id, timeout_seconds: 2 });
assert(w2.text.includes("timed out") && Date.now() - t0 >= 1900, "wait times out after the requested seconds");

const pending = call("go_wait_for_opponent", { game_id: id, timeout_seconds: 20 });
await new Promise((r) => setTimeout(r, 800));
await human({ type: "play", point: 5 * 9 + 4 });
const w3 = await pending;
assert(w3.text.includes("Last: black E4") && !w3.text.includes("timed out"), "blocked wait wakes up when the human moves");

const ren = await call("go_rename", { game_id: id, ai_name: "Lunare" });
assert(!ren.isError && ren.text.includes("You play white") && ren.text.includes("Lunare (you)"), "AI renames itself");
const hren = await human({ type: "rename", humanName: "Seren Qi", aiName: "Claude" });
assert(hren.status === 200 && hren.body.record.humanName === "Seren Qi" && hren.body.record.aiName === "Claude", "human renames both sides");
const badName = await human({ type: "rename", humanName: "  " });
assert(badName.status === 409 && badName.body.error === "bad_name", "blank names are rejected");

const occ = await call("go_play", { game_id: id, move: "E4" });
assert(occ.isError && occ.text.includes("already occupied"), "occupied point is rejected");
const turn = await human({ type: "pass" });
assert(turn.status === 409 && turn.body.error === "wrong_turn", "human acting out of turn gets 409");

await call("go_play", { move: "pass" });
await human({ type: "pass" });
const sc = await call("go_get_board", { game_id: id });
assert(sc.text.includes("Phase: scoring"), "two passes enter scoring");
const td = await call("go_scoring", { game_id: id, action: "toggle_dead", point: "E6" });
assert(td.text.includes(" o "), "AI marks its own stone dead (lowercase o)");
await human({ type: "accept" });
const fin = await call("go_scoring", { game_id: id, action: "accept" });
assert(fin.text.includes("Game over: B+73.5"), "both accept and the game is scored");

const list = await fetch(`${BASE}/api/games`, { headers: { authorization: `Bearer ${TOKEN}` } }).then((r) => r.json());
assert(list.games.some((g) => g.id === id && g.result === "B+73.5"), "lobby lists the finished game");

await client.close();
console.log("\nall smoke checks passed");
