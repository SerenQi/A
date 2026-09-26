import type { ReactNode } from "react";
import { SnakeMark } from "./icons";

/** The black capsule from the reference design: avatar, italic name, one-line subtitle. */
export function Pill({ title, subtitle, onClick }: { title: ReactNode; subtitle: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="pill-black flex w-full items-center gap-4 px-5 py-4 text-left">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] border-[#3a3a3a] bg-[#161616]">
        <SnakeMark width={34} height={34} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[1.7rem] italic leading-tight">{title}</span>
        <span className="block truncate text-[1.05rem] text-white/70">{subtitle}</span>
      </span>
    </Tag>
  );
}

/** Thin progress ring with a number in the middle, like the anniversary countdown. */
export function Ring({ value, fraction, size = 92 }: { value: ReactNode; fraction: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(0 0 0 / 0.1)" strokeWidth="5" />
      {f > 0 && <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${c * f} ${c}`}
        transform="rotate(-90 50 50)"
      />}
      <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="30" fontFamily="var(--font-serif)" fill="#0a0a0a">
        {value}
      </text>
    </svg>
  );
}

export function Stat({ label, sub, value }: { label: ReactNode; sub?: ReactNode; value: ReactNode }) {
  return (
    <div className="stat-bar min-w-0">
      <div className="text-[1.05rem] leading-snug">{label}</div>
      {sub && <div className="text-sm text-faint">{sub}</div>}
      <div className="mt-1 text-[2.1rem] leading-none">{value}</div>
    </div>
  );
}
