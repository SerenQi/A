import {
  AEROPLANE_CENTRE,
  AEROPLANE_LOOP,
  AEROPLANE_LOOP_CELLS,
  aeroplaneCell,
  aeroplaneColumnCell,
  aeroplaneDoneCell,
  aeroplaneFlyLine,
  aeroplaneHangar,
  aeroplaneHangarSpot,
  aeroplaneSquareColour,
  aeroplaneStartCell,
  type AeroplaneChoice,
  type AeroplaneEvent,
  type AeroplanePoint,
  type AeroplaneSeat,
  type AeroplaneView,
} from "@rain-go/engine";
import { useRef, useState, type PointerEvent } from "react";
import { Bead, DropDefs, LastMark } from "../../components/drops";
import type { BoardProps, GameUI } from "../types";

/*
 * The board is drawn on the engine's 15x15 lattice (cell centres 0..14). The viewer's colour is always
 * shown in the bottom-left corner: for seat 1 every point is turned 180°. Colours: 0 ink, 2 milk
 * (the two players), 1 and 3 two soft greys (loop colours only), told apart by a dot and a ring.
 */

const PAD = 0.7;
const SQ = 0.84;
const ACCENT = "var(--color-accent)";
const LINE = "rgb(20 20 20 / 0.42)";

type Tone = { fill: string; stroke: string; mark?: "dot" | "ring" };
const LOOP_TONE: Record<number, Tone> = {
  0: { fill: "rgb(22 22 22 / 0.7)", stroke: "rgb(0 0 0 / 0.3)" },
  1: { fill: "rgb(118 118 114 / 0.42)", stroke: "rgb(255 255 255 / 0.4)", mark: "dot" },
  2: { fill: "rgb(255 255 255 / 0.88)", stroke: "rgb(0 0 0 / 0.16)" },
  3: { fill: "rgb(196 196 191 / 0.55)", stroke: "rgb(255 255 255 / 0.7)", mark: "ring" },
};
const COLUMN_TONE: Record<number, Tone> = {
  0: { fill: "rgb(22 22 22 / 0.4)", stroke: "rgb(0 0 0 / 0.18)" },
  1: { fill: "rgb(118 118 114 / 0.2)", stroke: "rgb(255 255 255 / 0.35)", mark: "dot" },
  2: { fill: "rgb(255 255 255 / 0.6)", stroke: "rgb(0 0 0 / 0.1)" },
  3: { fill: "rgb(196 196 191 / 0.3)", stroke: "rgb(255 255 255 / 0.5)", mark: "ring" },
};

/** A small plane silhouette pointing up, about one unit tall, centred on the origin. */
const PLANE_PATH =
  "M0 -0.5 C0.06 -0.5 0.08 -0.42 0.08 -0.32 L0.08 -0.1 L0.46 0.12 L0.46 0.22 L0.08 0.1 L0.08 0.32 L0.2 0.42 L0.2 0.5 L0 0.44 L-0.2 0.5 L-0.2 0.42 L-0.08 0.32 L-0.08 0.1 L-0.46 0.22 L-0.46 0.12 L-0.08 -0.1 L-0.08 -0.32 C-0.08 -0.42 -0.06 -0.5 0 -0.5 Z";

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

const colourOf = (seat: AeroplaneSeat) => (seat === 0 ? 0 : 2);

function Square({ p, tone, size = SQ }: { p: AeroplanePoint; tone: Tone; size?: number }) {
  const [x, y] = p;
  return (
    <g>
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={0.16} fill={tone.fill} stroke={tone.stroke} strokeWidth={0.03} />
      {tone.mark === "dot" && <circle cx={x} cy={y} r={0.075} fill="rgb(255 255 255 / 0.7)" />}
      {tone.mark === "ring" && <circle cx={x} cy={y} r={0.22} fill="none" stroke="rgb(20 20 20 / 0.22)" strokeWidth={0.035} />}
    </g>
  );
}

function PlaneGlyph({ p, rot, size, fill, opacity }: { p: AeroplanePoint; rot: number; size: number; fill: string; opacity?: number }) {
  return <path d={PLANE_PATH} transform={`translate(${p[0]} ${p[1]}) rotate(${rot}) scale(${size})`} fill={fill} opacity={opacity} pointerEvents="none" />;
}

