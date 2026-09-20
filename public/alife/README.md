# 人工生命史 · 沉浸式画廊（静态站）

满屏画廊展览：几乎无 UI chrome；**悬停 / 点按**卡片弹出 tips；可演示条目进全屏 canvas。纯静态 HTML/CSS/JS，**零构建**。

## 本地打开

```bash
cd /workspace/alife-museum
python3 -m http.server 8877
# 浏览器打开 http://127.0.0.1:8877/
```

## 交互

| 操作 | 行为 |
|------|------|
| 桌面悬停卡片 | 旁侧 tips 浮层 |
| 触控点按 | 底部 sheet tips |
| 可演示 | tips 内「演示」→ 全屏 canvas |
| `···` 或 `.` / `m` | 打开筛选浮层（默认隐藏） |
| `/` 或 `f` | 搜索 |
| Esc | 关闭浮层 / 演示 / tips |
| 页脚 | 悬停近底部才显 |

## Tips 字段（`data/catalog.json`）

每条含：`team`、`leads[{name,role,photo,website?,scholar?,photoNote?}]`、`construction`、`lineage`、`limits`、`links[{label,url}]`。

- 真人肖像：`assets/photos/{slug}.jpg`，Tips 中约 80×100 圆角矩形
- 点击照片/姓名：优先 `website`，否则 `scholar`
- 禁止 AI 假脸 / 禁止把 logo 当人像

## 可交互 Demo

| Demo | 模块 |
|------|------|
| Game of Life | `js/demos/life.js` |
| Boids | `js/demos/boids.js` |
| Langton's Ant | `js/demos/langton-ant.js` |
| Grey-Scott | `js/demos/grey-scott.js` |
| Elementary CA | `js/demos/eca.js` |
| Lenia-lite | `js/demos/lenia-lite.js` |
| Tierra-lite | `js/demos/tierra-lite.js` |

## 自检

```bash
node selfcheck.mjs
```
