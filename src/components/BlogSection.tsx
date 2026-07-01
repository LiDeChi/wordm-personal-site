type BlogPost = {
  id: string
  title: string
  date: string
  category: string
  excerpt: string
}

const blogPosts: BlogPost[] = [
  {
    id: 'agent-loop',
    title: '把 Agent 工作流落到产品日常：从 Prompt 到闭环迭代',
    date: '2026.02.10',
    category: 'AI Workflow',
    excerpt:
      '记录如何把多 Agent 任务拆解、执行与回传流程做成标准化循环，核心是把“任务状态”变成可追踪的数据对象。',
  },
  {
    id: 'economy-sim',
    title: '游戏经济系统的可解释建模：RTP、奖池与软回归',
    date: '2026.01.28',
    category: 'Game Economy',
    excerpt:
      '通过参数化水池机制与分层场景控制，把“体验稳定性”和“营收目标”统一到同一套可回放模型，减少拍脑袋调参。',
  },
  {
    id: 'speed-stack',
    title: '小团队提速方法：策略、工程与自动化的一体化实践',
    date: '2026.01.15',
    category: 'Product Ops',
    excerpt:
      '从需求澄清、实验设计、数据回收到发布复盘，形成一个 1-2 周可复用的快速迭代模板，支撑作品持续产出。',
  },
]

export function BlogSection() {
  return (
    <section id="blog">
      <h2>博客 / Blog</h2>
      {blogPosts.map((post) => (
        <article key={post.id} className="blog-entry">
          <div className="paper-meta">
            <span>{post.date}</span>
            <span>{post.category}</span>
          </div>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </section>
  )
}
