import { useEffect } from "react";
import { api, ApiError, prefs } from "../api";
import { MatchScreen } from "../components/MatchScreen";
import { Header, hhmm } from "../components/Shell";
import { navigate } from "../router";
import { useMatch } from "../useMatch";

export function MatchPage({ id }: { id: string }) {
  const { match, setMatch, error, live, syncedAt } = useMatch(id);
  useEffect(() => prefs.setLastGame(id), [id]);

  if (error || !match) {
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

  return (
    <MatchScreen
      match={match}
      chip={
        <>
          <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-ink" : "bg-faint"}`} />
          {live ? `live · ${hhmm(syncedAt ?? Date.now())}` : "offline"}
        </>
      }
      perform={async (action) => {
        try {
          setMatch(await api.act(id, action));
          if (action.type === "rename") {
            prefs.rememberNames(action.humanName, action.aiName);
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) throw new Error("需要访问口令：点右上角齿轮填写");
          throw e;
        }
      }}
    />
  );
}
