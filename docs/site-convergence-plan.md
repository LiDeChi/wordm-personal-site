# 站点收敛计划（Site Convergence Plan）

> 状态：**已实施**。下面的契约与验收项即当前代码的实际状态；决策记录见本文件末尾。

目标：把当前杂乱的多壳站点收敛成三段式信息架构，恢复原主页壳（含音乐），删除定价 / Fount / Fields。

## 1. 信息架构（冻结）

```
/                              → 关注方向 Focus（默认：人工生命 / 文章）
/?area=minds                   → 关注方向 > 机器心智
/?area=alife&mode=projects     → 关注方向 > 人工生命 > 项目
/projects                      → 个人项目
/blog                          → 博客
/login                         → 账号
/about                         → 关于
```

- `area`（关注方向）：`alife`（人工生命）| `minds`（机器心智），默认 `alife`。
- `mode`（呈现方式）：`article`（文章）| `projects`（项目页），默认 `article`。
- 顶部主导航只有三项：**关注方向 / 个人项目 / 博客**。
- 旧路由全部收敛：
  - `/pricing`、`/?view=pricing`、`/partners`、`/updates`、`/?view=updates`、`/docs`、`/fields` → `/`
  - `/?view=portfolio` → `/projects`
  - `/minds` → `/?area=minds`
  - `/?view=home` 的旧「动态呈现」壳删除

## 2. 组件契约（冻结）

`src/components/FountHomePage.tsx`（原主页壳，保留 header / 音乐 / 社交竖栏 / footer）：

```ts
export type FocusArea = "alife" | "minds";
export type FocusPresentation = "article" | "projects";

export function FocusAreaPage({
  lang, area, presentation, onAreaChange, onPresentationChange,
}: {
  lang: Lang;
  area: FocusArea;
  presentation: FocusPresentation;
  onAreaChange: (area: FocusArea) => void;
  onPresentationChange: (mode: FocusPresentation) => void;
}): JSX.Element;
```

子组件（各自独占新文件，互不冲突）：

| 组件 | 文件 | Props |
| --- | --- | --- |
| `MachineMindArticle` | `src/components/MachineMindArticle.tsx` + `.css` | `{ lang: Lang }` |
| `AlifeArticle` | `src/components/AlifeArticle.tsx` + `.css`、`src/data/alife.ts` | `{ lang: Lang }` |
| `FocusProjectList` | `src/components/FocusProjectList.tsx` + `.css`、`src/data/focusProjects.ts` | `{ lang: Lang; area: FocusArea }` |

## 3. 写作边界（避免并行冲突）

- 只有主 agent 可以改：`src/App.tsx`、`src/components/FountHomePage.tsx`、`src/index.css`。
- 子任务只能改自己表格里列出的文件；不得启动 dev server（已有 44014 在跑）；不得改 `src/index.css`。

## 4. 删除清单

- `src/components/InteractiveHomePage.tsx` / `.css`——用户明确要求去掉的「新主页壳」。
- 定价：`FountPricingSection`（`FountHomePage.tsx` 内）、`/pricing` 路由与导航项。
  - 保留 `src/lib/project-offers.ts`、`src/lib/pricing-remote.ts`、`unlock-*`——项目解锁仍依赖它们。
- Fount：Fount 营销主页正文、`FountDocsSection.tsx`、`FountPartnerPage`、`FountUpdatesSection`、`OneAgentProductPage.tsx`。
- Fields：`FountFieldsSection` 与其 `/fields` 路由；项目列表以「关注方向 > 项目」和「个人项目」两种形态保留。
- `FountDownloadControl` / `FOUNT_DOWNLOAD_ENABLED` 相关下载入口。

## 5. 侧栏叠放修复

`fount-social-rail`（固定 `top: 118px`）与 `fount-music-rail`（固定 `top: 50%` 居中）同处右侧同一横向位置，滚动/短视口时相互挤压重叠。

修复方向：把两者收敛为**同一条右侧竖栏容器**，纵向排布（社交在上、音乐在下），或让音乐栏贴在社交栏下方并在矮屏隐藏文字。二选一实现，但必须保证任何视口下不重叠、不遮挡正文操作区。

## 6. 验收

在 `npm run dev`（44014）上人工确认：

1. 顶部导航只有 关注方向 / 个人项目 / 博客 三项，且可清楚切换。
2. 关注方向页可在 人工生命 / 机器心智 间切换，并在 文章 / 项目 两种呈现间切换。
3. 关注方向 > 项目 可筛选类别，且在人工生命下能看到机器心智项目。
4. 主页（原壳）右侧同时可见音乐组件与社交组件，叠放整齐、互不遮挡；音乐可播放/暂停/切歌。
5. 全站无 定价 / Fount / Fields 入口；旧链接回落到 `/?`。
6. `npm run lint` 与 `npm run build` 通过。


## 7. 实施结果（2026-09-20）

