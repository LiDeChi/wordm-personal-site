import type { Lang } from "../i18n/lang";
import { AlifeTimeline } from "./AlifeTimeline";
import "./FocusPage.css";

const COPY = {
  zh: {
    title: "让数字世界产生历史",
    intro: "我想构建持续运行的数字世界。世界中的人和生命依据自己的认知行动，逐渐改变环境；这些改变不会在下一次交互时清零，而会成为后来者生活的条件。",
    question: "一个念头，怎样成为世界的一部分？",
    sequence: ["世界自行演化", "主体理解并改变世界", "后果留在环境里", "人通过窗口参与"],
    principle: "世界负责因果，交互负责让人看见和参与。玩家的每一次影响，都要进入世界本身的历史。",
    pathsTitle: "从三个方向走近这个问题",
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
      {
        number: "03", title: "人与世界的窗口",
        description: "复杂世界需要一种人能理解的入口。智能体选择值得呈现的事，把人的意图转成世界中的行动。",
        project: "叙事、推演与对照",
        detail: "同一段历史可以成为游戏、编年史或图册；还可以对照“如果我没有开口”，看见影响的边界。",
        href: "https://github.com/LiDeChi/yinian", link: "看当前原型",
      },
    ],
    alifeTitle: "人工生命：数字世界的一种可能",
    alifeIntro: "下面是人工生命研究与作品的时间轴。它帮助我追问：世界里的结构如何获得身体、记忆和改变环境的能力。",
  },
  en: {
    title: "Digital worlds that make history",
    intro: "I want to build digital worlds that keep running. Their inhabitants act on what they believe, change their surroundings, and leave consequences that become the conditions for those who come after them.",
    question: "How does one thought become part of a world?",
    sequence: ["A world evolves", "Its inhabitants learn and intervene", "Consequences remain", "People enter through a window"],
    principle: "The world determines what happens. The interface helps us see and participate. Every intervention becomes part of the world's history.",
    pathsTitle: "Three ways into the question",
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
      {
        number: "03", title: "A window into the world",
        description: "A complex world needs an understandable interface. An agent chooses what to show and translates human intent into actions within the world.",
        project: "Narrative, simulation, comparison",
        detail: "The same history can become a game, chronicle, or atlas. A counterfactual can reveal what changed because you spoke.",
        href: "https://github.com/LiDeChi/yinian", link: "See the current prototype",
      },
    ],
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
        <div className="world-hero-question"><span aria-hidden="true">↗</span><p>{copy.question}</p></div>
      </header>
      <section className="world-loop" aria-label={lang === "zh" ? "数字世界的循环" : "The digital world loop"}>
        <ol>{copy.sequence.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
        <p>{copy.principle}</p>
      </section>
      <section className="world-paths" aria-labelledby="world-paths-title">
        <h2 id="world-paths-title">{copy.pathsTitle}</h2>
        <div className="world-path-list">{copy.paths.map((path) => <article className="world-path" key={path.number}>
          <span className="world-path-number">{path.number}</span>
          <div className="world-path-main"><h3>{path.title}</h3><p>{path.description}</p></div>
          <div className="world-path-detail"><strong>{path.project}</strong><p>{path.detail}</p><a href={path.href}>{path.link}<span aria-hidden="true"> ↗</span></a></div>
        </article>)}</div>
      </section>
      <section className="world-alife" id="alife-section" aria-labelledby="world-alife-title">
        <div className="world-alife-intro"><h2 id="world-alife-title">{copy.alifeTitle}</h2><p>{copy.alifeIntro}</p></div>
        <AlifeTimeline lang={lang} />
      </section>
    </main>
  );
}

export default FocusPage;
