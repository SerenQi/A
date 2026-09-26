import { MONOPOLY_GROUP_MARKS, monopolyCell, type Actor, type MatchView, type MonopolyEvent, type MonopolySpaceView, type MonopolyView } from "@rain-go/engine";
import { useState, type CSSProperties } from "react";
import { Bead, DropDefs } from "../../components/drops";
import type { BoardProps, GameUI } from "../types";

/** One grid step as a share of the board (7 tiles across). All sizes are in cqw of the square board. */
const T = 100 / 7;
const cq = (n: number) => `${n}cqw`;

const other = (a: Actor): Actor => (a === "human" ? "ai" : "human");
const nameOf = (m: MatchView<MonopolyView>, a: Actor) => (a === "human" ? m.humanName : m.aiName);

/** Small glossy disc (ink or milk) drawn with the shared drop gradients. */
function Disc({ ink, size, className, jailed }: { ink: boolean; size: string; className?: string; jailed?: boolean }) {
  return (
    <svg viewBox="-0.5 -0.5 1 1" style={{ width: size, height: size, overflow: "visible" }} className="block">
      <g filter="url(#drop-shadow)" className={className}>
        <Bead x={0} y={0} r={0.4} dark={ink} />
      </g>
      {jailed && <circle r={0.48} fill="none" stroke="rgb(11 11 11 / 0.6)" strokeWidth={0.05} strokeDasharray="0.09 0.07" />}
    </svg>
  );
}

function GroupBand({ group }: { group: number }) {
  const a = 0.14 + group * 0.1;
  const c = `rgb(20 20 20 / ${a})`;
  const background = group % 2 ? `repeating-linear-gradient(90deg, ${c} 0 0.9cqw, transparent 0.9cqw 1.5cqw)` : c;
  return <span className="absolute inset-x-[10%] top-[5%] rounded-full" style={{ height: cq(0.9), background }} />;
}

function HouseBars({ n }: { n: number }) {
  return (
    <span className="flex items-end" style={{ gap: cq(0.4) }}>
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          className="rounded-[1px]"
          style={{ width: cq(0.9), height: cq(1.3 + k * 0.6), background: k < n ? "#0b0b0b" : "rgb(20 20 20 / 0.14)" }}
        />
      ))}
    </span>
  );
}

function Tile({ sp, v, active, occupied, selected, onTap }: { sp: MonopolySpaceView; v: MonopolyView; active: boolean; occupied: boolean; selected: boolean; onTap: () => void }) {
  const { row, col } = monopolyCell(sp.index);
  const corner = sp.index % 6 === 0;
  const prop = sp.kind === "property";
  const long = sp.name.length > 2;
  const ownerInk = sp.owner ? v.players[sp.owner].ink : false;
  const sub = prop ? (sp.owner ? `租 ${sp.rentNow}` : String(sp.price)) : sp.kind === "tax" ? `-${sp.tax}` : sp.kind === "start" ? "+200" : sp.kind === "chance" ? "抽签" : "";
  const offer = v.offer?.index === sp.index;
  const style: CSSProperties = {
    gridRow: row + 1,
    gridColumn: col + 1,
    borderRadius: cq(1.6),
    background: !sp.owner ? "rgb(255 255 255 / 0.26)" : ownerInk ? "rgb(40 40 40 / 0.1)" : "rgb(255 255 255 / 0.62)",
    border: "1px solid rgb(255 255 255 / 0.6)",
    boxShadow: selected || offer ? "inset 0 0 0 1.5px rgb(11 11 11 / 0.7)" : active ? "inset 0 0 0 1px rgb(11 11 11 / 0.35)" : undefined,
  };
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onTap(); }} style={style} className="relative flex min-h-0 min-w-0 flex-col items-center overflow-hidden text-ink" aria-label={sp.name}>
      {prop && <GroupBand group={sp.group!} />}
      {corner ? (
        <span className="mt-[14%] flex flex-col items-center leading-[1.08]" style={{ fontSize: cq(sp.name.length > 2 ? 4 : 4.8) }}>
          {sp.name.length > 3 ? (
            <>
              <span>{sp.name.slice(0, 2)}</span>
              <span>{sp.name.slice(2)}</span>
            </>
          ) : (
            <span className="whitespace-nowrap">{sp.name}</span>
          )}
        </span>
      ) : (
        <span className="mt-[17%] whitespace-nowrap leading-none" style={{ fontSize: cq(long ? 4.05 : 4.9), letterSpacing: long ? "-0.04em" : undefined }}>
          {sp.name}
        </span>
      )}
      {sub && !occupied && (
        <span className="mt-[7%] whitespace-nowrap leading-none text-muted" style={{ fontSize: cq(2.7) }}>
          {sub}
        </span>
      )}
      {prop && (
        <span className="absolute left-[8%] bottom-[8%]">
          <HouseBars n={sp.houses} />
        </span>
      )}
      {sp.owner && (
        <span
          className="absolute right-[9%] bottom-[9%] rounded-full"
          style={{
            width: cq(2.5),
            height: cq(2.5),
            background: ownerInk ? "radial-gradient(circle at 35% 30%, #3a3a3a, #0b0b0b 55%, #000)" : "radial-gradient(circle at 35% 30%, #fff, #ecece8 70%, #c9c9c4)",
            boxShadow: ownerInk ? undefined : "0 0 0 1px rgb(0 0 0 / 0.16)",
          }}
        />
      )}
    </button>
  );
}

