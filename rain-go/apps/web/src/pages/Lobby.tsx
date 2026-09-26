import { GAMES, cleanOptions, readyGames, type GameKind } from "@rain-go/engine";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, prefs, type GameMeta } from "../api";
import { BRAND } from "../brand";
import { IconSwap } from "../components/icons";
import { Pill, Ring } from "../components/Pill";
import { Header, hhmm } from "../components/Shell";
import { notifyPrefs } from "../components/Settings";
import { useToast } from "../components/Toast";
import { navigate } from "../router";

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };
const KIND_KEY = "rain-go:kind";

export const GLYPH: Record<GameKind, string> = {
  go: "围",
  gomoku: "五",
  reversi: "翻",
  chess: "♞",
  xiangqi: "帥",
  poker: "♠",
  paodekuai: "跑",
  monopoly: "⚄",
  aeroplane: "✈",
};

/** Symbol glyphs render smaller than CJK characters at the same size. */
const SYMBOL = new Set<GameKind>(["chess", "poker", "monopoly", "aeroplane"]);

function statusOf(g: GameMeta) {
  if (g.over) return g.result ?? "已结束";
  return g.waitingOn.includes("human") ? "轮到你" : `等 ${g.aiName}`;
}

function readKind(): GameKind {
  try {
    const k = localStorage.getItem(KIND_KEY) as GameKind | null;
    if (k && GAMES[k]?.ready) return k;
  } catch {
    // Storage unavailable.
  }
  return "go";
}

