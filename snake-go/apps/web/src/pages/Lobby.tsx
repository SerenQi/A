import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, prefs, type GameMeta } from "../api";
import { Pill, Ring } from "../components/Pill";
import { Header, hhmm } from "../components/Shell";
import { notifyPrefs } from "../components/Settings";
import { useToast } from "../components/Toast";
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
      <div className="space-y-5">
        <motion.div {...card}>
          <Pill title="Serpent Go" subtitle="蛇弈 · 连接 MCP，让 AI 和你下棋 ›" onClick={() => navigate("/connect")} />
        </motion.div>

        {needToken && (
          <motion.section {...card} className="glass px-7 py-6">
            <div className="text-[1.5rem] font-semibold">访问口令</div>
            <p className="mt-1 text-muted">这个站点设了口令。填一次，这台设备会记住。</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                prefs.setToken(tokenDraft);
                notifyPrefs();
              }}
            >
              <input className="field" type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="ACCESS_TOKEN" />
              <button className="btn btn-ink">进入</button>
            </form>
          </motion.section>
        )}

        <motion.section {...card} className="glass px-7 py-7">
          <div className="text-[1.5rem] text-ink-2">New game</div>
          <div className="mt-1 text-[3.6rem] font-bold leading-none tracking-tight">开一局</div>
          <div className="mt-6 space-y-4">
            <div className="seg" role="group" aria-label="棋盘大小">
              {[9, 13, 19].map((s) => (
                <button key={s} aria-pressed={size === s} onClick={() => setSize(s)}>
                  {s} 路
                </button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="执子">
              <button aria-pressed={color === "black"} onClick={() => setColor("black")}>
                我执黑 · 先手
              </button>
              <button aria-pressed={color === "white"} onClick={() => setColor("white")}>
                我执白
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" value={humanName} onChange={(e) => setHumanName(e.target.value)} placeholder="你的名字" maxLength={40} />
              <input className="field" value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="AI 的名字" maxLength={40} />
            </div>
            <button className="btn btn-ink w-full" disabled={busy || needToken} onClick={create}>
              开局
            </button>
            <p className="text-sm text-faint">也可以直接让 AI 调用 go_new_game 开局，它会把棋盘链接发给你。</p>
          </div>
        </motion.section>

        {active.length > 0 && (
          <motion.section {...card} className="glass px-7 py-6">
            <div className="text-[1.9rem] font-bold">In play</div>
            <div className="text-muted">进行中的对局</div>
            <div className="divider my-4" />
            <div className="space-y-2">
              {active.map((g) => (
                <GameRow key={g.id} g={g} />
              ))}
            </div>
          </motion.section>
        )}

        {done.length > 0 && (
          <motion.section {...card} className="glass px-7 py-6">
            <div className="text-[1.9rem] font-bold">Archive</div>
            <div className="text-muted">下完的棋</div>
            <div className="divider my-4" />
            <div className="space-y-2">
              {done.slice(0, 12).map((g) => (
                <GameRow key={g.id} g={g} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </>
  );
}

function GameRow({ g }: { g: GameMeta }) {
  const mine = g.phase !== "finished" && g.waitingOn.includes("human");
  return (
    <button onClick={() => navigate(`/g/${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2 text-left transition hover:bg-white/30">
      <div className="stat-bar min-w-0">
        <div className="truncate text-[1.2rem]">
          {g.humanName} × {g.aiName}
        </div>
        <div className="text-sm text-faint">
          {g.size} 路 · {new Date(g.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {hhmm(g.updatedAt)}
        </div>
        <div className={`text-[1rem] ${mine ? "font-semibold text-ink" : "text-muted"}`}>{statusOf(g)}</div>
      </div>
      <Ring value={g.moves} fraction={g.moves / (g.size * g.size)} size={64} />
    </button>
  );
}
