import { lazy, Suspense, useRef, useState } from "react";
import type { Lang } from "../i18n/lang";
import "./HistoryTrace.css";

const HistoryWorld3D = lazy(() => import("./HistoryWorld3D").then((module) => ({ default: module.HistoryWorld3D })));

type Moment = {
  year: number;
  kind: { zh: string; en: string };
  title: { zh: string; en: string };
  scene: { zh: string; en: string };
  consequence: { zh: string; en: string };
  echo: { zh: string; en: string };
  related: number[];
  comparison?: { zh: string; en: string };
};

// Curated excerpts from one reproducible run: random policy, seed 14.
// "Related" means an earlier recorded clue in this life, not a claim that the
// engine proves a unique causal explanation for the later event.
const MOMENTS: Moment[] = [
  {
    year: 334,
    kind: { zh: "天下与家", en: "World and home" },
    title: { zh: "王号松动，父亲去世", en: "Kings claim titles; his father dies" },
    scene: { zh: "齐魏互尊为王。同一年，公孙启的父亲去世，他认定家中有厉鬼作祟。", en: "Qi and Wei recognize each other as kings. That year, Gongsun Qi's father dies; he blames an evil spirit." },
    consequence: { zh: "他决定请巫祝大祭，驱除家中厉鬼。", en: "He decides to hold a great rite to drive the spirit away." },
    echo: { zh: "这是一生的起点：公族名分与鬼神解释，仍牢牢占着他的心。", en: "The life begins with noble rank and spirits still shaping his view of events." },
    related: [],
  },
  {
    year: 328,
    kind: { zh: "天下大事", en: "World event" },
    title: { zh: "张仪以布衣相秦", en: "Zhang Yi becomes Qin's minister" },
    scene: { zh: "一个布衣，凭一条舌头做了秦相。", en: "A commoner reaches Qin's court through persuasion." },
    consequence: { zh: "时代事件触动了「利→势」：言辞也可能借来权势。", en: "The event shifts the belief that persuasion can bring power." },
    echo: { zh: "三年后，公孙启亲自遇见张仪。", en: "Three years later, Gongsun Qi meets Zhang Yi." },
    related: [334],
  },
  {
    year: 325,
    kind: { zh: "学说进入心里", en: "An idea takes hold" },
    title: { zh: "执弟子礼，受张仪之学", en: "He studies under Zhang Yi" },
    scene: { zh: "公孙启第一次觉得，一条舌头可以抵得上千乘之兵。", en: "For the first time, Gongsun Qi sees that words might wield the force of an army." },
    consequence: { zh: "「利→势」从将信将疑变为相信；「名分不可僭」从相信降为半信。", en: "His trust in persuasion rises; his trust in fixed rank weakens." },
    echo: { zh: "他的志向自己长到了「卿相」。", en: "His ambition grows toward high office." },
    related: [328],
  },
  {
    year: 323,
    kind: { zh: "第一次尝试", en: "First attempt" },
    title: { zh: "游说诸侯，碰了壁", en: "Persuasion fails" },
    scene: { zh: "他决定游说诸侯。秦王听了一半，打了个呵欠。", en: "He goes to persuade a ruler. The King of Qin yawns halfway through." },
    consequence: { zh: "他被客客气气地送出了宫门。", en: "He is politely shown out of the palace." },
    echo: { zh: "相信一种道理，不保证每一次实践都成功。", en: "A belief can make an action conceivable without making it succeed." },
    related: [325],
  },
  {
    year: 321,
    kind: { zh: "再次尝试", en: "Second attempt" },
    title: { zh: "齐王拜他为客卿", en: "The King of Qi appoints him" },
    scene: { zh: "他在齐王面前说了一个下午。说完，齐王离席，亲手扶他起来。", en: "He speaks before the King of Qi all afternoon. The king rises and helps him to his feet." },
    consequence: { zh: "这一次，他被拜为客卿。", en: "This time, he is appointed guest minister." },
    echo: { zh: "同一条可想的路，终于走出了不同结果。", en: "The same conceivable path finally leads somewhere new." },
    related: [325, 323],
    comparison: { zh: "当年若你不开口，他仍是门客；眼下则是客卿。", en: "In that year's silent replay he remains a retainer; in this run he becomes a guest minister." },
  },
  {
    year: 319,
    kind: { zh: "心念与相位", en: "Thought and office" },
    title: { zh: "他听进了求相的念头", en: "He takes the thought of higher office" },
    scene: { zh: "他拿不定主意，向心里的声音求问。你说：谋取相位，想想你想要的东西。", en: "Unsure what to do, he asks the voice within. It urges him to seek the minister's seal." },
    consequence: { zh: "这句问话，他听进去了。齐王拜他为相。", en: "He listens. The King of Qi appoints him minister." },
    echo: { zh: "这是日志里清楚可见的一次介入与结果。", en: "The log records both the intervention and its result." },
    related: [325, 321],
    comparison: { zh: "当年若你不开口，他会是大夫；眼下则是相。", en: "In that year's silent replay he becomes an official; in this run he becomes minister." },
  },
  {
    year: 311,
    kind: { zh: "此生终局", en: "End of this life" },
    title: { zh: "史书只记了十一个字", en: "Eleven words in the chronicle" },
    scene: { zh: "他做了十几年的相国，辅佐过两代君王。", en: "He serves as minister for more than a decade, under two rulers." },
    consequence: { zh: "「言利可以动人主」从将信将疑变为相信；「名分不可僭」从相信变为将信将疑。", en: "Persuasion becomes credible to him; fixed rank loses its hold." },
    echo: { zh: "他一生都相信，冥冥中有什么在指引他。", en: "All his life, he believes something unseen has guided him." },
    related: [325, 321, 319],
    comparison: { zh: "没有你，他会是门客，志向停在显名；这一生，他做到了相。", en: "Without you, he would end as a retainer, his ambition stopping at reputation. In this run he becomes minister." },
  },
];

