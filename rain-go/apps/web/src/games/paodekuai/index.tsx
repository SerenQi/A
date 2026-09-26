import { pdkCardText, pdkCheckPlay, pdkComboName, type PaodekuaiView, type PdkPlayView } from "@rain-go/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardProps, GameUI } from "../types";
import { PdkBack, PdkCard, pdkStep, usePdkBox } from "./Cards";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** A row of face-up cards, centered, overlapping as needed. */
function PlayedRow({ play, w, h, avail, dim, animate }: { play: PdkPlayView; w: number; h: number; avail: number; dim?: boolean; animate?: boolean }) {
  const n = play.cards.length;
  const step = pdkStep(n, w, avail, w * 0.62);
  const width = w + step * (n - 1);
  return (
    <div className="relative mx-auto shrink-0" style={{ width, height: h, opacity: dim ? 0.38 : 1 }}>
      {play.cards.map((c, i) => (
        <PdkCard
          key={`${play.n}-${c}`}
          card={c}
          w={w}
          h={h}
          className={animate ? "drop-in" : ""}
          full={i === n - 1 || step >= w * 0.9}
          strip={i === n - 1 ? w : step}
          style={{ left: i * step, top: 0, animationDelay: animate ? `${i * 28}ms` : undefined, animationFillMode: "backwards" }}
        />
      ))}
    </div>
  );
}

