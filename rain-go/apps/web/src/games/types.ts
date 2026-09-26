import type { MatchView } from "@rain-go/engine";
import type { FC } from "react";

export interface BoardProps<V = any> {
  match: MatchView<V>;
  /** The human's view of the game state (module.view(state, "human")). */
  view: V;
  /** True when it is the human's turn and no request is in flight. */
  canAct: boolean;
  /** Sends a move in the module's move syntax. Resolves false (and toasts) on error. */
  send: (move: string) => Promise<boolean>;
  toast: (msg: string) => void;
  /** Phone layout: the board gets whatever height is left and must not overflow. */
  compact: boolean;
}

export interface GameUI<V = any> {
  /**
   * "square": the page gives Board a square glass box (like a go board).
   * "fill": the page gives Board a flexible box (flex-1, min-h-0); Board lays out its own
   * table and controls and must never overflow it.
   */
  shape: "square" | "fill";
  Board: FC<BoardProps<V>>;
  /** Buttons for the action row. Render <button className="btn btn-glass flex-1 ..."> elements. */
  Actions?: FC<BoardProps<V>>;
  /** Short header status; return null to use the default ("轮到你了" / "X 思考中…" / result). */
  status?: (view: V, match: MatchView<V>) => string | null;
  /** Small figure for the right side of the black pill, e.g. { value: "17", label: "MOVE" }. */
  badge?: (view: V, match: MatchView<V>) => { value: string; label: string };
  /** Extra numbers for the desktop stats card. */
  stats?: (view: V, match: MatchView<V>) => { label: string; value: string }[];
}
