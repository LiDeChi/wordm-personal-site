export function ResumeSection() {
  return (
    <section id="resume" className="resume-section">
      <h2>简历 / Resume</h2>

      <div className="abstract-block">
        <span className="abstract-label">Profile Summary</span>
        <p>
          5 年游戏策划经验，专注数值与经济系统、A/B 测试与数据闭环。熟练使用 SQL / Python / Excel，
          并将 AI Agent 与自动化流程引入日常分析与迭代。
        </p>
        <p style={{ marginBottom: 0 }}>
          <span className="mono">Contact:</span> <a href="mailto:parsonjian@gmail.com">parsonjian@gmail.com</a>
          {' · '}
          <span className="mono">Location:</span> 广州 / 深圳
          {' · '}
          <a href="/jian-yongjie-resume.pdf" target="_blank" rel="noreferrer">
            下载 PDF 简历
          </a>
        </p>
      </div>

      <div className="resume-block">
        <h3>核心技能</h3>
        <ul>
          <li>游戏数值策划：RTP、奖池/税池结构、软回归与参数化平衡</li>
          <li>数据分析：SQL（留存/漏斗/付费分布）、Python（Pandas/回归/蒙特卡洛）、Excel</li>
          <li>AI 自动化：Prompt/Agent、自动报表、参数搜索与迭代流程自动化</li>
          <li>跨团队协作：策划、美术、客户端、后端联动推进版本迭代</li>
        </ul>
      </div>

      <div className="resume-block">
        <h3>工作经历</h3>
        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州加悦游戏科技有限公司</strong>
            <span className="mono">2023.03 - 2025.08</span>
          </div>
          <p className="meta">游戏数值策划 / 产品经理</p>
          <ul>
            <li>负责 30+ 游戏方向（捕鱼/老虎机/转盘/棋牌/Ludo），参与经济系统与玩法迭代。</li>
            <li>重构捕鱼/老虎机经济系统，提升黏性并保持 RTP 与回归速度稳定可控。</li>
            <li>设计统一水池机制与 Ludo 陪玩机器人算法，优化体验与系统稳定性。</li>
            <li>构建从配置到测试的自动化流程，并尝试用 AI Agent 自动搜索更优参数。</li>
          </ul>
        </div>

        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州浩动网络科技有限公司</strong>
            <span className="mono">2021.03 - 2022.12</span>
          </div>
          <p className="meta">系统策划 / 数据分析</p>
          <ul>
            <li>负责核心系统与商业化设计，联动数值平衡与运营活动。</li>
            <li>参与核心玩法与世界观方向设计，推进建筑与布局系统数值落地。</li>
          </ul>
        </div>

        <div className="resume-item">
          <div className="resume-item-head">
            <strong>广州星辉娱乐有限公司 (RASTAR)</strong>
            <span className="mono">2020.04 - 2020.08</span>
          </div>
          <p className="meta">研策实习 - 初级策划</p>
          <ul>
            <li>参与 SLG 项目战力、天气等系统搭建，输出竞品分析与对标研究。</li>
          </ul>
        </div>
      </div>

      <div className="resume-block">
        <h3>教育背景</h3>
        <p>
          华南师范大学 · 统计学学士
          <br />
          CET-6
        </p>
      </div>

      <div className="resume-block">
        <h3>求职意向</h3>
        <p>
          高级数值策划 / 经济系统策划 / 数据驱动型产品（游戏）
          <br />
          偏好重视 AI 与快速迭代的团队，地点广州/深圳，可快速到岗。
        </p>
      </div>
    </section>
  )
}
