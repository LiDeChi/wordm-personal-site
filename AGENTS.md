# AGENTS

<!-- ORCHESTRATOR:BEGIN -->
## Purpose & Boundaries
- Purpose: my-blog is a web application project in this workspace.
- Boundary: only modify files inside this project directory unless orchestrator requests otherwise.
## Status
- ready
## Runtime Profile
- surface_bucket: `web_ui`
- platform: `web`
- platforms: `web`
- mode: `ui`
- entry_kind: `browser_url`
- entry_hint: `npm run dev`
## Entry points
- `my-blog/README.md`
## Read first
- README.md
- AGENTS.md
## Start steps
- Read `README.md`, `AGENTS.md` first.
- Start the local UI with `npm run dev`.
- Open the first local URL emitted by the dev server and confirm the home screen loads.
## Main surface
- Browser home screen captured at `screenshots/runtime-home.png`.
## Deep exploration flow
- Visit `http://127.0.0.1:44014/?lang=zh` (首页为「项目 / 文章」两张预览卡，每侧三项).
- Visit `http://127.0.0.1:44014/?lang=en` (same page, English).
- Visit `http://127.0.0.1:44014/projects?lang=zh` (六件个人项目，等高水平叠放的阅读卡片).
- Visit `http://127.0.0.1:44014/blog?lang=zh` (博客阅读卡片及可搜索的文章目录).
- Visit `http://127.0.0.1:44014/?show=page-glance-extension%2Capple-notes-webclipper%2Cpersonalinflationbasket%2Cllm-layer%2Cfocusor%2Ccode-agent-demo%2Copen-deep-research%2Cdynamic-delegate-2&debug=1`.
- Visit `http://127.0.0.1:44014/auth-role-rules.json`.
- Visit `http://127.0.0.1:44014/jian-yongjie-resume.pdf`.
- Replay `button` interaction `中文`.
- Replay `button` interaction `EN`.
- On the projects page, confirm only these six cards: 人工生命史, RingBook, MuseumBook, Flipook, 诗经长卷, 万卷.
## Acceptance chain
- Run `npm run dev` and wait for a local browser URL.
- Confirm `screenshots/runtime-home.png` still matches the main UI (`screenshots/runtime-home.png`).
- Confirm home has exactly two preview cards (项目 / 文章), each showing three entries. Heading arrows and upward touch gestures / downward wheel gestures expand the corresponding panel into its card library; individual previews open in place. Summaries show at most two lines and fade only when overflowing, with no bottom 全部文章 button or extra reading-action text.
- Reading cards share their top and bottom edges, retain native internal scroll, and expand on click with Escape / 收回 to return. Only sharing is offered; no quote action or frame ornaments.
- Confirm the mast has no personal seal, and the 项目 / 博客 switch sits directly above the cards. Home article previews, article cards and index entries expand in place; no 阅读原文 link remains. Vertical scrolling keeps native momentum while horizontal navigation still changes cards.
- Confirm language, theme, music and hover-revealed social controls remain usable outside the cards on desktop and in the bottom rail on phones. Browser Back / Forward must restore the correct surface.
- Revisit the recorded deep pages and successful interactions listed above.
## Commands (real / N/A)
- run: `npm run dev`
- test: `N/A`
- lint: `npm run lint`
- build: `npm run build`
- docs: `N/A`
## Runtime Evidence
- runtime_cover: `screenshots/runtime-home.png`
- static_cover_asset: `screenshots/runtime-home.png`
- runtime_ui_home: `screenshots/runtime-home.png`
- runtime_url: `http://127.0.0.1:44014`
- runtime_local_port: `44014`
- runtime_url_purpose: `Main browser preview for the running project.`
- evidence_requirement: `real_ui_screenshot`
- evidence_status: `captured`
- evidence_reason: `runtime_ui_home_present`
## Key directories
- `AGENTS.md`
- `docs/`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
## Do / Don't
- Do: follow the read-first order and acceptance chain before changing behavior.
- Do: use declared commands first and keep changes minimal.
- Don't: assume missing commands; record N/A with explanation instead.
- Don't: replace real runtime evidence with placeholder screenshots.
## Known issues & tips
- Missing command(s): test, docs. Add real scripts/targets if support exists.
<!-- ORCHESTRATOR:END -->

## 发布约定（2026-10-15 修订，取代 2026-09-21 版）

- 改完并通过 `tsc -b` / `eslint .` / `npm run build` 后，commit，然后**推新分支，不推 main**：

  ```sh
  git push -u origin HEAD:agent/<简短主题>    # 例：agent/zhuzi-product-page
  gh pr create --fill --base main
  ```

  仍然不要等用户说「推送」，但目标永远是「分支 + PR」，不是 main。
- `main` 是生产分支，只有人合并 PR 才动它。合并后的那次 push 才触发 `.github/workflows/deploy.yml`
  （Cloudflare Pages，`wrangler pages deploy ... --branch=main`）上线。
- **不要**直接 `git push origin main`：那会跳过审阅直接进生产。需要紧急直推时先问用户，得到同意再用。
- 只提交本次改动涉及的文件：不要顺手 `git add .`（`.playwright-mcp/`、历史遗留的 `screenshots/*` 等未跟踪文件不进提交）。