### 信息架构
| 栏目 | 路径 | 组件 |
| --- | --- | --- |
| 关注方向 | `/`（`?area=alife\|minds`、`?mode=article\|projects`） | `FocusAreaPage` |
| 个人项目 | `/projects` | `App.tsx` 内的 `home-projects-hero` |
| 博客 | 外链 `lidechi.github.io`（`IN_SITE_BLOG_ENABLED=false`） | — |
| 关于 / 账号 | `/?view=about`、`/?view=login` | `PortfolioShowcase` / `LoginPage` |

### 新增文件
- `src/lib/focus.ts` — `FocusArea` / `FocusPresentation` 类型、`FOCUS_COPY`、URL 参数解析
- `src/lib/site-shell.ts` — `SiteTab`、外壳文案、栏目 href 生成
- `src/components/FocusAreaPage.tsx` + `.css` — 方向 + 呈现方式切换
- `src/components/AlifeArticle.tsx` + `.css`、`src/data/alife.ts` — 人工生命文章（素材来自 `docs/idea.md`）
- `src/components/MachineMindArticle.tsx` + `.css` — 机器心智文章（重做，替代 `MindSchoolsPage`）
- `src/components/FocusProjectList.tsx` + `.css`、`src/data/focusProjects.ts` — 项目模式 + 类别筛选

### 删除文件
`InteractiveHomePage.tsx/.css`（用户要求去掉的新壳）、`FountDocsSection.tsx`、`MindSchoolsPage.tsx`（被 `MachineMindArticle` 取代）、`AccountEntryCard.tsx`（随旧 topbar 一起失效）。

### 重写
`src/components/FountHomePage.tsx` 从 4346 行收敛为站点外壳（header / 右侧社交+音乐竖栏 / footer），正文全部由 `children` 传入。

### 关于侧栏叠放
`fount-social-rail` 与 `fount-music-rail` 原先各自 `position: fixed` 且共用同一 `right` 值，矮视口会互相压住。现在包在一个 `.fount-rail` 固定竖栏里纵向排布（社交在上、音乐在下），`max-height: calc(100svh - 116px)` + `overflow-y: auto` 兜底；`<=900px` 时整条竖栏改为静态行，不再覆盖任何内容。已验证 1600×1000、1291×820/700/620、1440×480、899×800、390×844 等尺寸下 `verticalOverlap = 0`。

### 窄屏修正（收到用户截图后追加）
390px 下实测到的三处缺陷，已修：

1. **标题过大**：`mma-hero h1` 的 `clamp(2.65rem, 17vw, 4.4rem)` 在 390px 解析成 66.3px，标题被拆成 6 行、占据整屏。改为 `clamp(1.8rem, 8.4vw, 2.5rem)`（560px 档）与 `clamp(2.1rem, 6vw, 3.3rem)`（900px 档）。`alife-hero h1` 同理加了 900px / 720px 两档。
2. **正文前的 chrome 过高**：移动端右侧竖栏原本换行成社交、音乐两行（120px）。改成单行横向可滚动（56px），社交图标 30px、音乐按钮 32px。正文起始位置从 ~330px 提前到 266px。
3. **页面过长**：机器心智文章在 390px 下有 19,088px，其中索引表一段就占 5,255px。索引表加 `.mma-index-scroll` 容器，窄屏 `max-height: 68svh` 内部滚动 + 一行说明；宽屏完全不变（不滚动、不显示提示）。整页 19,088px → 14,401px。

### 已知遗留（未在本次范围内处理）
- `关于` 页仍保留 center-control 的全量项目归档（约 40 项），是比三段式更杂的一层，建议后续收敛或移入「个人项目 > 全部」。
- 本次改动前就已存在的死代码未清理（`BlogSection`、`BlogNotesPanel`、`DebugPanel`、`MarginNotes`、`Sidebar`、`SiteHeroBanner`、`SiteTopBar`、`SubdomainProjectLocked`、`lib/deploy-ticket.ts`）。
- `src/index.css` 里 Fount 时代的遗留样式（`fount-pricing-*`、`fount-docs-*`、`fount-minds-*`、`fount-fields-*` 等）已无引用但仍在文件里；`index.css` 未做体积收敛。
- `.env.example` 中 Fount 定价/Partner 相关键已无代码读取，保留仅为兼容既有部署。

## 8. 顺带修复：site-analytics Edge Function 的性能与丢事件（2026-09-20）

排查触发的现象：浏览器控制台出现两条无 body 的 `500`（`functions/v1/site-analytics`）。

### 根因
`supabase/functions/site-analytics/index.ts` 的 `ensureAnalyticsSchema()` 用 `SUPABASE_DB_URL` 开一条直连 Postgres，跑 10 条 DDL（`create extension` / `create table if not exists` / 4× `create index if not exists` / `enable row level security` / 2× `grant`）作为建表兜底。

它靠模块级变量 `analyticsSchemaReady` 做一次性缓存，但 **Edge Runtime 的模块状态在调用之间不保留**，缓存失效，于是这段 DDL 在**每个事件**上都重跑：

