import { COLUMNS, EMPTY, other, starPoints, step, type Color, type GameState, type Snake } from "@snake-go/engine";
import { useMemo, useRef, useState, type PointerEvent, type ReactElement } from "react";

const HEAD_R = 0.46;
const NECK_R = 0.36;
const TAIL_R = 0.23;
const TIP = 0.3;
const PAD = 1.05;

export interface BoardProps {
  size: number;
  state: GameState;
  snakes: Snake[];
  moveCount: number;
  phase: "playing" | "scoring" | "finished";
  /** The human's color; clicks play this color. */
  humanColor: Color;
  canPlay: boolean;
  dead: Set<number>;
  owner?: number[] | null;
  onPlay: (point: number) => void;
  onToggleDead: (point: number) => void;
  onIllegal: (reason: string) => void;
}

/** Head is round and full size; the body starts at the neck and tapers toward the tails. */
const radiusOf = (s: Snake, p: number) => {
  const d = s.depth[p] ?? 0;
  if (d === 0) return HEAD_R;
  const t = s.maxDepth <= 1 ? 1 : (d - 1) / (s.maxDepth - 1);
  return NECK_R - (NECK_R - TAIL_R) * Math.pow(t, 0.9);
};
/** Radius used where a body segment meets a node: the head end of the neck uses the neck width. */
const segR = (s: Snake, p: number) => (p === s.head ? NECK_R : radiusOf(s, p));

/** Circles at every stone plus tapered quads along tree edges; their union is the snake's body. */
function bodyShapes(s: Snake, size: number, grow = 0) {
  const at = (p: number) => ({ x: p % size, y: Math.floor(p / size) });
  const out: ReactElement[] = [];
  for (const p of s.stones) {
    const { x, y } = at(p);
    out.push(<circle key={`c${p}`} cx={x} cy={y} r={radiusOf(s, p) + grow} />);
  }
  for (const [a, b] of s.edges) {
    const A = at(a);
    const B = at(b);
    const nx = -(B.y - A.y);
    const ny = B.x - A.x;
    const ra = segR(s, a) + grow;
    const rb = segR(s, b) + grow;
    const pts = [
      [A.x + nx * ra, A.y + ny * ra],
      [B.x + nx * rb, B.y + ny * rb],
      [B.x - nx * rb, B.y - ny * rb],
      [A.x - nx * ra, A.y - ny * ra],
    ];
    out.push(<polygon key={`e${a}-${b}`} points={pts.map((q) => q.join(",")).join(" ")} />);
  }
  // Pointed tail beyond every leaf of the tree.
  const parents = new Map(s.edges.map(([a, b]) => [b, a]));
  const hasChild = new Set(s.edges.map(([a]) => a));
  for (const [leaf, parent] of parents) {
    if (hasChild.has(leaf)) continue;
    const L = at(leaf);
    const P = at(parent);
    const dx = L.x - P.x;
    const dy = L.y - P.y;
    const r = radiusOf(s, leaf) + grow;
    const tip = TIP + r + grow * 0.5;
    const pts = [
      [L.x - dy * r, L.y + dx * r],
      [L.x + dx * tip, L.y + dy * tip],
      [L.x + dy * r, L.y - dx * r],
    ];
    out.push(<polygon key={`t${leaf}`} points={pts.map((q) => q.join(",")).join(" ")} strokeLinejoin="round" />);
  }
  return out;
}

