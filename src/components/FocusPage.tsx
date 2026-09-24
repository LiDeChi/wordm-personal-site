import type { Lang } from "../i18n/lang";
import { AlifeTimeline } from "./AlifeTimeline";
import { ThoughtInteraction } from "./ThoughtInteraction";
import "./FocusPage.css";

const COPY = {
  zh: {
    title: "让数字世界产生历史",
    intro: "我想构建持续运行的数字世界。世界中的人和生命依据自己的认知行动，逐渐改变环境；这些改变不会在下一次交互时清零，而会成为后来者生活的条件。",
    pathsTitle: "两条世界实验线",
    paths: [
      {
        number: "01", title: "心智与社会",
        description: "从人的信念、情感和选择开始。观念如何传播，制度如何形成，一个人的经历又如何改变时代？",
        project: "第一个实例：《一念》",
        detail: "你是战国人物心中的一个念头，只能通过解释和劝说影响他。他会按自己的心图理解世界，也可能拒绝你。",
        href: "https://github.com/LiDeChi/yinian", link: "查看《一念》",
      },
      {
        number: "02", title: "人工生命",
        description: "从简单的计算基质出发，观察身体、感知、记忆、通信和规则能否在资源约束下逐渐形成。",
        project: "一条独立的研究线",
        detail: "人工生命是数字世界的一种起点，而不是所有数字世界必须经历的起点。",
        href: "#alife-section", link: "浏览人工生命史",
      },
    ],
    windowTitle: "人如何进入这样的世界？",
    windowIntro: "这是两条实验线共用的交互问题：怎样让人看见世界正在发生什么，并让人的选择成为其中一个真实事件？",
    windowDetail: "我设想用一个“窗口”翻译两端：把世界的变化呈现给人，把人的意图转成受世界规则约束的行动。《一念》中，玩家作为人物心里的念头影响他的判断，是这个想法的一个早期例子。",
    alifeTitle: "人工生命：数字世界的一种可能",
    alifeIntro: "下面是人工生命研究与作品的时间轴。它帮助我追问：世界里的结构如何获得身体、记忆和改变环境的能力。",
  },
  en: {
    title: "Digital worlds that make history",
    intro: "I want to build digital worlds that keep running. Their inhabitants act on what they believe, change their surroundings, and leave consequences that become the conditions for those who come after them.",
    pathsTitle: "Two lines of world experiments",
    paths: [
      {
        number: "01", title: "Minds and societies",
        description: "Start with beliefs, feelings, and choices. How do ideas spread, institutions form, and individual lives change an era?",
        project: "First instance: Yinian",
        detail: "You are a thought in a Warring States person's mind. You can explain and persuade, but he sees the world through his own beliefs and may refuse you.",
        href: "https://github.com/LiDeChi/yinian", link: "Explore Yinian",
      },
      {
        number: "02", title: "Artificial life",
        description: "Begin with a small computational substrate and ask whether bodies, perception, memory, communication, and rules can emerge under resource constraints.",
        project: "An independent research path",
        detail: "Artificial life is one possible starting point for a digital world, not a prerequisite for every world.",
        href: "#alife-section", link: "Explore the timeline",
      },
    ],
    windowTitle: "How do people enter these worlds?",
    windowIntro: "Both research paths share an interaction question: how can people see what is happening in a world and make choices that become real events within it?",
    windowDetail: "I imagine a window that translates both ways: it presents changes in the world to a person, then turns their intent into an action constrained by the world's rules. In Yinian, influencing a character as a thought in his mind is an early example.",
    alifeTitle: "Artificial life: one kind of digital world",
    alifeIntro: "This timeline of artificial life research and works helps me ask how structures in a world acquire bodies, memory, and the ability to change their environment.",
  },
} as const;

export function FocusPage({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  return (
    <main className="focus-page">
      <header className="world-hero">
        <h1>{copy.title}</h1>
        <p className="world-hero-intro">{copy.intro}</p>
      </header>
      <ThoughtInteraction lang={lang} />
      <section className="world-paths" aria-labelledby="world-paths-title">
        <h2 id="world-paths-title">{copy.pathsTitle}</h2>
        <div className="world-path-list">{copy.paths.map((path) => <article className="world-path" key={path.number}>
          <span className="world-path-number">{path.number}</span>
          <div className="world-path-main"><h3>{path.title}</h3><p>{path.description}</p></div>
          <div className="world-path-detail"><strong>{path.project}</strong><p>{path.detail}</p><a href={path.href}>{path.link}<span aria-hidden="true"> ↗</span></a></div>
        </article>)}</div>
      </section>
      <section className="world-window" aria-labelledby="world-window-title">
        <h2 id="world-window-title">{copy.windowTitle}</h2>
        <div><p>{copy.windowIntro}</p><p>{copy.windowDetail}</p></div>
      </section>
      <section className="world-alife" id="alife-section" aria-labelledby="world-alife-title">
        <div className="world-alife-intro"><h2 id="world-alife-title">{copy.alifeTitle}</h2><p>{copy.alifeIntro}</p></div>
        <AlifeTimeline lang={lang} />
      </section>
    </main>
  );
}

export default FocusPage;
