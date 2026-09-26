import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, prefs, type GameMeta } from "../api";
import { Pill, Ring } from "../components/Pill";
import { Header, hhmm } from "../components/Shell";
import { notifyPrefs } from "../components/Settings";
import { useToast } from "../components/Toast";
import { BRAND } from "../brand";
import { navigate } from "../router";

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

function statusOf(g: GameMeta) {
  if (g.phase === "finished") return `终局 ${g.result ?? ""}`;
  if (g.phase === "scoring") return "数子中";
  return g.waitingOn.includes("human") ? "轮到你" : `等 ${g.aiName}`;
}

export function Lobby() {
  const toast = useToast();
  const [needToken, setNeedToken] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [games, setGames] = useState<GameMeta[] | null>(null);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [size, setSize] = useState(9);
  const [color, setColor] = useState<"black" | "white">("black");
  const [humanName, setHumanName] = useState("");
  const [aiName, setAiName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setGames(await api.listGames());
      setSyncedAt(Date.now());
      setNeedToken(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setNeedToken(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 15_000);
    const on = () => void load();
    window.addEventListener("prefschange", on);
    return () => {
      clearInterval(t);
      window.removeEventListener("prefschange", on);
    };
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const r = await api.createGame({ size, humanColor: color, komi: 7.5, humanName: humanName || undefined, aiName: aiName || undefined });
      navigate(`/g/${r.id}`);
    } catch (e) {
      toast.show(e instanceof ApiError && e.status === 401 ? "需要访问口令" : "开局失败");
    } finally {
      setBusy(false);
    }
  };

  const active = games?.filter((g) => g.phase !== "finished") ?? [];
  const done = games?.filter((g) => g.phase === "finished") ?? [];

  return (
    <>
      {toast.node}
      <Header status={`sync · ${syncedAt ? hhmm(syncedAt) : "--:--"}`} />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 lg:block lg:space-y-5">
        <motion.div {...card} className="shrink-0 [@media(max-height:700px)]:hidden lg:!block">
          <Pill title={BRAND.en} subtitle={`${BRAND.zh} · ${BRAND.tagline} · 连接 MCP，和 AI 下棋 ›`} onClick={() => navigate("/connect")} />
        </motion.div>

        {needToken && (
          <motion.section {...card} className="glass shrink-0 px-5 py-4 lg:px-7 lg:py-6">
            <div className="text-[1.2rem] font-semibold lg:text-[1.5rem]">访问口令</div>
            <p className="mt-0.5 text-sm text-muted lg:text-base">这个站点设了口令。填一次，这台设备会记住。</p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                prefs.setToken(tokenDraft);
                notifyPrefs();
              }}
            >
              <input className="field !min-h-[44px]" type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="ACCESS_TOKEN" />
              <button className="btn btn-ink !min-h-[44px]">进入</button>
            </form>
          </motion.section>
        )}

        <motion.section {...card} className="glass shrink-0 px-5 py-4 lg:px-7 lg:py-7 [@media(max-height:700px)]:py-3">
          <div className="flex items-baseline justify-between lg:block">
            <div className="text-[2rem] font-bold leading-none tracking-tight [@media(max-height:700px)]:text-[1.6rem] lg:order-2 lg:mt-1 lg:text-[3.6rem]">开一局</div>
            <div className="text-[1rem] text-ink-2 lg:order-1 lg:text-[1.5rem]">New game</div>
          </div>
          <div className="mt-3 space-y-2.5 lg:mt-6 lg:space-y-4 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:space-y-2">
            <div className="seg" role="group" aria-label="棋盘大小">
              {[9, 13, 19].map((s) => (
                <button key={s} className="!min-h-[34px] lg:!min-h-[38px]" aria-pressed={size === s} onClick={() => setSize(s)}>
                  {s} 路
                </button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="执子">
              <button className="!min-h-[34px] lg:!min-h-[38px]" aria-pressed={color === "black"} onClick={() => setColor("black")}>
                我执黑 · 先手
              </button>
              <button className="!min-h-[34px] lg:!min-h-[38px]" aria-pressed={color === "white"} onClick={() => setColor("white")}>
                我执白
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:gap-3">
              <input className="field !min-h-[42px] lg:!min-h-[46px]" value={humanName} onChange={(e) => setHumanName(e.target.value)} placeholder="你的名字" maxLength={40} />
              <input className="field !min-h-[42px] lg:!min-h-[46px]" value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="AI 的名字" maxLength={40} />
            </div>
            <button className="btn btn-ink w-full !min-h-[44px] lg:!min-h-[46px]" disabled={busy || needToken} onClick={create}>
              开局
            </button>
          </div>
          <p className="mt-4 hidden text-sm text-faint lg:block">也可以直接让 AI 调用 go_new_game 开局，它会把棋盘链接发给你。</p>
        </motion.section>

        <motion.section {...card} className="glass flex min-h-[112px] flex-1 flex-col px-5 py-3.5 lg:block lg:px-7 lg:py-6">
          <div className="flex shrink-0 items-baseline justify-between">
            <div className="text-[1.35rem] font-bold lg:text-[1.9rem]">Games</div>
            <div className="text-sm text-muted">
              进行中 {active.length} · 下完 {done.length}
            </div>
          </div>
          <div className="divider my-2.5 shrink-0 lg:my-4" />
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto lg:space-y-2">
            {games === null && <div className="py-3 text-muted">{needToken ? "填了口令才能看到对局。" : "Loading…"}</div>}
            {games?.length === 0 && <div className="py-3 text-muted">还没有对局。开一局，或者让 AI 开。</div>}
            {active.map((g) => (
              <GameRow key={g.id} g={g} />
            ))}
            {done.slice(0, 20).map((g) => (
              <GameRow key={g.id} g={g} />
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}

function GameRow({ g }: { g: GameMeta }) {
  const mine = g.phase !== "finished" && g.waitingOn.includes("human");
  return (
    <button onClick={() => navigate(`/g/${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1.5 text-left transition hover:bg-white/30">
      <div className="stat-bar min-w-0">
        <div className="truncate text-[1.1rem] lg:text-[1.2rem]">
          {g.humanName} × {g.aiName}
        </div>
        <div className="text-sm text-faint">
          {g.size} 路 · {new Date(g.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {hhmm(g.updatedAt)}
        </div>
        <div className={`text-[0.95rem] ${mine ? "font-semibold text-ink" : "text-muted"}`}>{statusOf(g)}</div>
      </div>
      <Ring value={g.moves} fraction={g.moves / (g.size * g.size)} size={52} />
    </button>
  );
}
