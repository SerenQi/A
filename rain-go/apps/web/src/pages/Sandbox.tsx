import { applyMatchAction, createMatch, describeMatch, isGameKind, statusOf, viewMatch, type Actor, type GameKind, type Match } from "@rain-go/engine";
import { useMemo, useState } from "react";
import { Sheet } from "../components/Chat";
import { MatchScreen } from "../components/MatchScreen";
import { Header } from "../components/Shell";

const fresh = (kind: GameKind, humanFirst: boolean) =>
  createMatch({ id: "sandbox", kind, humanFirst, humanName: "Seren", aiName: "Claude", seed: (Math.random() * 2 ** 32) >>> 0, now: Date.now() });

/**
 * Local, offline table for trying a game: both sides are played on this screen.
 * "自动" plays whichever side the game is waiting on. The AI view shows exactly
 * the text the AI would receive over MCP.
 */
export function Sandbox({ kind }: { kind: string }) {
  const [humanFirst, setHumanFirst] = useState(true);
  const [match, setMatch] = useState<Match | null>(() => (isGameKind(kind) ? safeCreate(kind, true) : null));
  const [mode, setMode] = useState<"auto" | Actor>("auto");
  const [aiText, setAiText] = useState(false);
  const status = useMemo(() => (match ? statusOf(match) : null), [match]);

  if (!match || !status || !isGameKind(kind)) {
    return (
      <>
        <Header status="sandbox" />
        <div className="glass p-8 text-center text-muted">没有这个游戏，或者它还没做好：{kind}</div>
      </>
    );
  }
  const me: Actor = mode === "auto" ? (status.waitingOn[0] ?? "human") : mode;
  const cycle = () => setMode((m) => (m === "auto" ? "human" : m === "human" ? "ai" : "auto"));

  return (
    <MatchScreen
      key={`${match.createdAt}-${me}`}
      match={viewMatch(match, me)}
      me={me}
      chip={
        <button onClick={cycle} className="whitespace-nowrap">
          扮演 · {mode === "auto" ? `自动(${me === "human" ? "你" : "AI"})` : me === "human" ? "你" : "AI"}
        </button>
      }
      perform={async (action) => {
        const res = applyMatchAction(match, me, action, Date.now());
        if (!res.ok) throw new Error(res.message);
        setMatch(res.match);
      }}
      extra={
        <>
          <div className="flex shrink-0 gap-2 text-sm">
            <button className="btn btn-glass flex-1 !min-h-[36px]" onClick={() => setAiText(true)}>
              AI 视角
            </button>
            <button
              className="btn btn-glass flex-1 !min-h-[36px]"
              onClick={() => {
                setHumanFirst(!humanFirst);
                setMatch(safeCreate(kind, !humanFirst));
              }}
            >
              换先手
            </button>
            <button className="btn btn-glass flex-1 !min-h-[36px]" onClick={() => setMatch(safeCreate(kind, humanFirst))}>
              重开
            </button>
          </div>
          {aiText && (
            <Sheet title="AI 收到的文字" onClose={() => setAiText(false)}>
              <pre className="mt-3 min-h-0 flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">{describeMatch(match)}</pre>
            </Sheet>
          )}
        </>
      }
    />
  );
}

function safeCreate(kind: GameKind, humanFirst: boolean): Match | null {
  try {
    return fresh(kind, humanFirst);
  } catch {
    return null;
  }
}