- 实测每个 POST 2.5–3.2s（网关基线 0.27s）；
- `create index if not exists` 需要表级排他锁，一旦抢锁就超出调用预算，网关返回无 body 的 500，**事件被丢弃**；
- 失败路径本身正确（`ANALYTICS_SCHEMA_INIT_FAILED`），但前端 `trackSiteEvent` 只写了 `return response.ok`，把错误整个吞掉，所以线上只看到「500 ()」；
- 该 Pool 从不 `end()`，每次调用泄漏一条连接。

### 修复
- 建表兜底移出请求主路径：先插入；只有插入真的因「表不存在」失败时，才走一次带 5s 超时的 bootstrap 并重试一次。
- bootstrap 超时可控、永不 reject，删除了 `ANALYTICS_SCHEMA_INIT_FAILED` 这个 500 分支，它再也不能吃掉事件。
- bootstrap 完成后 `pool.end()` 并清空引用。
- 前端 `src/lib/site-analytics.ts` 在非 2xx 时读出错误码并按 `status:error` 去重 `console.warn` 一次。

### 部署与验证
`supabase functions deploy site-analytics --project-ref uswackifoqjxfitesflz --use-api` → VERSION 4，2026-09-20 12:35 UTC。

| 路径 | 改前 | 改后 |
| --- | --- | --- |
| POST 稳定态 | 2.87–4.29s | 0.56–0.94s |
| POST（空闲 75s 后首个） | — | 0.92s（无冷启动尖峰） |
| `400 ANALYTICS_EVENT_INVALID` | 2.57s | 0.37s |
| `400 INVALID_JSON` | 2.54s | 0.47s |
| `401 UNAUTHENTICATED` | 2.64s | 0.70s |

浏览器全流程（个人项目 → 关注方向 → 人工生命 → 文章）9 次埋点请求全部 200，控制台无新 500，新的 `[analytics]` 告警未触发。

### 顺带发现，未处理
- `WORDM_ANALYTICS_IP_SALT` 未配置 → `ip_hash` 恒为 `null`（若是有意不存 IP 哈希则无需处理）。
- POST 稳定态仍有约 0.7s，其中包含一次 `auth.getUser()` 对 GoTrue 的往返；当 Bearer 就是 anon key（游客）时这次往返是纯浪费，可跳过以再降几百毫秒。

## 9. 关注方向改版：时间轴 + 标签化项目卡片（2026-09-20）

用户反馈：「原来人工生命那个时间轴的项目呢？你怎么换成我的个人项目了。也不要搞文章形式了。直接在时间线上写一段话，然后是项目卡片。人工生命和机器心智的项目卡片都在一个界面里，打上标签就行，不需要做筛选」

### 之前做错的地方
第 2、3 条需求被理解成「关注方向 × 两种呈现（文章 / 项目）」+「项目按类别筛选」，于是：
- 造了两篇长文（`AlifeArticle` / `MachineMindArticle`）；
- 项目模式的清单取自 `FOUNT_FIELDS`——**那是用户自己的产品**（Flipook、诗经长卷、MuseumBook…），不是人工生命 / 机器心智方向的作品。

结果关注方向页上摆的是个人产品，方向本身的项目反而没有出现。

### 现在的结构
关注方向 = **一页到底**：

1. **时间轴**（`FAMILY_STAGES`，6 段）：分布式心智 → 意识循环 → 世界与实验 → 规则即身体 → 神经机制 → 智能体社会。每段带一个小标题和一段话，末尾列出该段成员。
   - 时间轴自身带一段话：整条方向的共同命题（`FAMILY_THESIS`）。
2. **项目卡片**（`FAMILY_PROJECTS`，16 张）：人工生命与机器心智**混在同一张列表**里，只用标签区分（人工生命 / 机器心智 / 智能体社会 / 神经机制），**没有筛选、没有视图切换**。

### 数据来源
`mind-society` 项目族登记表（`/Users/lidechi/Documents/Github/mind-society`：`README.md`、`ECOSYSTEM.md`、`ecosystem.json`），双语整理进 `src/data/mindFamily.ts`：

- 11 个已登记成员 + `self-referring`（规则即身体，README 自述为「可交互的人工生命 demo」）+ `control_itself` / `dongzhou` / `multiscale` = 16 张卡片。
- 有公开仓库的（MindOS / mindfile / mind0711 / mind0714 / mindcodex0711 / town）把 `git@github.com:...` 转成 https 链接；没有 remote 的只展示本地运行入口。

### 删除
`FocusAreaPage`（方向 + 呈现切换）、`AlifeArticle`、`MachineMindArticle`、`FocusProjectList`（含筛选器）、`data/alife.ts`、`data/focusProjects.ts`、`lib/focus.ts`，以及 `?area=` / `?mode=` 参数与 `/minds` 特殊路由。

### 保留但已下线
`src/data/mindSchools.ts`（学派 / 人物 / 著作数据）没有删除——用户此前明确要过这份内容，页面下线但数据留在仓库，要恢复随时说。