function Board({ view: v, canAct, send, toast, compact }: BoardProps<PaodekuaiView>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { w: W, h: H } = usePdkBox(rootRef);
  const table = usePdkBox(tableRef);
  const [sel, setSel] = useState<string[]>([]);
  const [hintAt, setHintAt] = useState(-1);
  useEffect(() => {
    setSel([]);
    setHintAt(-1);
  }, [v.moves, v.viewer]);

  const selected = sel.filter((c) => v.hand.includes(c));
  const last = v.trick?.combo ?? null;
  const check = useMemo(() => (selected.length ? pdkCheckPlay(v.hand, selected, last) : null), [selected.join(" "), v.hand.join(" "), last]);
  const active = canAct && v.myTurn;

  // Hand card size from the box (phones: about 342x225 at the smallest), shrunk so 16 cards fit the width.
  const btnH = compact ? 40 : 46;
  const n = v.hand.length;
  let cardH = clamp(Math.round(H * 0.26), 50, 132);
  let cardW = Math.round(cardH * 0.7);
  if (n > 1 && cardW * (1 + 0.36 * (n - 1)) > W) {
    cardW = Math.max(30, Math.floor(W / (1 + 0.36 * (n - 1))));
    cardH = Math.round(cardW / 0.7);
  }
  const rise = Math.round(cardH * 0.16);
  const handStep = pdkStep(n, cardW, W, cardW * 0.58);
  const handWidth = n ? cardW + handStep * (n - 1) : W;
  const labelH = compact ? 18 : 26;
  const trickH = clamp(Math.min(table.h - labelH - 8, cardH * 1.05), 30, 150);
  const trickW = Math.round(trickH * 0.7);

  const toggle = (c: string) => {
    if (!active) return;
    setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s.filter((x) => v.hand.includes(x)), c]));
  };
  const hint = () => {
    if (!v.hints.length) {
      toast("没有能压过的牌");
      return;
    }
    const i = (hintAt + 1) % v.hints.length;
    setHintAt(i);
    setSel(v.hints[i]!.cards);
  };
  const playSel = () => {
    if (check?.ok) void send(selected.join(" "));
  };

  const me = v.viewer;
  const who = (a: string) => (a === me ? "你" : "对手");
  const oppTurn = !v.winner && v.toPlay !== null && v.toPlay !== me;
  const backs = Math.min(v.opponentCount, 10);
  const bw = compact ? 15 : 22;
  const bh = Math.round(bw * 1.42);

  let message: string | null = null;
  let sub: string | null = null;
  if (v.winner) {
    message = v.winner === me ? "你出完了" : "对手出完了";
  } else if (!v.trick) {
    sub = v.lastPass ? (v.lastPass === me ? "你不要" : "对手不要") : null;
    message = v.toPlay === me ? "你先出" : "对手先出";
  }
  const shown = v.trick ?? (v.winner ? null : v.lastTrick);

  return (
    <div ref={rootRef} className="flex h-full w-full min-h-0 select-none flex-col gap-1.5 overflow-hidden lg:gap-3">
      {/* Table: opponent strip on top, current trick in the middle */}
      <div className="flex min-h-0 flex-1 flex-col rounded-[18px] border border-white/60 bg-white/25 px-2 pt-1.5 lg:px-4 lg:pt-3">
        <div className="flex shrink-0 items-center gap-2" style={{ height: bh + 2 }}>
          <div className="relative shrink-0" style={{ width: bw + Math.max(0, backs - 1) * (bw * 0.32), height: bh }} aria-hidden>
            {Array.from({ length: backs }, (_, i) => (
              <PdkBack key={i} w={bw} h={bh} style={{ left: i * bw * 0.32, top: 0, transform: `rotate(${(i - (backs - 1) / 2) * 3}deg)` }} />
            ))}
          </div>
          <div className="flex shrink-0 items-baseline gap-1" aria-label={`对手剩 ${v.opponentCount} 张`}>
            <span className={`font-serif font-bold leading-none ${compact ? "text-[1.1rem]" : "text-[1.6rem]"}`}>{v.opponentCount}</span>
            <span className="text-[0.75rem] text-muted">张</span>
            {oppTurn && <span className="pulse-dot ml-0.5 text-[0.65rem] text-muted">●</span>}
          </div>
          <div className="ml-auto min-w-0 truncate text-right text-[0.72rem] text-faint lg:text-[0.9rem]">
            {v.recent
              .slice(compact ? -2 : -4)
              .map((p) => `${who(p.by)} ${p.name}`)
              .join(" · ")}
          </div>
        </div>
        <div ref={tableRef} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden pb-1">
          {shown && table.h > 0 && <PlayedRow key={shown.n} play={shown} w={trickW} h={trickH} avail={table.w} dim={!v.trick} animate={!!v.trick} />}
          <div className="flex shrink-0 items-center gap-2 leading-none" style={{ height: labelH }}>
            {v.trick?.combo && (
              <span className={compact ? "text-[0.9rem]" : "text-[1.1rem]"}>
                <span className="text-muted">{who(v.trick.by)} · </span>
                {pdkComboName(v.trick.combo)}
              </span>
            )}
            {sub && <span className="chip !py-0.5 !text-[0.78rem]">{sub}</span>}
            {message && <span className={`${compact ? "text-[1rem]" : "text-[1.3rem]"} ${v.winner === me ? "text-accent" : "text-ink"}`}>{message}</span>}
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="relative mx-auto shrink-0" style={{ width: handWidth, height: cardH + rise }} role="group" aria-label="你的手牌">
        {v.hand.map((c, i) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              disabled={!active}
              aria-pressed={on}
              aria-label={pdkCardText(c)}
              className="absolute p-0 transition-[top] duration-150 ease-out disabled:cursor-default"
              style={{ left: i * handStep, top: on ? 0 : rise, width: i === n - 1 ? cardW : handStep, height: cardH, zIndex: i }}
            >
              <PdkCard card={c} w={cardW} h={cardH} selected={on} full={i === n - 1 || handStep >= cardW * 0.9}
                strip={i === n - 1 ? cardW : handStep} style={{ left: 0, top: 0 }} />
            </button>
          );
        })}
        {!n && <div className="grid h-full place-items-center whitespace-nowrap text-muted">手牌出完了</div>}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 gap-2">
        <button className="btn btn-glass flex-1 !px-2" style={{ minHeight: btnH }} onClick={hint} disabled={!active}>
          提示
        </button>
        <button className="btn btn-glass flex-1 !px-2" style={{ minHeight: btnH }} onClick={() => void send("pass")} disabled={!active || !v.trick}>
          不要
        </button>
        <button className="btn btn-ink flex-[1.4] !px-2" style={{ minHeight: btnH }} onClick={playSel} disabled={!active || !check?.ok} title={check && !check.ok ? check.error : undefined}>
          出牌
        </button>
      </div>
    </div>
  );
}

export const paodekuaiUI: GameUI<PaodekuaiView> = {
  shape: "fill",
  Board,
  status: (v) => {
    if (v.winner || !v.myTurn) return null;
    if (!v.trick?.combo) return "到你出牌";
    return `要压过${pdkComboName(v.trick.combo)}`;
  },
  badge: (v) => ({ value: String(v.hand.length), label: "剩牌" }),
  stats: (v) => [
    { label: "你的牌", value: String(v.hand.length) },
    { label: "对手牌", value: String(v.opponentCount) },
    { label: "已过轮", value: String(v.tricks) },
  ],
};
