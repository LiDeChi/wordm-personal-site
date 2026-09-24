import { lazy, Suspense, useState } from "react";
import type { Lang } from "../i18n/lang";
import "./ThoughtInteraction.css";

const ThoughtWorld3D = lazy(() => import("./ThoughtWorld3D").then((module) => ({ default: module.ThoughtWorld3D })));
export type ThoughtChoice = "waiting" | "speak" | "silent";

const COPY = {
  zh: {
    eyebrow: "《一念》 · 一次心念交互",
    title: "你是他心中的一个念头",
    intro: "他站在齐国的宫门前，拿不定主意。你可以说一句，也可以不说。路要由他自己走。",
    scene: "公孙启 · 齐国",
    thought: "他在想：要不要谋取相位？",
    speak: "对他说：想想你想要的东西",
    silent: "保持沉默",
    reply: "他听进去了，决定求相。齐王拜他为相。",
    silence: "没有这句话，他走向另一条路。这一年的对照记录里，他成为大夫。",
    replay: "重新选择 ↺",
    note: "取自《一念》固定种子的一次运行；这是记录中的分岔示意，不是即时生成的模拟。",
    autonomy: "你只能影响他的判断，不能替他决定。",
    sceneWaiting: "一念尚未出口",
    sceneSpeak: "念头被听见",
    sceneSilent: "念头保持沉默",
  },
  en: {
    eyebrow: "Yinian · one moment of influence",
    title: "You are a thought in his mind",
    intro: "At the court of Qi, Gongsun Qi hesitates. You can offer a thought or remain silent. The choice of action is his.",
    scene: "Gongsun Qi · Qi",
    thought: "Should he seek the minister's seal?",
    speak: "Say: Think of what you want",
    silent: "Stay silent",
    reply: "He takes the thought to heart and seeks office. The King of Qi appoints him minister.",
    silence: "Without the thought, he takes another path. In this year's recorded comparison, he becomes an official.",
    replay: "Choose again ↺",
    note: "A fork from one recorded Yinian run with a fixed seed. This is a replay, not a live simulation.",
    autonomy: "You can influence his judgment. The decision remains his.",
    sceneWaiting: "A thought unspoken",
    sceneSpeak: "The thought takes hold",
    sceneSilent: "The thought stays silent",
  },
} as const;

export function ThoughtInteraction({ lang }: { lang: Lang }) {
  const [choice, setChoice] = useState<ThoughtChoice>("waiting");
  const copy = COPY[lang];
  return (
    <section className="thought-interaction" aria-labelledby="thought-title">
      <div className="thought-heading"><span>{copy.eyebrow}</span><h2 id="thought-title">{copy.title}</h2><p>{copy.intro}</p></div>
      <div className="thought-stage">
        <div className="thought-scene" role="img" aria-label={`${copy.scene}${lang === "zh" ? "：" : ": "}${choice === "speak" ? copy.sceneSpeak : choice === "silent" ? copy.sceneSilent : copy.sceneWaiting}`}>
          <Suspense fallback={<div className="thought-scene-loading" />}><ThoughtWorld3D choice={choice} /></Suspense>
          <div className="thought-scene-shade" />
          <div className="thought-scene-top"><span>{copy.scene}</span><span>{choice === "speak" ? copy.sceneSpeak : choice === "silent" ? copy.sceneSilent : copy.sceneWaiting}</span></div>
          <div className="thought-scene-label thought-scene-label-person">{lang === "zh" ? "他" : "Him"}</div>
          <div className="thought-scene-label thought-scene-label-voice">{lang === "zh" ? "你 · 一个念头" : "You · a thought"}</div>
        </div>
        <div className="thought-panel">
          <div className="thought-panel-index">01 / {lang === "zh" ? "此刻" : "This moment"}</div>
          <h3>{copy.thought}</h3>
          {choice === "waiting" ? <div className="thought-choices">
            <button type="button" className="thought-button-primary" onClick={() => setChoice("speak")}>{copy.speak}<span aria-hidden="true">↗</span></button>
            <button type="button" className="thought-button-secondary" onClick={() => setChoice("silent")}>{copy.silent}<span aria-hidden="true">→</span></button>
          </div> : <div className="thought-outcome" aria-live="polite">
            <div className="thought-outcome-line"><span>{choice === "speak" ? "02" : "—"}</span><p>{choice === "speak" ? copy.reply : copy.silence}</p></div>
            <button type="button" className="thought-reset" onClick={() => setChoice("waiting")}>{copy.replay}</button>
          </div>}
          <p className="thought-autonomy">{copy.autonomy}</p>
        </div>
      </div>
      <p className="thought-note">{copy.note}</p>
    </section>
  );
}
