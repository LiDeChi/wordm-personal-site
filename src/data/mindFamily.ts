import type { Lang } from "../i18n/lang";

/**
 * 「agent 社会 / 多智能体协作 / 机器心智 / 人工生命」项目族
 *
 * 来源：/Users/lidechi/Documents/Github/mind-society（README.md、ECOSYSTEM.md、
 * ecosystem.json）。这里只做展示用的双语整理，不复制实现细节。
 * 修改成员时请同步 mind-society 的登记表，避免两边漂移。
 */

export type LocalizedText = Record<Lang, string>;

/** 卡片上的标签。刻意保持少量几个，方便一眼分堆。 */
export type FamilyTag = "alife" | "mind" | "society" | "brain";

export type FamilyProject = {
  key: string;
  name: string;
  /** 展示用英文名，缺省时不显示。 */
  latin?: string;
  tags: FamilyTag[];
  /** 一句话说明，取自 ecosystem.json 的 summary。 */
  summary: LocalizedText;
  /** 形态，例如「运行时 (TS)」/「研究内核」。 */
  kind: LocalizedText;
  status: "active" | "prototype" | "archive" | "draft";
  /** 本地运行入口；公开站点上只作为信息展示。 */
  entry: string | null;
  /** 有公开仓库时给出 https 链接。 */
  repoUrl: string | null;
};

export type FamilyStage = {
  key: string;
  label: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  /** 该阶段的成员，对应 FamilyProject.key。 */
  members: string[];
};

export const FAMILY_TAG_LABELS: Record<FamilyTag, LocalizedText> = {
  alife: { zh: "人工生命", en: "Artificial Life" },
  mind: { zh: "机器心智", en: "Machine Mind" },
  society: { zh: "智能体社会", en: "Agent Society" },
  brain: { zh: "神经机制", en: "Neural Substrate" },
};

/** 时间轴本身带一段话——整条方向的共同命题。 */
export const FAMILY_THESIS: LocalizedText = {
  zh: "这十几件东西在追同一个问题：心智不在单次模型调用里，而在主体—环境—社会的整个系统中。区别只在于各自压强压在哪一层——文件结构、意识循环、世界介质、神经基底，还是群体互动。",
  en: "These projects chase one question: a mind does not live inside a single model call, but in the whole subject–environment–society system. What differs is which layer each one squeezes — file structure, the consciousness loop, the world as medium, the neural substrate, or group interaction.",
};

