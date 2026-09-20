import { useEffect, useState } from "react";
import type { Lang } from "../i18n/lang";
import { ARTICLES_SITE_URL } from "../data/blogArticles";
import { FOUNT_FIELDS, type FountField } from "../data/fountFields";
import { withSiteParams } from "../lib/lang-url";
import { ThemeModeIcon } from "./ThemeModeIcon";
import "./InteractiveHomePage.css";

function fieldEntryHref(field: FountField, lang: Lang) {
    if (field.embedType === "video") {
        return field.href;
    }
    return withSiteParams(field.href, { lang });
}
type Props = {
    lang: Lang;
    onLangChange: (lang: Lang) => void;
    themeMode: "day" | "night";
    onThemeToggle: () => void;
};
function WaveStudy({ lang }: {
    lang: Lang;
}) {
    const zh = lang === "zh";
    const [phase, setPhase] = useState(60);
    const [playing, setPlaying] = useState(false);
    const [showSources, setShowSources] = useState(true);
    useEffect(() => {
        if (!playing)
            return;
        let frame = 0;
        let previous = 0;
        const tick = (now: number) => {
            if (previous)
                setPhase((value) => (value + Math.min(now - previous, 50) * 0.025) % 360);
            previous = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing]);
    const offset = phase * Math.PI / 180;
    const path = (kind: "a" | "b" | "sum") => Array.from({ length: 301 }, (_, i) => {
        const x = i * 4;
        const a = Math.sin(i / 300 * Math.PI * 6);
        const b = Math.sin(i / 300 * Math.PI * 6 + offset);
        const y = 145 - 53 * (kind === "a" ? a : kind === "b" ? b : a + b);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(2)}`;
    }).join(" ");
    const strength = Math.abs(Math.cos(offset / 2)) * 2;
    return <section className="wave-study" aria-labelledby="wave-title">
    <div className="study-heading"><span id="wave-title">{zh ? "一个可以动手的解释" : "An explanation you can touch"}</span><span>01 / {zh ? "波的叠加" : "WAVE INTERFERENCE"}</span></div>
    <svg viewBox="0 0 1200 290" preserveAspectRatio="none" role="img" aria-label={zh ? `两列波叠加，相位差 ${Math.round(phase)} 度，合成振幅 ${strength.toFixed(2)}` : `Two waves, phase difference ${Math.round(phase)} degrees, combined amplitude ${strength.toFixed(2)}`}>
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={i * 100} x2={i * 100} y1="0" y2="290" className="wave-grid"/>)}
      {[39, 92, 145, 198, 251].map(y => <line key={y} x1="0" x2="1200" y1={y} y2={y} className={y === 145 ? "wave-axis" : "wave-grid"}/>)}
      {showSources && <g className="wave-sources"><path d={path("a")}/><path d={path("b")} strokeDasharray="5 7"/></g>}
      <path className="wave-result" d={path("sum")}/>
    </svg>
    <div className="study-controls">
      <button className="study-play" onClick={() => setPlaying(!playing)} aria-pressed={playing}>{playing ? (zh ? "Ⅱ 暂停" : "Ⅱ Pause") : (zh ? "▷ 播放" : "▷ Play")}</button>
      <label className="phase-control"><span>{zh ? "相位差" : "Phase"} <output aria-live="off">{Math.round(phase)}°</output></span><input aria-label={zh ? "相位差" : "Phase difference"} type="range" min="0" max="360" step="1" value={phase} onChange={event => { setPlaying(false); setPhase(Number(event.target.value)); }}/></label>
      <label className="source-control"><input type="checkbox" checked={showSources} onChange={event => setShowSources(event.target.checked)}/>{zh ? "显示原始波" : "Show source waves"}</label>
      <button className="study-reset" onClick={() => { setPhase(60); setPlaying(false); setShowSources(true); }}>{zh ? "重置 ↺" : "Reset ↺"}</button>
    </div>
    <div className="study-caption"><p>{zh ? "拖动，让两列波从彼此加强走向相互抵消。关系在变化中变得可见。" : "Drag to move two waves from reinforcement to cancellation. Change makes the relationship visible."}</p><span>{zh ? "合成振幅" : "Combined amplitude"} <b>{strength.toFixed(2)}</b> / 2</span></div>
  </section>;
}
export function InteractiveHomePage({ lang, onLangChange, themeMode, onThemeToggle }: Props) {
    const zh = lang === "zh";
    useEffect(() => {
        document.title = zh ? "简永杰 · 动态呈现与交互 | wordm.us" : "Jian Yongjie · Dynamic & Interactive | wordm.us";
    }, [zh]);
    const mindsHref = withSiteParams("/minds", { lang });
    const alifeHref = withSiteParams("/alife/", { lang });
    return <div className="interactive-home">
    <a className="ih-skip" href="#home-main">{zh ? "跳到正文" : "Skip to content"}</a>
    <header className="ih-header">
      <a className="ih-brand" href={`/?lang=${lang}`}>wordm<span>●</span>us</a>
      <nav aria-label={zh ? "主导航" : "Main navigation"}><a href="#explorations">{zh ? "探索" : "Explore"}</a><a href={mindsHref}>{zh ? "心智" : "Minds"}</a><a href={alifeHref}>{zh ? "人工生命" : "ALife"}</a><a href={ARTICLES_SITE_URL}>{zh ? "文章" : "Writing"}</a><a href={`/?view=about&lang=${lang}`}>{zh ? "关于" : "About"}</a></nav>
      <div className="ih-utils"><button aria-pressed={zh} onClick={() => onLangChange("zh")}>中文</button><button aria-pressed={!zh} onClick={() => onLangChange("en")}>EN</button><button className="ih-theme" onClick={onThemeToggle} aria-label={zh ? (themeMode === "day" ? "切换到黑夜模式" : "切换到白天模式") : (themeMode === "day" ? "Switch to dark mode" : "Switch to light mode")}><ThemeModeIcon mode={themeMode}/></button></div>
    </header>
    <main id="home-main">
      <section className="ih-hero">
        <div className="ih-eyebrow"><span>{zh ? "简永杰 / 个人探索" : "JIAN YONGJIE / PERSONAL EXPLORATIONS"}</span><span>{zh ? "当下关注：动态呈现与交互" : "CURRENT FOCUS: DYNAMIC & INTERACTIVE"}</span></div>
        <h1>{zh ? <>让想法成为<br />可以<span className="ih-emphasis">探索</span>的现场。</> : <>Ideas become<br />places to <span className="ih-emphasis">explore.</span></>}</h1>
        <div className="ih-intro"><p>{zh ? "我在探索：文字、模型与知识，如何变成可以操作、观察和理解的体验。" : "I explore how words, models, and knowledge become experiences we can manipulate, observe, and understand."}</p><a href="#explorations">{zh ? "看看我在做什么" : "Explore my work"} <span>↘</span></a></div>
        <WaveStudy lang={lang}/>
      </section>
      <section id="explorations" className="ih-explorations">
        <div className="ih-section-heading"><span>01 — {zh ? "正在探索" : "EXPLORATIONS"}</span><a href={`/fields?lang=${lang}`}>{zh ? "全部作品" : "All projects"} ↗</a></div>
        <a className="ih-minds" href={mindsHref}>
          <div className="ih-minds-image">
            <img src="/minds/scenes/hero.jpg" alt={zh ? "脑、身体与环境连成同一张机器心智关系图" : "Brain, body, and environment linked as a machine-mind map"}/>
            <span>↗</span>
          </div>
          <div className="ih-minds-copy">
            <span>{zh ? "心智探索" : "EXPLORING MINDS"}</span>
            <h3>{zh ? "机器构建心智" : "Building Machine Minds"}</h3>
            <p>{zh ? "把意识与认知科学的主要学派、人物，以及脑、身体与环境的关系，放到同一个可操作的现场里看。" : "See the main schools of mind, their people, and how brain, body, and world relate — in one shared, operable space."}</p>
          </div>
        </a>
        <a className="ih-minds ih-alife" href={alifeHref}>
          <div className="ih-minds-image">
            <img src="/alife/assets/cover.png" alt={zh ? "人工生命史画廊：时间与流派交织的展览现场" : "Artificial life history gallery across time and schools"}/>
            <span>↗</span>
          </div>
          <div className="ih-minds-copy">
            <span>{zh ? "人工生命史" : "ALIFE MUSEUM"}</span>
            <h3>{zh ? "历史上的人工生命" : "Artificial Life, Across History"}</h3>
            <p>{zh ? "以时间与流派织成画廊：悬停看团队与扬弃，可演示的项目可进入核心交互。" : "A gallery by decade and school — hover for lineage and limits; open runnable cores where demos exist."}</p>
          </div>
        </a>
        <div className="ih-projects">{FOUNT_FIELDS.map((field, index) => <a className="ih-project" key={field.key} href={fieldEntryHref(field, lang)}>
          <div className="ih-project-image"><img src={field.coverUrl} alt={field.coverAlt[lang]} loading={index > 1 ? "lazy" : "eager"}/><span>{String(index + 1).padStart(2, "0")} ↗</span></div>
          <div className="ih-project-heading"><h3>{field.name}</h3><span>{field.kind[lang]}</span></div><p>{field.summary[lang]}</p>
        </a>)}</div>
      </section>
      <section className="ih-note"><span>02 — {zh ? "为什么做这些" : "THE QUESTION BEHIND THE WORK"}</span><div><h2>{zh ? "理解，能不能从一次操作开始？" : "Can understanding begin with an interaction?"}</h2><p>{zh ? "有些关系，写下来仍然很远；改变一个条件，看见结果怎样变化，就近了一步。我想把这样的时刻放进阅读、工具和日常界面里，让呈现本身也参与思考。" : "Some relationships remain distant on the page. Change a condition and watch the result, and they come closer. I want to bring those moments into reading, tools, and everyday interfaces, so the medium becomes part of the thinking."}</p><a href={ARTICLES_SITE_URL}>{zh ? "阅读我的文章" : "Read my writing"} ↗</a></div></section>
    </main>
    <footer className="ih-footer"><span>© {new Date().getFullYear()} {zh ? "简永杰" : "Jian Yongjie"} · wordm.us</span><a href="mailto:parsonjian@gmail.com">{zh ? "一起聊聊" : "Get in touch"} ↗</a><a href="#home-main">{zh ? "回到顶部" : "Back to top"} ↑</a></footer>
  </div>;
}
