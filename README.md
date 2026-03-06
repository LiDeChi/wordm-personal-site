# wordm.us Personal Site (Vite + React)

基于你提供的学术极简版式实现的个人网站，包含：

- 根域 `wordm.us`：个人博客 + 作品集
- 子域 `resume.wordm.us`：独立简历页（含 PDF 下载，仅管理员/测试账号可访问）
- 账号系统：Supabase 邮箱登录/注册/退出（`wordm.us` 与全部子域共用一套会话）
- `center-control` 项目展示（来源：`/Users/lidechi/Documents/Github/center-control/data/exports/projects.json`）
- `debug` 模式控制展示项目
- 项目子域名展示（`p-*.wordm.us`）
- 根域支持 `Blog / Portfolio` 一键切换：博客为双栏阅读模式（左目录、中间连续文章 + 底部下一篇按钮，注释列暂时隐藏）

## 本地开发

```bash
npm install
npm run sync:projects
npm run dev
```

默认地址：`http://localhost:5173`

### Supabase 账号系统配置

在 `.env` 中配置（可直接复制 `.env.example`）：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_ADMIN_EMAILS=admin1@example.com,admin2@example.com
VITE_AUTH_TEST_EMAILS=test1@example.com,test2@example.com
VITE_UNLOCK_PRODUCT_SINGLE=prod_xxx
VITE_UNLOCK_PRODUCT_ALL_CURRENT=prod_yyy
VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR=prod_zzz
VITE_SELFHOST_INSTALL_URL=https://github.com/LiDeChi/center-control#付费用户一键安装deploy-ticket
VITE_SELFHOST_INSTALL_SCRIPT_URL=https://raw.githubusercontent.com/LiDeChi/center-control/main/scripts/install-center-control.sh
```

- 推荐使用你提到的同一套 Supabase 项目（`latti-wordm`）来保证账号一致。
- 三个 `VITE_UNLOCK_PRODUCT_*` 对应作品集三种付费解锁模式，前端会调用 Supabase Edge Function `creem-checkout` 拉起支付。
- `VITE_SELFHOST_INSTALL_URL` 用于支付成功后的“自部署安装”入口，默认指向 `center-control` 安装说明。
- `VITE_SELFHOST_INSTALL_SCRIPT_URL` 用于部署页生成一键部署命令，默认指向 `center-control` 官方安装脚本。
- 若不配置，会使用 `latti` 当前公开计划商品作为默认值（Basic 月付 / Pro 月付 / Pro 年付）。
- 站点会将 Supabase 会话同步到 `.wordm.us` 域级 cookie，因此 `wordm.us`、`resume.wordm.us`、`p-*.wordm.us` 会共享登录态。
- 账号角色共四类：`admin`（管理员）、`tester`（测试账号）、`user`（普通账号）、`guest`（游客）。
- 角色判定顺序：Supabase 用户 metadata 的 `role` 字段 > `public/auth-role-rules.json` 邮箱名单（与环境变量合并）> 默认 `user`。
- 简历页权限：仅 `admin` / `tester` 可访问，`user` / `guest` 会显示受限提示页。
- 项目解锁权限：`admin` / `tester` 自动拥有全部作品访问权限；`user` 需按解锁规则获取访问；`guest` 需先登录。

### 作品解锁规则（Portfolio Monetization MVP）

- 单作品解锁：仅解锁一个指定项目。
- 当前全部作品解锁：按购买时的作品清单解锁当下所有项目。
- 当前作品 + 一年内新作品：购买时清单全部可访问，且购买后一年内新增项目也可访问。
- 付费权限校验与 `latti-wordm` 保持一致：读取 `public.entitlements`（`plan/plan_id/expires_at`）。
  - `single` / `all_current` / `all_current_plus_year` 均需要有效付费权益（`SUBSCRIPTION/basic/pro/lifetime`）。
- 免费解锁额度（一次性总池）：
  - 注册 7 天内：总额度 `N=2`
  - 注册 7~30 天：总额度 `N=1`
  - 注册超过 30 天：总额度 `N=0`
- 免费额度在首次使用时固化，后续按已用/剩余额度扣减。
- 当前实现为 `Supabase 优先 + 本地回退`：
  - 优先通过 Supabase RPC 读写解锁状态（服务端约束）。
  - 当 RPC 不可用时，仅 `free_pick` 回退到本地账本（`localStorage`，按用户 ID 分桶）。
  - 付费解锁（`single/all_current/all_current_plus_year`）必须走 Supabase 校验，不会本地降级绕过。
- 付费交互：
  - 若点击解锁触发 `PAYMENT_REQUIRED`，前端会自动拉起 `creem-checkout`。
  - 支付成功后自动跳转到 `?view=deploy` 部署页（默认“当前机器”）。
  - 部署页支持“当前机器 / 远程服务器”两种目标，复制命令前会向 Supabase 申请一次性 deploy ticket。
  - 部署页仍保留安装指南入口；你也可返回作品集再次点击解锁完成授权同步。
- 免登录分享：
  - 管理员/测试账号可在 `?debug=1` 面板里生成带到期时间的分享链接。
  - 分享链接可按条目控制：作品集、博客、部署页、简历页、全部项目子域或当前勾选项目。
  - 对方无需注册登录，直接通过 `?share=...` 访问；到期或撤销后自动失效。

### 初始化 Supabase 解锁表与函数

在 Supabase SQL Editor 执行：

```sql
-- file: scripts/supabase-unlock-schema.sql
```

该脚本会创建：

- `public.project_unlock_profiles`
- `public.project_unlock_grants`
- `public.wordm_unlock_plan_tier(uuid)` RPC
- `public.wordm_get_unlock_state()` RPC
- `public.wordm_apply_unlock_grant(...)` RPC

另外，分享链接功能依赖：

- `supabase/migrations/20260306120000_wordm_share_links.sql`
- `supabase/functions/create-share-link`
- `supabase/functions/resolve-share-link`
- `supabase/functions/revoke-share-link`
- 其中 `resolve-share-link` 需要以 `--no-verify-jwt` 部署，供游客免登录访问
- 若希望分享链接直接进入部署页，`create-deploy-ticket` 也要以 `--no-verify-jwt` 部署

### 部署票据（Deploy Ticket）配置

为“支付后安装 center-control”链路，还需要在 Supabase 部署两个函数：

- `create-deploy-ticket`
- `resolve-deploy-ticket`

并确保已应用 migration：

- `supabase/migrations/20260301110000_wordm_deploy_tickets.sql`

建议的函数 secrets（按你的项目实际值替换）：

```bash
npx supabase secrets set \
  CENTER_CONTROL_INSTALL_SCRIPT_URL=https://raw.githubusercontent.com/LiDeChi/center-control/main/scripts/install-center-control.sh \
  CENTER_CONTROL_REPO_URL=https://github.com/LiDeChi/center-control.git \
  CENTER_CONTROL_GIT_REF=main \
  CENTER_CONTROL_DEFAULT_GITHUB_ROOT=~/Documents/Github \
  CENTER_CONTROL_DEFAULT_OWNER_LOGIN=LiDeChi \
  CENTER_CONTROL_DEFAULT_REPORT_TIME=09:00 \
  CENTER_CONTROL_DEFAULT_TIMEZONE=America/New_York \
  CENTER_CONTROL_DEFAULT_WEB_PORT=3000
