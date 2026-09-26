import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { prefs } from "../api";
import { navigate, type Route } from "../router";
import { IconBoard, IconGear, IconHome, IconTerminal } from "./icons";
import { Settings } from "./Settings";

export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export const hhmm = (d: Date | number) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function Backdrop() {
  const [bg, setBg] = useState(prefs.background());
  useEffect(() => {
    const on = () => setBg(prefs.background());
    window.addEventListener("prefschange", on);
    return () => window.removeEventListener("prefschange", on);
  }, []);
  return (
    <div
      className={`backdrop ${bg ? "has-image" : ""}`}
      style={bg ? ({ "--bg-image": `url("${bg.replace(/"/g, "%22")}")` } as CSSProperties) : undefined}
      aria-hidden
    >
      {!bg && (
        <>
          <div className="blob" style={{ width: 260, height: 260, left: "-60px", top: "18%", background: "#8d8d8a" }} />
          <div className="blob" style={{ width: 200, height: 200, right: "-40px", top: "8%", background: "#fbfbf9", animationDelay: "-8s" }} />
          <div className="blob" style={{ width: 320, height: 320, right: "10%", bottom: "-80px", background: "#a3a3a0", animationDelay: "-15s" }} />
        </>
      )}
    </div>
  );
}

export function Header({ status }: { status: ReactNode }) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  return (
    <header className="flex items-center justify-between gap-3 pt-6 pb-4">
      <div className="min-w-0">
        <div className="truncate text-[clamp(1.1rem,5vw,1.4rem)] leading-tight text-muted">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="chip">{status}</span>
        <button className="chip !p-2.5 !text-ink" onClick={() => setOpen(true)} aria-label="设置">
          <IconGear width={22} height={22} />
        </button>
      </div>
      {open && <Settings onClose={() => setOpen(false)} />}
    </header>
  );
}

const NAV = [
  { key: "lobby", label: "大厅", icon: IconHome },
  { key: "game", label: "棋盘", icon: IconBoard },
  { key: "connect", label: "连接", icon: IconTerminal },
] as const;

function BottomNav({ route }: { route: Route }) {
  const go = (key: (typeof NAV)[number]["key"]) => {
    if (key === "lobby") navigate("/");
    else if (key === "connect") navigate("/connect");
    else {
      const last = prefs.lastGame();
      navigate(last ? `/g/${last}` : "/");
    }
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(14px,env(safe-area-inset-bottom))]">
      <div className="glass mx-auto flex max-w-[520px] justify-around !rounded-[34px] px-2 py-2.5">
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = route.name === key;
          return (
            <button key={key} onClick={() => go(key)} className="flex w-20 flex-col items-center gap-1" aria-current={active ? "page" : undefined}>
              <span
                className={`grid h-12 w-12 place-items-center rounded-full transition ${active ? "bg-ink text-white" : "text-faint"}`}
              >
                <Icon width={22} height={22} />
              </span>
              <span className={`text-sm ${active ? "font-semibold text-ink" : "text-faint"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Shell({ route, children, wide = false }: { route: Route; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <Backdrop />
      <main className={`mx-auto px-4 pb-40 ${wide ? "max-w-[1100px]" : "max-w-[520px]"}`}>{children}</main>
      <BottomNav route={route} />
    </>
  );
}
