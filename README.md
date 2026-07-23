# wordm.us Personal Site (Vite + React)

> **根域名管理说明**：本仓库已接管 `wordm.us` 根域名管理职责（原 `wordm-personal-home` 的 `_redirects` 和根域名配置已合并至此）。
> 当前域名归属与迁移原则见 [`docs/domain-ownership.md`](docs/domain-ownership.md)，机器可审计清单见 [`config/domain-ownership.json`](config/domain-ownership.json)。

基于你提供的学术极简版式实现的个人网站，包含：

- 根域 `wordm.us`：个人博客 + 作品集
- `Fields` 中的 Foundry Agent Studio 入口：独立站 `foundry.wordm.us`
- 子域 `resume.wordm.us`：独立简历页（含 PDF 下载，仅管理员/测试账号可访问）
- 子域 `admin.wordm.us`：后台系统入口（HTTP Basic Auth 保护）
- 子域 `support.wordm.us`：所有产品/App Store 上架共用的支持入口
- 账号系统：Supabase 邮箱密码 + Google 登录/注册/退出（`wordm.us` 与全部子域共用一套会话）
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
VITE_UNLOCK_PRODUCT_ALL_ACCESS=prod_yyy
VITE_UNLOCK_PRODUCT_ALL_CURRENT=prod_yyy
VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR=prod_zzz
VITE_SELFHOST_INSTALL_URL=https://github.com/LiDeChi/center-control#付费用户一键安装deploy-ticket
VITE_SELFHOST_INSTALL_SCRIPT_URL=https://raw.githubusercontent.com/LiDeChi/center-control/main/scripts/install-center-control.sh
NEXT_PUBLIC_CREEM_AFFILIATE_APPLY_URL=https://...
NEXT_PUBLIC_PARTNER_CONTACT_EMAIL=partners@wordm.us
NEXT_PUBLIC_FOUNT_BUILDER_EARLY_BIRD_URL=https://...
NEXT_PUBLIC_FOUNT_BUILDER_LIFETIME_URL=https://...
NEXT_PUBLIC_FOUNT_MASTER_EARLY_BIRD_URL=https://...
NEXT_PUBLIC_FOUNT_MASTER_LIFETIME_URL=https://...
NEXT_PUBLIC_FOUNT_EARLY_BIRD_LIMIT=20
NEXT_PUBLIC_FOUNT_EARLY_BIRD_CLAIMED=0
```

- 推荐使用你提到的同一套 Supabase 项目（`latti-wordm`）来保证账号一致。
- Google 登录不需要新增前端环境变量，但需要在 Supabase Dashboard 里启用 Google provider，并填好 Google OAuth Client ID / Secret。
- Google provider 的回调地址使用 Supabase 默认值；另外要把站点实际访问地址加入 Supabase Auth 的重定向白名单，例如生产域名 `https://wordm.us`、相关子域，以及本地开发地址。
- `VITE_UNLOCK_PRODUCT_SINGLE` / `VITE_UNLOCK_PRODUCT_ALL_ACCESS` 仅作为前端回退值；正式价格与商品 ID 以 Supabase 后台配置为准。
- `VITE_UNLOCK_PRODUCT_ALL_CURRENT` / `VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR` 仍可作为兼容回退值；前端会优先读取 `VITE_UNLOCK_PRODUCT_ALL_ACCESS`。
- `VITE_SELFHOST_INSTALL_URL` 用于支付成功后的“自部署安装”入口，默认指向 `center-control` 安装说明。
- `VITE_SELFHOST_INSTALL_SCRIPT_URL` 用于部署页生成一键部署命令，默认指向 `center-control` 官方安装脚本。
- `NEXT_PUBLIC_CREEM_AFFILIATE_APPLY_URL` 用于 Fount Partner Program 的申请按钮；未配置时会回退到 `NEXT_PUBLIC_PARTNER_CONTACT_EMAIL` 生成的 `mailto:`。
- `NEXT_PUBLIC_FOUNT_*_URL` 用于 Fount 定价页的 Builder / Master 买断付款入口；未配置时页面会保留 `/checkout/...-lifetime` 占位路由。
- `NEXT_PUBLIC_FOUNT_EARLY_BIRD_LIMIT` / `NEXT_PUBLIC_FOUNT_EARLY_BIRD_CLAIMED` 是早鸟进度的构建时回退值；线上会优先通过 `/api/fount-early-bird-status` 从 Creem 交易统计当前进度。
- 若不配置，会使用 `latti` 当前公开计划商品作为默认值。
- 站点会将 Supabase 会话同步到 `.wordm.us` 域级 cookie，因此 `wordm.us`、`resume.wordm.us`、`p-*.wordm.us` 会共享登录态。
- `foundry.wordm.us` 使用同一 Supabase 项目与 `wordm-auth-v1` 存储键；从 `/fields` 进入独立站后会继续使用当前账号。
- 账号角色共四类：`admin`（管理员）、`tester`（测试账号）、`user`（普通账号）、`guest`（游客）。
- 角色判定顺序：Supabase 用户 metadata 的 `role` 字段 > `public/auth-role-rules.json` 邮箱名单（与环境变量合并）> 默认 `user`。
- 简历页权限：仅 `admin` / `tester` 可访问，`user` / `guest` 会显示受限提示页。
- 项目解锁权限：`admin` / `tester` 自动拥有全部作品访问权限；`user` 需按解锁规则获取访问；`guest` 需先登录。