export function Lobby() {
  const toast = useToast();
  const [needToken, setNeedToken] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [games, setGames] = useState<GameMeta[] | null>(null);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [kind, setKindRaw] = useState<GameKind>(readKind);
  const [options, setOptions] = useState<Record<string, string>>(() => cleanOptions(readKind()));
  const [humanFirst, setHumanFirst] = useState(true);
  const [humanName, setHumanName] = useState(() => prefs.lastNames().human);
  const [aiName, setAiName] = useState(() => prefs.lastNames().ai);
  const [busy, setBusy] = useState(false);
  const mod = GAMES[kind];

  const setKind = (k: GameKind) => {
    setKindRaw(k);
    setOptions(cleanOptions(k));
    try {
      localStorage.setItem(KIND_KEY, k);
    } catch {
      // Storage unavailable.
    }
  };

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
      const m = await api.createGame({ kind, options, humanFirst, humanName: humanName.trim() || undefined, aiName: aiName.trim() || undefined });
      prefs.rememberNames(humanName, aiName);
      prefs.setLastNames(humanName, aiName);
      navigate(`/g/${m.id}`);
    } catch (e) {
      toast.show(e instanceof ApiError && e.status === 401 ? "需要访问口令" : "开局失败");
    } finally {
      setBusy(false);
    }
  };

  const active = games?.filter((g) => !g.over) ?? [];
  const done = games?.filter((g) => g.over) ?? [];
  const seg = "!min-h-[34px] lg:!min-h-[38px]";

  return (
    <>
      {toast.node}
      <Header status={`sync · ${syncedAt ? hhmm(syncedAt) : "--:--"}`} />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 lg:block lg:space-y-5">
        <motion.div {...card} className="shrink-0 [@media(max-height:700px)]:hidden lg:!block">
          <Pill title={BRAND.en} subtitle={`${BRAND.zh} · ${BRAND.tagline} · 连接 MCP，和 AI 玩 ›`} onClick={() => navigate("/connect")} />
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

        <motion.section {...card} className="glass shrink-0 px-4 py-3.5 lg:px-7 lg:py-7">
          <div className="flex items-baseline justify-between [@media(max-height:620px)]:hidden lg:!flex">
            <div className="shrink-0 whitespace-nowrap text-[1.7rem] font-bold leading-none tracking-tight lg:text-[3rem]">开一局</div>
            <div className="truncate pl-3 text-sm text-muted lg:text-base">{mod.blurb}</div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5 [@media(max-height:620px)]:mt-0 lg:mt-5 lg:gap-2.5">
            {readyGames().map((g) => (
              <button
                key={g.kind}
                onClick={() => setKind(g.kind)}
                aria-pressed={kind === g.kind}
                className={`flex h-[52px] flex-col items-center justify-center rounded-2xl border transition lg:h-[72px] ${
                  kind === g.kind ? "border-transparent bg-ink text-white" : "border-white/80 bg-white/35 text-ink"
                }`}
              >
                <span className={`leading-none ${SYMBOL.has(g.kind) ? "text-[1.55rem] lg:text-[2rem]" : "text-[1.2rem] lg:text-[1.6rem]"}`}>{GLYPH[g.kind]}</span>
                <span className="mt-1 whitespace-nowrap text-[0.7rem] leading-none lg:text-sm">{g.name.zh}</span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 space-y-2 lg:mt-4 lg:space-y-3">
            <div className="flex gap-2">
              {mod.options.slice(0, 1).map((o) => (
                <div key={o.key} className="seg flex-1" role="group" aria-label={o.label}>
                  {o.choices.map((c) => (
                    <button key={c.value} className={seg} aria-pressed={options[o.key] === c.value} onClick={() => setOptions({ ...options, [o.key]: c.value })}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ))}
              <div className="seg flex-1" role="group" aria-label="先手">
                <button className={seg} aria-pressed={humanFirst} onClick={() => setHumanFirst(true)}>
                  我先
                </button>
                <button className={seg} aria-pressed={!humanFirst} onClick={() => setHumanFirst(false)}>
                  AI 先
                </button>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-2.5 lg:gap-3">
              <input className="field !min-h-[42px] pr-6 lg:!min-h-[46px]" value={humanName} onChange={(e) => setHumanName(e.target.value)} placeholder="你的名字" maxLength={40} list="recent-names" />
              <input className="field !min-h-[42px] pl-6 lg:!min-h-[46px]" value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="AI 的名字" maxLength={40} list="recent-names" />
              <button
                type="button"
                aria-label="互换名字"
                className="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-ink text-white shadow"
                onClick={() => {
                  setHumanName(aiName);
                  setAiName(humanName);
                }}
              >
                <IconSwap width={15} height={15} />
              </button>
              <datalist id="recent-names">
                {prefs.recentNames().map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <button className="btn btn-ink w-full !min-h-[44px] lg:!min-h-[46px]" disabled={busy || needToken} onClick={create}>
              开一局{mod.name.zh}
            </button>
          </div>
          <p className="mt-4 hidden text-sm text-faint lg:block">也可以直接让 AI 调用 new_game 开局，它会把链接发给你。</p>
        </motion.section>

        <motion.section {...card} className="glass flex min-h-[100px] flex-1 flex-col px-5 py-3 lg:block lg:px-7 lg:py-6">
          <div className="flex shrink-0 items-baseline justify-between">
            <div className="text-[1.25rem] font-bold lg:text-[1.9rem]">Games</div>
            <div className="text-sm text-muted">
              进行中 {active.length} · 下完 {done.length}
            </div>
          </div>
          <div className="divider my-2 shrink-0 lg:my-4" />
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto lg:space-y-2">
            {games === null && <div className="py-3 text-muted">{needToken ? "填了口令才能看到对局。" : "Loading…"}</div>}
            {games?.length === 0 && <div className="py-3 text-muted">还没有对局。开一局，或者让 AI 开。</div>}
            {[...active, ...done.slice(0, 20)].map((g) => (
              <GameRow key={g.id} g={g} />
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}

function GameRow({ g }: { g: GameMeta }) {
  const mine = !g.over && g.waitingOn.includes("human");
  const mod = GAMES[g.kind];
  return (
    <button onClick={() => navigate(`/g/${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1.5 text-left transition hover:bg-white/30">
      <div className="stat-bar min-w-0">
        <div className="truncate text-[1.05rem] lg:text-[1.2rem]">
          {mod?.name.zh ?? g.kind} · {g.humanName} × {g.aiName}
        </div>
        <div className="text-sm text-faint">
          {new Date(g.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {hhmm(g.updatedAt)}
        </div>
        <div className={`truncate text-[0.95rem] ${mine ? "font-semibold text-ink" : "text-muted"}`}>{statusOf(g)}</div>
      </div>
      <Ring value={GLYPH[g.kind] ?? "·"} fraction={g.over ? 1 : Math.min(1, g.moves / 100)} size={52} />
    </button>
  );
}