const COPY = {
  zh: {
    heading: "沿着痕迹，读一生",
    intro: "旋转山河，点一座碑进入那一年；再沿金线回看此前留下的线索。",
    sceneHint: "拖动旋转 · Ctrl + 滚轮缩放 · 点碑选年",
    sceneLabel: "一人之史 / 七处遗痕",
    openRecord: "读这一年 ↘",
    provenance: "《一念》真实运行记录 · 随机策略 · 种子 14 · 节选 7 个节点",
    record: "这一年发生了什么",
    result: "他如何行动",
    echo: "留下的痕迹",
    related: "回看较早的记录",
    noRelated: "这条记录从这里开始。",
    comparison: "如果心里的声音没有开口",
    caveat: "连线表示这局记录中可回看的观念与经历；它们不是对每一步唯一原因的证明。",
    previous: "上一节点",
    next: "下一节点",
    year: (value: number) => `公元前 ${value} 年`,
  },
  en: {
    heading: "Follow the traces of a life",
    intro: "Turn the landscape, choose a year, then follow its golden threads to earlier clues.",
    sceneHint: "Drag to orbit · Ctrl + scroll to zoom · Select a monument",
    sceneLabel: "One life / seven traces",
    openRecord: "Read this year ↘",
    provenance: "A real Yinian run · random policy · seed 14 · seven selected moments",
    record: "What happened",
    result: "What he did",
    echo: "What remained",
    related: "Earlier clues in this run",
    noRelated: "The record starts here.",
    comparison: "If the voice within had stayed silent",
    caveat: "Connections mark earlier beliefs and experiences worth revisiting. They do not prove a unique cause for every later action.",
    previous: "Previous moment",
    next: "Next moment",
    year: (value: number) => `${value} BCE`,
  },
};

