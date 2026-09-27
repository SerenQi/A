/**
 * Shared look for pieces: glossy water drops on glass. Put <DropDefs /> once inside
 * each board <svg>, then draw pieces with <Bead /> inside <g filter="url(#drop-shadow)">.
 * Units are board units (1 = one grid step).
 */
export function DropDefs() {
  return (
    <defs>
      <filter id="goo" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.09" />
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
      </filter>
      <filter id="drop-shadow" x="-40%" y="-40%" width="180%" height="190%">
        <feDropShadow dx="0.04" dy="0.09" stdDeviation="0.07" floodOpacity="0.28" />
      </filter>
      <radialGradient id="ink" cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#3a3a3a" />
        <stop offset="0.55" stopColor="#0b0b0b" />
        <stop offset="1" stopColor="#000" />
      </radialGradient>
      <radialGradient id="milk" cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#ecece8" />
        <stop offset="1" stopColor="#c9c9c4" />
      </radialGradient>
    </defs>
  );
}

/** Highlights that make a disc read as a drop. */
export function Sheen({ x, y, r = 0.41, dark }: { x: number; y: number; r?: number; dark: boolean }) {
  const k = r / 0.41;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={x - 0.13 * k}
        cy={y - 0.17 * k}
        rx={0.13 * k}
        ry={0.07 * k}
        transform={`rotate(-30 ${x - 0.13 * k} ${y - 0.17 * k})`}
        fill="#fff"
        opacity={dark ? 0.55 : 0.95}
      />
      <path
        d={`M${x - 0.22 * k} ${y + 0.25 * k} Q${x} ${y + 0.38 * k} ${x + 0.24 * k} ${y + 0.22 * k}`}
        stroke="#fff"
        strokeWidth={0.035 * k}
        fill="none"
        strokeLinecap="round"
        opacity={dark ? 0.16 : 0.6}
      />
    </g>
  );
}

/** One drop-shaped piece. `dark` picks ink (black) or milk (white). */
export function Bead({
  x,
  y,
  r = 0.41,
  dark,
  className,
  opacity,
}: {
  x: number;
  y: number;
  r?: number;
  dark: boolean;
  className?: string;
  opacity?: number;
}) {
  return (
    <g className={className} opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={dark ? "url(#ink)" : "url(#milk)"} stroke={dark ? "none" : "rgb(0 0 0 / 0.12)"} strokeWidth={0.015} />
      <Sheen x={x} y={y} r={r} dark={dark} />
    </g>
  );
}

/** Thin ring on the last move plus a one-shot ripple (re-keyed by `k`). */
export function LastMark({ x, y, r = 0.51, dark, k }: { x: number; y: number; r?: number; dark: boolean; k: number | string }) {
  const stroke = dark ? "#0b0b0b" : "#8f8f8b";
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r} fill="none" stroke={stroke} strokeWidth={0.03} opacity={0.5} />
      <circle key={k} className="ripple" cx={x} cy={y} r={r} fill="none" stroke={stroke} strokeWidth={0.03} />
    </g>
  );
}

/**
 * Marks a stone that a touch has armed but not yet placed: a dashed ring and a small ink tag,
 * so the see-through preview never reads as a placed stone. `fs` is the tag's font size and
 * `lo`/`hi` the board's drawable extent, used to keep the tag on the board.
 */
export function ArmedHint({ x, y, r = 0.41, fs, lo, hi }: { x: number; y: number; r?: number; fs: number; lo: number; hi: number }) {
  const text = "再点一下落子";
  const w = fs * (text.length + 1.1);
  const h = fs * 1.6;
  const cx = Math.min(hi - w / 2, Math.max(lo + w / 2, x));
  const above = y - r - 0.12 - h >= lo;
  const top = above ? y - r - 0.12 - h : y + r + 0.12;
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r + 0.12} fill="none" stroke="#0b0b0b" strokeWidth={0.035} strokeDasharray="0.12 0.1" opacity={0.7} />
      <g className="drop-in" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <rect x={cx - w / 2} y={top} width={w} height={h} rx={h / 2} fill="rgb(11 11 11 / 0.86)" />
        <text x={cx} y={top + h / 2} fontSize={fs} fill="#fff" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-serif)">
          {text}
        </text>
      </g>
    </g>
  );
}
