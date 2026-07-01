import type { Lang } from '../i18n/lang'
import { FROME_TWEET_ARTICLES } from './fromeTweets'

export type BilingualText = Record<Lang, string>

export type BlogContentBlock =
  | {
      type: 'heading'
      text: BilingualText
    }
  | {
      type: 'paragraph'
      text: BilingualText
    }
  | {
      type: 'list'
      items: BilingualText[]
    }
  | {
      type: 'figure'
      src: string
      alt: BilingualText
      caption: BilingualText
    }

export type BlogArticle = {
  id: string
  title: BilingualText
  date: string
  category: BilingualText
  summary: BilingualText
  note: BilingualText
  paragraphs: BilingualText[]
  blocks?: BlogContentBlock[]
  source?: 'site' | 'x' | 'substack'
  sourceUrl?: string | null
  originalPublishedAt?: string | null
}

const AGENT_SYSTEM_ARTICLE: BlogArticle = {
  id: 'large-world-agent-system',
  title: {
    zh: '大世界：Agent System 整理',
    en: 'Large World: Notes on Agent Systems',
  },
  date: '2026.06.29',
  category: {
    zh: 'Agent System',
    en: 'Agent System',
  },
  summary: {
    zh: '一个生成 agent loop 的系统，不只是制造子代理，而是管理资源、历史、注意力、tick、感知、协作和消亡。',
    en: 'A system that generates agent loops, not merely child agents, and manages resources, history, attention, ticks, perception, collaboration, and disappearance.',
  },
  note: {
    zh: '',
    en: '',
  },
  source: 'site',
  sourceUrl: null,
  originalPublishedAt: null,
  paragraphs: [],
  blocks: [
    {
      type: 'paragraph',
      text: {
        zh: '一个应用放一个 agent system。这个 system 本身也是一个工具，也可能是一个 agent。它向主 agent 暴露 API，让主 agent 借助它生成更多 agent，去补足人和环境互动时缺少的工具。',
        en: 'Each application can hold one agent system. The system itself is a tool, and may also be an agent. It exposes APIs to the main agent, letting that agent create more agents when humans lack tools for interacting with the environment.',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '系统的产出不是一个孤立的 agent，而是一个 agent loop：能感知、调用工具、行动、接收反馈、继续学习，也能在资源不足或反馈消失时减速、压缩、被收回。',
        en: 'The output is not an isolated agent, but an agent loop: it can perceive, call tools, act, receive feedback, keep learning, and also slow down, compress, or be reclaimed when resources or feedback disappear.',
      },
    },
    {
      type: 'list',
      items: [
        {
          zh: '真正关键的不是“生成子代理”，而是资源分配、通信协作、历史、注意力、tick 与感知、agent 的存在与消亡。',
          en: 'The core is not simply “creating subagents,” but resource allocation, communication, history, attention, ticks and perception, and the birth and disappearance of agents.',
        },
        {
          zh: '系统应该接收模糊需求，而不只接收结构化需求。它要能推测“你可能会喜欢这样”，并据此创造合适的 agent。',
          en: 'The system should accept vague needs, not only structured requirements. It should infer “you might like this” and create suitable agents from that imagination.',
        },
      ],
    },
    {
      type: 'figure',
      src: '/blog/agent-system/system-map.png',
      alt: {
        zh: 'Agent System 的核心模块结构图：API、历史、注意力、资源、tick 与 agent loop',
        en: 'Diagram of an agent system: API, history, attention, resources, tick, and agent loop.',
      },
      caption: {
        zh: 'Agent System 不是一个生成按钮，而是一套让 agent loop 出生、协作、学习和收回的环境。',
        en: 'An agent system is not a generate button. It is an environment where agent loops are born, collaborate, learn, and get reclaimed.',
      },
    },
    {
      type: 'heading',
      text: {
        zh: '权限、API 和必要的绕过',
        en: 'Permission, APIs, and Necessary Bypass',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '主 agent 应该尽量通过系统暴露的 API 修改系统，而不是直接修改底层代码。API 是系统和主 agent 之间的礼貌边界，也是可追踪、可审计的入口。',
        en: 'The main agent should modify the system through exposed APIs whenever possible, rather than changing the underlying code directly. APIs form a polite boundary and a traceable, auditable entry point.',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '但最后仍然需要一个强力 API，让主 agent 可以在预测到 API 不足、或者 API 路径消耗更多资源时，绕过常规路径直接改底层。绕过应该被资源惩罚，修改完成后再补充新的 API，把例外沉淀成制度。',
        en: 'Yet the system still needs a powerful API that allows bypassing the normal route when the main agent predicts the existing APIs are insufficient or more costly. Bypass should carry a resource penalty; after the change, the system should add a new API so the exception becomes institution.',
      },
    },
    {
      type: 'heading',
      text: {
        zh: '历史让系统像环境，而不是工具调用器',
        en: 'History Makes the System an Environment',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: 'Agent system 的意义在于拥有历史：它知道每个 agent 如何被创建，获得了什么权限，做过什么，什么时候减速，什么时候被收回。',
        en: 'The meaning of an agent system is that it has history: it knows how each agent was created, what permissions it received, what it did, when it slowed down, and when it was reclaimed.',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '例如，创建 agent a，约定它能阅读一个文件夹，并能编辑某些文件；再创建 agent b，给它几乎一样的权限，只是不能编辑。系统需要保留这些差异，因为这些差异就是环境的记忆。',
        en: 'For example, agent A may read a folder and edit certain files; agent B may receive almost the same permissions but cannot edit. The system must retain these differences, because they are the memory of the environment.',
      },
    },
    {
      type: 'heading',
      text: {
        zh: '注意力：谁来接收子代理的信息',
        en: 'Attention: Who Receives the Subagents',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '人会要求生成子代理，是因为注意力分身乏力；但 system 本身也会分身乏力。它产出 agent 后需要告诉你，可问题是：你又用谁来接收这些信息？',
        en: 'Humans ask for subagents because attention cannot split indefinitely; the system has the same problem. After it creates an agent, it needs to report back, but who receives that information?',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '注意力接近于组装上下文：工具列表、工具调用历史、子 agent 的反馈、当前需要做决定的信息。判断力可以集中给中央注意力，也可以让模块子 agent 带着分布式注意力；地方失败多次后提交中央，中央解决后再把方法下沉成 skill。',
        en: 'Attention is close to context assembly: tool lists, tool-call history, subagent feedback, and the current decision. Judgment can be centralized, or distributed to local agents; repeated local failure can be escalated to the center, then pushed back down as a skill after resolution.',
      },
    },
    {
      type: 'figure',
      src: '/blog/agent-system/attention-map.png',
      alt: {
        zh: '中央注意力与分布式注意力的结构图',
        en: 'Diagram comparing central attention and distributed attention.',
      },
      caption: {
        zh: '中央注意力负责理解、规划和协调；地方经验在失败后上报，解决后沉淀成可复用 skill。',
        en: 'Central attention handles understanding, planning, and coordination; local experience escalates after failure and returns as reusable skills.',
      },
    },
    {
      type: 'heading',
      text: {
        zh: 'Tick、感知、资源与闲暇',
        en: 'Ticks, Perception, Resources, and Idle Time',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: 'tick 是为了应付快速变化。监控界面的 agent 需要 tick，因为它要感知变化、发现异常、决定是否通报。但监控界面是否真的需要是 agent，也值得怀疑：如果它只是机械传递变化，那么它到底需要什么决策？',
        en: 'Ticks handle rapid change. A monitoring agent needs ticks because it perceives changes, detects anomalies, and decides whether to report. But it is worth questioning whether every monitor must be an agent: if it merely relays changes mechanically, what decision does it make?',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '资源分配也需要一个 agent。它面对的是数字，但这些数字从哪里来、数学如何构建，仍然没有说清楚。当多余资源没有分配出去，这也许就是闲暇：注意力收缩到少量工具，尝试组合工具、发现 pattern、抽象出新工具。',
        en: 'Resource allocation also needs an agent. It faces numbers, but where the numbers come from and how the math is constructed remain open. When spare resources are unallocated, perhaps that is idle time: attention narrows to a few tools, combines them, discovers patterns, and abstracts new tools.',
      },
    },
    {
      type: 'figure',
      src: '/blog/agent-system/lifecycle-map.png',
      alt: {
        zh: 'Agent 生命周期结构图：生成、运行、反馈、减速、压缩、收回',
        en: 'Agent lifecycle diagram: creation, running, feedback, slowing, compression, and reclaiming.',
      },
      caption: {
        zh: '低能耗不是静止，而是压缩。没有反馈的 agent 会减速，和被遗弃工具相关的 agent 会自然受损并被系统收回。',
        en: 'Low energy is not stillness, but compression. Agents without feedback slow down; agents tied to abandoned tools degrade and are reclaimed.',
      },
    },
    {
      type: 'heading',
      text: {
        zh: '环境、个人 agent 与“家”',
        en: 'Environment, Personal Agents, and Home',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: 'LLM 可能承接了很多先验，但真正要构建意识循环，还缺环境。环境不就是工具吗？更现实的顺序是先搭建基础环境，再让 agent 去探索和拓展环境。',
        en: 'LLMs may carry many priors, but to build a loop of consciousness, an environment is still missing. Is an environment not made of tools? A more realistic order is to build the base environment first, then let agents explore and expand it.',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '平台不是单个工具，而是一个有分发能力的环境。用户可以付费下载，也可以由他的个人 agent 决定下载。环境里的 agent 行为更符合用户喜好，个人 agent 也因此增长经验。',
        en: 'A platform is not a single tool, but an environment with distribution. Users may pay to download, or their personal agents may decide to download. Agents in the environment behave more in line with user preferences, and the personal agent gains experience in return.',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: '每个人都想要一个专属于自己的世界。这个世界不只是 3D 行走器，而是能容纳多种模态的编排，也能容纳其他环境。它是入口，也是回顾的地方，也是收集信息的地方。这不就是家吗。',
        en: 'Everyone wants a world of their own. This world is not just a 3D walking space; it can orchestrate many modalities and contain other environments. It is an entrance, a place of review, and a place to collect information. Is that not home?',
      },
    },
    {
      type: 'paragraph',
      text: {
        zh: 'App 的位置也由此变得清楚：app 是从这个世界里抽出的核心体验，是对复杂环境的一次抽象和压缩。',
        en: 'The role of an app becomes clear: an app extracts a core experience from this world. It is an abstraction and compression of a complex environment.',
      },
    },
  ],
}

