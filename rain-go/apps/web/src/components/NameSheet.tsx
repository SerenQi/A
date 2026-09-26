import { MAX_NAME_LENGTH } from "@rain-go/engine";
import { useState } from "react";
import { prefs } from "../api";
import { IconSwap } from "./icons";

/** Recent names as tappable chips; tapping fills the active field. */
export function NameChips({ exclude, onPick }: { exclude: string[]; onPick: (n: string) => void }) {
  const [names, setNames] = useState(() => prefs.recentNames());
  const shown = names.filter((n) => !exclude.includes(n));
  if (!shown.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((n) => (
        <span key={n} className="inline-flex items-center overflow-hidden rounded-full border border-white/80 bg-white/45 text-sm">
          <button type="button" className="py-1 pr-1 pl-3" onClick={() => onPick(n)}>
            {n}
          </button>
          <button
            type="button"
            className="px-2 py-1 text-faint"
            aria-label={`忘掉 ${n}`}
            onClick={() => {
              prefs.forgetName(n);
              setNames(prefs.recentNames());
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export function NameSheet({
  humanName,
  aiName,
  humanSeat,
  aiSeat,
  onSave,
  onClose,
}: {
  humanName: string;
  aiName: string;
  humanSeat: string;
  aiSeat: string;
  onSave: (human: string, ai: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [human, setHuman] = useState(humanName);
  const [ai, setAi] = useState(aiName);
  const [active, setActive] = useState<"human" | "ai">("human");
  const [busy, setBusy] = useState(false);
  const valid = human.trim() && ai.trim();

  const field = (who: "human" | "ai") => (
    <label className="block">
      <span className="text-sm text-muted">
        {who === "human" ? `你 · ${humanSeat}` : `AI · ${aiSeat}`}
      </span>
      <input
        className={`field mt-1 !min-h-[44px] ${active === who ? "!border-black/35" : ""}`}
        value={who === "human" ? human : ai}
        maxLength={MAX_NAME_LENGTH}
        onFocus={() => setActive(who)}
        onChange={(e) => (who === "human" ? setHuman : setAi)(e.target.value)}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/25 p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:items-center lg:justify-center" onClick={onClose}>
      <form
        className="glass sheet-enter w-full max-w-[480px] !bg-white/75 p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid || busy) return;
          setBusy(true);
          const ok = await onSave(human.trim(), ai.trim());
          setBusy(false);
          if (ok) {
            prefs.rememberNames(human, ai);
            prefs.setLastNames(human, ai);
            onClose();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[1.3rem] font-semibold">Names</div>
          <button type="button" className="text-muted" onClick={onClose}>
            取消
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {field("human")}
          <div className="flex justify-center">
            <button
              type="button"
              className="btn btn-glass !min-h-[34px] gap-1.5 !px-3.5 text-sm"
              onClick={() => {
                setHuman(ai);
                setAi(human);
              }}
            >
              <IconSwap width={16} height={16} /> 互换名字
            </button>
          </div>
          {field("ai")}
        </div>
        <div className="mt-3">
          <div className="mb-1.5 text-sm text-faint">常用名字 · 点一下填入{active === "human" ? "你" : "AI"}的名字</div>
          <NameChips exclude={[human.trim(), ai.trim()]} onPick={(n) => (active === "human" ? setHuman(n) : setAi(n))} />
        </div>
        <button className="btn btn-ink mt-4 w-full !min-h-[44px]" disabled={!valid || busy}>
          保存
        </button>
      </form>
    </div>
  );
}
