import { otherActor, pokerBestHand, pokerHandNameZh, pokerStreetZh, type Actor, type PokerActionEntry, type PokerView } from "@rain-go/engine";
import { useEffect, useState, type CSSProperties } from "react";
import type { BoardProps, GameUI } from "../types";
import { PokerCard, PokerCardBack, PokerCardSlot, PokerDisc } from "./Cards";

const currentBet = (v: PokerView) => Math.max(v.bets.human, v.bets.ai);

/** True while the previous hand's result should stay on the table: until the viewer acts again. */
function inRecap(v: PokerView): boolean {
  if (!v.lastHand) return false;
  if (v.over) return true;
  return !v.actions.some((a) => a.actor === v.viewer && a.kind !== "sb" && a.kind !== "bb");
}

function actionZh(e: PokerActionEntry): string {
  switch (e.kind) {
    case "sb":
      return `小盲 ${e.amount}`;
    case "bb":
      return `大盲 ${e.amount}`;
    case "fold":
      return "弃牌";
    case "check":
      return "过牌";
    case "call":
      return `跟注 ${e.amount}`;
    case "bet":
      return `下注 ${e.to}`;
    case "raise":
      return `加注到 ${e.to}`;
    case "allin":
      return `全下 ${e.to}`;
  }
}

function resultLine(v: PokerView, nameOf: (a: Actor) => string): string {
  const lh = v.lastHand!;
  if (lh.folded) return `${nameOf(lh.folded)} 弃牌 · ${nameOf(otherActor(lh.folded))} 赢 ${lh.pot}`;
  if (lh.winners.length === 2) return `平分底池 ${lh.pot} · ${lh.names.human ?? ""}`;
  const w = lh.winners[0]!;
  const l = otherActor(w);
  return `${nameOf(w)} 赢 ${lh.pot} · ${lh.names[w]} 胜 ${lh.names[l]}`;
}

const fz = (k: number, min: number, max: number) => `clamp(${min}px, calc(var(--ch) * ${k}), ${max}px)`;