const SITE_BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'substack-note-function-families',
    title: {
      zh: 'AI时代，以函数族而非函数的思想行事',
      en: 'In the AI Era, Think in Function Families, Not Single Functions',
    },
    date: '2026.03.17',
    category: {
      zh: '短帖',
      en: 'Note',
    },
    summary: {
      zh: '把 AI 时代的能力设计理解成可组合、可迁移的一组函数，而不是孤立的单点函数。',
      en: 'Treat capability design in the AI era as a composable, transferable family of functions rather than isolated single points.',
    },
    note: {
      zh: '把能力理解成一组可组合、可迁移的函数，会比盯着单个函数更接近 AI 时代的工作方式。',
      en: 'Capability design works better as a composable, transferable family of functions than as isolated single functions.',
    },
    source: 'substack',
    sourceUrl: 'https://substack.com/@parson1/note/c-229003400',
    originalPublishedAt: '2026-03-17 07:35 UTC',
    paragraphs: [],
  },
  {
    id: 'substack-note-project-skill-memory',
    title: {
      zh: '项目经验和skill经验同时沉淀，前者宏观，后者微观',
      en: 'Accumulate Project Experience and Skill Experience Together',
    },
    date: '2026.03.17',
    category: {
      zh: '短帖',
      en: 'Note',
    },
    summary: {
      zh: '经验沉淀要两条线并行：项目层复盘全局，skill 层提炼可复用动作。',
      en: 'Experience capture should run on two lines at once: project retrospectives at the macro level, reusable skills at the micro level.',
    },
    note: {
      zh: '经验沉淀最好同时走两条线：项目层复盘全局，skill 层提炼动作。',
      en: 'Experience capture works best on two tracks at once: project-level retrospectives and skill-level reusable actions.',
    },
    source: 'substack',
    sourceUrl: 'https://substack.com/@parson1/note/c-229003041',
    originalPublishedAt: '2026-03-17 07:34 UTC',
    paragraphs: [],
  },
  {
    id: 'substack-note-convergence-line',
    title: {
      zh: '找到你预期的收敛线',
      en: 'Find the Convergence Line You Expect',
    },
    date: '2026.03.16',
    category: {
      zh: '短帖',
      en: 'Note',
    },
    summary: {
      zh: '先去以逸待劳，游戏化是那条线，你选择哪种游戏。',
      en: 'Wait from a position of leverage first. Gamification is that line. Which game do you choose?',
    },
    note: {
      zh: '先判断那条真正会把事情带向收敛的线，再决定自己要参与哪种游戏。',
      en: 'Decide which line actually leads to convergence first, then choose which game you want to play.',
    },
    source: 'substack',
    sourceUrl: 'https://substack.com/@parson1/note/c-228716631',
    originalPublishedAt: '2026-03-16 17:42 UTC',
    paragraphs: [
      {
        zh: '找到你预期的收敛线',
        en: 'Find the convergence line you expect.',
      },
      {
        zh: '先去以逸待劳',
        en: 'First, wait from a position of leverage.',
      },
      {
        zh: '游戏化是那条线',
        en: 'Gamification is that line.',
      },
      {
        zh: '你选择哪种游戏',
        en: 'Which game do you choose?',
      },
    ],
  },
  {
    id: 'note-resource-sensing-and-coexistence',
    title: {
      zh: '机器要感知资源，也要学会跟人相处',
      en: 'A Machine Should Sense Resources and Learn to Live With Humans',
    },
    date: '2026.02.26',
    category: {
      zh: '短帖',
      en: 'Note',
    },
    summary: {
      zh: '如果机器要长期工作，它既要预测资源消耗，也要明白自己和人类之间的边界。',
      en: 'If a machine is meant to work over time, it should predict resource use and understand its boundary with humans.',
    },
    note: {
      zh: '先把资源感知、任务优先级和与人类相处的方式放在同一张图里。',
      en: 'Put resource sensing, task priority, and coexistence with humans on the same sketch first.',
    },
    source: 'site',
    sourceUrl: null,
    originalPublishedAt: null,
    paragraphs: [
      {
        zh: '时刻感知本机的运行资源，也预测未来的资源消耗。',
        en: 'Continuously sense the machine’s runtime resources and also predict future consumption.',
      },
      {
        zh: '它应该知道自己是一台机器，也要寻找跟人类相处的方式。',
        en: 'It should know that it is a machine and still search for a way to live alongside humans.',
      },
      {
        zh: '做预测不是为了炫耀智能，而是为了更稳地配置资源、调整方向。',
        en: 'Prediction is not for showing off intelligence, but for allocating resources and adjusting direction more steadily.',
      },
    ],
  },
  {
    id: 'substack-post-self-evolving-lobster',
    title: {
      zh: '自进化的龙虾',
      en: 'The Self-Evolving Lobster',
    },
    date: '2026.02.26',
    category: {
      zh: '长文',
      en: 'Essay',
    },
    summary: {
      zh: '时刻感知本机的运行资源，预测未来的资源消耗，预测方式不仅是定时任务，还有人类本来的习惯。',
      en: 'Continuously sense the machine’s runtime resources and predict future consumption, not only from timers but also from human habits.',
    },
    note: {
      zh: '一张把资源预测、表达能力和与人类相处方式放在一起思考的草图。',
      en: 'A sketch that places resource prediction, expressive capacity, and coexistence with humans in the same frame.',
    },
    source: 'substack',
    sourceUrl: 'https://substack.com/@parson1/p-189247112',
    originalPublishedAt: '2026-02-26 12:49 UTC',
    paragraphs: [
      {
        zh: '时刻感知本机的运行资源，预测未来的资源消耗，预测方式不仅是定时任务，还有人类本来的习惯。',
        en: 'Continuously sense the machine’s runtime resources and predict future consumption, not only from timers but also from human habits.',
      },
      {
        zh: '它应该感知它是一台机器，它知道它跟人类不同，它要找寻跟人类相处的方式',
        en: 'It should know that it is a machine, understand that it differs from humans, and search for a way to live alongside them.',
      },
      {
        zh: '它接受人类的训导，优先完成人类分派的任务，随时调整它的方向',
        en: 'It accepts human guidance, prioritizes the tasks assigned by humans, and keeps adjusting its direction.',
      },
      {
        zh: '所有历史都应该能呈现给它',
        en: 'All history should be presentable to it.',
      },
      {
        zh: '需要调试模式，方便装卸，直到OK了再交付给别的人类。',
        en: 'It needs a debug mode, easy mounting and removal, until it is ready to be handed over to other humans.',
      },
      {
        zh: '它需不需要表达自己。它需不需要连接其他机器。',
        en: 'Does it need to express itself? Does it need to connect to other machines?',
      },
      {
        zh: '它做预测是为了优化它的资源配置，本质是为了它的扩大；但是AI是否需要扩大呢，它的目标是什么？先假设它也是自私地复制。',
        en: 'It predicts in order to optimize resource allocation, essentially to expand itself. But does AI need expansion, and what is its objective? Assume first that it also reproduces selfishly.',
      },
      {
        zh: '它应该有足够的手段去表达自己。包括著作和视频各种媒体。',
        en: 'It should have enough means to express itself, including writing, video, and other media.',
      },
      {
        zh: '它应该了解当今时代对AI、对AGI的认知，所有的期盼和担忧。它应该要回应它们。这也是找寻跟人类相处方式的过程。',
        en: 'It should understand this era’s views of AI and AGI, along with all the hopes and anxieties around them, and respond to them. That too is part of finding a way to live with humans.',
      },
    ],
  },
  {
    id: 'blog-agent-loop',
    title: {
      zh: '把 Agent 工作流落到产品日常：从 Prompt 到闭环迭代',
      en: 'Operationalizing Agent Workflows: From Prompts to Closed-Loop Iteration',
    },
    date: '2026.02.10',
    category: {
      zh: 'AI 工作流',
      en: 'AI Workflow',
    },
    summary: {
      zh: '把多 Agent 协作拆成可观测状态机，核心目标是缩短“想法到验证”的回路。',
      en: 'I decompose multi-agent collaboration into observable state machines to shorten the loop from idea to validation.',
    },
    note: {
      zh: '关键不是模型参数，而是任务状态可追踪、可回放、可重试。',
      en: 'The key is not model tuning, but whether task states are traceable, replayable, and retryable.',
    },
    source: 'site',
    sourceUrl: null,
    originalPublishedAt: null,
    paragraphs: [
      {
        zh: '过去团队里最大的问题不是“不会写 Prompt”，而是信息在多个对话、文档和临时表格之间来回丢失。我们把任务拆解为固定阶段：问题定义、候选方案、实验执行、结果归档，并给每个阶段绑定标准输入输出。',
        en: 'The biggest issue in prior teams was not prompt quality, but losing context across chats, docs, and ad-hoc sheets. We decomposed work into fixed stages: problem framing, option design, experiment execution, and outcome archival, each with explicit inputs and outputs.',
      },
      {
        zh: '一旦流程结构化，Agent 的价值才会显现。它不只是生成内容，而是承担批量比对、异常提醒和复盘摘要这类重复性高的环节，把人从机械整理中解放出来。',
        en: 'Once the workflow is structured, the value of agents becomes tangible. They are not just content generators, but engines for bulk comparison, anomaly alerts, and review summaries, freeing people from repetitive coordination work.',
      },
      {
        zh: '最终收益来自节奏稳定。每一轮迭代都能知道“上一轮假设是什么、失败在哪、下一轮怎么改”，这比单次高光结果更重要。',
        en: 'The long-term gain comes from stable cadence. In each cycle, we can answer what the previous hypothesis was, why it failed, and what changes next, which matters more than isolated one-off wins.',
      },
    ],
  },
  {
    id: 'blog-economy-modeling',
    title: {
      zh: '游戏经济系统的可解释建模：RTP、奖池与软回归',
      en: 'Interpretable Economy Modeling: RTP, Prize Pools, and Soft Reversion',
    },
    date: '2026.01.28',
    category: {
      zh: '游戏经济',
      en: 'Game Economy',
    },
    summary: {
      zh: '统一体验稳定性与商业目标，需要先把参数关系转成可验证模型。',
      en: 'Balancing player experience and business targets starts with turning parameter relations into verifiable models.',
    },
    note: {
      zh: '把“调参”升级为“实验设计”，能显著降低线上波动风险。',
      en: 'Upgrading from parameter tweaking to experiment design significantly reduces online volatility risk.',
    },
    source: 'site',
    sourceUrl: null,
    originalPublishedAt: null,
    paragraphs: [
      {
        zh: '很多数值系统看起来复杂，实际可拆成几条稳定约束：返奖率区间、波动控制、玩家体感节奏。我们把这些约束写成明确的检查指标，而不是依赖经验口头传递。',
        en: 'Many numerical systems look complex, but they can be reduced to stable constraints: payout ranges, volatility control, and perceived pacing. We formalized these as measurable checks instead of oral know-how.',
      },
      {
        zh: '奖池与税池机制的重点在于回归速度可控。软回归不是“慢慢回去”这么简单，而是要在不同玩家分层和付费阶段中保持一致预期，避免出现局部极端体验。',
        en: 'For prize-pool and tax-pool mechanics, controllable reversion speed is the core. Soft reversion is not simply “slower return”; it must preserve consistent expectations across segments and spend phases to avoid local extremes.',
      },
      {
        zh: '当模型可解释后，A/B 测试就不再是盲试。每个参数变化都带着明确假设进入实验，结果也能快速回写到下一轮配置。',
        en: 'With interpretable models, A/B testing is no longer blind trial-and-error. Each parameter change enters with a clear hypothesis, and results can be fed directly into the next configuration cycle.',
      },
    ],
  },
  {
    id: 'blog-data-automation',
    title: {
      zh: '从手工报表到自动分析：让数据真正服务策划决策',
      en: 'From Manual Reports to Automated Analytics for Better Product Decisions',
    },
    date: '2026.01.15',
    category: {
      zh: '数据运营',
      en: 'Data Ops',
    },
    summary: {
      zh: '把报表自动化做对，策划团队才能把时间投入到策略判断，而不是搬运数字。',
      en: 'When reporting automation is done right, product teams can spend time on strategy instead of moving numbers around.',
    },
    note: {
      zh: '自动化的价值，在于让“例行工作零摩擦”。',
      en: 'Automation creates value when routine work becomes almost frictionless.',
    },
    source: 'site',
    sourceUrl: null,
    originalPublishedAt: null,
    paragraphs: [
      {
        zh: '如果每次复盘都要先花两小时整理数据，策略讨论就会被疲劳消耗。我们先定义了固定的指标字典，再把 SQL 查询、图表生成和周报模板串成脚本流水线。',
        en: 'If every review starts with two hours of data cleanup, strategic discussion gets exhausted before it starts. We first standardized a metrics dictionary, then chained SQL queries, chart generation, and weekly templates into scripts.',
      },
      {
        zh: '统一口径带来的好处非常直接：同一指标在不同项目、不同阶段可横向对比，团队沟通不再陷入“到底哪个数字才对”的争论。',
        en: 'The benefit of metric consistency is immediate: the same metric becomes comparable across projects and phases, and teams stop arguing about which number is “the real one.”',
      },
      {
        zh: '数据平台不是替代判断，而是降低判断成本。信息到位后，策划可以更快地发现异常、形成假设并推进实验。',
        en: 'A data platform does not replace human judgment; it reduces the cost of judgment. With high-quality signal in place, teams detect anomalies faster, form hypotheses sooner, and run experiments with less drag.',
      },
    ],
  },
  {
    id: 'blog-portfolio-thinking',
    title: {
      zh: '作品集不是截图墙：如何讲清一个项目的决策逻辑',
      en: 'A Portfolio Is Not a Screenshot Wall: Showing Decision Logic Clearly',
    },
    date: '2025.12.30',
    category: {
      zh: '作品集方法',
      en: 'Portfolio',
    },
    summary: {
      zh: '优秀作品集应该回答“为什么这么做”，而不只是“做了什么”。',
      en: 'A strong portfolio should answer why decisions were made, not only what was shipped.',
    },
    note: {
      zh: '展示结果很容易，展示决策过程才有说服力。',
      en: 'Results are easy to display; decision process is what builds credibility.',
    },
    source: 'site',
    sourceUrl: null,
    originalPublishedAt: null,
    paragraphs: [
      {
        zh: '我在整理作品集时，优先保留四类证据：目标定义、关键约束、方案权衡和上线反馈。这样读者可以快速理解项目中的真实决策环境。',
        en: 'When curating portfolio entries, I prioritize four evidence types: objective definition, hard constraints, option trade-offs, and post-launch feedback. This helps readers understand the actual decision environment quickly.',
      },
      {
        zh: '同一个功能在不同团队条件下会有完全不同的实现路径。作品集最有价值的部分，是你如何在资源有限的情况下做取舍。',
        en: 'The same feature can take very different paths under different team constraints. The most valuable part of a portfolio is how you made trade-offs under limited resources.',
      },
      {
        zh: '因此我把每个项目都拆成可独立访问的子域名页面，既能单独传播，也方便持续迭代和补充复盘。',
        en: 'That is why each project is published as an independently accessible subdomain page, making it easy to share, iterate, and append retrospective insights over time.',
      },
    ],
  },
]

export const BLOG_ARTICLES: BlogArticle[] = [
  AGENT_SYSTEM_ARTICLE,
  ...FROME_TWEET_ARTICLES,
  ...SITE_BLOG_ARTICLES,
]
