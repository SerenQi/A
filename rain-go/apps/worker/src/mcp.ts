import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { describeForAi, fromGtp, type Action, type GameRecord } from "@rain-go/engine";
import { z } from "zod";
import { isGameId, lobbyOf, newGameId, roomOf, type Env } from "./env";

const INSTRUCTIONS = `West Window (西窗): play Go against a human on a shared board. On the human's screen stones look like water drops on a rainy window; connected stones of one color merge into one drop.

Flow:
1. go_new_game (or go_list_games to find one). Share the board link with the human.
2. When it is your turn call go_play with a GTP coordinate like "D4", or "pass".
3. Otherwise call go_wait_for_opponent. It blocks up to ~50s; call it again if it times out.
4. After two passes the game enters scoring: mark dead chains with go_scoring toggle_dead, then accept. Either side may resume play instead.
Rules: Chinese area scoring, positional superko, suicide forbidden. Board text uses X for black, O for white, + for star points, lowercase for stones marked dead.
You may talk to the human with the "say" argument of go_play or with go_say. Keep it short and warm.
Either side's display name can be changed at any time with go_rename, for example when the human asks you to call them something else.`;

const text = (t: string, isError = false) => ({ content: [{ type: "text" as const, text: t }], isError });

export function buildMcpServer(env: Env, origin: string): McpServer {
  const server = new McpServer(
    { name: "rain-go", version: "0.1.0" },
    { instructions: INSTRUCTIONS, jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  );
  const urlOf = (id: string) => `${origin}/g/${id}`;

  const resolveGame = async (gameId?: string): Promise<{ id: string; record: GameRecord } | { error: string }> => {
    let id = gameId?.trim();
    if (!id) {
      const [latest] = await lobbyOf(env).list(1, false);
      if (!latest) return { error: "No active game. Start one with go_new_game." };
      id = latest.id;
    }
    if (!isGameId(id)) return { error: `Invalid game id "${id}".` };
    const record = await roomOf(env, id).get();
    if (!record) return { error: `Game ${id} not found.` };
    return { id, record };
  };

  const gameIdArg = z
    .string()
    .optional()
    .describe("Game id. Omit to use the most recently active unfinished game.");

  const act = async (gameId: string | undefined, actions: Action[]) => {
    const g = await resolveGame(gameId);
    if ("error" in g) return text(g.error, true);
    let record = g.record;
    for (const a of actions) {
      const res = await roomOf(env, g.id).act("ai", a);
      if (!res.ok) return text(`Not allowed: ${res.message}\n\n${describeForAi(record, urlOf(g.id))}`, true);
      record = res.record;
    }
    return text(describeForAi(record, urlOf(g.id)));
  };

  server.registerTool(
    "go_new_game",
    {
      title: "Start a new game",
      description: "Create a new Go game against the human. Returns the game id and a board link to give to the human.",
      inputSchema: {
        size: z.union([z.literal(9), z.literal(13), z.literal(19)]).default(9).describe("Board size."),
        ai_color: z.enum(["black", "white"]).default("white").describe("Your color. Black moves first."),
        komi: z.number().min(-50).max(50).default(7.5).describe("Points given to white."),
        human_name: z.string().max(40).optional().describe("How to call the human player."),
        ai_name: z.string().max(40).optional().describe("Your display name on the board."),
      },
    },
    async ({ size, ai_color, komi, human_name, ai_name }) => {
      const id = newGameId();
      const record = await roomOf(env, id).create({
        id,
        size,
        komi,
        humanColor: ai_color === "white" ? 1 : 2,
        humanName: human_name,
        aiName: ai_name,
        now: Date.now(),
      });
      return text(`New game created. Send the human this link: ${urlOf(id)}\n\n${describeForAi(record, urlOf(id))}`);
    },
  );

  server.registerTool(
    "go_list_games",
    {
      title: "List games",
      description: "List recent games with their status.",
      inputSchema: { include_finished: z.boolean().default(false) },
      annotations: { readOnlyHint: true },
    },
    async ({ include_finished }) => {
      const games = await lobbyOf(env).list(20, include_finished);
      if (!games.length) return text("No games yet. Start one with go_new_game.");
      const lines = games.map(
        (g) =>
          `- ${g.id} · ${g.size}x${g.size} · ${g.phase}${g.result ? ` (${g.result})` : ""} · ${g.moves} moves · waiting on ${
            g.waitingOn.join(" & ") || "nobody"
          } · vs ${g.humanName} · ${urlOf(g.id)}`,
      );
      return text(lines.join("\n"));
    },
  );

  server.registerTool(
    "go_get_board",
    {
      title: "Show the board",
      description: "Show the current board, whose turn it is, chains in danger, and recent messages.",
      inputSchema: { game_id: gameIdArg },
      annotations: { readOnlyHint: true },
    },
    async ({ game_id }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      return text(describeForAi(g.record, urlOf(g.id)));
    },
  );

  server.registerTool(
    "go_play",
    {
      title: "Play a move",
      description: 'Play your move: a GTP coordinate such as "D4" (columns skip I, row 1 is the bottom) or "pass". Optionally say something to the human.',
      inputSchema: {
        game_id: gameIdArg,
        move: z.string().describe('GTP coordinate like "D4", or "pass".'),
        say: z.string().max(280).optional().describe("A short message shown to the human next to your move."),
      },
    },
    async ({ game_id, move, say }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      const actions: Action[] = [];
      if (move.trim().toLowerCase() === "pass") actions.push({ type: "pass" });
      else {
        const point = fromGtp(move, g.record.size);
        if (point === null) return text(`"${move}" is not a coordinate on a ${g.record.size}x${g.record.size} board.`, true);
        actions.push({ type: "play", point });
      }
      if (say?.trim()) actions.push({ type: "say", text: say });
      return act(g.id, actions);
    },
  );

  server.registerTool(
    "go_wait_for_opponent",
    {
      title: "Wait for the human",
      description:
        "Block until the human has moved (or scoring needs your decision, or the game ends). Returns the board. If it says it timed out, call it again.",
      inputSchema: {
        game_id: gameIdArg,
        timeout_seconds: z.number().int().min(1).max(55).default(50),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ game_id, timeout_seconds }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      const { record, timedOut } = await roomOf(env, g.id).waitFor("ai", timeout_seconds * 1000);
      if (!record) return text("Game disappeared.", true);
      const head = timedOut ? "Still waiting for the human (timed out). Call go_wait_for_opponent again.\n\n" : "";
      return text(head + describeForAi(record, urlOf(g.id)));
    },
  );

  server.registerTool(
    "go_scoring",
    {
      title: "Scoring decisions",
      description:
        "During scoring: toggle_dead marks or unmarks the whole chain at a point as dead; accept agrees to the current marking; resume goes back to playing.",
      inputSchema: {
        game_id: gameIdArg,
        action: z.enum(["toggle_dead", "accept", "resume"]),
        point: z.string().optional().describe('For toggle_dead: any stone of the chain, e.g. "C3".'),
      },
    },
    async ({ game_id, action, point }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      if (action === "toggle_dead") {
        const p = point ? fromGtp(point, g.record.size) : null;
        if (p === null) return text("toggle_dead needs a valid point.", true);
        return act(g.id, [{ type: "toggle_dead", point: p }]);
      }
      return act(g.id, [{ type: action }]);
    },
  );

  server.registerTool(
    "go_resign",
    {
      title: "Resign",
      description: "Resign the game.",
      inputSchema: { game_id: gameIdArg },
      annotations: { destructiveHint: true },
    },
    async ({ game_id }) => act(game_id, [{ type: "resign" }]),
  );

  server.registerTool(
    "go_rename",
    {
      title: "Rename players",
      description: "Change the display name of the human, of yourself, or both. The board page updates at once.",
      inputSchema: {
        game_id: gameIdArg,
        human_name: z.string().min(1).max(40).optional().describe("New name for the human."),
        ai_name: z.string().min(1).max(40).optional().describe("New name for you."),
      },
    },
    async ({ game_id, human_name, ai_name }) => {
      if (human_name === undefined && ai_name === undefined) return text("Give human_name, ai_name, or both.", true);
      return act(game_id, [{ type: "rename", humanName: human_name, aiName: ai_name }]);
    },
  );

  server.registerTool(
    "go_say",
    {
      title: "Say something",
      description: "Send a short message to the human; it appears on the board page.",
      inputSchema: { game_id: gameIdArg, text: z.string().min(1).max(280) },
    },
    async ({ game_id, text: t }) => act(game_id, [{ type: "say", text: t }]),
  );

  return server;
}

/** Stateless Streamable HTTP: a fresh server and transport per request. */
export async function handleMcp(req: Request, env: Env, origin: string): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "POST" },
    });
  }
  const server = buildMcpServer(env, origin);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}
