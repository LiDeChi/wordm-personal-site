# wordm.us Personal Site (Vite + React)

基于你提供的学术极简版式实现的个人网站，包含：

- 根域 `wordm.us`：个人博客 + 作品集
- 子域 `resume.wordm.us`：独立简历页（含 PDF 下载）
- `center-control` 项目展示（来源：`/Users/lidechi/Documents/Github/center-control/data/exports/projects.json`）
- `debug` 模式控制展示项目
- 项目子域名展示（`p-*.wordm.us`）
- 根域支持 `Blog / Portfolio` 一键切换：博客为三栏阅读模式（左目录、中间连续文章、右注释 + 下一篇按钮）

## 本地开发

```bash
npm install
npm run sync:projects
npm run dev
```

默认地址：`http://localhost:5173`

### Debug 模式

通过 URL 开启：

```text
http://localhost:5173/?debug=1
```

可用参数：

- `debug=1`：开启可视化控制面板
- `show=slug1,slug2`：指定展示项目
- `centerApi=https://.../api/portfolio/projects.json`：切换为 center-control 实时 API 数据
- `subdomain=p-xxx`：本地模拟子域名视图
- `page=resume`：本地模拟简历子域名视图
- `view=portfolio`：切到作品集视图（默认是 blog）

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

3. 部署子域名 Worker（自动绑定简历子域名 + 项目子域名）：

```bash
npm run deploy:subdomains
```

脚本：`scripts/deploy-subdomain-worker.sh` + `workers/subdomain-proxy.ts`

- Worker 名称：`wordm-project-subdomains`
- 已绑定子域名：
  - `resume.wordm.us`
  - `p-page-glance-extension.wordm.us`
  - `p-apple-notes-webclipper.wordm.us`
  - `p-personalinflationbasket.wordm.us`
  - `p-llm-layer.wordm.us`
  - `p-focusor.wordm.us`
  - `p-code-agent-demo.wordm.us`
  - `p-open-deep-research.wordm.us`
  - `p-dynamic-delegate-2.wordm.us`

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
