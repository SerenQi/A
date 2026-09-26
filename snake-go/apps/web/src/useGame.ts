import {
  areaScore,
  findSnakes,
  phaseOf,
  replay,
  resultOf,
  waitingOn,
  type GameRecord,
} from "@snake-go/engine";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";

/** Loads a game, keeps it live over a WebSocket, and derives the board state and snakes. */
export function useGame(id: string) {
  const [record, setRecordRaw] = useState<GameRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const setRecord = useCallback((r: GameRecord) => {
    setRecordRaw((prev) => (prev && prev.id === r.id && prev.version > r.version ? prev : r));
    setSyncedAt(Date.now());
  }, []);

  useEffect(() => {
    setRecordRaw(null);
    setError(null);
    let ws: WebSocket | null = null;
    let stopped = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    api.getGame(id).then(setRecord, (e: unknown) => setError(e instanceof ApiError && e.status === 404 ? "找不到这局棋" : "加载失败"));

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/games/${id}/ws`);
      ws.onopen = () => {
        setLive(true);
        retry = 0;
      };
      ws.onmessage = (e) => {
        if (e.data === "pong") return;
        const m = JSON.parse(String(e.data)) as { type: string; record?: GameRecord; message?: string };
        if (m.type === "record" && m.record) setRecord(m.record);
      };
      ws.onclose = () => {
        setLive(false);
        if (!stopped) timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 10_000));
      };
    };
    connect();
    const ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(ping);
      ws?.close();
    };
  }, [id, setRecord]);

  const derived = useMemo(() => {
    if (!record) return null;
    const state = replay(record.size, record.moves);
    const phase = phaseOf(record, state);
    return {
      state,
      phase,
      snakes: findSnakes(state),
      waiting: waitingOn(record, state),
      result: resultOf(record, state),
      score: phase === "scoring" ? areaScore(state.cells, record.size, record.dead, record.komi) : record.finalScore ?? null,
    };
  }, [record]);

  return { record, setRecord, derived, error, live, syncedAt };
}
