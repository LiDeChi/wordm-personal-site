import type { Lang } from '../i18n/lang'

type ResumeSectionProps = {
  lang: Lang
}

const RESUME_COPY = {
  zh: {
    title: '简历',
    profileSummary: '个人概述',
    profile:
      '5 年游戏策划经验，专注数值与经济系统、A/B 测试与数据闭环。熟练使用 SQL / Python / Excel，并将 AI Agent 与自动化流程引入日常分析与迭代。',
    contact: '联系方式',
    location: '所在地',
    locationValue: '广州 / 深圳',
    downloadPdf: '下载 PDF 简历',
    skillsTitle: '核心技能',
    skills: [
      '游戏数值策划：RTP、奖池/税池结构、软回归与参数化平衡',
      '数据分析：SQL（留存/漏斗/付费分布）、Python（Pandas/回归/蒙特卡洛）、Excel',
      'AI 自动化：Prompt/Agent、自动报表、参数搜索与迭代流程自动化',
      '跨团队协作：策划、美术、客户端、后端联动推进版本迭代',
    ],
    experienceTitle: '工作经历',
    exp1Role: '游戏数值策划 / 产品经理',
    exp1Bullets: [
      '负责 30+ 游戏方向（捕鱼/老虎机/转盘/棋牌/Ludo），参与经济系统与玩法迭代。',
      '重构捕鱼/老虎机经济系统，提升黏性并保持 RTP 与回归速度稳定可控。',
      '设计统一水池机制与 Ludo 陪玩机器人算法，优化体验与系统稳定性。',
      '构建从配置到测试的自动化流程，并尝试用 AI Agent 自动搜索更优参数。',
    ],
    exp2Role: '系统策划 / 数据分析',
    exp2Bullets: [
      '负责核心系统与商业化设计，联动数值平衡与运营活动。',
      '参与核心玩法与世界观方向设计，推进建筑与布局系统数值落地。',
    ],
    exp3Role: '研策实习 - 初级策划',
    exp3Bullets: ['参与 SLG 项目战力、天气等系统搭建，输出竞品分析与对标研究。'],
    educationTitle: '教育背景',
    educationText: '华南师范大学 · 统计学学士',
    objectiveTitle: '求职意向',
    objectiveText: '高级数值策划 / 经济系统策划 / 数据驱动型产品（游戏）',
    objectiveSub: '偏好重视 AI 与快速迭代的团队，地点广州/深圳，可快速到岗。',
  },
  en: {
    title: 'Resume',
    profileSummary: 'Profile Summary',
    profile:
      '5 years in game design with a focus on economy balancing, A/B experimentation, and analytics feedback loops. Skilled in SQL, Python, and Excel, with practical AI-agent automation in daily iteration workflows.',
    contact: 'Contact',
    location: 'Location',
    locationValue: 'Guangzhou / Shenzhen',
    downloadPdf: 'Download PDF Resume',
    skillsTitle: 'Core Skills',
    skills: [
      'Game economy design: RTP, pool/tax structures, soft reversion, and parameter balancing',
      'Data analytics: SQL (retention/funnel/payment distribution), Python (Pandas/regression/Monte Carlo), Excel',
      'AI automation: Prompt/Agent pipelines, auto reporting, parameter search, and iteration tooling',
      'Cross-functional delivery: coordinating design, art, client, and backend teams',
    ],
    experienceTitle: 'Experience',
    exp1Role: 'Game Economy Designer / Product Manager',
    exp1Bullets: [
      'Worked across 30+ game directions (fishing, slots, wheel, board, Ludo), driving economy and gameplay iterations.',
      'Rebuilt fishing/slot economy systems to improve engagement while keeping RTP and reversion speed stable.',
      'Designed a unified pool mechanism and Ludo companion-bot strategy to improve consistency.',
      'Built automation from configuration to test loops and explored AI-agent parameter search.',
    ],
    exp2Role: 'System Designer / Data Analyst',
    exp2Bullets: [
      'Owned core systems and monetization features in collaboration with balance and operations.',
      'Contributed to core gameplay and world-building directions, including architecture/layout value tuning.',
    ],
    exp3Role: 'Design Intern',
    exp3Bullets: ['Participated in SLG system setup (power progression, weather), with competitor benchmarking reports.'],
    educationTitle: 'Education',
    educationText: 'South China Normal University · B.S. in Statistics',
    objectiveTitle: 'Target Roles',
    objectiveText: 'Senior Economy Designer / Game Economy Planner / Data-Driven Product Roles',
    objectiveSub: 'Prefer teams that value AI-enabled execution and rapid iteration. Open to Guangzhou/Shenzhen.',
  },
} as const

export function ResumeSection({ lang }: ResumeSectionProps) {
  const copy = RESUME_COPY[lang]

  return (
    <section id="resume" className="resume-section">
      <h2>{copy.title}</h2>

      <div className="abstract-block">
        <span className="abstract-label">{copy.profileSummary}</span>
        <p>{copy.profile}</p>
        <p style={{ marginBottom: 0 }}>
          <span className="mono">{copy.contact}:</span> <a href="mailto:parsonjian@gmail.com">parsonjian@gmail.com</a>
          {' · '}
          <span className="mono">{copy.location}:</span> {copy.locationValue}
          {' · '}
          <a href="/jian-yongjie-resume.pdf" target="_blank" rel="noreferrer">
            {copy.downloadPdf}
          </a>
        </p>
      </div>

      <div className="resume-block">
        <h3>{copy.skillsTitle}</h3>
        <ul>
          {copy.skills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="resume-block">
        <h3>{copy.experienceTitle}</h3>
        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州加悦游戏科技有限公司</strong>
            <span className="mono">2023.03 - 2025.08</span>
          </div>
          <p className="meta">{copy.exp1Role}</p>
          <ul>
            {copy.exp1Bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州浩动网络科技有限公司</strong>
            <span className="mono">2021.03 - 2022.12</span>
          </div>
          <p className="meta">{copy.exp2Role}</p>
          <ul>
            {copy.exp2Bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州星辉娱乐有限公司 (RASTAR)</strong>
            <span className="mono">2020.04 - 2020.08</span>
          </div>
          <p className="meta">{copy.exp3Role}</p>
          <ul>
            {copy.exp3Bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="resume-block">
        <h3>{copy.educationTitle}</h3>
        <p>
          {copy.educationText}
          <br />
          CET-6
        </p>
      </div>

      <div className="resume-block">
        <h3>{copy.objectiveTitle}</h3>
        <p>
          {copy.objectiveText}
          <br />
          {copy.objectiveSub}
        </p>
      </div>
    </section>
  )
}