export const FAMILY_STAGES: FamilyStage[] = [
  {
    key: "files",
    label: { zh: "分布式心智", en: "Distributed mind" },
    title: { zh: "文件即大脑", en: "The filesystem is the brain" },
    body: {
      zh: "先把「大脑」从进程里拿出来，放进文件系统。每一拍重新组装上下文，没有主模型；事件以 append-only 的方式落盘，SQLite 之类的索引只是可重建的投影。这条线关心的是：心智能不能是一个可读、可回放、可 fork 的目录结构。",
      en: "Move the brain out of the process and into the filesystem. Context is reassembled every tick with no master model; events land append-only, and indexes such as SQLite are only rebuildable projections. The question here: can a mind be a readable, replayable, forkable directory?",
    },
    members: ["mind", "mindos", "mindfile", "codemind"],
  },
  {
    key: "loop",
    label: { zh: "意识循环", en: "Consciousness loop" },
    title: { zh: "让注意力有唯一的主循环", en: "One main loop for attention" },
    body: {
      zh: "把感知、注意、预测、压缩记忆、驱动力放进机器层唯一的主循环里，再往上长出多机器控制平面和持续存在的环境。心跳由 Executive 调度，而不是等外部请求——这是「持续存在」和「一问一答」的分界。",
      en: "Perception, attention, prediction, compressed memory, and drive live in a single machine-layer main loop; above it grow a multi-machine control plane and a persistently existing environment. The heartbeat is scheduled by an Executive rather than waiting for a request — that is the line between existing and answering.",
    },
    members: ["mind0711", "mindcodex0711", "mind0714"],
  },
  {
    key: "world",
    label: { zh: "世界与实验", en: "Worlds and experiments" },
    title: { zh: "世界是思维的介质", en: "The world is the medium of thought" },
    body: {
      zh: "持续世界保存事实，分支世界拿去跑反事实，观察房间把内部状态显影出来。再往上一层，史料本身也可以当观测数据：给 agent 半段《左传》，让它自己构造一个能跑起来的郑国世界，然后停掉输入，看世界会往哪儿长。",
      en: "A persistent world stores facts, branch worlds run counterfactuals, and an observation room renders internal state. One layer up, source material itself becomes observational data: hand an agent the first half of a chronicle, let it build a runnable world, then cut the input and watch where the world grows.",
    },
    members: ["machine-being", "dongzhou", "multiscale"],
  },
  {
    key: "rules",
    label: { zh: "规则即身体", en: "Rules as body" },
    title: { zh: "规则是能被搬动的结构", en: "Rules are structures you can move" },
    body: {
      zh: "规则不是藏在后台的代码，而是生命身体里可以被感知、搬动、复制、重接的结构——改这些结构，就改它之后怎么运行。再走一步：当智能体学会运行自己的代码语言，并把解释器接到时钟上，外部内核就可以撤出了。",
      en: "Rules are not code hidden in the backend; they are structures perceptible, movable, copyable, and rewireable inside a living body — change the structure and you change how it runs from then on. One step further: when agents learn to run their own language and wire the interpreter into the clock, the external kernel can withdraw.",
    },
    members: ["self-referring", "control_itself"],
  },
  {
    key: "neural",
    label: { zh: "神经机制", en: "Neural substrate" },
    title: { zh: "世界 → 神经元 → 认知", en: "World → neurons → cognition" },
    body: {
      zh: "把导航世界接进脉冲网络，再接到任务上，检查一件事：能不能从下游的脉冲里把位置解码回来。这一条线提供的是校验链——如果认知声称来自神经活动，就该能在神经活动里被读出来。",
      en: "Wire a navigation world into spiking neurons and then into a task, and check one thing: can position be decoded back out of downstream spikes? This line supplies the verification chain — if cognition claims to come from neural activity, it should be readable in that activity.",
    },
    members: ["brain"],
  },
  {
    key: "society",
    label: { zh: "智能体社会", en: "Agent society" },
    title: { zh: "符号、欺骗与规范从互动里长出来", en: "Symbols, deception, norms emerge from interaction" },
    body: {
      zh: "双层心智（联想 / 心智理论）放进确定性的 2D 世界里，看符号怎么涌现、欺骗怎么出现、规范怎么被重写。语言这条线把它做成可证伪的实验：闸门、递归、粗粒化闭合、印迹链、约定形成，最后把 Keeper 撤出看规则还成不成立。",
      en: "Put a two-tier mind (associative / theory-of-mind) into a deterministic 2D world and watch symbols emerge, deception appear, and norms get rewritten. The language line turns this into falsifiable experiments: gates, recursion, coarse-graining closure, trace chains, convention formation — then withdraw the Keeper and see whether the rules still hold.",
    },
    members: ["mind-society", "lang1", "town"],
  },
];

