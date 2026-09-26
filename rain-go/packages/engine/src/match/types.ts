export type Actor = "human" | "ai";
export const otherActor = (a: Actor): Actor => (a === "human" ? "ai" : "human");

export const GAME_KINDS = ["go", "gomoku", "reversi", "chess", "xiangqi", "poker", "paodekuai", "monopoly", "aeroplane", "doudizhu"] as const;
export type GameKind = (typeof GAME_KINDS)[number];
export const isGameKind = (s: unknown): s is GameKind => typeof s === "string" && (GAME_KINDS as readonly string[]).includes(s);

/** A choice shown in the lobby and accepted by new_game. Values are strings. */
export interface OptionSpec {
  key: string;
  label: string;
  choices: { value: string; label: string }[];
  default: string;
}

export interface CreateContext {
  /** Seed for any randomness (shuffles, dice). Store RNG state inside your game state. */
  seed: number;
  /** True when the human takes the first seat (black, white in chess, red in xiangqi, first to act...). */
  humanFirst: boolean;
  /** Validated option values keyed by OptionSpec.key. */
  options: Record<string, string>;
}

export interface Outcome {
  winner: Actor | "draw";
  /** Short Chinese result detail, e.g. "黑 +3.5" or "将死". Names are added by the match layer. */
  text: string;
}

export type MoveResult<S> = { ok: true; state: S; log?: string } | { ok: false; error: string };

/**
 * One game's rules. Everything is pure and JSON-serializable: `apply` never mutates,
 * and any randomness comes from RNG state kept inside S (see ./rng).
 */
export interface GameModule<S = any, V = any> {
  kind: GameKind;
  name: { zh: string; en: string };
  family: "棋" | "牌" | "骰";
  /** One short Chinese line for the lobby. */
  blurb: string;
  /** False for placeholders; the lobby hides them and new_game rejects them. */
  ready: boolean;
  options: OptionSpec[];
  /** Full rules and move syntax for the AI, in English. */
  rules: string;
  /** One-line move syntax reminder for the AI, in English. */
  moveHelp: string;
  create(ctx: CreateContext): S;
  /** Applies `move` (free text, trimmed) by `actor`. Errors are short Chinese messages shown to the human. */
  apply(state: S, actor: Actor, move: string): MoveResult<S>;
  /** Who must act now. Empty when the game is over. */
  waitingOn(state: S): Actor[];
  outcome(state: S): Outcome | null;
  /** Seat labels such as { human: "黑", ai: "白" }. */
  seats(state: S): Record<Actor, string>;
  /** What `viewer` may see. Hide the opponent's cards and any deck order. */
  view(state: S, viewer: Actor): V;
  /** The AI's view in English: board or table, its own hand, whose turn, legal move hints. */
  describe(state: S, names: Record<Actor, string>): string;
}