function Die({ n, cx, cy, active, k }: { n: number | null; cx: number; cy: number; active: boolean; k: string }) {
  const h = 0.56;
  return (
    <g key={k} className="drop-in">
      <rect
        x={cx - h}
        y={cy - h}
        width={h * 2}
        height={h * 2}
        rx={0.22}
        fill="rgb(255 255 255 / 0.82)"
        stroke={active ? ACCENT : "rgb(255 255 255 / 0.95)"}
        strokeWidth={active ? 0.06 : 0.035}
        filter="url(#drop-shadow)"
      />
      {n ? (
        PIPS[n]!.map(([dx, dy], i) => <circle key={i} cx={cx + dx * 0.29} cy={cy + dy * 0.29} r={0.09} fill={n === 1 ? ACCENT : "#0b0b0b"} />)
      ) : (
        <text x={cx} y={cy + 0.02} fontSize={0.42} textAnchor="middle" dominantBaseline="middle" fill="rgb(20 20 20 / 0.5)" fontFamily="var(--font-serif)">
          掷
        </text>
      )}
    </g>
  );
}

/** Short lines for the board corner, grouped per roll, relative to the viewer. */
function eventLines(v: AeroplaneView): { text: string; recent: boolean }[][] {
  const all: AeroplaneEvent[] = [...(v.prev?.events ?? []), ...v.events];
  const groups: string[][] = [];
  for (const e of all) {
    const who = e.seat === v.you ? "你" : "对手";
    if (e.k === "roll" || !groups.length) groups.push([]);
    const g = groups[groups.length - 1]!;
    switch (e.k) {
      case "roll":
        g.push(`${who}掷出 ${e.value}`);
        break;
      case "launch":
        g.push(`${e.plane} 号起飞`);
        break;
      case "move":
        g.push(
          e.to === AEROPLANE_CENTRE ? `${e.plane} 号到家` : e.bounce ? `${e.plane} 号反弹` : e.to > AEROPLANE_LOOP && e.from <= AEROPLANE_LOOP ? `${e.plane} 号进跑道` : `${e.plane} 号前进`,
        );
        break;
      case "jump":
        g[g.length - 1] += " · 跳子";
        break;
      case "fly":
        g[g.length - 1] += " · 飞棋";
        break;
      case "capture":
        g.push(`撞回${e.seat === v.you ? "对手" : "你的"} ${e.victims.join("、")} 号`);
        break;
      case "sentBack":
        g.push(`三个 6 · ${e.plane} 号回机场`);
        break;
      case "pass":
        g.push(e.again ? "没法走 · 再掷" : "没有飞机能动");
        break;
    }
  }
  return groups.slice(-2).reverse().map((g, gi) => g.map((text) => ({ text, recent: gi === 0 })));
}

function tagOf(c: AeroplaneChoice): string | null {
  if (c.sentBack) return "回机场";
  if (c.home) return "到家";
  const t = [c.jump !== null && "跳", c.fly !== null && "飞", c.captures.length > 0 && "撞"].filter(Boolean).join("·");
  return t || (c.bounce ? "反弹" : null);
}

