# Serpent Go · 蛇弈

一个可以连接到 AI 的 MCP 服务器，让人和 AI 在同一张棋盘上下围棋。
棋盘上横竖相连的同色棋子会画成一条蛇：最新落下的那颗是蛇头，身体往尾巴渐细，被叫吃的蛇会发抖，被提掉的蛇会慢慢消失。

## 结构

| 目录 | 内容 |
|---|---|
| `packages/engine` | 纯 TypeScript 规则引擎：提子、禁自杀、全局同形禁止（打劫）、中国规则数子、蛇的结构、给 AI 看的文字棋盘 |
| `apps/worker` | Cloudflare Worker：Hono 路由、MCP 服务器（Streamable HTTP，无状态）、每局一个 Durable Object、对局列表 Durable Object |
| `apps/web` | React + Vite + Tailwind v4 + Motion 前端，SVG 画蛇，WebSocket 实时同步 |

AI 通过 MCP 工具下棋，人在网页上下棋，两边通过同一个 Durable Object 同步。
AI 调用 `go_wait_for_opponent` 会挂起，直到人落子。

## MCP 工具

| 工具 | 作用 |
|---|---|
| `go_new_game` | 开新局，返回棋盘链接 |
| `go_list_games` | 列出对局 |
| `go_get_board` | 当前盘面、轮到谁、危险的蛇、最近的悄悄话 |
| `go_play` | 落子（`D4`）或 `pass`，可附带一句话 |
| `go_wait_for_opponent` | 等人落子，最长约 50 秒，超时就再调一次 |
| `go_scoring` | 数子阶段：`toggle_dead`、`accept`、`resume` |
| `go_resign` | 认输 |
| `go_say` | 给人发一句话 |

不传 `game_id` 时，默认用最近活跃的未结束对局。

## 本地开发

```bash
pnpm install
echo 'ACCESS_TOKEN=devtoken' > apps/worker/.dev.vars
pnpm dev                              # 构建前端并在 http://127.0.0.1:8787 启动 Worker
pnpm --filter @snake-go/worker smoke  # 另开终端：端到端跑一遍 MCP 对局流程
pnpm --filter @snake-go/worker seed   # 造一局有长蛇和提子的演示棋
pnpm test                             # 规则引擎单元测试
pnpm typecheck
```

改前端时可以用 `pnpm dev:web`，Vite 会把 `/api` 和 `/mcp` 代理到 8787 端口。

## 部署到 Cloudflare

```bash
npx wrangler login
cd apps/worker && npx wrangler secret put ACCESS_TOKEN   # 设一个足够长的随机口令
cd ../.. && pnpm deploy
```

部署完会得到一个 `*.workers.dev` 地址。
要用自己的域名，比如 `go.ombre-lunare.top`，在 Cloudflare 面板里给这个 Worker 添加自定义域名即可，也可以在 `apps/worker/wrangler.jsonc` 里加 `routes`。

## 连接到 AI

连接器地址是 `https://<你的域名>/mcp/<ACCESS_TOKEN>`，网页的「连接」页会自动生成并提供复制。

- **Claude 网页或 App**：设置 → 连接器 → 添加自定义连接器，粘贴上面的地址。
- **Claude Code**：`claude mcp add --transport http snake-go https://<你的域名>/mcp/<ACCESS_TOKEN>`

然后对 AI 说「我们来下一盘围棋吧」。

## 权限说明

- MCP 端点、创建对局、查看对局列表、以人类身份落子，都需要 `ACCESS_TOKEN`。
  口令可以放在路径里、`?token=` 参数里，或 `Authorization: Bearer` 头里。
- 知道对局链接的人可以只读观战，链接里的对局 id 是 12 位随机串。
- 没有设置 `ACCESS_TOKEN` 时所有接口都是开放的，只适合本地开发。

## 规则

中国规则数子，默认贴 7.5 目，禁止自杀，禁止全局同形。
双方连续停一手后进入数子阶段：点蛇标记死活，双方都接受后出结果，任何一方也可以选择继续下。