/** Die face with pips, drawn in a unit square. */
function Die({ n, size }: { n: number; size: string }) {
  const at: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
    6: [[0.28, 0.24], [0.72, 0.24], [0.28, 0.5], [0.72, 0.5], [0.28, 0.76], [0.72, 0.76]],
  };
  return (
    <svg viewBox="0 0 1 1" style={{ width: size, height: size }} className="block drop-shadow-[0_2px_3px_rgb(0_0_0/0.14)]">
      <rect x={0.03} y={0.03} width={0.94} height={0.94} rx={0.2} fill="rgb(255 255 255 / 0.82)" stroke="rgb(255 255 255 / 0.95)" strokeWidth={0.03} />
      {(at[n] ?? []).map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={n === 1 ? 0.11 : 0.085} fill="#0b0b0b" />
      ))}
    </svg>
  );
}

function recentEvents(v: MonopolyView): { actor: Actor; label: string; events: MonopolyEvent[] } | null {
  if (v.events.length) return { actor: v.turn, label: "本回合", events: v.events };
  if (v.lastTurn?.events.length) return { actor: v.lastTurn.actor, label: "上回合", events: v.lastTurn.events };
  return null;
}

function Center({ v, match }: { v: MonopolyView; match: MatchView<MonopolyView> }) {
  const recent = recentEvents(v);
  const lines = recent ? recent.events.slice(-3) : [];
  const order: Actor[] = [v.first, other(v.first)];
  return (
    <div
      className="flex min-h-0 min-w-0 flex-col overflow-hidden"
      style={{
        gridRow: "2 / 7",
        gridColumn: "2 / 7",
        margin: cq(1.2),
        padding: `${cq(2.4)} ${cq(3)}`,
        borderRadius: cq(3),
        background: "rgb(255 255 255 / 0.18)",
        border: "1px solid rgb(255 255 255 / 0.5)",
        gap: cq(1.6),
      }}
    >
      <div className="flex items-baseline justify-between leading-tight text-muted" style={{ fontSize: cq(3) }}>
        <span>
          第 {v.round}
          {v.rounds ? ` / ${v.rounds}` : ""} 轮
        </span>
        <span>{v.over ? "终局" : `${nameOf(match, v.turn)} 的回合`}</span>
      </div>
      <div className="grid grid-cols-2" style={{ gap: cq(2) }}>
        {order.map((a) => {
          const p = v.players[a];
          const turn = !v.over && v.turn === a;
          return (
            <div key={a} className="min-w-0" style={{ borderLeft: `${cq(0.5)} solid ${turn ? "#0b0b0b" : "rgb(20 20 20 / 0.15)"}`, paddingLeft: cq(1.6) }}>
              <div className="flex items-center leading-tight text-ink-2" style={{ gap: cq(0.9), fontSize: cq(3) }}>
                <Disc ink={p.ink} size={cq(3)} />
                <span className="truncate">
                  {nameOf(match, a)}
                  {a === v.me ? "（你）" : ""}
                </span>
              </div>
              <div className="font-semibold leading-none tracking-tight" style={{ fontSize: cq(8), marginTop: cq(0.8) }}>
                {p.cash}
              </div>
              <div className="truncate leading-tight text-muted" style={{ fontSize: cq(2.6), marginTop: cq(0.6) }}>
                身家 {p.worth}
                {p.inJail ? " · 拘留中" : ""}
                {p.cards ? ` · 出狱卡 ${p.cards}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center" style={{ gap: cq(1.6) }}>
        {v.dice ? (
          <>
            <Die n={v.dice[0]} size={cq(8.6)} />
            <Die n={v.dice[1]} size={cq(8.6)} />
            {v.dice[0] === v.dice[1] && (
              <span className="chip !text-ink" style={{ fontSize: cq(2.8) }}>
                对子
              </span>
            )}
          </>
        ) : (
          <span className="text-faint" style={{ fontSize: cq(3) }}>
            还没掷骰子
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden leading-[1.3]" style={{ fontSize: cq(3.4) }}>
        {recent && (
          <div className="truncate text-faint" style={{ fontSize: cq(2.8) }}>
            {nameOf(match, recent.actor)} · {recent.label}
          </div>
        )}
        {lines.map((e, k) => (
          <div key={`${v.seq}-${k}`} className={`truncate ${k === lines.length - 1 ? "text-ink" : "text-ink-2"}`}>
            {e.actor !== recent?.actor ? `${nameOf(match, e.actor)}：` : ""}
            {e.zh}
          </div>
        ))}
      </div>
    </div>
  );
}

function Popover({ sp, v, canAct, send, onClose }: { sp: MonopolySpaceView; v: MonopolyView; canAct: boolean; send: (m: string) => Promise<boolean>; onClose: () => void }) {
  const { row, col } = monopolyCell(sp.index);
  const W = 56;
  const cx = (col + 0.5) * T;
  const cy = (row + 0.5) * T;
  const pos: CSSProperties = { width: cq(W) };
  if (row === 6) Object.assign(pos, { bottom: cq(T + 1.5), left: cq(Math.min(Math.max(cx - W / 2, T + 1), 100 - T - 1 - W)) });
  else if (row === 0) Object.assign(pos, { top: cq(T + 1.5), left: cq(Math.min(Math.max(cx - W / 2, T + 1), 100 - T - 1 - W)) });
  else Object.assign(pos, { top: cq(Math.min(Math.max(cy - 12, T + 1), 100 - T - 34)), left: cq(col === 0 ? T + 1.5 : 100 - T - 1.5 - W) });
  const build = v.buildable.find((b) => b.index === sp.index);
  const mine = sp.owner === v.me;
  const canBuild = canAct && v.turn === v.me && !!build;
  const prop = sp.kind === "property";
  const text: Record<string, string> = {
    start: "经过或停在这里，领 200。",
    jail: "路过只是探望。进了拘留所：掷对子、交 50 或用出狱卡出来。",
    rest: "茶馆歇脚，什么也不发生。",
    gotojail: "直接去拘留所，不经过起点。",
    chance: "抽一张命运牌。",
    tax: `交 ${sp.tax}。`,
  };
  return (
    <div className="glass z-20 !rounded-[18px] text-ink" style={{ ...pos, position: "absolute", padding: cq(2.6), background: "linear-gradient(165deg, rgb(252 252 250 / 0.96), rgb(238 238 235 / 0.93))" }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-baseline justify-between" style={{ gap: cq(1) }}>
        <span className="font-semibold leading-none" style={{ fontSize: cq(4.6) }}>
          {sp.name}
        </span>
        <span className="leading-none text-muted" style={{ fontSize: cq(3) }}>
          {prop ? `第${MONOPOLY_GROUP_MARKS[sp.group!]}组 · ${sp.price}` : ""}
        </span>
      </div>
      <div className="leading-snug text-ink-2" style={{ fontSize: cq(3.2), marginTop: cq(1.4) }}>
        {prop ? (
          <>
            <div>
              租 {sp.rent!.join(" / ")}
            </div>
            <div className="text-muted">
              {sp.owner ? `${mine ? "你的" : "对方的"}地 · ${sp.houses} 层房 · 现租 ${sp.rentNow}` : `无主 · 盖房 ${sp.houseCost}/层`}
            </div>
          </>
        ) : (
          text[sp.kind]
        )}
      </div>
      <div className="flex" style={{ gap: cq(1.2), marginTop: cq(1.8) }}>
        {canBuild && (
          <button className="btn btn-ink flex-1 !min-h-0" style={{ fontSize: cq(3.4), height: cq(8), padding: 0 }} onClick={() => void send(`build ${sp.index}`)}>
            盖房 ({build!.cost})
          </button>
        )}
        <button className="btn btn-glass flex-1 !min-h-0" style={{ fontSize: cq(3.4), height: cq(8), padding: 0 }} onClick={onClose}>
          {canBuild ? "算了" : "关闭"}
        </button>
      </div>
    </div>
  );
}

function Board({ match, view: v, canAct, send }: BoardProps<MonopolyView>) {
  const [sel, setSel] = useState<number | null>(null);
  const actors: Actor[] = [v.first, other(v.first)];
  const both = v.players.human.pos === v.players.ai.pos;
  const selected = sel === null ? null : v.spaces[sel];
  return (
    <div className="relative h-full w-full touch-manipulation select-none" style={{ containerType: "size" }} onClick={() => setSel(null)}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <DropDefs />
      </svg>
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          gap: cq(0.6),
          padding: cq(0.4),
          borderRadius: cq(3),
          background: "rgb(255 255 255 / 0.26)",
          border: "1px solid rgb(255 255 255 / 0.6)",
        }}
      >
        {v.spaces.map((sp) => (
          <Tile
            key={sp.index}
            sp={sp}
            v={v}
            active={!v.over && v.players[v.turn].pos === sp.index}
            occupied={v.players.human.pos === sp.index || v.players.ai.pos === sp.index}
            selected={sel === sp.index}
            onTap={() => setSel(sel === sp.index ? null : sp.index)}
          />
        ))}
        <Center v={v} match={match} />
      </div>
      {actors.map((a, k) => {
        const p = v.players[a];
        const { row, col } = monopolyCell(p.pos);
        const size = both ? 4.6 : 5.2;
        const dx = both ? (k === 0 ? -2.3 : 2.3) : 0;
        return (
          <div
            key={`${a}-${p.pos}`}
            className="pointer-events-none absolute z-10"
            style={{ left: cq((col + 0.5) * T + dx - size / 2), top: cq((row + 1) * T - size - 1.3), width: cq(size), height: cq(size) }}
          >
            <Disc ink={p.ink} size={cq(size)} className="drop-in" jailed={p.inJail} />
          </div>
        );
      })}
      {selected && <Popover sp={selected} v={v} canAct={canAct} send={send} onClose={() => setSel(null)} />}
    </div>
  );
}

function Actions({ view: v, canAct, send, compact }: BoardProps<MonopolyView>) {
  if (v.over) return null;
  if (v.turn !== v.me) {
    return (
      <button className="btn btn-glass flex-1" disabled>
        对方回合
      </button>
    );
  }
  const legal = new Set(v.legal);
  const offer = v.offer ? v.spaces[v.offer.index]! : null;
  const items: { move: string; label: string }[] = [];
  if (legal.has("roll")) items.push({ move: "roll", label: v.rollAgain ? "再掷一次" : v.players[v.me].inJail ? "掷对子" : "掷骰子" });
  if (legal.has("buy") && offer) items.push({ move: "buy", label: compact ? `买下 (${offer.price})` : `买下${offer.name} (${offer.price})` });
  if (legal.has("skip")) items.push({ move: "skip", label: "不买" });
  if (legal.has("pay")) items.push({ move: "pay", label: compact ? "交 50" : "交 50 出狱" });
  if (legal.has("card")) items.push({ move: "card", label: compact ? "用卡" : "用出狱卡" });
  if (legal.has("end")) items.push({ move: "end", label: "结束回合" });
  const main = items[0]?.move;
  const tight = compact && items.length > 1;
  return (
    <>
      {items.map((it) => (
        <button
          key={it.move}
          className={`btn ${it.move === main ? "btn-ink" : "btn-glass"} min-w-0 flex-1 whitespace-nowrap ${tight ? "!px-2 !text-[0.95rem]" : ""}`}
          style={it.move === "buy" ? { flexGrow: 2 } : undefined}
          disabled={!canAct}
          onClick={() => void send(it.move)}
        >
          {it.label}
        </button>
      ))}
    </>
  );
}

export const monopolyUI: GameUI<MonopolyView> = {
  shape: "square",
  Board,
  Actions,
  status: (v) => {
    if (v.over || v.turn !== v.me) return null;
    const p = v.players[v.me];
    if (v.phase === "buy" && v.offer) {
      const sp = v.spaces[v.offer.index]!;
      return p.cash >= sp.price! ? `要不要买${sp.name}？` : `钱不够买${sp.name}`;
    }
    if (v.phase === "roll") return p.inJail ? (p.cards ? "拘留中：掷对子、交 50 或用卡" : "拘留中：掷对子或交 50") : v.rollAgain ? "对子！再掷一次" : "到你掷骰";
    return v.buildable.length ? "点自己的地可以盖房" : "可以结束回合";
  },
  badge: (v) => ({ value: String(v.players[v.me].cash), label: "CASH" }),
  stats: (v) => {
    const me = v.players[v.me];
    const them = v.players[other(v.me)];
    return [
      { label: "轮次", value: v.rounds ? `${v.round}/${v.rounds}` : String(v.round) },
      { label: "你的现金", value: String(me.cash) },
      { label: "对方现金", value: String(them.cash) },
      { label: "你的身家", value: String(me.worth) },
      { label: "对方身家", value: String(them.worth) },
      { label: "地产", value: String(v.spaces.filter((s) => s.owner === v.me).length) },
    ];
  },
};