export const FAMILY_PROJECTS: FamilyProject[] = [
  {
    key: "mind",
    name: "Mind",
    tags: ["mind"],
    kind: { zh: "规格 + 长期运行存档", en: "Spec + long-run archive" },
    status: "archive",
    summary: {
      zh: "《分布式心智》框架规格 v0.1，附长期运行留下的心智存档（economy / archive epochs / traj）与只读观察窗。",
      en: "The Distributed Mind framework spec v0.1, with the archive a long run left behind (economy / archive epochs / traj) and a read-only observation window.",
    },
    entry: "node renderer/server.js --mind ./mind --port 7777",
    repoUrl: null,
  },
  {
    key: "mindos",
    name: "MindOS",
    tags: ["mind"],
    kind: { zh: "运行时 (TS)", en: "Runtime (TS)" },
    status: "prototype",
    summary: {
      zh: "File Mind OS：文件即数据库的本地心智系统，append-only 事件总线 + context assembler + Dashboard。",
      en: "File Mind OS: a local mind where the filesystem is the database — append-only event bus, context assembler, and dashboard.",
    },
    entry: "npm run dev",
    repoUrl: "https://github.com/LiDeChi/MindOS",
  },
  {
    key: "mindfile",
    name: "mindfile",
    tags: ["mind"],
    kind: { zh: "运行时 (Node)", en: "Runtime (Node)" },
    status: "prototype",
    summary: {
      zh: "分布式心智 MVP：brain/ 目录即大脑，fs.watch + SSE 实时显影，零依赖 Node ≥ 20。",
      en: "A minimal distributed mind: the brain/ directory is the brain, rendered live over fs.watch + SSE, zero dependencies on Node ≥ 20.",
    },
    entry: "node server.js  # http://localhost:4321",
    repoUrl: "https://github.com/LiDeChi/mindfile",
  },
  {
    key: "codemind",
    name: "CodeMind",
    tags: ["mind"],
    kind: { zh: "运行时 (TS)", en: "Runtime (TS)" },
    status: "prototype",
    summary: {
      zh: "file-as-mind：Markdown、不可变修订与 append-only JSONL 作为事实源，SQLite 只作可重建投影。",
      en: "file-as-mind: Markdown, immutable revisions, and append-only JSONL are the source of truth; SQLite is only a rebuildable projection.",
    },
    entry: "npm run dev",
    repoUrl: null,
  },
  {
    key: "mind0711",
    name: "mind0711",
    tags: ["mind"],
    kind: { zh: "运行时 (Python)", en: "Runtime (Python)" },
    status: "prototype",
    summary: {
      zh: "MAC 三层意识体原型：机器层唯一意识主循环（感知 / 注意 / 预测 / 压缩记忆 / 通信建模 / 驱动力）。",
      en: "A three-layer MAC consciousness prototype: one machine-layer main loop covering perception, attention, prediction, compressed memory, communication modelling, and drive.",
    },
    entry: "python3 web.py  # http://localhost:8711",
    repoUrl: "https://github.com/LiDeChi/mind0711",
  },
  {
    key: "mindcodex0711",
    name: "mindcodex0711",
    tags: ["mind"],
    kind: { zh: "规格 + 运行时", en: "Spec + runtime" },
    status: "prototype",
    summary: {
      zh: "MindCodex MAC：统一逻辑心智 + 多机器执行节点的控制平面（事件、注意力、记忆压缩、存在预测、策略门）。",
      en: "MindCodex MAC: a unified logical mind plus a control plane for several execution nodes — events, attention, memory compression, existence prediction, policy gates.",
    },
    entry: "python3 -m mindcodex demo",
    repoUrl: "https://github.com/LiDeChi/mindcodex-mac",
  },
  {
    key: "mind0714",
    name: "mind0714",
    latin: "Minimal RLM Environment",
    tags: ["mind"],
    kind: { zh: "运行时 (Node)", en: "Runtime (Node)" },
    status: "prototype",
    summary: {
      zh: "文件驱动、持续存在的心智环境：Executive 心跳调度 + 有界工具 + 意识流界面。",
      en: "A file-driven, persistently existing mind environment: Executive heartbeat scheduling, bounded tools, and a stream-of-consciousness UI.",
    },
    entry: "npm start",
    repoUrl: "https://github.com/LiDeChi/minimal-rlm-environment",
  },
  {
    key: "machine-being",
    name: "machine-being",
    tags: ["mind", "alife"],
    kind: { zh: "运行时 (Python)", en: "Runtime (Python)" },
    status: "active",
    summary: {
      zh: "机器内宇宙：持续世界保存事实、分支世界做反事实实验、观察房间显影、实验室世界按契约采集源世界。",
      en: "An inner universe for a machine: a persistent world keeps facts, branch worlds run counterfactuals, an observation room renders state, and a laboratory world samples the source world under contract.",
    },
    entry: "python -m machine_being.cli serve --db var/runtime.sqlite --port 8765",
    repoUrl: null,
  },
  {
    key: "dongzhou",
    name: "东周",
    latin: "ZuoZhuan World",
    tags: ["alife", "society"],
    kind: { zh: "实验 + 查看器", en: "Experiment + viewer" },
    status: "draft",
    summary: {
      zh: "给 agent《左传》前半段史料，让它自己构造一个可运行的郑国世界；停掉史料后看世界自行发展，再揭开后文比较机制差异。",
      en: "Hand an agent the first half of the Zuo Zhuan and let it build a runnable Zheng world; cut the source, watch the world evolve on its own, then reveal the rest and compare mechanisms.",
    },
    entry: "python3 serve.py",
    repoUrl: null,
  },
  {
    key: "multiscale",
    name: "multiscale",
    tags: ["alife"],
    kind: { zh: "研究笔记", en: "Research notes" },
    status: "draft",
    summary: {
      zh: "不直接定义细胞或更小的尺度，而是从个体尺度出发，让系统自己找出更小尺度上合理的组织规则。",
      en: "Rather than defining cells or smaller scales up front, start from the individual scale and let the system find a plausible organisation rule at a smaller one.",
    },
    entry: null,
    repoUrl: null,
  },
  {
    key: "self-referring",
    name: "规则即身体",
    latin: "Rules-as-Body",
    tags: ["alife"],
    kind: { zh: "可交互 Demo", en: "Interactive demo" },
    status: "active",
    summary: {
      zh: "一个可交互的人工生命 demo：规则不是后台代码，而是生命身体里可被感知、搬动、复制、重接的结构。",
      en: "An interactive artificial-life demo: rules are not backend code but structures inside a living body that can be sensed, moved, copied, and rewired.",
    },
    entry: "bash serve.sh  # http://localhost:8787",
    repoUrl: null,
  },
  {
    key: "control_itself",
    name: "control itself",
    tags: ["alife"],
    kind: { zh: "可交互 Demo", en: "Interactive demo" },
    status: "active",
    summary: {
      zh: "智能体学会运行自己的代码语言，把解释器接到时钟上；外部内核撤出后，下一拍由它们自己的解释器执行。",
      en: "Agents learn to run their own language and wire the interpreter into the clock; once the external kernel withdraws, the next tick runs on their own interpreter.",
    },
    entry: "python3 main.py  # http://127.0.0.1:8770/",
    repoUrl: null,
  },
  {
    key: "brain",
    name: "Brain",
    tags: ["brain", "mind"],
    kind: { zh: "运行时 (Python)", en: "Runtime (Python)" },
    status: "active",
    summary: {
      zh: "世界 → 神经元 → 认知校验链：RatInABox 世界接 Brian2 脉冲再接 NeuroGym 任务，可从下游脉冲岭回归解码回位置。",
      en: "A world → neuron → cognition verification chain: a RatInABox world feeds Brian2 spiking neurons and a NeuroGym task, with position decodable back out of downstream spikes.",
    },
    entry: "./run.sh  # 自动 uv sync",
    repoUrl: null,
  },
  {
    key: "mind-society",
    name: "mind-society",
    tags: ["society"],
    kind: { zh: "运行时 (Python)", en: "Runtime (Python)" },
    status: "active",
    summary: {
      zh: "双层心智（System 1 联想 / System 2 心智理论）× 确定性 2D 世界：符号涌现、欺骗与规范重构的最小闭环。",
      en: "A two-tier mind (System 1 association / System 2 theory of mind) in a deterministic 2D world: a minimal closed loop for symbol emergence, deception, and norm rewriting.",
    },
    entry: "python3 projects/mind-society/main.py --web",
    repoUrl: null,
  },
  {
    key: "lang1",
    name: "lang1",
    tags: ["society"],
    kind: { zh: "研究内核 + 实验", en: "Kernel + experiments" },
    status: "prototype",
    summary: {
      zh: "最小 spatial cell primitives 内核 + 可证伪实验：闸门、递归、粗粒化闭合、印迹链、约定形成、规则迁移，以及 Keeper 撤出（含对抗性 LLM 重复实验与负结果归档）。",
      en: "A minimal spatial-cell-primitive kernel plus falsifiable experiments: gates, recursion, coarse-graining closure, trace chains, convention formation, rule migration, and Keeper withdrawal — including adversarial LLM repeats and archived negative results.",
    },
    entry: "python3 main.py gate  # 或 bash scripts/verify.sh",
    repoUrl: null,
  },
  {
    key: "town",
    name: "Town Agents",
    tags: ["society", "alife"],
    kind: { zh: "运行时 (Godot)", en: "Runtime (Godot)" },
    status: "active",
    summary: {
      zh: "程序化城镇 + LLM 驱动居民智能体：关系、对话、市政协作、连续性存档。",
      en: "A procedural town with LLM-driven resident agents: relationships, dialogue, civic collaboration, and continuity saves.",
    },
    entry: "godot -e --path .",
    repoUrl: "https://github.com/LiDeChi/town-agents-godot",
  },
];

export const FAMILY_STATUS_LABELS: Record<
  FamilyProject["status"],
  LocalizedText
> = {
  active: { zh: "在跑", en: "Active" },
  prototype: { zh: "原型", en: "Prototype" },
  archive: { zh: "存档", en: "Archive" },
  draft: { zh: "想法", en: "Draft" },
};

export const FAMILY_SOURCE_LABEL: LocalizedText = {
  zh: "登记表：mind-society",
  en: "Registry: mind-society",
};