### AI 聊天框 / Kimi 接入

站点右下角提供 AI 聊天框，用 Cloudflare Pages Function `/api/chat` 作为服务端代理接入 Kimi。前端会把公开站点上下文发送给该接口，包括：

- 网站结构与主要页面
- 主页信息与产品落地页摘要
- 项目快照与项目展示信息
- 文章摘要、正文摘录与图片说明
- `docs/domain-ownership.md`、`docs/idea.md` 的摘要

生产环境需要在 Cloudflare Pages 项目变量中配置：

```bash
KIMI_API_KEY=...
KIMI_MODEL=kimi-k2.7-code
KIMI_API_BASE_URL=https://api.moonshot.ai/v1
```

`KIMI_API_KEY` 不要加 `VITE_` 前缀，避免进入浏览器 bundle。若你的 Kimi Coding Plan 使用不同的兼容入口，可只覆盖 `KIMI_API_BASE_URL`。

### 作品解锁规则（Portfolio Monetization MVP）

- 单作品解锁：仅解锁一个指定项目。
- 全部作品解锁：解锁当前全部项目，并默认包含后续新作品。
- 项目展示卡片支持三种公开状态：
  - `free`：永久免费，游客可直接进入项目页。
  - `limited_free`：限时免费，卡片会显示倒计时；到期后自动恢复为付费。
  - `paid`：需要单独解锁或全部解锁。
- 付费权限校验与 `latti-wordm` 保持一致：读取 `public.entitlements`（`plan/plan_id/expires_at`）。
  - 前端新模型为 `single` / `all_access`。
  - 为兼容既有 Supabase RPC，前端会把 `all_access` 映射到旧的 `all_current_plus_year` 存储格式。
- 当前实现为 `Supabase 配置优先 + 本地只读缓存回退`：
  - 公开/付费状态、单作品价格、全部解锁价格、checkout product id 均由 `site_pricing_configs` 控制。
  - 根域前台通过 Edge Function `pricing-config` 读取当前生效配置。
  - 管理员/测试账号可在后台通过 `manage-pricing-config` 保存配置。
  - 优先通过 Supabase RPC 读写解锁状态（服务端约束）。
  - 当解锁 RPC 不可用时，前台只会读取本地缓存的既有权限，不会在本地绕过付费校验。
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
- `public.site_pricing_configs`
- `public.wordm_unlock_plan_tier(uuid)` RPC
- `public.wordm_get_unlock_state()` RPC
- `public.wordm_apply_unlock_grant(...)` RPC

另外，分享链接功能依赖：

