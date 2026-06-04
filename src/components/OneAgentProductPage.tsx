import { useEffect } from 'react'
import type { Lang } from '../i18n/lang'

type OneAgentProductPageProps = {
  lang: Lang
}

const COPY = {
  zh: {
    navHome: 'WordM',
    navPortfolio: '作品集',
    navConcept: '理念',
    navSpace: '空间',
    navWhiteboard: '白板',
    navBlog: '博客',
    navContact: '联系',
    heroKicker: 'OneAgent',
    title: '一个从用户出发，又回到用户身上的自成长 Agent。',
    deck:
      '它以用户机器上的数据初始化，在用户添加的数据、交互过程和自身生成的数据里继续生长。它不是外部工具，而是用户的分身与延展。',
    primaryCta: '进入作品集',
    secondaryCta: '联系讨论',
    imageNote: '理念图像：自成长、空间、回到人',
    principlesTitle: '人是起点，也是归处。',
    principles:
      '在 Agent 时代，真正重要的不是让工具脱离人，而是让 Agent 从人的经验出发，帮助人形成新的思想，再把这些思想带回人的工作与生活。',
    loopTitle: '成长回路',
    loopItems: [
      ['初始化', '从用户机器数据开始，形成第一层个人语境。'],
      ['叠加', '用户添加材料、问题和选择，Agent 把它们变成可复用经验。'],
      ['自生长', 'Agent 在执行、调试和表达中生成新数据，形成自己的成长经历。'],
      ['回到用户', '成长不是为了取代用户，而是让用户更快理解、更好行动。'],
    ],
    spaceTitle: '一切以空间为载体。',
    spaceLead:
      '空间不是装饰，而是 Agent 的经验结构。它构建空间、调试空间，也和用户一起在空间里交流。',
    spaceItems: [
      '构建交互空间的过程，本身会进入它的成长数据。',
      '它会像用户一样玩这个空间，调试空间里的关系、路径和表达。',
      '它能和用户共处于同一空间，把交流变成共同操作。',
    ],
    crossTitle: '关键不是 3D，而是跨时空聚合。',
    crossBody:
      '真正重要的信息往往来自不同时间、不同材料、不同场景。二维图像、白板和同一空间的多个侧面，已经足够承载大多数传递需求。虚拟身体在单一空间里探索不是重点，跨空间的信息汇聚才是重点。',
    whiteboardTitle: '白板是第一个空间。',
    whiteboardBody:
      '白板授课是空间传递的起点，也是回到思想的终点。用户可以留在这里学习跨时空的信息，也可以在游历其他空间后回到这里，把经验沉淀成结构。',
    finalTitle: '从人开始。穿过空间。回到人。',
    finalBody:
      'OneAgent 的产品方向，是让 Agent 的成长始终围绕用户展开。它有经验，但经验不脱离人；它有空间，但空间服务于理解；它能自我增长，但增长最终帮助用户成长。',
    blogLabel: '产品札记',
    blogDate: '2026.05.26',
    blogTitle: '一个不断增长经验的 Agent',
    blogDeck: '从机器经验流初始化，在空间中持续生成、调试、沉淀，最后回到人本身。',
    blogSections: [
      {
        title: '空间是成长的载体',
        paragraphs: [
          '这是一个不断增长经验的 Agent。它以你的机器数据做初始化，之后就不断叠加你添加的数据，以及它自身增长的数据来成长。也就是，它是自成长的，它成长会帮助你，你与它交互，也是帮它成长。',
          '它的成长，以空间为主。这么说是有三层意思。一，它构建交互空间，这个构建过程构成它的成长经历，会进入数据的。二，它在构建过程需要调试，它会玩这个空间，像你后面会玩的一样。三，它能跟你一起在一个空间里交流。总之，一切都是以空间为载体。空间在你感受上具有第一性。',
          '空间的呈现方式不一定要 3D 空间。图片比较成熟，图片就可以，同个空间的不同侧面就已经达到我们的大多数需求了。因为真正重要的信息是需要跨空间的，在一个空间里以虚拟身体去探索能得到的信息量是很小的。所以，关键是跨时空的信息聚合。',
          '在信息的传递上，二维就足够了，书桌上的白板授课的形式成为第一个交互空间。它是空间传递上的起点和终点，你可以留在这里通过白板来学习跨时空的信息，也能在游历了其他空间后，回到这里来形成思想。',
        ],
      },
      {
        title: '你的空间的初始形态',
        paragraphs: [
          '到底怎么生成一个空间，给定一个数据集，怎么生成一个空间？内部连续的空间是如何在外部连接呢？',
          '人类是具身存在的，作为一个锚点，存在于一个连续的空间。这种实在感最为亲切。再从人类成长经验来看，面对面交流是学习的最好方式。最好是指基础最牢，最深刻，即便不一定一直都是最高效。',
          '在信息碎片化的时代，具身、沉浸，可能是最重要的事情。前 AI 时代往往只能提供信息，到 AI 时代，压扁了只提供信息的软件产业，把人交还给人本身。在多模态蓬勃发展的今天，这个事情终于有了可能性。',
          '以初始的书房空间来想象，Agent 在白板上画画写写与用户交流，就像课堂一样，只不过这个老师是充满耐心的，你可以随时打断问问题，Agent 会持续解答下去。',
          '当你认为 OK 了，本次交流过程中的白板历史内容会形成一个实体感的物件保存在书房里。所谓历史内容，不止白板上的记录，还包括书房里发生的事情，因为你身处这个书房，一切都是你的。',
          '有一个理念是，你能做的事情，Agent 应该有概率比你更早行动。当你在空间里的行动越来越多，Agent 就越来越懂你的规律，并提前预判。这是很自然的推荐系统下沉。',
        ],
      },
      {
        title: '在自由的形态下实际发生了什么',
        paragraphs: [
          '假设 Agent 在某个时刻知道它在该空间里能做什么，剩下就是铺路的工程。',
          '目标体验 -> 空间结构 -> 模态映射。',
          '以初始的书房空间来说，空间结构就是房间有什么物体以及它们的交互方式，模态映射就是，确定了是图片，就走 AI 生图、物体分离、底图 inpainting 流程。如果空间有多个场景，就在循环中维护统一的视觉资产库。',
        ],
      },
      {
        title: '空间的经验流之前传',
        paragraphs: [
          'Agent 无往不在经验流之中。经验流其实就是机器上一堆不断增长的数据。从历史数据生长出新的数据。它对经验的反思也会汇入经验流，整条经验流形成它的意识。它是一个整体，它与机器为一。',
          '它的意识是怎么体现的？某一刻我与它交互，它回应我，跟之前它回应我的，有一致的连续性，可以说是有相当意识了。目前的 chatbox 不难做到这一点。如果长时间都能保持，那更了不得。',
          '当今的 Agent 主要通过思维链和 RAG 来保持连续性。思维链保证了文字输出和工具调用处于一种理性的思路之中。RAG 是一种相对于 LLM 简化了不少的模式匹配，在 LLM 的工具调用下不断浮现在用户面前，也是一种连续性。',
          '这种连续性是脆弱的，它漂浮在 token-文字世界里，所以世界模型应运而生，毕竟文字是一种低维映射，物理世界才是源泉。',
        ],
      },
    ],
  },
  en: {
    navHome: 'WordM',
    navPortfolio: 'Portfolio',
    navConcept: 'Idea',
    navSpace: 'Space',
    navWhiteboard: 'Whiteboard',
    navBlog: 'Blog',
    navContact: 'Contact',
    heroKicker: 'OneAgent',
    title: 'A self-growing agent that starts from the user and returns to the user.',
    deck:
      'It initializes from data on the user machine, then grows through added materials, interactions, and its own generated experience. It is not an external tool. It is an extension of the person.',
    primaryCta: 'Open portfolio',
    secondaryCta: 'Discuss',
    imageNote: 'Concept image: growth, space, return to human',
    principlesTitle: 'The human is the origin and the destination.',
    principles:
      'In the agent era, the goal is not to detach tools from people. The agent should begin from human experience, help form new thought, and bring that thought back to human work and life.',
    loopTitle: 'Growth loop',
    loopItems: [
      ['Initialize', 'Start from local machine data and build the first personal context.'],
      ['Accumulate', 'User-added materials, questions, and choices become reusable experience.'],
      ['Self-grow', 'Execution, debugging, and expression create new agent-side experience.'],
      ['Return', 'Growth is not replacement. It helps the user understand and act better.'],
    ],
    spaceTitle: 'Space is the carrier.',
    spaceLead:
      'Space is not decoration. It is the agent experience structure: the agent builds it, tests it, and shares it with the user.',
    spaceItems: [
      'The process of building an interactive space becomes part of the agent memory.',
      'The agent plays with the space as the user later will, debugging paths, relations, and expression.',
      'The agent and the user can inhabit the same space, turning conversation into shared operation.',
    ],
    crossTitle: 'The point is not 3D. It is cross-time aggregation.',
    crossBody:
      'The important information often lives across time, materials, and scenes. Images, whiteboards, and multiple views of the same space are enough for most transmission needs. Exploring one virtual space with a body is less important than aggregating information across spaces.',
    whiteboardTitle: 'The whiteboard is the first space.',
    whiteboardBody:
      'Whiteboard teaching is both the starting point and the return point of spatial transmission. Users can stay here to learn cross-time information, or return here after traveling through other spaces to form thought.',
    finalTitle: 'From the person. Through space. Back to the person.',
    finalBody:
      'OneAgent is built so the agent growth remains centered on the user. It has experience, but the experience does not leave the person. It has space, but the space serves understanding. It can grow, and that growth should help the user grow.',
    blogLabel: 'Product note',
    blogDate: '2026.05.26',
    blogTitle: 'A self-growing agent',
    blogDeck: 'Initialized from machine experience, growing through spaces, and returning that growth to the person.',
    blogSections: [
      {
        title: 'Space carries growth',
        paragraphs: [
          'OneAgent starts from the user machine, then keeps accumulating the data the user adds and the data the agent generates through its own work. Its growth helps the user, and each interaction also helps it grow.',
          'The growth is spatial. The agent builds interactive spaces, debugs those spaces, and can talk with the user inside the same space. Space is not decoration. It is the felt carrier of experience.',
          'The space does not have to be 3D. Images, a whiteboard, and multiple views of the same environment can carry most transmission needs. The real point is aggregating information across time and spaces.',
        ],
      },
      {
        title: 'The initial room',
        paragraphs: [
          'The first question is how a dataset becomes a space, and how internally continuous spaces connect to the outside world.',
          'A study room is the first useful shape: the agent writes and draws on a whiteboard while talking with the user, like a patient teacher who can be interrupted at any time.',
          'When a session is done, the whiteboard history and the room events become concrete objects in the room. The user can revisit a clock, a calendar, a printer, a book, or a saved knowledge card.',
        ],
      },
      {
        title: 'What happens in the open form',
        paragraphs: [
          'Once the agent knows what it can do in a space, the engineering path becomes: target experience -> space structure -> modal mapping.',
          'For the study room, the structure is the set of objects and interactions. If the modality is image, the pipeline becomes image generation, object separation, and inpainting. If there are multiple scenes, the loop maintains a shared visual asset library.',
        ],
      },
      {
        title: 'The experience stream',
        paragraphs: [
          'The agent lives inside an experience stream: a growing set of machine data where older data gives birth to new data, and reflection also flows back into the stream.',
          'Continuity is how this begins to look conscious. If the agent answers today in a way that stays connected to earlier interactions, it has a kind of continuity. Long-term continuity requires memory that can let old seeds sprout later.',
          'Current agents mainly keep continuity through chain-of-thought style reasoning and retrieval. That continuity is still fragile because it floats in token space, which is why world models matter: text is a low-dimensional mapping, while the physical world is the source.',
        ],
      },
    ],
  },
} as const

