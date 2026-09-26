// End-to-end check of every game through the real Worker and MCP tools: `pnpm all-games` while the dev server runs.
// For each game the AI moves first over MCP, the human answers over HTTP where it is their turn,
// and card games are checked for hidden-information leaks in the human's web view.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.TOKEN ?? "devtoken";
let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "ok  " : "FAIL"} - ${msg}`);
  if (!cond) failures++;
};

const client = new Client({ name: "all-games", version: "0" });
await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${TOKEN}`)));
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { text: r.content.map((c) => c.text).join("\n"), isError: Boolean(r.isError) };
};
const human = async (id, move) => {
  const r = await fetch(`${BASE}/api/games/${id}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ type: "move", move }),
  });
  return { status: r.status, body: await r.json() };
};
const webView = (id) => fetch(`${BASE}/api/games/${id}`).then((r) => r.json()).then((j) => j.match);

// First AI move (the AI takes the first seat) and a reply for the human, per game.
const PLAN = {
  go: { ai: () => "E5", human: "E4" },
  gomoku: { ai: () => "H8", human: "H9" },
  reversi: { ai: () => "d3", human: "c5" },
  chess: { ai: () => "e2e4", human: "e7e5" },
  xiangqi: { ai: () => "h2e2", human: "h9g7" },
  poker: { ai: () => "call", human: "check" },
  paodekuai: { ai: (t) => /^- "([^"]+)"/m.exec(t)?.[1], human: "pass" },
  monopoly: { ai: () => "roll" },
  aeroplane: { ai: () => "roll" },
};

const types = await call("list_game_types");
const kinds = [...types.text.matchAll(/^## (\w+) ·/gm)].map((m) => m[1]);
check(kinds.length === 9 && Object.keys(PLAN).every((k) => kinds.includes(k)), `list_game_types offers all 9 games (${kinds.join(", ")})`);

for (const kind of Object.keys(PLAN)) {
  const plan = PLAN[kind];
  const created = await call("new_game", { kind, human_first: false, human_name: "Seren", ai_name: "Claude" });
  const id = /Game (\w+) ·/.exec(created.text)?.[1];
  check(id && created.text.includes("Status: YOUR TURN"), `${kind}: created with the AI to move`);

  // Hidden information: nothing the AI holds may reach the human's page.
  if (kind === "poker") {
    const cards = /Your hole cards: ([2-9TJQKA][shdc]) ([2-9TJQKA][shdc])/.exec(created.text)?.slice(1) ?? [];
    const v = JSON.stringify(await webView(id));
    check(cards.length === 2 && cards.every((c) => !v.includes(`"${c}"`)), `${kind}: web view hides the AI's hole cards (${cards.join(" ")})`);
  }
  if (kind === "paodekuai") {
    const hand = /Your hand \(16 cards\): (.*)/.exec(created.text)?.[1] ?? "";
    const aiCards = [...hand.matchAll(/([♠♥♣♦])(10|[2-9JQKA])/g)].map((m) => ({ suit: m[1], rank: m[2] }));
    const view = await webView(id);
    const mine = JSON.stringify(view.view.hand ?? view.view);
    const letters = { "♠": "S", "♥": "H", "♣": "C", "♦": "D" };
    const leaked = aiCards.filter((c) => mine.includes(`"${letters[c.suit]}${c.rank}"`) || mine.includes(`"${c.suit}${c.rank}"`));
    check(aiCards.length === 16 && leaked.length === 0, `${kind}: web view contains none of the AI's 16 cards`);
    check(!JSON.stringify(view).includes("rng"), `${kind}: web view has no RNG state`);
  }

  const aiMove = plan.ai(created.text);
  const played = await call("play", { game_id: id, move: aiMove });
  check(!played.isError, `${kind}: AI plays "${aiMove}"${played.isError ? ` → ${played.text.slice(0, 120)}` : ""}`);

  if (plan.human) {
    const res = await human(id, plan.human);
    check(res.status === 200, `${kind}: human answers "${plan.human}"${res.status !== 200 ? ` → ${JSON.stringify(res.body).slice(0, 160)}` : ""}`);
  }
  const state = await call("get_state", { game_id: id });
  check(!state.isError && state.text.includes(`Game ${id}`), `${kind}: get_state describes the game`);
  const v = await webView(id);
  check(v.kind === kind && v.log.length >= 1 && v.status && v.seats, `${kind}: web view has status, seats and a log (${v.log.map((l) => l.move).join(" | ")})`);
}

await client.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall games passed");
process.exit(failures ? 1 : 0);