- `supabase/migrations/20260306120000_wordm_share_links.sql`
- `supabase/functions/create-share-link`
- `supabase/functions/resolve-share-link`
- `supabase/functions/revoke-share-link`
- `supabase/functions/pricing-config`
- `supabase/functions/manage-pricing-config`
- 其中 `resolve-share-link` 需要以 `--no-verify-jwt` 部署，供游客免登录访问
- 若希望分享链接直接进入部署页，`create-deploy-ticket` 也要以 `--no-verify-jwt` 部署

### 站点行为监控（Analytics）

站点会通过一方埋点记录访问、点击、下载、停留、注册、登录、退出事件。事件写入 Supabase 表：

- `supabase/migrations/20260704120000_wordm_site_analytics.sql`
- `supabase/functions/site-analytics`

前端会发送页面路径、清理后的 query、referrer、语言、视口、session id、登录用户 id/角色、按钮/链接标签、下载地址/文件名、停留时长和必要上下文；不会采集密码、输入框内容或原始 IP。

部署 Supabase 侧：

```bash
npx supabase db push
npx supabase functions deploy site-analytics
```

如需区分同一来源 IP，可配置盐化哈希；未配置时不会写入 IP 信息：

```bash
npx supabase secrets set WORDM_ANALYTICS_IP_SALT=<long-random-secret>
```

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

2. 构建并发布到 Pages 项目 `my-blog`：

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
- Pages 项目名优先读取 `CF_PAGES_PROJECT`，默认值是 `my-blog`
  - 已统一使用 `my-blog` 作为根域名（wordm.us）管理项目，避免与产品主页（`inote.wordm.us` 对应的 `wordm` 项目）冲突
- Pages 分支优先读取 `CF_PAGES_BRANCH`；未设置时默认使用当前 git 分支
- 当分支为 `main` 时会更新生产域名 `wordm.us`；其他分支会生成对应的 Pages 预览部署

3. 部署共享登录 Worker：

```bash
npm run deploy:auth
```

脚本：`scripts/deploy-auth-worker.sh` + `workers/wordm-auth.ts`

- Worker 名称：`wordm-auth`
- 默认绑定 `auth.wordm.us` 和 route `auth.wordm.us/*`
- 使用 `--keep-vars` 保留 Cloudflare 上现有环境变量，不在仓库里保存 Supabase 配置值

4. 部署子域名 Worker（保留当前已绑定子域名，可按需追加新子域名）：

```bash
npm run deploy:subdomains
```

脚本：`scripts/deploy-subdomain-worker.sh` + `workers/subdomain-proxy.ts`

- Worker 名称：`wordm-project-subdomains`
- 默认从 Cloudflare 读取当前已绑定的 Workers custom domains，并原样保留这些域名。
- 新增域名时使用 `DEPLOY_SUBDOMAIN_EXTRA_DOMAINS`，例如：

```bash
DEPLOY_SUBDOMAIN_EXTRA_DOMAINS=p-new-project.wordm.us npm run deploy:subdomains
```

- 如需零新增费用地逐步缩减现有 custom domains，可使用保留模式：

```bash
DEPLOY_SUBDOMAIN_RETENTION_MODE=direct npm run deploy:subdomains
DEPLOY_SUBDOMAIN_RETENTION_MODE=priority npm run deploy:subdomains
```

- `direct`: 只保留固定入口 + 当前已有 `productionUrl` 的直达体验子域
- `priority`: 只保留固定入口 + `activityScore >= 75` 或带 `ready` 标签的高优先级项目子域
- 默认值仍是 `current`，表示沿用 Cloudflare 当前已绑定集合，不会主动缩减
- 在真正部署前，可先运行：

```bash
npm run list:subdomain-retention
```

- 它会输出两套建议保留名单，方便你先看删减规模。

- 不要默认从 `src/data/projects.snapshot.json` 全量绑定域名；该快照是前端项目目录数据源，不是 Cloudflare custom-domain 清单。
- 如确实需要重建全部快照子域，可显式设置 `DEPLOY_SUBDOMAIN_FROM_SNAPSHOT=1`，但这可能超过 Cloudflare 每个 zone 100 个 Workers custom domains 的限制。
- Worker 访问规则：
  - 固定允许 `resume` / `cv` / `admin`
  - 所有 `p-` 前缀子域按统一代理规则转发到根域并保留语言参数

