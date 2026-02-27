import type { Lang } from '../i18n/lang'

export type BilingualText = Record<Lang, string>

export type BlogArticle = {
  id: string
  title: BilingualText
  date: string
  category: BilingualText
  summary: BilingualText
  note: BilingualText
  paragraphs: BilingualText[]
}

export const BLOG_ARTICLES: BlogArticle[] = [
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