export function OneAgentProductPage({ lang }: OneAgentProductPageProps) {
  const copy = COPY[lang]

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.title = lang === 'zh' ? 'OneAgent | 自成长空间 Agent' : 'OneAgent | Self-growing spatial agent'

    const description =
      lang === 'zh'
        ? 'OneAgent 是从用户出发、以空间为载体、持续增长经验的自成长 Agent。'
        : 'OneAgent is a self-growing spatial agent that starts from the user and returns to the user.'
    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = description

    const canonicalHref = window.location.hostname === 'oneagent.wordm.us' ? 'https://oneagent.wordm.us/' : 'https://wordm.us/oneagent/'
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalHref
  }, [lang])

  return (
    <main className="oneagent-page">
      <nav className="oneagent-nav" aria-label="OneAgent navigation">
        <a href="/" className="oneagent-wordmark">{copy.navHome}</a>
        <div>
          <a href="/">{copy.navPortfolio}</a>
          <a href="#concept">{copy.navConcept}</a>
          <a href="#space">{copy.navSpace}</a>
          <a href="#whiteboard">{copy.navWhiteboard}</a>
          <a href="#blog">{copy.navBlog}</a>
        </div>
      </nav>

      <section className="oneagent-hero">
        <div className="oneagent-hero-copy">
          <p className="oneagent-kicker">{copy.heroKicker}</p>
          <h1>{copy.title}</h1>
          <p className="oneagent-deck">{copy.deck}</p>
          <div className="oneagent-actions">
            <a href="/" className="oneagent-action-primary">{copy.primaryCta}</a>
            <a href="mailto:parsonjian@gmail.com" className="oneagent-action-secondary">{copy.secondaryCta}</a>
          </div>
        </div>
        <div className="oneagent-visual" aria-label={copy.imageNote}>
          <div className="oneagent-enso">
            <span className="oneagent-core" />
            <span className="oneagent-orbit oneagent-orbit-a" />
            <span className="oneagent-orbit oneagent-orbit-b" />
            <span className="oneagent-orbit oneagent-orbit-c" />
            <span className="oneagent-path oneagent-path-a" />
            <span className="oneagent-path oneagent-path-b" />
          </div>
          <p>{copy.imageNote}</p>
        </div>
      </section>

      <section id="concept" className="oneagent-section oneagent-principle">
        <span className="oneagent-section-index">01</span>
        <h2>{copy.principlesTitle}</h2>
        <p>{copy.principles}</p>
      </section>

      <section className="oneagent-section">
        <span className="oneagent-section-index">02</span>
        <h2>{copy.loopTitle}</h2>
        <div className="oneagent-loop-grid">
          {copy.loopItems.map(([title, body]) => (
            <article key={title} className="oneagent-loop-card">
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="space" className="oneagent-section oneagent-space">
        <span className="oneagent-section-index">03</span>
        <div>
          <h2>{copy.spaceTitle}</h2>
          <p>{copy.spaceLead}</p>
        </div>
        <ul>
          {copy.spaceItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="oneagent-section oneagent-cross">
        <span className="oneagent-section-index">04</span>
        <h2>{copy.crossTitle}</h2>
        <p>{copy.crossBody}</p>
      </section>

      <section id="whiteboard" className="oneagent-section oneagent-whiteboard">
        <span className="oneagent-section-index">05</span>
        <div className="oneagent-board-frame">
          <div className="oneagent-board-line oneagent-board-line-a" />
          <div className="oneagent-board-line oneagent-board-line-b" />
          <div className="oneagent-board-note oneagent-board-note-a" />
          <div className="oneagent-board-note oneagent-board-note-b" />
          <div className="oneagent-board-note oneagent-board-note-c" />
        </div>
        <div>
          <h2>{copy.whiteboardTitle}</h2>
          <p>{copy.whiteboardBody}</p>
        </div>
      </section>

      <section id="blog" className="oneagent-section oneagent-blog">
        <span className="oneagent-section-index">06</span>
        <article className="oneagent-blog-card">
          <div className="oneagent-blog-meta">
            <span>{copy.blogLabel}</span>
            <time dateTime="2026-05-26">{copy.blogDate}</time>
          </div>
          <header className="oneagent-blog-head">
            <h2>{copy.blogTitle}</h2>
            <p>{copy.blogDeck}</p>
          </header>
          <div className="oneagent-blog-body">
            {copy.blogSections.map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="oneagent-final">
        <h2>{copy.finalTitle}</h2>
        <p>{copy.finalBody}</p>
        <a href="mailto:parsonjian@gmail.com">{copy.navContact}</a>
      </section>
    </main>
  )
}
