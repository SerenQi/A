import { COLUMNS, starPoints, toGtp } from "./coords";
import { actorColor, phaseOf, resultOf, waitingOn } from "./record";
import { findChains } from "./chains";
import { areaScore } from "./score";
import { replay } from "./state";
import { BLACK, WHITE, colorName, type GameRecord } from "./types";

const symbol = (c: number) => (c === BLACK ? "X" : c === WHITE ? "O" : ".");

/** Plain-text board with GTP coordinates. Dead stones are lowercase. */
export function boardText(r: GameRecord): string {
  const s = replay(r.size, r.moves);
  const stars = new Set(starPoints(r.size));
  const dead = new Set(r.dead);
  const cols = COLUMNS.slice(0, r.size).split("").join(" ");
  const lines = [`    ${cols}`];
  for (let y = 0; y < r.size; y++) {
    const row: string[] = [];
    for (let x = 0; x < r.size; x++) {
      const p = y * r.size + x;
      const c = s.cells[p]!;
      let ch = c === 0 && stars.has(p) ? "+" : symbol(c);
      if (dead.has(p)) ch = ch.toLowerCase();
      row.push(ch);
    }
    const n = String(r.size - y).padStart(2, " ");
    lines.push(`${n}  ${row.join(" ")}  ${n}`);
  }
  lines.push(`    ${cols}`);
  return lines.join("\n");
}

/** Full game description written for an AI player. */
export function describeForAi(r: GameRecord, url?: string): string {
  const s = replay(r.size, r.moves);
  const aiColor = actorColor(r, "ai");
  const phase = phaseOf(r, s);
  const g = (p: number) => toGtp(p, r.size);
  const name = (c: 1 | 2) => (c === aiColor ? `${r.aiName} (you)` : r.humanName);
  const out: string[] = [];

  out.push(`Game ${r.id} · ${r.size}x${r.size} · komi ${r.komi} · Chinese area scoring, positional superko`);
  if (url) out.push(`Board page: ${url}`);
  out.push(`You play ${colorName(aiColor)} (${symbol(aiColor)}). ${r.humanName} plays ${colorName(r.humanColor)} (${symbol(r.humanColor)}).`);

  const plays = r.moves.filter((m) => m.k === "play" || m.k === "pass").length;
  out.push(`Phase: ${phase}. Moves played: ${plays}. Captures: black ${s.captures[1]}, white ${s.captures[2]}.`);

  const last = s.lastMove;
  if (last) {
    const what = last.k === "play" ? g(last.p!) : last.k;
    const cap = s.lastCaptured.length ? `, captured ${s.lastCaptured.length}: ${s.lastCaptured.map(g).join(" ")}` : "";
    out.push(`Last: ${colorName(last.c)} ${what}${cap}.`);
  }

  const waits = waitingOn(r, s);
  if (phase === "playing") {
    out.push(`To play: ${colorName(s.toPlay)}, ${waits[0] === "ai" ? "that's YOU. Call go_play." : `waiting for ${r.humanName}. Call go_wait_for_opponent.`}`);
  } else if (phase === "scoring") {
    const est = areaScore(s.cells, r.size, r.dead, r.komi);
    out.push(
      `Both players passed. Mark dead stones with go_scoring (toggle_dead), then accept. Lowercase stones below are marked dead.`,
      `Current count: black ${est.black}, white ${est.white} (incl. komi). Accepted by: ${r.accepted.map(colorName).join(", ") || "nobody yet"}.`,
    );
  } else {
    const res = resultOf(r, s);
    out.push(`Game over: ${res?.text ?? "finished"}.`);
    if (r.finalScore) out.push(`Final count: black ${r.finalScore.black}, white ${r.finalScore.white}.`);
  }

  out.push("", boardText(r), "");

  const chains = findChains(s);
  const count = (c: 1 | 2) => chains.filter((x) => x.color === c).length;
  out.push(`Chains: black ${count(BLACK)}, white ${count(WHITE)}.`);
  const weak = chains.filter((x) => x.liberties.length <= 2).sort((a, b) => a.liberties.length - b.liberties.length);
  for (const x of weak.slice(0, 12)) {
    const stones = x.stones.map(g).sort().join(" ");
    const libs = x.liberties.map(g).join(" ");
    out.push(
      `- ${x.liberties.length === 1 ? "IN ATARI" : "2 liberties"}: ${name(x.color)}'s ${colorName(x.color)} chain ${stones}, liberties ${libs}`,
    );
  }

  const recent = r.chat.slice(-5);
  if (recent.length) {
    out.push("", "Recent messages:");
    for (const m of recent) out.push(`- ${m.from === "ai" ? `${r.aiName} (you)` : r.humanName}: ${m.text}`);
  }
  return out.join("\n");
}