function Seat({ who, v, name, cards, note }: { who: Actor; v: PokerView; name: string; cards: string[] | null; note: string | null }) {
  const bet = v.bets[who];
  const turn = v.toAct === who && !v.over;
  const allIn = v.stacks[who] === 0 && !v.over && v.street !== "showdown";
  return (
    <div className="flex shrink-0 items-center" style={{ height: "var(--ch)", gap: "calc(var(--ch) * 0.28)" }}>
      <div className="flex shrink-0" style={{ gap: "calc(var(--ch) * 0.07)" }}>
        {cards ? cards.map((c) => <PokerCard key={`${v.hand}-${c}`} card={c} className="drop-in" />) : [0, 1].map((i) => <PokerCardBack key={i} />)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-w-0 items-center gap-1.5" style={{ fontSize: fz(0.3, 11, 19), lineHeight: 1.2 }}>
          <span className={`h-[0.5em] w-[0.5em] shrink-0 rounded-full ${turn ? "bg-ink" : "bg-faint"}`} />
          <span className="truncate italic text-ink-2">{name}</span>
          {v.button === who && (
            <span title="庄位（小盲）" className="inline-flex">
              <PokerDisc dark={false} size="1.35em">
                D
              </PokerDisc>
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-bold tracking-tight" style={{ fontSize: fz(0.46, 15, 34), lineHeight: 1.1 }}>
            {v.stacks[who]}
          </span>
          {allIn && !note?.startsWith("全下") && (
            <span className="shrink-0 text-accent" style={{ fontSize: fz(0.28, 11, 17) }}>
              全下
            </span>
          )}
          {note && (
            <span className="truncate text-muted" style={{ fontSize: fz(0.28, 11, 17) }}>
              {note}
            </span>
          )}
        </div>
      </div>
      {bet > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/40 py-[0.15em] pr-[0.6em] pl-[0.15em] font-semibold" style={{ fontSize: fz(0.32, 12, 19) }}>
          <PokerDisc dark={false} size="1.25em" />
          {bet}
        </span>
      )}
    </div>
  );
}

function Board({ match, view: v, canAct, send, compact }: BoardProps<PokerView>) {
  const me = v.viewer;
  const them = otherActor(me);
  const nameOf = (a: Actor) => (a === me ? "你" : (match.seats[a === "human" ? 0 : 1]?.name ?? ""));
  const recap = inRecap(v);
  const lh = v.lastHand;
  const [picking, setPicking] = useState(false);
  const [amount, setAmount] = useState(v.minRaiseTo);
  const turnKey = `${v.hand}-${v.street}-${v.actions.length}-${v.toAct}`;
  useEffect(() => {
    setPicking(false);
    setAmount(v.minRaiseTo);
  }, [turnKey, v.minRaiseTo]);

  const myTurn = canAct && v.toAct === me;
  const cb = currentBet(v);
  const canRaise = v.minRaiseTo > 0;
  const raiseKind = v.legal.includes("bet") ? "bet" : v.legal.includes("raise") ? "raise" : null;
  const verb = cb === 0 ? "下注" : "加注";

  // Opponent: show their shown-down cards during the recap.
  const oppShown = recap ? lh?.shown[them] : undefined;
  const board = recap && v.board.length === 0 && lh ? lh.board : v.board;
  const recapBoard = board !== v.board;
  const myName = v.board.length >= 3 && v.hole.length === 2 ? pokerHandNameZh(pokerBestHand([...v.hole, ...v.board])) : null;
  const lastOpp = [...v.actions].reverse().find((a) => a.actor === them && a.kind !== "sb" && a.kind !== "bb");
  const oppNote = oppShown ? `亮牌 · ${lh!.names[them] ?? ""}` : lastOpp && lastOpp.street === v.street ? actionZh(lastOpp) : null;
  const myNote = recap && lh?.names[me] && !v.over ? `上一手 ${lh.names[me]}` : myName;

  const send1 = (m: string) => void send(m);
  const preset = (f: "min" | "half" | "pot" | "all") => {
    const potAfterCall = v.pot + v.toCall;
    const raw = f === "min" ? v.minRaiseTo : f === "all" ? v.maxRaiseTo : cb + Math.round(potAfterCall * (f === "half" ? 0.5 : 1));
    return Math.max(v.minRaiseTo, Math.min(v.maxRaiseTo, raw));
  };
  const snap = (x: number) => {
    if (x >= v.maxRaiseTo) return v.maxRaiseTo;
    const step = v.sb;
    return Math.max(v.minRaiseTo, Math.min(v.maxRaiseTo, Math.round(x / step) * step));
  };
  const confirm = () => send1(amount >= v.maxRaiseTo ? "allin" : `${raiseKind ?? "raise"} ${amount}`);

  const btn = "btn flex-1 whitespace-nowrap !min-h-[40px] !px-2 text-[0.98rem] lg:!min-h-[48px]";
  const line = { fontSize: fz(0.34, 12, 20), lineHeight: 1.2 } as CSSProperties;
  const ch = compact ? "clamp(24px, min(calc(100cqh / 4.4), 21cqw), 104px)" : "clamp(40px, min(calc(100cqh / 4.6), 15cqw), 120px)";

  let centerLine: string | null = null;
  if (recap && lh) centerLine = `${v.over ? "" : `第 ${lh.hand} 手 · `}${resultLine(v, nameOf)}`;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden" style={{ containerType: "size" }}>
        <div className="flex h-full flex-col justify-between px-1 py-0.5 lg:px-4 lg:py-3" style={{ "--ch": ch } as CSSProperties}>
          <Seat who={them} v={v} name={nameOf(them)} cards={oppShown ?? null} note={oppNote} />

          <div className="flex min-h-0 flex-col items-center" style={{ gap: "calc(var(--ch) * 0.12)" }}>
            <div className="flex items-center gap-1.5" style={line}>
              <PokerDisc dark size="1em" />
              <span className="text-muted">底池</span>
              <span className="font-bold">{v.over && lh ? lh.pot : v.pot}</span>
              <span className="text-faint">·</span>
              <span className="text-muted">{v.over ? "结束" : pokerStreetZh[v.street]}</span>
            </div>
            <div className="flex" style={{ gap: "calc(var(--ch) * 0.1)", opacity: recapBoard ? 0.7 : 1 }}>
              {Array.from({ length: 5 }, (_, i) =>
                board[i] ? <PokerCard key={`${recapBoard ? "r" : v.hand}-${board[i]}`} card={board[i]!} className="drop-in" /> : <PokerCardSlot key={i} />,
              )}
            </div>
            {!(picking && myTurn) && (
              <div className="max-w-full truncate px-2 text-center" style={line}>
                {centerLine ? (
                  <span className="text-ink-2">{centerLine}</span>
                ) : (
                  <span className="text-muted">
                    盲注 {v.sb}/{v.bb} · 第 {v.hand}
                    {v.handLimit ? `/${v.handLimit}` : ""} 手
                  </span>
                )}
              </div>
            )}
          </div>

          <Seat who={me} v={v} name={nameOf(me)} cards={v.hole} note={myNote} />
        </div>
      </div>

      <div className="mt-1.5 shrink-0 lg:mt-3">
        {v.over ? (
          <div className="chip w-full justify-center !py-2 !text-ink">对局结束 · 筹码 {v.stacks[me]} : {v.stacks[them]}</div>
        ) : picking && myTurn ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              {(
                [
                  ["min", "最小"],
                  ["half", "½ 池"],
                  ["pot", "一池"],
                  ["all", "全下"],
                ] as const
              ).map(([k, label]) => {
                const val = preset(k);
                return (
                  <button
                    key={k}
                    className={`btn flex-1 !min-h-[32px] !px-1 text-[0.9rem] ${amount === val ? "btn-ink" : "btn-glass"}`}
                    onClick={() => setAmount(val)}
                    aria-pressed={amount === val}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-glass !min-h-[40px] shrink-0 !px-3" onClick={() => setPicking(false)} aria-label="取消">
                ✕
              </button>
              <input
                type="range"
                className="min-w-0 flex-1"
                style={{ accentColor: "#0b0b0b" }}
                min={v.minRaiseTo}
                max={v.maxRaiseTo}
                step={1}
                value={amount}
                onChange={(e) => setAmount(snap(Number(e.target.value)))}
                aria-label="加注金额"
              />
              <button className="btn btn-ink !min-h-[40px] shrink-0 !px-3 text-[0.98rem]" onClick={confirm}>
                {amount >= v.maxRaiseTo ? `全下 ${v.maxRaiseTo}` : `${verb}到 ${amount}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className={`${btn} btn-glass`} disabled={!myTurn || !v.legal.includes("fold")} onClick={() => send1("fold")}>
              弃牌
            </button>
            <button className={`${btn} btn-ink`} disabled={!myTurn} onClick={() => send1(v.toCall > 0 ? "call" : "check")}>
              {!myTurn ? "等待" : v.toCall > 0 ? (v.toCall >= v.stacks[me] ? `全下 ${v.toCall}` : `跟注 ${v.toCall}`) : "过牌"}
            </button>
            {myTurn && canRaise && !raiseKind ? (
              <button className={`${btn} btn-glass`} onClick={() => send1("allin")}>
                全下 {v.maxRaiseTo}
              </button>
            ) : (
              <button
                className={`${btn} btn-glass`}
                disabled={!myTurn || !raiseKind}
                onClick={() => {
                  setAmount(v.minRaiseTo);
                  setPicking(true);
                }}
              >
                {verb}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const pokerUI: GameUI<PokerView> = {
  shape: "fill",
  Board,
  status: (v) => {
    if (v.over) return null;
    const street = pokerStreetZh[v.street];
    if (v.toAct === v.viewer) return v.toCall > 0 ? `到你了 · 跟注 ${v.toCall}` : `到你了 · 底池 ${v.pot}`;
    return `${street} · 底池 ${v.pot}`;
  },
  badge: (v) => ({ value: String(v.stacks[v.viewer]), label: "CHIPS" }),
  stats: (v) => [
    { label: "手数", value: v.handLimit ? `${v.hand}/${v.handLimit}` : String(v.hand) },
    { label: "盲注", value: `${v.sb}/${v.bb}` },
    { label: "底池", value: String(v.pot) },
  ],
};
