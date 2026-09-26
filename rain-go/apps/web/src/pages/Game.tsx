import { actorColor, type Action, type IllegalReason } from "@rain-go/engine";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError, prefs } from "../api";
import { BRAND } from "../brand";
import { Board } from "../components/Board";
import { DropMark, IconChat, IconSend } from "../components/icons";
import { Pill, Ring, Stat } from "../components/Pill";
import { Header, hhmm, useWide } from "../components/Shell";
import { useToast } from "../components/Toast";
import { navigate } from "../router";
import { useGame } from "../useGame";

const ILLEGAL_ZH: Record<IllegalReason, string> = {
  occupied: "这里已经有子了",
  suicide: "不能自杀：落下去就没气了",
  ko: "打劫：先在别处下一手",
  wrong_turn: "还没轮到你",
  not_playing: "现在不能落子",
  off_board: "不在棋盘上",
};

const colorZh = (c: 1 | 2) => (c === 1 ? "黑" : "白");
const stoneBg = (c: 1 | 2) =>
  c === 1 ? "radial-gradient(circle at 35% 30%, #3a3a3a, #050505)" : "radial-gradient(circle at 35% 30%, #fff, #d4d4cf)";

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

type ChatMsg = { from: "human" | "ai"; text: string };

function ChatList({ chat, className = "" }: { chat: ChatMsg[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [chat.length]);
  return (
    <div ref={box} className={`space-y-2 overflow-y-auto ${className}`}>
      {chat.length === 0 && <div className="text-muted">还没有悄悄话。</div>}
      {chat.map((m, i) => (
        <div key={i} className={`flex ${m.from === "human" ? "justify-end" : ""}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-[1rem] ${
              m.from === "human" ? "bg-ink text-white" : "border border-white/80 bg-white/50"
            }`}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatInput({ aiName, busy, onSend, compact = false }: { aiName: string; busy: boolean; onSend: (t: string) => Promise<boolean>; compact?: boolean }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="flex min-w-0 flex-1 gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (draft.trim() && (await onSend(draft))) setDraft("");
      }}
    >
      <input
        className={`field min-w-0 ${compact ? "!min-h-[44px]" : ""}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={280}
        placeholder={`对 ${aiName} 说…`}
        enterKeyHint="send"
      />
      <button className={`btn btn-ink shrink-0 !px-3.5 ${compact ? "!min-h-[44px]" : ""}`} aria-label="发送" disabled={!draft.trim() || busy}>
        <IconSend width={20} height={20} />
      </button>
    </form>
  );
}

function ChatSheet({ chat, onClose, input }: { chat: ChatMsg[]; onClose: () => void; input: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/25 p-3 pb-[max(12px,env(safe-area-inset-bottom))]" onClick={onClose}>
      <div className="glass sheet-enter flex max-h-[70dvh] w-full flex-col !bg-white/75 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-[1.3rem] font-semibold">Whisper</div>
          <button className="text-muted" onClick={onClose}>
            关闭
          </button>
        </div>
        <ChatList chat={chat} className="mt-3 min-h-0 flex-1" />
        <div className="mt-3 flex">{input}</div>
      </div>
    </div>
  );
}

export function Game({ id }: { id: string }) {
  const { record, setRecord, derived, error, live, syncedAt } = useGame(id);
  const toast = useToast();
  const wide = useWide();
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [seenChat, setSeenChat] = useState(0);

  useEffect(() => prefs.setLastGame(id), [id]);
  const dead = useMemo(() => new Set(record?.dead ?? []), [record?.dead]);
  useEffect(() => {
    if (chatOpen && record) setSeenChat(record.chat.length);
  }, [chatOpen, record]);

  const send = async (action: Action) => {
    if (busy) return false;
    setBusy(true);
    try {
      setRecord(await api.act(id, action));
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) toast.show("需要访问口令：点右上角齿轮填写");
      else if (e instanceof ApiError && e.code in ILLEGAL_ZH) toast.show(ILLEGAL_ZH[e.code as IllegalReason]);
      else toast.show(e instanceof Error ? e.message : "出错了");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const liveChip = (
    <>
      <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-ink" : "bg-faint"}`} />
      {live ? `live · ${hhmm(syncedAt ?? Date.now())}` : "offline"}
    </>
  );

  if (error || !record || !derived) {
    return (
      <>
        <Header status={error ? "offline" : "sync · …"} />
        <div className="glass grid h-64 place-items-center p-8 text-center">
          {error ? (
            <div>
              <div className="text-2xl">{error}</div>
              <button className="btn btn-ink mt-6" onClick={() => navigate("/")}>
                回大厅
              </button>
            </div>
          ) : (
            <span className="text-muted">Loading…</span>
          )}
        </div>
      </>
    );
  }

  const { state, phase, chains, waiting, result, score } = derived;
  const human = record.humanColor;
  const ai = actorColor(record, "ai");
  const moves = record.moves.filter((m) => m.k === "play" || m.k === "pass").length;
  const myTurn = phase === "playing" && waiting.includes("human");
  const lastAiSay = [...record.chat].reverse().find((m) => m.from === "ai");
  const iAccepted = record.accepted.includes(human);
  const longest = chains.reduce((m, s) => Math.max(m, s.stones.length), 0);
  const inAtari = chains.filter((s) => s.liberties.length === 1).length;
  const unread = Math.max(0, record.chat.length - seenChat) > 0 && record.chat.at(-1)?.from === "ai";

  const status =
    phase === "finished"
      ? `终局 · ${result?.text ?? ""}`
      : phase === "scoring"
        ? waiting.includes("ai")
          ? `${record.aiName} 正在确认死活…`
          : "点水珠标记死子，然后接受"
        : myTurn
          ? "轮到你了"
          : `${record.aiName} 思考中…`;

  const pillSubtitle = (
    <>
      {!myTurn && phase === "playing" && <span className="pulse-dot mr-1">●</span>}
      {lastAiSay ? `“${lastAiSay.text}”` : status}
    </>
  );

  const board = (
    <Board
      size={record.size}
      state={state}
      chains={chains}
      moveCount={record.moves.length}
      phase={phase}
      humanColor={human}
      canPlay={myTurn && !busy}
      dead={dead}
      owner={phase !== "playing" ? score?.owner : null}
      onPlay={(point) => void send({ type: "play", point })}
      onToggleDead={(point) => phase === "scoring" && void send({ type: "toggle_dead", point })}
      onIllegal={(r) => toast.show(ILLEGAL_ZH[r as IllegalReason] ?? r)}
    />
  );

  const btn = wide ? "" : "!min-h-[44px]";
  const controls = (
    <>
      {phase === "playing" && (
        <>
          <button className={`btn btn-glass flex-1 ${btn}`} disabled={!myTurn || busy} onClick={() => void send({ type: "pass" })}>
            停一手
          </button>
          <button className={`btn btn-glass flex-1 ${btn}`} disabled={busy} onClick={() => confirm("确定认输吗？") && void send({ type: "resign" })}>
            认输
          </button>
        </>
      )}
      {phase === "scoring" && (
        <>
          <button className={`btn btn-ink flex-1 ${btn}`} disabled={busy || iAccepted} onClick={() => void send({ type: "accept" })}>
            {iAccepted ? "已接受，等对方" : "接受结果"}
          </button>
          <button className={`btn btn-glass flex-1 ${btn}`} disabled={busy} onClick={() => void send({ type: "resume" })}>
            继续下棋
          </button>
        </>
      )}
      {phase === "finished" && (
        <button className={`btn btn-ink flex-1 ${btn}`} onClick={() => navigate("/")}>
          再来一局
        </button>
      )}
    </>
  );

  const sayInput = (compact: boolean) => (
    <ChatInput aiName={record.aiName} busy={busy} compact={compact} onSend={(text) => send({ type: "say", text })} />
  );

  if (!wide) {
    // One screen, no scrolling: status in the header, pill, board, one row of actions.
    const headerLeft = (
      <div className="flex min-w-0 items-center gap-2 text-[1.05rem]">
        {phase !== "finished" && (
          <span className="h-4 w-4 shrink-0 rounded-full border border-black/20" style={{ background: stoneBg(state.toPlay) }} />
        )}
        <span className="truncate">{phase === "scoring" && score ? `黑 ${score.black} · 白 ${score.white}` : status}</span>
      </div>
    );
    return (
      <>
        {toast.node}
        <Header status={liveChip} left={headerLeft} />
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <button onClick={() => setChatOpen(true)} className="pill-black flex shrink-0 items-center gap-3 !rounded-[26px] px-3.5 py-2.5 text-left">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#3a3a3a] bg-[#161616]">
              <DropMark width={24} height={24} />
              {unread && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black bg-accent" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.25rem] italic leading-tight">{record.aiName}</span>
              <span className="block truncate text-[0.9rem] text-white/70">{lastAiSay || phase !== "playing" ? pillSubtitle : `${record.humanName} 执${colorZh(human)} · 贴 ${record.komi}`}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[1.5rem] font-bold leading-none">{phase === "finished" ? result?.text : moves}</span>
              <span className="mt-1 block text-[0.72rem] text-white/55">
                {phase === "finished" ? "RESULT" : "MOVE"} · 提 {state.captures[1]}:{state.captures[2]}
              </span>
            </span>
          </button>

          <div className="board-fit flex-1">
            <div className="board-box glass grid place-items-center !rounded-[24px] p-1">{board}</div>
          </div>

          <div className="flex shrink-0 gap-2">
            {controls}
            <button className="btn btn-glass relative shrink-0 !min-h-[44px] !px-3.5" onClick={() => setChatOpen(true)} aria-label="聊天">
              <IconChat width={20} height={20} />
              {unread && <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-accent" />}
            </button>
          </div>
        </div>
        {chatOpen && <ChatSheet chat={record.chat} onClose={() => setChatOpen(false)} input={sayInput(true)} />}
      </>
    );
  }

  return (
    <>
      {toast.node}
      <Header status={liveChip} />
      <div className="game-grid">
        <motion.div {...card} className="area-pill">
          <Pill title={record.aiName} subtitle={pillSubtitle} />
        </motion.div>

        <motion.section {...card} className="glass area-hero flex items-center justify-between gap-4 px-7 py-7">
          <div className="min-w-0">
            <div className="text-[1.5rem] text-ink-2">
              {BRAND.en} · {record.size}路
            </div>
            <div className="mt-1 text-[4.2rem] font-bold leading-[1.02] tracking-tight">{phase === "finished" ? result?.text : `Move ${moves}`}</div>
            <div className="mt-3 text-[1.1rem] text-muted">
              {record.humanName} 执{colorZh(human)} · {record.aiName} 执{colorZh(ai)} · 贴 {record.komi}
            </div>
            <div className="mt-1 text-[1.05rem] text-ink">{status}</div>
          </div>
          {phase !== "finished" && (
            <div className="h-14 w-14 shrink-0 rounded-full border border-black/20 shadow-md" style={{ background: stoneBg(state.toPlay) }} title={`轮到${colorZh(state.toPlay)}`} />
          )}
        </motion.section>

        <motion.section {...card} className="glass area-board p-4">
          {board}
        </motion.section>

        <motion.section {...card} className="area-controls flex flex-wrap gap-3">
          {controls}
        </motion.section>

        <motion.section {...card} className="glass area-stats px-7 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[1.9rem] font-bold leading-tight">{score ? "Count" : "Drops"}</div>
              <div className="text-[1.15rem] text-muted">
                {score
                  ? `黑 ${score.black} · 白 ${score.white}`
                  : `黑 ${chains.filter((s) => s.color === 1).length} 滴 · 白 ${chains.filter((s) => s.color === 2).length} 滴`}
              </div>
            </div>
            <Ring value={inAtari} fraction={chains.length ? inAtari / chains.length : 0} size={84} />
          </div>
          <div className="divider my-5" />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="黑提子" sub="black" value={state.captures[1]} />
            <Stat label="白提子" sub="white" value={state.captures[2]} />
            <Stat label="最大一滴" sub="largest" value={longest} />
          </div>
          <div className="mt-4 text-sm text-faint">圆环里是正被叫吃的水珠，它们会轻轻发颤。</div>
        </motion.section>

        <motion.section {...card} className="glass area-chat px-6 py-5">
          <div className="text-[1.3rem] font-semibold">Whisper</div>
          <ChatList chat={record.chat} className="mt-3 max-h-56" />
          <div className="mt-3 flex">{sayInput(false)}</div>
        </motion.section>
      </div>
    </>
  );
}
