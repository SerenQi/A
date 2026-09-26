import { actorColor, type Action, type IllegalReason } from "@snake-go/engine";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, prefs } from "../api";
import { Board } from "../components/Board";
import { IconSend } from "../components/icons";
import { Pill, Ring, Stat } from "../components/Pill";
import { Header, hhmm } from "../components/Shell";
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

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export function Game({ id }: { id: string }) {
  const { record, setRecord, derived, error, live, syncedAt } = useGame(id);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const chatBox = useRef<HTMLDivElement>(null);

  useEffect(() => prefs.setLastGame(id), [id]);
  useEffect(() => {
    const el = chatBox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [record?.chat.length]);

  const dead = useMemo(() => new Set(record?.dead ?? []), [record?.dead]);

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

  if (error) {
    return (
      <>
        <Header status="offline" />
        <div className="glass p-8 text-center">
          <div className="text-2xl">{error}</div>
          <button className="btn btn-ink mt-6" onClick={() => navigate("/")}>
            回大厅
          </button>
        </div>
      </>
    );
  }
  if (!record || !derived) {
    return (
      <>
        <Header status="sync · …" />
        <div className="glass grid h-64 place-items-center text-muted">Loading…</div>
      </>
    );
  }

  const { state, phase, snakes, waiting, result, score } = derived;
  const human = record.humanColor;
  const ai = actorColor(record, "ai");
  const moves = record.moves.filter((m) => m.k === "play" || m.k === "pass").length;
  const myTurn = phase === "playing" && waiting.includes("human");
  const lastAiSay = [...record.chat].reverse().find((m) => m.from === "ai");
  const iAccepted = record.accepted.includes(human);

  const status =
    phase === "finished"
      ? `终局 · ${result?.text ?? ""}`
      : phase === "scoring"
        ? waiting.includes("ai")
          ? `${record.aiName} 正在确认死活…`
          : "等你确认结果"
        : myTurn
          ? "轮到你了"
          : `${record.aiName} 思考中…`;

  const longest = snakes.reduce((m, s) => Math.max(m, s.stones.length), 0);

  return (
    <>
      {toast.node}
      <Header
        status={
          <>
            <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-ink" : "bg-faint"}`} />
            {live ? `live · ${hhmm(syncedAt ?? Date.now())}` : "offline"}
          </>
        }
      />
      <div className="game-grid">
        <motion.div {...card} className="area-pill">
          <Pill
            title={record.aiName}
            subtitle={
              <>
                {!myTurn && phase === "playing" && <span className="pulse-dot mr-1">●</span>}
                {lastAiSay ? `“${lastAiSay.text}”` : status}
              </>
            }
          />
        </motion.div>

        <motion.section {...card} className="glass area-hero flex items-center justify-between gap-4 px-7 py-7">
          <div className="min-w-0">
            <div className="text-[1.5rem] text-ink-2">
              Serpent Go · {record.size}路
            </div>
            <div className="mt-1 text-[4.2rem] font-bold leading-[1.02] tracking-tight">
              {phase === "finished" ? result?.text : `Move ${moves}`}
            </div>
            <div className="mt-3 text-[1.1rem] text-muted">
              {record.humanName} 执{colorZh(human)} · {record.aiName} 执{colorZh(ai)} · 贴 {record.komi}
            </div>
            <div className="mt-1 text-[1.05rem] text-ink">{status}</div>
          </div>
          {phase !== "finished" && (
            <div
              className="h-14 w-14 shrink-0 rounded-full border border-black/20 shadow-md"
              style={{ background: state.toPlay === 1 ? "radial-gradient(circle at 35% 30%, #3a3a3a, #050505)" : "radial-gradient(circle at 35% 30%, #fff, #d4d4cf)" }}
              title={`轮到${colorZh(state.toPlay)}`}
            />
          )}
        </motion.section>

        <motion.section {...card} className="glass area-board p-2 sm:p-4">
          <Board
            size={record.size}
            state={state}
            snakes={snakes}
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
        </motion.section>

        <motion.section {...card} className="area-controls flex flex-wrap gap-3">
          {phase === "playing" && (
            <>
              <button className="btn btn-glass flex-1" disabled={!myTurn || busy} onClick={() => void send({ type: "pass" })}>
                停一手
              </button>
              <button
                className="btn btn-glass flex-1"
                disabled={busy}
                onClick={() => confirm("确定认输吗？") && void send({ type: "resign" })}
              >
                认输
              </button>
            </>
          )}
          {phase === "scoring" && (
            <>
              <p className="w-full px-2 text-muted">双方都停了一手。点一条蛇可以标记它死了，两边都接受就数子。</p>
              <button className="btn btn-ink flex-1" disabled={busy || iAccepted} onClick={() => void send({ type: "accept" })}>
                {iAccepted ? "已接受，等对方" : "接受结果"}
              </button>
              <button className="btn btn-glass flex-1" disabled={busy} onClick={() => void send({ type: "resume" })}>
                继续下棋
              </button>
            </>
          )}
          {phase === "finished" && (
            <button className="btn btn-ink flex-1" onClick={() => navigate("/")}>
              再来一局
            </button>
          )}
        </motion.section>

        <motion.section {...card} className="glass area-stats px-7 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[1.9rem] font-bold leading-tight">{score ? "Count" : "Snakes"}</div>
              <div className="text-[1.15rem] text-muted">
                {score
                  ? `黑 ${score.black} · 白 ${score.white}`
                  : `黑 ${snakes.filter((s) => s.color === 1).length} 条 · 白 ${snakes.filter((s) => s.color === 2).length} 条`}
              </div>
            </div>
            <Ring value={snakes.filter((s) => s.liberties.length === 1).length} fraction={snakes.length ? snakes.filter((s) => s.liberties.length === 1).length / snakes.length : 0} size={84} />
          </div>
          <div className="divider my-5" />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="黑提子" sub="black" value={state.captures[1]} />
            <Stat label="白提子" sub="white" value={state.captures[2]} />
            <Stat label="最长的蛇" sub="longest" value={longest} />
          </div>
          <div className="mt-4 text-sm text-faint">圆环里是正被叫吃的蛇，它们会发抖。</div>
        </motion.section>

        <motion.section {...card} className="glass area-chat px-6 py-5">
          <div className="text-[1.3rem] font-semibold">Whisper</div>
          <div ref={chatBox} className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {record.chat.length === 0 && <div className="text-muted">还没有悄悄话。</div>}
            {record.chat.map((m, i) => (
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
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (draft.trim() && (await send({ type: "say", text: draft }))) setDraft("");
            }}
          >
            <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={280} placeholder={`对 ${record.aiName} 说…`} />
            <button className="btn btn-ink !px-4" aria-label="发送" disabled={!draft.trim() || busy}>
              <IconSend />
            </button>
          </form>
        </motion.section>
      </div>
    </>
  );
}