function SnakeView({ s, size, isLast, dead }: { s: Snake; size: number; isLast: boolean; dead: boolean }) {
  const black = s.color === 1;
  const hx = s.head % size;
  const hy = Math.floor(s.head / size);
  const { dx, dy } = s.gaze;
  const nx = -dy;
  const ny = dx;
  const clipId = `snake-clip-${s.head}`;
  const eye = (side: 1 | -1) => {
    const ex = hx + dx * 0.13 + nx * 0.18 * side;
    const ey = hy + dy * 0.13 + ny * 0.18 * side;
    return black ? (
      <g key={side}>
        <circle cx={ex} cy={ey} r={0.083} fill="#f1f0eb" />
        <circle cx={ex + dx * 0.025} cy={ey + dy * 0.025} r={0.045} fill="#0a0a0a" />
      </g>
    ) : (
      <g key={side}>
        <circle cx={ex} cy={ey} r={0.07} fill="#1b1b1b" />
        <circle cx={ex - 0.022} cy={ey - 0.025} r={0.022} fill="#fff" />
      </g>
    );
  };
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const inAtari = s.liberties.length === 1 && !dead;

  return (
    <g
      className={`${inAtari ? "snake-atari" : ""}`}
      opacity={dead ? 0.38 : 1}
      filter={dead ? undefined : "url(#snake-shadow)"}
      data-snake={s.id}
    >
      <clipPath id={clipId}>{bodyShapes(s, size)}</clipPath>
      <g fill={black ? "#000" : "#8f8f8b"}>{bodyShapes(s, size, 0.03)}</g>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-1} y={-1} width={size + 1} height={size + 1} fill={black ? "url(#body-black)" : "url(#body-white)"} />
        <rect x={-1} y={-1} width={size + 1} height={size + 1} fill={black ? "url(#scales-black)" : "url(#scales-white)"} />
        <g stroke={black ? "rgb(255 255 255 / 0.1)" : "rgb(255 255 255 / 0.55)"} strokeWidth={0.07} strokeLinecap="round">
          {s.edges.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={(a % size) - 0.06} y1={Math.floor(a / size) - 0.08} x2={(b % size) - 0.06} y2={Math.floor(b / size) - 0.08} />
          ))}
        </g>
        <circle cx={hx - 0.14} cy={hy - 0.16} r={0.17} fill={black ? "rgb(255 255 255 / 0.14)" : "rgb(255 255 255 / 0.85)"} />
      </g>
      {isLast && !dead && (
        <g transform={`translate(${hx + dx * HEAD_R * 0.92} ${hy + dy * HEAD_R * 0.92}) rotate(${angle})`}>
          <path
            className="tongue"
            d="M0 0 L0.24 0 L0.34 -0.075 M0.24 0 L0.34 0.075"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={0.045}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      {eye(1)}
      {eye(-1)}
      {dead && (
        <path
          d={`M${hx - 0.2} ${hy - 0.2} L${hx + 0.2} ${hy + 0.2} M${hx + 0.2} ${hy - 0.2} L${hx - 0.2} ${hy + 0.2}`}
          stroke={black ? "#f1f0eb" : "#1b1b1b"}
          strokeWidth={0.06}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

export function Board(p: BoardProps) {
  const { size, state, snakes } = p;
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const stars = useMemo(() => starPoints(size), [size]);
  const touchFirst = useMemo(() => typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches, []);
  const lastPoint = state.lastMove?.k === "play" ? state.lastMove.p : undefined;
  const view = `${-PAD} ${-PAD} ${size - 1 + PAD * 2} ${size - 1 + PAD * 2}`;

  const pointAt = (e: PointerEvent<SVGSVGElement>): number | null => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const x = Math.round(pt.x);
    const y = Math.round(pt.y);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    if (Math.hypot(pt.x - x, pt.y - y) > 0.62) return null;
    return y * size + x;
  };

  const legality = (point: number) =>
    step(state, { c: p.humanColor, k: "play", p: point, t: 0 }, p.moveCount);

  const onClick = (e: PointerEvent<SVGSVGElement>) => {
    const point = pointAt(e);
    if (point === null) return;
    if (p.phase === "scoring") {
      if (state.cells[point] !== EMPTY) p.onToggleDead(point);
      return;
    }
    if (!p.canPlay || state.cells[point] !== EMPTY) return;
    const r = legality(point);
    if (!r.ok) {
      p.onIllegal(r.reason);
      setArmed(null);
      return;
    }
    if (touchFirst && armed !== point) {
      setArmed(point);
      return;
    }
    setArmed(null);
    p.onPlay(point);
  };

  const preview = armed ?? hover;
  const showPreview = p.canPlay && p.phase === "playing" && preview !== null && state.cells[preview] === EMPTY;
  const capturedColor = state.lastMove ? other(state.lastMove.c) : 1;

  return (
    <svg
      ref={svgRef}
      viewBox={view}
      className="block w-full touch-manipulation select-none"
      style={{ aspectRatio: "1 / 1" }}
      onPointerMove={(e) => e.pointerType === "mouse" && setHover(pointAt(e))}
      onPointerLeave={() => setHover(null)}
      onPointerUp={onClick}
      role="grid"
      aria-label={`${size} by ${size} Go board`}
    >
      <defs>
        <filter id="snake-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.03" dy="0.07" stdDeviation="0.05" floodColor="#000" floodOpacity="0.32" />
        </filter>
        <linearGradient id="body-black" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id="body-white" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfbf9" />
          <stop offset="1" stopColor="#d9d9d4" />
        </linearGradient>
        <pattern id="scales-black" width="0.28" height="0.2" patternUnits="userSpaceOnUse">
          <path d="M0 0.2 A0.14 0.14 0 0 1 0.28 0.2 M-0.14 0.1 A0.14 0.14 0 0 1 0.14 0.1 M0.14 0.1 A0.14 0.14 0 0 1 0.42 0.1" fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.018" />
        </pattern>
        <pattern id="scales-white" width="0.28" height="0.2" patternUnits="userSpaceOnUse">
          <path d="M0 0.2 A0.14 0.14 0 0 1 0.28 0.2 M-0.14 0.1 A0.14 0.14 0 0 1 0.14 0.1 M0.14 0.1 A0.14 0.14 0 0 1 0.42 0.1" fill="none" stroke="rgb(0 0 0 / 0.07)" strokeWidth="0.018" />
        </pattern>
      </defs>

      <rect
        x={-PAD + 0.25}
        y={-PAD + 0.25}
        width={size - 1 + PAD * 2 - 0.5}
        height={size - 1 + PAD * 2 - 0.5}
        rx={0.55}
        fill="rgb(255 255 255 / 0.26)"
        stroke="rgb(255 255 255 / 0.6)"
        strokeWidth={0.025}
      />
      <g stroke="rgb(20 20 20 / 0.42)" strokeWidth={0.028} strokeLinecap="square">
        {Array.from({ length: size }, (_, i) => (
          <g key={i}>
            <line x1={0} y1={i} x2={size - 1} y2={i} />
            <line x1={i} y1={0} x2={i} y2={size - 1} />
          </g>
        ))}
      </g>
      {stars.map((s) => (
        <circle key={s} cx={s % size} cy={Math.floor(s / size)} r={0.085} fill="rgb(20 20 20 / 0.55)" />
      ))}
      <g fontSize={0.3} fill="rgb(20 20 20 / 0.42)" fontFamily="var(--font-serif)" textAnchor="middle">
        {Array.from({ length: size }, (_, i) => (
          <g key={i}>
            <text x={i} y={size - 1 + 0.78} dominantBaseline="middle">
              {COLUMNS[i]}
            </text>
            <text x={-0.72} y={i} dominantBaseline="middle">
              {size - i}
            </text>
          </g>
        ))}
      </g>

      {p.owner && (
        <g>
          {p.owner.map((o, i) =>
            o && (state.cells[i] === EMPTY || p.dead.has(i)) ? (
              <rect
                key={i}
                x={(i % size) - 0.13}
                y={Math.floor(i / size) - 0.13}
                width={0.26}
                height={0.26}
                rx={0.05}
                fill={o === 1 ? "#0a0a0a" : "#f7f7f4"}
                stroke={o === 1 ? "none" : "#8f8f8b"}
                strokeWidth={0.02}
                opacity={0.8}
              />
            ) : null,
          )}
        </g>
      )}

      {state.lastCaptured.map((c) => (
        <circle
          key={`${p.moveCount}-${c}`}
          className="ghost-captured"
          cx={c % size}
          cy={Math.floor(c / size)}
          r={0.4}
          fill={capturedColor === 1 ? "#0a0a0a" : "#f2f2ef"}
          stroke="#8f8f8b"
          strokeWidth={0.02}
        />
      ))}

      {snakes.map((s) => (
        <g key={`${s.color}-${s.stones.length}-${s.head}`} className={s.head === lastPoint && s.stones.length === 1 ? "snake-enter" : undefined}>
          <SnakeView s={s} size={size} isLast={s.head === lastPoint} dead={s.stones.every((q) => p.dead.has(q))} />
        </g>
      ))}

      {showPreview && (
        <g pointerEvents="none">
          <circle
            cx={preview! % size}
            cy={Math.floor(preview! / size)}
            r={HEAD_R * 0.92}
            fill={p.humanColor === 1 ? "#0a0a0a" : "#f7f7f4"}
            stroke="#8f8f8b"
            strokeWidth={0.02}
            opacity={armed !== null ? 0.72 : 0.38}
          />
          {armed !== null && (
            <circle
              cx={armed % size}
              cy={Math.floor(armed / size)}
              r={HEAD_R + 0.08}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={0.04}
              strokeDasharray="0.12 0.1"
            />
          )}
        </g>
      )}
    </svg>
  );
}
