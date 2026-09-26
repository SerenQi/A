import { GAMES, otherActor, type Actor, type MatchAction, type MatchView } from "@rain-go/engine";
import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { UIS } from "../games";
import type { BoardProps } from "../games/types";
import { ChatInput, ChatList, Sheet } from "./Chat";
import { DropMark, IconChat, IconFlag, IconName } from "./icons";
import { NameSheet } from "./NameSheet";
import { Pill, Stat } from "./Pill";
import { Header, useWide } from "./Shell";
import { useToast } from "./Toast";

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

/**
 * The shared game screen. `me` is the side this screen plays (the human on the real page;
 * either side in the sandbox). `perform` throws an Error whose message is shown as a toast.
 */
export function MatchScreen({
  match,
  me = "human",
  perform,
  chip,
  extra,
}: {
  match: MatchView;
  me?: Actor;
  perform: (a: MatchAction) => Promise<void>;
  chip: ReactNode;
  extra?: ReactNode;
}) {
  const wide = useWide();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [seenChat, setSeenChat] = useState(0);
  const mod = GAMES[match.kind];
  const ui = UIS[match.kind];
  const them = otherActor(me);
  const nameOf = (a: Actor) => (a === "human" ? match.humanName : match.aiName);

  useEffect(() => {
    if (chatOpen) setSeenChat(match.chat.length);
  }, [chatOpen, match.chat.length]);

  const send = async (a: MatchAction) => {
    if (busy) return false;
    setBusy(true);
    try {
      await perform(a);
      return true;
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "出错了");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const st = match.status;
  const myTurn = !st.outcome && st.waitingOn.includes(me);
  const props: BoardProps = {
    match,
    view: match.view,
    canAct: myTurn && !busy,
    send: (move) => send({ type: "move", move }),
    toast: toast.show,
    compact: !wide,
  };
  const status = st.resultText ?? ui.status?.(match.view, match) ?? (myTurn ? "轮到你了" : `${nameOf(them)} 思考中…`);
  const badge = ui.badge?.(match.view, match) ?? { value: String(match.log.length), label: "MOVE" };
  const lastTheirSay = [...match.chat].reverse().find((m) => m.from === them);
  const unread = match.chat.length > seenChat && match.chat.at(-1)?.from === them;
  const thinking = !st.outcome && st.waitingOn.includes(them) && !myTurn;
  const seatLine = `${nameOf(me)} ${match.seats[me]} · ${nameOf(them)} ${match.seats[them]}`;
  const subtitle = (
    <>
      {thinking && <span className="pulse-dot mr-1">●</span>}
      {lastTheirSay ? `“${lastTheirSay.text}”` : seatLine}
    </>
  );

  const resign = () => confirm("确定认输吗？") && void send({ type: "resign" });
  const Actions = ui.Actions;
  const board =
    ui.shape === "square" ? (
      <div className="board-fit min-h-0 flex-1">
        <div className="board-box glass grid place-items-center !rounded-[24px] p-1 lg:p-3">
          <ui.Board {...props} />
        </div>
      </div>
    ) : (
      <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden !rounded-[24px] p-2 lg:p-4">
        <ui.Board {...props} />
      </div>
    );

  const sheets = (
    <>
      {chatOpen && (
        <Sheet title="Whisper" onClose={() => setChatOpen(false)}>
          <ChatList chat={match.chat} me={me} className="mt-3 min-h-0 flex-1" />
          <div className="mt-3 flex shrink-0">
            <ChatInput to={nameOf(them)} busy={busy} compact onSend={(text) => send({ type: "say", text })} />
          </div>
        </Sheet>
      )}
      {namesOpen && (
        <NameSheet
          humanName={match.humanName}
          aiName={match.aiName}
          humanSeat={match.seats.human}
          aiSeat={match.seats.ai}
          onClose={() => setNamesOpen(false)}
          onSave={(humanName, aiName) => send({ type: "rename", humanName, aiName })}
        />
      )}
    </>
  );

  if (!wide) {
    return (
      <>
        {toast.node}
        <Header
          status={chip}
          left={
            <div className="flex min-w-0 items-center gap-2 text-[1.05rem]">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${myTurn ? "bg-ink" : "bg-faint"}`} />
              <span className="truncate">{status}</span>
            </div>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <button onClick={() => setChatOpen(true)} className="pill-black flex shrink-0 items-center gap-3 !rounded-[26px] px-3.5 py-2.5 text-left">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#3a3a3a] bg-[#161616]">
              <DropMark width={24} height={24} />
              {unread && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black bg-accent" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.25rem] italic leading-tight">{nameOf(them)}</span>
              <span className="block truncate text-[0.9rem] text-white/70">{subtitle}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[1.4rem] font-bold leading-none">{st.outcome ? (st.outcome.winner === me ? "WIN" : st.outcome.winner === "draw" ? "DRAW" : "LOSE") : badge.value}</span>
              <span className="mt-1 block text-[0.72rem] text-white/55">{st.outcome ? mod.name.zh : badge.label}</span>
            </span>
          </button>
          {board}
          <div className="flex shrink-0 gap-2 [&_.btn]:!min-h-[44px]">
            {Actions && !st.outcome ? <Actions {...props} /> : <div className="chip flex-1 justify-center !text-ink">{mod.name.zh}</div>}
            {!st.outcome && (
              <button className="btn btn-glass shrink-0 !px-3.5" onClick={resign} aria-label="认输">
                <IconFlag width={20} height={20} />
              </button>
            )}
            <button className="btn btn-glass shrink-0 !px-3.5" onClick={() => setNamesOpen(true)} aria-label="名字">
              <IconName width={20} height={20} />
            </button>
            <button className="btn btn-glass relative shrink-0 !px-3.5" onClick={() => setChatOpen(true)} aria-label="聊天">
              <IconChat width={20} height={20} />
              {unread && <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-accent" />}
            </button>
          </div>
          {extra}
        </div>
        {sheets}
      </>
    );
  }

  const stats = ui.stats?.(match.view, match) ?? [];
  return (
    <>
      {toast.node}
      <Header status={chip} />
      <div className="game-grid">
        <motion.div {...card} className="area-pill">
          <Pill title={nameOf(them)} subtitle={subtitle} onClick={() => setChatOpen(true)} />
        </motion.div>
        <motion.section {...card} className="glass area-hero px-7 py-6">
          <div className="text-[1.4rem] text-ink-2">
            {mod.name.en} · {mod.name.zh}
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-[3.6rem] font-bold leading-[1.02] tracking-tight">{st.outcome ? st.outcome.text : badge.value}</span>
            {!st.outcome && <span className="text-[1rem] tracking-wide text-muted">{badge.label}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[1.05rem] text-muted">
            <span>{seatLine}</span>
            <button className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.95rem] text-ink-2 hover:bg-white/50" onClick={() => setNamesOpen(true)}>
              <IconName width={16} height={16} /> 改名
            </button>
          </div>
          <div className="mt-1 text-[1.05rem] text-ink">{status}</div>
        </motion.section>
        <motion.section {...card} className="area-board flex h-[min(78vh,760px)] flex-col">
          {board}
        </motion.section>
        <motion.section {...card} className="area-controls flex flex-wrap gap-3">
          {Actions && !st.outcome && <Actions {...props} />}
          {!st.outcome && (
            <button className="btn btn-glass flex-1" onClick={resign}>
              认输
            </button>
          )}
        </motion.section>
        {stats.length > 0 && (
          <motion.section {...card} className="glass area-stats px-7 py-6">
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </motion.section>
        )}
        <motion.section {...card} className="glass area-chat px-6 py-5">
          <div className="text-[1.3rem] font-semibold">Whisper</div>
          <ChatList chat={match.chat} me={me} className="mt-3 max-h-56" />
          <div className="mt-3 flex">
            <ChatInput to={nameOf(them)} busy={busy} onSend={(text) => send({ type: "say", text })} />
          </div>
        </motion.section>
        {extra && <div className="area-chat">{extra}</div>}
      </div>
      {sheets}
    </>
  );
}