```

### 快速管理管理员/测试邮箱

优先推荐直接维护文件：`public/auth-role-rules.json`

```json
{
  "adminEmails": ["admin@example.com"],
  "testerEmails": ["qa@example.com"]
}
```

也可以用命令行快速增删改（会自动去重并排序）：

```bash
npm run roles -- list
npm run roles -- add admin admin1@example.com admin2@example.com
npm run roles -- add tester qa1@example.com
npm run roles -- remove tester qa1@example.com
npm run roles -- set admin admin@example.com,owner@example.com
npm run roles -- clear tester
```

修改后重新部署：

```bash
npm run deploy:pages
```

### Debug 模式

通过 URL 开启：

```text
http://localhost:5173/?debug=1
https://wordm.us/?debug=1
```

可用参数：

- `debug=1`：开启可视化控制面板
- `show=slug1,slug2`：指定展示项目
- `centerApi=https://.../api/portfolio/projects.json`：切换为 center-control 实时 API 数据
- `subdomain=p-xxx`：本地模拟子域名视图
- `page=resume`：本地模拟简历子域名视图
- `view=blog`：切到博客视图（默认是 portfolio）

## 数据同步

项目快照文件：`src/data/projects.snapshot.json`

同步命令（从 center-control 导入并自动生成子域名）：

```bash
npm run sync:projects
```

脚本：`scripts/sync-center-control.mjs`

