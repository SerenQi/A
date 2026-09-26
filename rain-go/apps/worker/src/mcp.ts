import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { GAMES, describeMatch, readyGames, type Match, type MatchAction } from "@rain-go/engine";
import { z } from "zod";
import { isGameId, lobbyOf, newGameId, roomOf, type Env } from "./env";

const INSTRUCTIONS = `West Window (西窗): play board, card and dice games against a human who watches a live page on their phone.

Flow:
1. list_game_types to see what can be played and each game's rules, then new_game. Share the returned link with the human.
2. When it is your turn call play with a move in that game's syntax (every state tells you the syntax).
3. Otherwise call wait_for_opponent. It blocks up to ~50s; call it again if it times out.
4. get_state shows the table at any time. Card games only show you your own hand.
You may talk to the human with the "say" argument of play or with say. Keep it short and warm.
Either side's display name can be changed at any time with rename.`;

const text = (t: string, isError = false) => ({ content: [{ type: "text" as const, text: t }], isError });

export function buildMcpServer(env: Env, origin: string): McpServer {
  const server = new McpServer(
    { name: "rain-go", version: "0.2.0" },
    { instructions: INSTRUCTIONS, jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  );
  const urlOf = (id: string) => `${origin}/g/${id}`;
  const readyKinds = readyGames().map((g) => g.kind) as [string, ...string[]];

  const resolveGame = async (gameId?: string): Promise<{ id: string; match: Match } | { error: string }> => {
    let id = gameId?.trim();
    if (!id) {
      const [latest] = await lobbyOf(env).list(1, false);
      if (!latest) return { error: "No active game. Start one with new_game." };
      id = latest.id;
    }
    if (!isGameId(id)) return { error: `Invalid game id "${id}".` };
    const match = await roomOf(env, id).get();
    if (!match) return { error: `Game ${id} not found.` };
    return { id, match };
  };

  const gameIdArg = z.string().optional().describe("Game id. Omit to use the most recently active unfinished game.");

  const act = async (gameId: string | undefined, actions: MatchAction[]) => {
    const g = await resolveGame(gameId);
    if ("error" in g) return text(g.error, true);
    let match = g.match;
    for (const a of actions) {
      const res = await roomOf(env, g.id).act("ai", a);
      if (!res.ok) return text(`Not allowed: ${res.message}\n\n${describeMatch(match, urlOf(g.id))}`, true);
      match = res.match;
    }
    return text(describeMatch(match, urlOf(g.id)));
  };

  server.registerTool(
    "list_game_types",
    {
      title: "List game types",
      description: "List the games you can start, with options and full rules.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const lines = readyGames().map((g) => {
        const opts = g.options.length
          ? ` Options: ${g.options.map((o) => `${o.key} = ${o.choices.map((c) => c.value).join(" | ")} (default ${o.default})`).join("; ")}.`
          : "";
        return `## ${g.kind} · ${g.name.en} (${g.name.zh})\n${g.rules}${opts}\nMove syntax: ${g.moveHelp}`;
      });
      return text(lines.join("\n\n"));
    },
  );

  server.registerTool(
    "new_game",
    {
      title: "Start a new game",
      description: "Create a game against the human and get a link for them. See list_game_types for kinds and options.",
      inputSchema: {
        kind: z.enum(readyKinds).describe(`Game type: ${readyKinds.join(", ")}.`),
        options: z.record(z.string(), z.string()).optional().describe('Game options, e.g. {"size": "13"} for go.'),
        human_first: z.boolean().default(true).describe("True: the human takes the first seat (black / white in chess / red in xiangqi / acts first)."),
        human_name: z.string().max(40).optional(),
        ai_name: z.string().max(40).optional().describe("Your display name."),
      },
    },
    async ({ kind, options, human_first, human_name, ai_name }) => {
      const id = newGameId();
      const match = await roomOf(env, id).create({
        id,
        kind: kind as Match["kind"],
        options,
        humanFirst: human_first,
        humanName: human_name,
        aiName: ai_name,
        seed: crypto.getRandomValues(new Uint32Array(1))[0]!,
        now: Date.now(),
      });
      return text(`New game created. Send the human this link: ${urlOf(id)}\n\nRules: ${GAMES[match.kind].rules}\n\n${describeMatch(match, urlOf(id))}`);
    },
  );

  server.registerTool(
    "list_games",
    {
      title: "List games",
      description: "List recent games with their status.",
      inputSchema: { include_finished: z.boolean().default(false) },
      annotations: { readOnlyHint: true },
    },
    async ({ include_finished }) => {
      const games = await lobbyOf(env).list(20, include_finished);
      if (!games.length) return text("No games yet. Start one with new_game.");
      return text(
        games
          .map(
            (g) =>
              `- ${g.id} · ${GAMES[g.kind].name.en} · ${g.result ?? (g.waitingOn.includes("ai") ? "your turn" : `waiting on ${g.humanName}`)} · ${g.moves} moves · ${urlOf(g.id)}`,
          )
          .join("\n"),
      );
    },
  );

  server.registerTool(
    "get_state",
    {
      title: "Show the game",
      description: "Show the board or table as you may see it, whose turn it is, and recent messages.",
      inputSchema: { game_id: gameIdArg },
      annotations: { readOnlyHint: true },
    },
    async ({ game_id }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      return text(describeMatch(g.match, urlOf(g.id)));
    },
  );

  server.registerTool(
    "play",
    {
      title: "Make a move",
      description: "Make your move in the game's move syntax (shown in every state). Optionally say something to the human.",
      inputSchema: {
        game_id: gameIdArg,
        move: z.string().min(1).describe('The move, e.g. "D4", "e2e4", "call", "roll".'),
        say: z.string().max(280).optional().describe("A short message shown to the human next to your move."),
      },
    },
    async ({ game_id, move, say }) => {
      const actions: MatchAction[] = [{ type: "move", move }];
      if (say?.trim()) actions.push({ type: "say", text: say });
      return act(game_id, actions);
    },
  );

  server.registerTool(
    "wait_for_opponent",
    {
      title: "Wait for the human",
      description: "Block until it is your turn again or the game ends. Returns the state. If it says it timed out, call it again.",
      inputSchema: { game_id: gameIdArg, timeout_seconds: z.number().int().min(1).max(55).default(50) },
      annotations: { readOnlyHint: true },
    },
    async ({ game_id, timeout_seconds }) => {
      const g = await resolveGame(game_id);
      if ("error" in g) return text(g.error, true);
      const { match, timedOut } = await roomOf(env, g.id).waitFor("ai", timeout_seconds * 1000);
      if (!match) return text("Game disappeared.", true);
      const head = timedOut ? "Still waiting for the human (timed out). Call wait_for_opponent again.\n\n" : "";
      return text(head + describeMatch(match, urlOf(g.id)));
    },
  );

  server.registerTool(
    "resign",
    { title: "Resign", description: "Resign the game.", inputSchema: { game_id: gameIdArg }, annotations: { destructiveHint: true } },
    async ({ game_id }) => act(game_id, [{ type: "resign" }]),
  );

  server.registerTool(
    "rename",
    {
      title: "Rename players",
      description: "Change the display name of the human, of yourself, or both. The page updates at once.",
      inputSchema: {
        game_id: gameIdArg,
        human_name: z.string().min(1).max(40).optional(),
        ai_name: z.string().min(1).max(40).optional(),
      },
    },
    async ({ game_id, human_name, ai_name }) => {
      if (human_name === undefined && ai_name === undefined) return text("Give human_name, ai_name, or both.", true);
      return act(game_id, [{ type: "rename", humanName: human_name, aiName: ai_name }]);
    },
  );

  server.registerTool(
    "say",
    {
      title: "Say something",
      description: "Send a short message to the human; it appears on their page.",
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
