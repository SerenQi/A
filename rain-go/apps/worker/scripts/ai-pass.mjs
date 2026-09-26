// Dev helper: make the AI pass in a game. Usage: node scripts/ai-pass.mjs <gameId>
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const client = new Client({ name: "ai-pass", version: "0" });
await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${process.env.TOKEN ?? "devtoken"}`)));
const r = await client.callTool({ name: "go_play", arguments: { game_id: process.argv[2], move: "pass", say: "我也停一手，数数看吧" } });
console.log(r.isError ? r.content[0].text : "ai passed");
await client.close();