## Cloudflare Pages 部署

1. 登录 Cloudflare：

```bash
npx wrangler whoami
```

2. 构建并发布到 Pages 项目 `wordm-personal-home`：

```bash
npm run deploy:pages
```

`deploy:pages` 现在默认走 `scripts/deploy-pages.sh`，会在发布前自动检查 Supabase 配置：

- 优先使用当前 shell 里的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
- 未设置时按顺序尝试读取：
  - `my-blog/.env.local`
  - `my-blog/.env`
  - `../gridnote/.env.local`
- 若仍缺失会直接中止部署（防止发布出“未配置 Supabase”的线上包）
- Pages 项目名优先读取 `CF_PAGES_PROJECT`，默认值是 `wordm-personal-home`

3. 部署子域名 Worker（自动绑定简历子域名 + 项目子域名）：

```bash
npm run deploy:subdomains
```

脚本：`scripts/deploy-subdomain-worker.sh` + `workers/subdomain-proxy.ts`

- Worker 名称：`wordm-project-subdomains`
- 自动从 `src/data/projects.snapshot.json` 读取全部 `p-*` 子域并绑定，同时包含：
  - `resume.wordm.us`
  - `cv.wordm.us`
- Worker 访问规则：
  - 固定允许 `resume` / `cv`
  - 所有 `p-` 前缀子域按统一代理规则转发到根域并保留语言参数

## SEO 与兼容跳转

`public/_redirects` 保留了已有根域历史跳转规则：

- `/zh -> https://gridnote.wordm.us/?lang=zh`
- `/en -> https://gridnote.wordm.us/?lang=en`
- `/api/* -> https://gridnote.wordm.us/api/:splat`

## 验证

```bash
npm run lint
npm run build
```

<!-- ORCHESTRATOR:BEGIN -->
## Status
ready
## What it is
my-blog is a web application project in this workspace.
## Runtime Profile
- surface_bucket: `web_ui`
- platform: `web`
- platforms: `web`
- mode: `ui`
- entry_kind: `browser_url`
- entry_hint: `npm run dev`
## Quickstart / How to use / How to read
- README.md
- AGENTS.md
- Read `README.md`, `AGENTS.md` first.
- Start the local UI with `npm run dev`.
- Open the first local URL emitted by the dev server and confirm the home screen loads.
## Main surface
- Browser home screen captured at `screenshots/runtime-home.png`.
## Deep exploration flow
- Visit `http://127.0.0.1:44014/?show=page-glance-extension%2Capple-notes-webclipper%2Cpersonalinflationbasket%2Cllm-layer%2Cfocusor%2Ccode-agent-demo%2Copen-deep-research%2Cdynamic-delegate-2&debug=1`.
- Visit `http://127.0.0.1:44014/auth-role-rules.json`.
- Visit `http://127.0.0.1:44014/jian-yongjie-resume.pdf`.
- Replay `button` interaction `中文`.
- Replay `button` interaction `EN`.
## Acceptance chain
- Run `npm run dev` and wait for a local browser URL.
- Confirm `screenshots/runtime-home.png` still matches the main UI (`screenshots/runtime-home.png`).
- Replay the saved flow in `orchestration/reports/runtime_flows/my-blog.json`.
- Revisit the recorded deep pages and successful interactions listed above.
## Commands
- run: `npm run dev`
- test: `N/A`
- lint: `npm run lint`
- build: `npm run build`
- docs: `N/A`
## Runtime Evidence
- runtime_cover: `screenshots/runtime-home.png`
- static_cover_asset: `screenshots/runtime-home.png`
- runtime_ui_home: `screenshots/runtime-home.png`
- acceptance_flow: `orchestration/reports/runtime_flows/my-blog.json`
- runtime_url: `http://127.0.0.1:44014`
- runtime_local_port: `44014`
- runtime_url_purpose: `Main browser preview for the running project.`
- evidence_requirement: `real_ui_screenshot`
- evidence_status: `captured`
- evidence_reason: `runtime_ui_home_present`
## Structure
- `AGENTS.md`
- `docs/`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
## Notes
- Missing command(s): test, docs. Add real scripts/targets if support exists.
- Metadata note: effective_root=my-blog detected_via=package.json raw_lang=javascript markers=my-blog/package.json commands missing: test, docs; next: add matching script/target in package.json or Makefile. probe=npm run lint=ok; npm run build=ok
<!-- ORCHESTRATOR:END -->
