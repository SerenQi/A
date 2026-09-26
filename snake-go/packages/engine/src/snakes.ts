import { groupAt } from "./board";
import { neighbors } from "./coords";
import type { GameState } from "./state";
import { EMPTY, type Color } from "./types";

/**
 * A chain of connected stones drawn as a snake. The most recently placed stone
 * is the head. The body is a depth-first spanning tree grown from the head, so
 * straight runs stay straight and branches become extra tails.
 */
export interface Snake {
  id: number;
  color: Color;
  head: number;
  stones: number[];
  /** Tree edges [parent, child]. */
  edges: [number, number][];
  /** Tree distance from the head, keyed by point. */
  depth: Record<number, number>;
  maxDepth: number;
  liberties: number[];
  /** Direction the head looks, as a unit step on the grid. */
  gaze: { dx: number; dy: number };
}

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export function findSnakes(s: GameState): Snake[] {
  const { size, cells, playedAt } = s;
  const seen = new Uint8Array(size * size);
  const snakes: Snake[] = [];
  const nb = neighbors(size);

  for (let p = 0; p < size * size; p++) {
    if (cells[p] === EMPTY || seen[p]) continue;
    const g = groupAt(cells, size, p);
    for (const st of g.stones) seen[st] = 1;

    let head = g.stones[0]!;
    for (const st of g.stones) if (playedAt[st]! > playedAt[head]!) head = st;

    const color = cells[p] as Color;
    const inTree = new Set<number>();
    const depth: Record<number, number> = {};
    const edges: [number, number][] = [];
    let maxDepth = 0;

    const stepTo = (q: number, d: number): number | null => {
      const x = (q % size) + DIRS[d]!.dx;
      const y = Math.floor(q / size) + DIRS[d]!.dy;
      if (x < 0 || y < 0 || x >= size || y >= size) return null;
      return y * size + x;
    };
    const grow = (q: number, dir: number, dist: number) => {
      inTree.add(q);
      depth[q] = dist;
      if (dist > maxDepth) maxDepth = dist;
      // Keep going straight first, then turn, so the body reads as one long snake.
      const order = dir < 0 ? [0, 1, 2, 3] : [dir, (dir + 1) % 4, (dir + 3) % 4];
      for (const d of order) {
        const r = stepTo(q, d);
        if (r === null || cells[r] !== color || inTree.has(r)) continue;
        edges.push([q, r]);
        grow(r, d, dist + 1);
      }
    };
    grow(head, -1, 0);

    // Look away from the body. A lone stone looks toward its first liberty.
    let gaze = { dx: 0, dy: -1 };
    const firstChild = edges.find(([a]) => a === head)?.[1];
    if (firstChild !== undefined) {
      gaze = {
        dx: (head % size) - (firstChild % size),
        dy: Math.floor(head / size) - Math.floor(firstChild / size),
      };
    } else {
      const lib = nb[head]!.find((q) => cells[q] === EMPTY);
      if (lib !== undefined) {
        gaze = { dx: (lib % size) - (head % size), dy: Math.floor(lib / size) - Math.floor(head / size) };
      }
    }

    snakes.push({
      id: snakes.length,
      color,
      head,
      stones: g.stones,
      edges,
      depth,
      maxDepth,
      liberties: g.liberties,
      gaze,
    });
  }
  return snakes;
}