function Board({ view: v, canAct, send }: BoardProps<AeroplaneView>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | "roll" | null>(null);
  const flip = v.you === 1;
  const T = ([x, y]: AeroplanePoint): AeroplanePoint => (flip ? [14 - x, 14 - y] : [x, y]);
  const mine = v.toMove === v.you && v.phase !== "over";
  const choosing = canAct && mine && v.phase === "choose";
  const rolling = canAct && mine && v.phase === "roll";
  const choices = choosing ? v.choices : [];

  // Positions of every plane on screen, with stacking offsets.
  type Piece = { seat: AeroplaneSeat; n: number; progress: number; p: AeroplanePoint; r: number; key: string };
  const pieces: Piece[] = [];
  const done: { seat: AeroplaneSeat; p: AeroplanePoint }[] = [];
  const stacks = new Map<string, Piece[]>();
  for (const pl of v.players) {
    const colour = colourOf(pl.seat);
    for (const pv of pl.planes) {
      if (pv.where === "done") {
        done.push({ seat: pl.seat, p: T(aeroplaneDoneCell(colour)) });
        continue;
      }
      const p = T(aeroplaneCell(colour, pv.progress, pv.n));
      const piece: Piece = { seat: pl.seat, n: pv.n, progress: pv.progress, p, r: pv.where === "hangar" ? 0.52 : 0.4, key: `${pl.seat}-${pv.n}-${pv.progress}` };
      pieces.push(piece);
      if (pv.where !== "hangar") {
        const k = p.join(",");
        stacks.set(k, [...(stacks.get(k) ?? []), piece]);
      }
    }
  }
  const OFF: AeroplanePoint[] = [
    [-0.17, -0.17],
    [0.17, 0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
  ];
  for (const group of stacks.values()) {
    if (group.length < 2) continue;
    group.forEach((pc, i) => {
      pc.p = [pc.p[0] + OFF[i % 4]![0], pc.p[1] + OFF[i % 4]![1]];
      pc.r = 0.29;
    });
  }
  const pieceOf = (seat: AeroplaneSeat, n: number) => pieces.find((pc) => pc.seat === seat && pc.n === n);
  const myColour = colourOf(v.you);
  const ghostAt = (c: AeroplaneChoice): AeroplanePoint | null => (c.to < 0 ? null : T(aeroplaneCell(myColour, c.to, c.plane)));

  const centre: AeroplanePoint = [7, 7];
  const locate = (e: PointerEvent<SVGSVGElement>): AeroplanePoint | null => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [pt.x, pt.y];
  };
  const target = (pt: AeroplanePoint | null): number | "roll" | null => {
    if (!pt) return null;
    if (rolling && Math.abs(pt[0] - centre[0]) < 0.75 && Math.abs(pt[1] - centre[1]) < 0.75) return "roll";
    let best: number | null = null;
    let bestD = 0.8;
    choices.forEach((c, i) => {
      const spots = [pieceOf(v.you, c.plane)?.p, ghostAt(c)].filter((q): q is AeroplanePoint => !!q);
      for (const q of spots) {
        const d = Math.hypot(pt[0] - q[0], pt[1] - q[1]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    });
    if (best !== null) return best;
    // A tap anywhere in the own hangar launches the first plane that can take off.
    const hg = aeroplaneHangar(myColour);
    const [hx, hy] = T([hg.cx, hg.cy]);
    if (Math.abs(pt[0] - hx) <= hg.half && Math.abs(pt[1] - hy) <= hg.half) {
      const i = choices.findIndex((c) => c.kind === "launch");
      if (i >= 0) return i;
    }
    return null;
  };

  const handlers = {
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "mouse") setHover(target(locate(e)));
    },
    onPointerLeave: () => setHover(null),
    onPointerUp: (e: PointerEvent<SVGSVGElement>) => {
      const t = target(locate(e));
      if (t === null) return;
      setHover(null);
      void send(t === "roll" ? "roll" : choices[t]!.move);
    },
  };

  const lines = eventLines(v);
  const last = v.last ? pieceOf(v.last.seat, v.last.plane) : undefined;
  const hoverCursor = hover !== null ? "pointer" : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`${-PAD} ${-PAD} ${14 + PAD * 2} ${14 + PAD * 2}`}
      className="block h-full w-full touch-manipulation select-none"
      style={{ cursor: hoverCursor }}
      {...handlers}
      role="img"
      aria-label="飞行棋棋盘"
    >
      <DropDefs />
      <rect x={-PAD + 0.2} y={-PAD + 0.2} width={14 + PAD * 2 - 0.4} height={14 + PAD * 2 - 0.4} rx={0.55} fill="rgb(255 255 255 / 0.26)" stroke="rgb(255 255 255 / 0.6)" strokeWidth={0.025} />

      {/* Centre (终点): a glass disc under the home column ends. */}
      <circle cx={7} cy={7} r={1.58} fill="rgb(255 255 255 / 0.34)" stroke="rgb(255 255 255 / 0.75)" strokeWidth={0.03} />
      <circle cx={7} cy={7} r={1.58} fill="none" stroke={LINE} strokeWidth={0.015} opacity={0.35} />

      {/* Hangars. */}
      {[0, 1, 2, 3].map((c) => {
        const hg = aeroplaneHangar(c);
        const [cx, cy] = T([hg.cx, hg.cy]);
        const player = c === 0 || c === 2;
        const seat: AeroplaneSeat = c === 0 ? 0 : 1;
        return (
          <g key={c}>
            <rect
              x={cx - hg.half}
              y={cy - hg.half}
              width={hg.half * 2}
              height={hg.half * 2}
              rx={0.7}
              fill={player ? (c === 0 ? "rgb(30 30 30 / 0.08)" : "rgb(255 255 255 / 0.42)") : "rgb(255 255 255 / 0.1)"}
              stroke={player ? "rgb(255 255 255 / 0.8)" : "rgb(255 255 255 / 0.45)"}
              strokeWidth={0.04}
              strokeDasharray={player ? undefined : "0.18 0.14"}
            />
            {player &&
              [1, 2, 3, 4].map((n) => {
                const [sx, sy] = T(aeroplaneHangarSpot(c, n));
                return <circle key={n} cx={sx} cy={sy} r={0.6} fill="rgb(255 255 255 / 0.2)" stroke={LINE} strokeWidth={0.02} opacity={0.6} />;
              })}
            {player && (
              <text x={cx} y={cy + 0.02} fontSize={0.4} textAnchor="middle" dominantBaseline="middle" fill="rgb(20 20 20 / 0.5)" fontFamily="var(--font-serif)">
                {seat === v.you ? "你" : "对手"}
              </text>
            )}
          </g>
        );
      })}

      {/* Take-off squares. */}
      {[0, 1, 2, 3].map((c) => {
        const p = T(aeroplaneStartCell(c));
        const tone = LOOP_TONE[c]!;
        const next = T(aeroplaneCell(c, 1));
        const rot = (Math.atan2(next[1] - p[1], next[0] - p[0]) * 180) / Math.PI + 90;
        return (
          <g key={c}>
            <circle cx={p[0]} cy={p[1]} r={0.4} fill={tone.fill} stroke={tone.stroke} strokeWidth={0.03} opacity={c % 2 ? 0.55 : 1} />
            <PlaneGlyph p={p} rot={rot} size={0.5} fill={c === 0 ? "rgb(255 255 255 / 0.55)" : "rgb(20 20 20 / 0.35)"} />
          </g>
        );
      })}

      {/* Loop. */}
      {AEROPLANE_LOOP_CELLS.map((cell, g) => (
        <Square key={g} p={T(cell)} tone={LOOP_TONE[aeroplaneSquareColour(g)]!} />
      ))}

      {/* Home columns. */}
      {[0, 1, 2, 3].map((c) =>
        [1, 2, 3, 4, 5, 6].map((s) => <Square key={`${c}-${s}`} p={T(aeroplaneColumnCell(c, s))} tone={COLUMN_TONE[c]!} size={SQ * 0.9} />),
      )}

      {/* Fly shortcuts: faint dashed lines with a small plane at the take-off end. */}
      {[0, 1, 2, 3].map((c) => {
        const [a, b] = aeroplaneFlyLine(c).map(T) as [AeroplanePoint, AeroplanePoint];
        const rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
        return (
          <g key={c} opacity={c % 2 ? 0.5 : 1}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={LINE} strokeWidth={0.045} strokeDasharray="0.12 0.1" strokeLinecap="round" />
            <PlaneGlyph p={a} rot={rot} size={0.46} fill={c === 0 ? "rgb(255 255 255 / 0.6)" : "rgb(20 20 20 / 0.38)"} />
          </g>
        );
      })}

      <Die n={v.roll} cx={7} cy={7} active={rolling} k={`${v.turn}-${v.events.length}`} />

      {/* Finished planes gather in the centre corner next to their home column. */}
      {[0, 1].map((seat) => {
        const mine = done.filter((d) => d.seat === seat);
        return mine.map((d, i) => (
          <Bead key={`${seat}-${i}`} x={d.p[0] + OFF[i]![0] * 1.1} y={d.p[1] + OFF[i]![1] * 1.1} r={0.17} dark={seat === 0} className="drop-in" />
        ));
      })}

      {/* Choice rings under the pieces. */}
      {choices.map((c, i) => {
        const pc = pieceOf(v.you, c.plane);
        if (!pc) return null;
        return (
          <circle
            key={`ring-${c.plane}`}
            className="drop-atari"
            cx={pc.p[0]}
            cy={pc.p[1]}
            r={pc.r + 0.12}
            fill="rgb(168 67 63 / 0.1)"
            stroke={ACCENT}
            strokeWidth={hover === i ? 0.09 : 0.055}
          />
        );
      })}

      <g filter="url(#drop-shadow)">
        {pieces.map((pc) => (
          <g key={pc.key} className="drop-in">
            <Bead x={pc.p[0]} y={pc.p[1]} r={pc.r} dark={pc.seat === 0} />
          </g>
        ))}
      </g>
      <g pointerEvents="none" fontFamily="var(--font-serif)" textAnchor="middle">
        {pieces.map((pc) => (
          <text key={pc.key} x={pc.p[0]} y={pc.p[1] + 0.02} fontSize={pc.r * 1.15} dominantBaseline="middle" fill={pc.seat === 0 ? "#f4f4f2" : "#0b0b0b"} fontWeight={600}>
            {pc.n}
          </text>
        ))}
      </g>
      {last && v.last && <LastMark x={last.p[0]} y={last.p[1]} r={last.r + 0.1} dark={v.last.seat === 0} k={`${v.turn}-${v.events.length}-${last.key}`} />}

      {/* Ghosts: where each choosable plane would land. */}
      {choices.map((c, i) => {
        const g = ghostAt(c);
        const pc = pieceOf(v.you, c.plane);
        const tag = tagOf(c);
        const at = g ?? pc?.p;
        if (!at) return null;
        const strong = hover === i;
        return (
          <g key={`ghost-${c.plane}`} pointerEvents="none">
            {g && (
              <>
                {!c.captures.length && <Bead x={g[0]} y={g[1]} r={0.36} dark={v.you === 0} opacity={strong ? 0.7 : 0.38} />}
                <circle cx={g[0]} cy={g[1]} r={0.44} fill="none" stroke={ACCENT} strokeWidth={0.04} strokeDasharray="0.1 0.08" opacity={strong ? 1 : 0.7} />
                {!c.captures.length && <text x={g[0]} y={g[1] + 0.02} fontSize={0.36} textAnchor="middle" dominantBaseline="middle" fill={v.you === 0 ? "#f4f4f2" : "#0b0b0b"} opacity={strong ? 1 : 0.7} fontFamily="var(--font-serif)">
                  {c.plane}
                </text>}
              </>
            )}
            {tag && (
              <text x={at[0]} y={at[1] - 0.62} fontSize={0.34} textAnchor="middle" fill={ACCENT} fontFamily="var(--font-serif)" stroke="rgb(255 255 255 / 0.85)" strokeWidth={0.08} paintOrder="stroke">
                {tag}
              </text>
            )}
          </g>
        );
      })}

      {/* Recent events in the empty top-left corner. */}
      <g fontFamily="var(--font-serif)" pointerEvents="none">
        {lines.flat().map((l, i) => (
          <text key={i} x={-0.25} y={0.15 + i * 0.66 + (lines[0] && i >= lines[0].length ? 0.18 : 0)} fontSize={0.5} fill={l.recent ? "#1a1a1a" : "rgb(24 24 24 / 0.45)"} dominantBaseline="hanging">
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

function Actions({ view: v, canAct, send }: BoardProps<AeroplaneView>) {
  const mine = v.toMove === v.you && v.phase !== "over";
  if (mine && v.phase === "roll") {
    return (
      <button className="btn btn-ink flex-1" disabled={!canAct} onClick={() => void send("roll")}>
        掷骰子
      </button>
    );
  }
  const hint = mine ? `掷出 ${v.roll} · 点飞机` : v.phase === "choose" ? `对手掷出 ${v.roll}` : "对手回合";
  return <div className="chip flex-1 justify-center !text-ink">{hint}</div>;
}

const homeOf = (v: AeroplaneView, seat: AeroplaneSeat) => v.players[seat].home;

export const aeroplaneUI: GameUI<AeroplaneView> = {
  shape: "square",
  Board,
  Actions,
  status: (v) => {
    if (v.phase === "over") return null;
    const them: AeroplaneSeat = v.you === 0 ? 1 : 0;
    if (v.toMove === v.you) {
      if (v.phase === "choose") return v.sixes === 3 ? "第三个 6：选一架飞机回机场" : `掷出 ${v.roll}，选一架飞机`;
      if (v.sixes > 0) return "掷出 6，再掷一次";
      const passed = v.prev?.seat === them && v.prev.events.some((e) => e.k === "pass");
      return passed ? `对手掷出 ${v.roll}没法走 · 到你掷骰` : "到你掷骰";
    }
    if (v.phase === "choose") return `对手掷出 ${v.roll}`;
    if (v.sixes > 0) return "对手掷出 6，再掷一次";
    if (v.prev?.seat === v.you && v.prev.events.some((e) => e.k === "pass")) return `掷出 ${v.roll}，没有飞机能动`;
    return null;
  },
  badge: (v) => ({ value: String(homeOf(v, v.you)), label: "到家" }),
  stats: (v) => [
    { label: "我方到家", value: `${homeOf(v, v.you)}/4` },
    { label: "对手到家", value: `${homeOf(v, v.you === 0 ? 1 : 0)}/4` },
    { label: "上次点数", value: v.roll ? String(v.roll) : "—" },
  ],
};