5. 审计当前域名归属和自定义域名占用：

```bash
npm run audit:domains
```

- 对照 `config/domain-ownership.json` 检查 Cloudflare Pages custom domains、Workers custom domains、Workers routes，以及 wildcard Worker 的 pass-through 名单。
- 默认只报告偏差；如需在 CI 中失败，可设置 `AUDIT_DOMAIN_OWNERSHIP_STRICT=1`。

继续审计 `wordm-project-subdomains` 的 custom-domain/TLS 细节：

```bash
npm run audit:subdomains
```

- 直接读取 Cloudflare 当前 `wordm-project-subdomains` 已绑定的 Workers custom domains。
- 输出会按以下几组拆开：
  - `fixedInfraDomains`: 固定入口，例如 `admin` / `resume` / `cv`
  - `liveWithDirectExperience`: 当前已绑定且项目本身已有 `productionUrl` 的子域
  - `livePortfolioShellOnly`: 当前已绑定，但只是作品集入口壳的子域
  - `snapshotOnlyDomains`: 快照里存在、但当前并未实际绑定的候选域名
- 还会额外输出 `tlsAudit`：
  - `sampledSnapshotOnlyDomains`: 本次抽样检查的未绑定候选子域
  - `customDomainsCanShrinkNow`: 只有当这些未绑定候选子域也都能完成 TLS 握手时，才说明可以开始删除现有 custom domains
  - `blocker`: 若这里提示 TLS 在 Worker 执行前就失败，说明 wildcard route 虽然存在，但还不能替代当前 custom domains
- 这一步适合先看清现网占用，再决定是否删减旧绑定。

附：检查某个子域是否已经具备 HTTPS 握手与证书覆盖：

```bash
npm run check:subdomain:tls -- p-gridnote.wordm.us p-10-klicstudio.wordm.us
```

- 若返回 `ok: true` 且 SAN 中覆盖该 hostname，说明这个子域在 TLS 层已经可用。
- 若在这里就失败，说明请求还到不了 Worker，不能只靠 wildcard route 替代现有 custom domain 绑定。

5. 用 wildcard route 部署子域名 Worker（节省 custom-domain 名额）：

```bash
npm run deploy:subdomains:routes
```

- 脚本：`scripts/deploy-subdomain-worker-routes.sh`
- 默认 route pattern：`*.wordm.us/*`
- 可通过 `DEPLOY_SUBDOMAIN_ROUTE_PATTERN` 覆盖，例如：

```bash
DEPLOY_SUBDOMAIN_ROUTE_PATTERN='*.wordm.us/*' npm run deploy:subdomains:routes
```

- 这条路径的目标是让绝大多数 `p-*` 子域走一条 wildcard route，而不是一条子域占一个 Workers custom domain。
- 前提条件：
  - `wordm.us` 这个 zone 已经有可覆盖子域的 DNS 配置（通常是 wildcard record 或等价接入方式）
  - `*.wordm.us` 还需要具备可正常握手的证书覆盖；如果某个子域在 TLS 握手前就失败，Worker route 不会有机会接管请求
  - 你确认不会拦截掉不该交给这个 Worker 的其他独立子域
  - 对 `wordm.us` 这种 full setup zone，Cloudflare `Universal SSL` 只自动覆盖根域和一级子域；若要让任意新增子域自动拿到证书，需要购买 `Advanced Certificate Manager`，再启用 `Total TLS`
- 迁移建议：
  - 先跑 `npm run audit:subdomains`
  - 再部署 wildcard route
  - 先挑一个“当前未绑定 custom domain、但已被 wildcard DNS 解析”的子域做实测
  - 只有在该子域也能完整通过 HTTPS 握手并返回 Worker 内容后，才适合逐步删除旧的 project-level custom domains
  - 若 TLS 在 Worker 执行前失败，就说明还不能仅靠 route 替代现有 project-level custom domains

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