export function HistoryTrace({ lang }: { lang: Lang }) {
  const [index, setIndex] = useState(MOMENTS.length - 1);
  const cardRef = useRef<HTMLDivElement>(null);
  const copy = COPY[lang];
  const current = MOMENTS[index];

  function followClue(nextIndex: number) {
    setIndex(nextIndex);
    window.requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <section className="history-trace" aria-labelledby="history-trace-title">
      <div className="history-trace-heading">
        <div><h2 id="history-trace-title">{copy.heading}</h2><p>{copy.intro}</p></div>
        <span className="history-trace-seal" aria-hidden="true">念</span>
      </div>
      <div className="history-trace-stage">
        <div className="history-world-shell">
          <Suspense fallback={<div className="history-world-loading" /> }>
            <HistoryWorld3D years={MOMENTS.map((moment) => moment.year)} index={index} related={current.related} lang={lang} onSelect={setIndex} />
          </Suspense>
          <div className="history-world-title" aria-hidden="true">{copy.sceneLabel}</div>
          <button type="button" className="history-world-caption" onClick={() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <span>{copy.year(current.year)} / {current.kind[lang]}</span>
            <strong>{current.title[lang]}</strong>
            <span>{copy.openRecord}</span>
          </button>
          <div className="history-world-hint" aria-hidden="true">{copy.sceneHint}</div>
        </div>
        <div className="history-trace-rail">
          <div className="history-trace-meta"><span>{copy.provenance}</span></div>
          <div className="history-trace-years" role="group" aria-label={lang === "zh" ? "选择年份" : "Select a year"}>
            <svg className="history-trace-arcs" viewBox="0 0 1000 44" preserveAspectRatio="none" aria-hidden="true">
              {current.related.map((year, arcIndex) => {
                const relatedIndex = MOMENTS.findIndex((moment) => moment.year === year);
                const start = 18 + relatedIndex * 964 / (MOMENTS.length - 1);
                const end = 18 + index * 964 / (MOMENTS.length - 1);
                return <path key={year} d={`M ${start} 43 Q ${(start + end) / 2} ${-10 + arcIndex * 6} ${end} 43`} />;
              })}
            </svg>
            {MOMENTS.map((moment, momentIndex) => (
              <button type="button" key={moment.year} className={momentIndex === index ? "is-active" : ""} aria-pressed={momentIndex === index} onClick={() => setIndex(momentIndex)}>
                <span className="history-trace-dot" aria-hidden="true" />
                <span>{moment.year}</span>
              </button>
            ))}
          </div>
          <input className="history-trace-range" type="range" min="0" max={MOMENTS.length - 1} value={index} onChange={(event) => setIndex(Number(event.target.value))} aria-label={lang === "zh" ? "拖动历史年份" : "Scrub through the years"} />
          <div className="history-trace-card" key={current.year} ref={cardRef}>
            <div className="history-trace-card-head"><span>{copy.year(current.year)} / {current.kind[lang]}</span><div><button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={copy.previous}>←</button><button type="button" disabled={index === MOMENTS.length - 1} onClick={() => setIndex(index + 1)} aria-label={copy.next}>→</button></div></div>
            <h3>{current.title[lang]}</h3>
            <div className="history-trace-facts">
              <div><span>{copy.record}</span><p>{current.scene[lang]}</p></div>
              <div><span>{copy.result}</span><p>{current.consequence[lang]}</p></div>
              <div><span>{copy.echo}</span><p>{current.echo[lang]}</p></div>
            </div>
            {current.comparison && <div className="history-trace-comparison"><span>{copy.comparison}</span><p>{current.comparison[lang]}</p></div>}
          </div>
        </div>
        <aside className="history-trace-related">
          <p className="history-trace-related-title">{copy.related}</p>
          {current.related.length ? <ol>{current.related.map((year) => {
            const relatedIndex = MOMENTS.findIndex((moment) => moment.year === year);
            const related = MOMENTS[relatedIndex];
            return <li key={year}><button type="button" onClick={() => followClue(relatedIndex)}><span>{copy.year(year)}</span><strong>{related.title[lang]}</strong><span aria-hidden="true">↗</span></button></li>;
          })}</ol> : <p className="history-trace-empty">{copy.noRelated}</p>}
          <p className="history-trace-caveat">{copy.caveat}</p>
        </aside>
      </div>
    </section>
  );
}
