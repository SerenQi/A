import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api, prefs } from "../api";
import { IconCopy } from "../components/icons";
import { Pill } from "../components/Pill";
import { Header } from "../components/Shell";
import { useToast } from "../components/Toast";

const card = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

const TOOLS: [string, string][] = [
  ["go_new_game", "开新局，返回棋盘链接"],
  ["go_list_games", "列出对局"],
  ["go_get_board", "看当前盘面、谁该下、哪条蛇危险"],
  ["go_play", "落子或停一手，可以顺便说一句话"],
  ["go_wait_for_opponent", "挂起等你落子，最长约 50 秒"],
  ["go_scoring", "数子阶段：标记死蛇、接受、继续下"],
  ["go_resign", "认输"],
  ["go_say", "给你发一句悄悄话"],
];

export function Connect() {
  const toast = useToast();
  const [authRequired, setAuthRequired] = useState(true);
  useEffect(() => {
    api.config().then((c) => setAuthRequired(c.authRequired), () => {});
  }, []);
  const token = prefs.token();
  const url = `${location.origin}/mcp${authRequired ? `/${token || "<ACCESS_TOKEN>"}` : ""}`;
  const copy = (s: string) =>
    navigator.clipboard.writeText(s).then(
      () => toast.show("已复制"),
      () => toast.show("复制失败，请手动选择"),
    );

  return (
    <>
      {toast.node}
      <Header status="MCP" />
      <div className="space-y-5">
        <motion.div {...card}>
          <Pill title="Connect" subtitle="把这张棋盘接到你的 AI" />
        </motion.div>

        <motion.section {...card} className="glass px-7 py-6">
          <div className="text-[1.5rem] text-ink-2">Connector URL</div>
          <div className="mt-3 flex items-center gap-2">
            <code className="field flex items-center overflow-x-auto whitespace-nowrap font-mono text-sm">{url}</code>
            <button className="btn btn-ink !px-4" onClick={() => copy(url)} aria-label="复制链接">
              <IconCopy />
            </button>
          </div>
          {authRequired && <p className="mt-3 text-sm text-faint">链接里带着访问口令，别发给别人。{!token && "先在右上角设置里填口令，这里会自动补全。"}</p>}
        </motion.section>

        <motion.section {...card} className="glass px-7 py-6">
          <div className="text-[1.9rem] font-bold">How to</div>
          <ol className="mt-3 space-y-3 text-[1.05rem]">
            <li className="stat-bar">
              <b>Claude 网页或 App</b>：设置 → 连接器 → 添加自定义连接器，把上面的链接粘进去。
            </li>
            <li className="stat-bar">
              <b>Claude Code</b>：在终端运行下面这行。
              <code
                className="mt-2 block cursor-pointer overflow-x-auto whitespace-nowrap rounded-xl bg-black/80 px-3 py-2 font-mono text-sm text-white"
                onClick={() => copy(`claude mcp add --transport http snake-go ${url}`)}
              >
                claude mcp add --transport http snake-go {url}
              </code>
            </li>
            <li className="stat-bar">然后对 AI 说：「我们来下一盘围棋吧」。它会开局，把棋盘链接发给你。</li>
          </ol>
        </motion.section>

        <motion.section {...card} className="glass px-7 py-6">
          <div className="text-[1.9rem] font-bold">Tools</div>
          <div className="divider my-4" />
          <div className="space-y-3">
            {TOOLS.map(([name, desc]) => (
              <div key={name} className="stat-bar">
                <div className="font-mono text-sm">{name}</div>
                <div className="text-muted">{desc}</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}
