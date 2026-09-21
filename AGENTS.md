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
- Visit `http://127.0.0.1:44014/?lang=zh` (关注方向：时间轴 + 标签化项目卡片).
- Visit `http://127.0.0.1:44014/?lang=en` (same page, English).
- Visit `http://127.0.0.1:44014/projects?lang=zh` (个人项目).
- Visit `http://127.0.0.1:44014/?show=page-glance-extension%2Capple-notes-webclipper%2Cpersonalinflationbasket%2Cllm-layer%2Cfocusor%2Ccode-agent-demo%2Copen-deep-research%2Cdynamic-delegate-2&debug=1`.
- Visit `http://127.0.0.1:44014/auth-role-rules.json`.
- Visit `http://127.0.0.1:44014/jian-yongjie-resume.pdf`.
- Replay `button` interaction `中文`.
- Replay `button` interaction `EN`.
- Scroll the 关注方向 timeline through all six stages, then check the tagged project cards below it.
## Acceptance chain
- Run `npm run dev` and wait for a local browser URL.
- Confirm `screenshots/runtime-home.png` still matches the main UI (`screenshots/runtime-home.png`).
- Confirm the top nav has exactly three entries (关注方向 / 个人项目 / 博客) and that the right rail shows the social links above the music player without overlap.
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
