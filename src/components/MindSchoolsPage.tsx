import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Lang } from "../i18n/lang";
import {
  BRAIN_REGIONS,
  MIND_SCHOOLS,
  MIND_TIMELINE,
  type BrainRegionId,
  type MindElement,
  type MindPerson,
  type MindSchool,
} from "../data/mindSchools";

type MindSchoolsPageProps = {
  lang: Lang;
};

const COPY = {
  zh: {
    eyebrow: "Machine Minds · Theory Map",
    heroTitle: "机器构建心智",
    heroDeck:
      "把意识与认知科学里最重要的几条理论路线放在同一张工程地图上：它们从何处起源，由谁推进，如何把大脑、身体与环境写成可争论、可检验、最终可实现的关系。",
    heroLead:
      "这一页同时服务于思想史与建造者。上面是足够展开的中长论述，下面是可切换学派的三维关系舞台。目标不是用一句话“总结意识”，而是让你看清：若要建造机器心智，每一派到底在约束什么、允许什么、忽略什么。",
    jumpTimeline: "时间线",
    jumpInteractive: "三维关系",
    jumpSchools: "学派深读",
    timelineTitle: "来龙去脉",
    timelineLead:
      "机器构建心智并不是深度学习之后才出现的话题。它穿过无意识推理、符号认知架构、可报告意识的神经机制、整合信息的形式度量，一路走到算法化主动推理与可工程的注意图式。下面按节点展开，而不是只列年份。",
    interactiveTitle: "交互区：脑 · 身 · 环境",
    interactiveLead:
      "拖动或移动指针以旋转三维舞台。选择学派后，高亮会改变元素权重、脑区与关系边。大脑使用真实渲染图并叠加可点选区域；身体与环境同样以场景图像呈现。右侧给出该理论的机制说明与关键连边。",
    pickSchool: "选择学派",
    relationTitle: "该理论如何连结这些元素",
    elementsTitle: "强调的系统元素",
    regionsTitle: "相关脑区",
    edgesTitle: "关键关系",
    envLabel: "环境",
    bodyLabel: "身体",
    brainLabel: "大脑",
    envHint: "证据场 / 被采样对象 / 外部原因",
    bodyHint: "感觉—运动界面 / 内感与行动效应器",
    brainHint: "生成模型 / 广播 / 整合 / 元表征 / 再入",
    schoolsTitle: "各门各派 · 深读",
    schoolsLead:
      "每位关键人物尽量使用公开可获取肖像；若暂无稳定公开肖像，则使用学术氛围图像并保留姓名缩写标识。著作与论文给出可继续追踪的链接。文段刻意保持中长篇幅，便于作为研究笔记而不是口号墙。",
    originLabel: "起源与问题意识",
    evolutionLabel: "关键演进",
    traitsLabel: "理论性格",
    peopleLabel: "关键人物",
    worksLabel: "经典著作与论文",
    booksLabel: "著作",
    papersLabel: "论文",
    openLink: "打开链接",
    noPortrait: "学术氛围图",
    regionHint: "点击脑区热点查看说明",
    activeSchool: "当前学派",
    legendPrimary: "主关系",
    legendSecondary: "次关系",
    legendActive: "被该理论强调",
    sceneHint: "拖拽旋转 · 松手后自动环绕 · 点击脑区",
    sceneReset: "回正",
    deepRead: "进入深读",
    compareTitle: "对照简表",
    compareLead:
      "建造机器心智时，各派其实在回答不同层级的问题：有的给第一性原理与算法，有的给可报告意识的神经机制，有的给内在整合度量，有的给“为何会自称有体验”的工程消解。下表用于快速对照，不是判决书。",
    compareSchool: "学派",
    compareCore: "核心主张",
    compareLocus: "解释重心",
    compareBuild: "对机器实现的含义",
  },
  en: {
    eyebrow: "Machine Minds · Theory Map",
    heroTitle: "Building Machine Minds",
    heroDeck:
      "A single engineering map of major routes in consciousness and cognitive science: where they come from, who advanced them, and how they write brain, body, and environment as disputable, testable, and ultimately buildable relations.",
    heroLead:
      "This page serves intellectual history and builders at once. Above: mid-length arguments. Below: a switchable 3D relation stage. The goal is not a one-line summary of consciousness, but clarity about what each school constrains, allows, and ignores when we try to build machine minds.",
    jumpTimeline: "Timeline",
    jumpInteractive: "3D relations",
    jumpSchools: "School deep-dives",
    timelineTitle: "Origins & arc",
    timelineLead:
      "Machine minds did not begin with deep learning. The arc runs through unconscious inference, symbolic architectures, neural mechanisms of reportable awareness, formal measures of integration, algorithmic Active Inference, and engineerable attention schemas. Nodes below are written as arguments, not year chips alone.",
    interactiveTitle: "Interactive: brain · body · environment",
    interactiveLead:
      "Move the pointer to rotate the stage. Selecting a school reweights elements, brain regions, and relation edges. The brain uses a rendered scene with clickable hotspots; body and environment are scene images too. The right panel explains mechanism and key edges.",
    pickSchool: "Choose a school",
    relationTitle: "How this theory connects the elements",
    elementsTitle: "Stressed system elements",
    regionsTitle: "Related brain regions",
    edgesTitle: "Key relations",
    envLabel: "Environment",
    bodyLabel: "Body",
    brainLabel: "Brain",
    envHint: "Evidence field / sampled objects / external causes",
    bodyHint: "Sensorimotor interface / interoception & effectors",
    brainHint: "Generative models / broadcast / integration / meta-rep / recurrence",
    schoolsTitle: "Schools · deep dives",
    schoolsLead:
      "Public portraits are used when stable images are available; otherwise academic atmosphere images with monogram markers. Books and papers include followable links. Copy is intentionally mid-to-long form for research notes rather than slogan walls.",
    originLabel: "Origin & problem space",
    evolutionLabel: "Evolution",
    traitsLabel: "Theoretical character",
    peopleLabel: "Key people",
    worksLabel: "Classics & papers",
    booksLabel: "Books",
    papersLabel: "Papers",
    openLink: "Open",
    noPortrait: "Academic atmosphere image",
    regionHint: "Click a brain hotspot for notes",
    activeSchool: "Active school",
    legendPrimary: "Primary edge",
    legendSecondary: "Secondary edge",
    legendActive: "Stressed by theory",
    sceneHint: "Drag to rotate · auto-orbit when idle · click regions",
    sceneReset: "Reset",
    deepRead: "Deep dive",
    compareTitle: "Comparison sheet",
    compareLead:
      "When building machine minds, schools answer different layers of the problem: first principles and algorithms, neural mechanisms of reportable awareness, intrinsic integration measures, or engineerable deflations of “why a system claims experience.” The table is a quick contrast, not a verdict.",
    compareSchool: "School",
    compareCore: "Core claim",
    compareLocus: "Explanatory locus",
    compareBuild: "Implication for machine build",
  },
} as const;

const COMPARE_ROWS: Array<{
  id: string;
  core: Record<Lang, string>;
  locus: Record<Lang, string>;
  build: Record<Lang, string>;
}> = [
  {
    id: "active-inference",
    core: {
      zh: "持续存在 ≈ 最小化变分自由能；感知与行动统一为推理。",
      en: "Persistence ≈ minimize variational free energy; perception and action unify as inference.",
    },
    locus: {
      zh: "脑—身—环境闭环的生成模型与策略选择。",
      en: "Generative models and policies over brain–body–world loops.",
    },
    build: {
      zh: "可直接落到离散/连续状态空间 agent 与期望自由能规划。",
      en: "Maps onto discrete/continuous-state agents and expected-free-energy planning.",
    },
  },
  {
    id: "predictive-processing",
    core: {
      zh: "心智是层级预测误差最小化系统，精度加权调节注意与学习。",
      en: "Mind as hierarchical prediction-error minimization with precision-weighted attention/learning.",
    },
    locus: {
      zh: "皮层层级预测栈与具身感觉—运动耦合。",
      en: "Cortical predictive hierarchy and embodied sensorimotor coupling.",
    },
    build: {
      zh: "适合作为架构哲学与层级模型设计语言，数学可严可松。",
      en: "Strong as architectural philosophy and hierarchical design language; math can be tight or loose.",
    },
  },
  {
    id: "gwt",
    core: {
      zh: "意识内容是赢得全局广播、从而通达多模块的信息。",
      en: "Conscious contents are those that win global broadcast and become available to many modules.",
    },
    locus: {
      zh: "前额叶—顶叶工作空间点火与全脑可用性。",
      en: "Fronto-parietal workspace ignition and brain-wide availability.",
    },
    build: {
      zh: "需要共享总线/工作记忆舞台 + 竞争选择机制 + 报告通路。",
      en: "Needs a shared bus/workspace stage, competition, and report pathways.",
    },
  },
  {
    id: "iit",
    core: {
      zh: "意识程度取决于系统内在整合信息（Φ），非报告功能。",
      en: "Degree of consciousness tracks intrinsic integrated information (Φ), not report functions.",
    },
    locus: {
      zh: "系统内部因果结构；经验讨论常指向后部热区。",
      en: "Intrinsic causal structure; empirical talk often points to posterior hot zone.",
    },
    build: {
      zh: "强本体论约束；实现上难在可计算 Φ 与候选基质选择。",
      en: "Strong ontological constraints; hard parts are computable Φ and substrate choice.",
    },
  },
  {
    id: "ast",
    core: {
      zh: "主观体验语言来自对注意过程的简化自模型。",
      en: "Experiential language arises from a simplified self-model of attention.",
    },
    locus: {
      zh: "注意控制 + 注意图式 + 元认知读取。",
      en: "Attention control + attention schema + metacognitive readout.",
    },
    build: {
      zh: "三件套可工程：注意机制、注意模型、基于模型的自我报告。",
      en: "Engineerable trio: attention mechanism, attention model, model-based self-report.",
    },
  },
  {
    id: "hot",
    core: {
      zh: "一阶状态需被高阶状态适当表征才成为意识状态。",
      en: "First-order states become conscious only when suitably meta-represented.",
    },
    locus: {
      zh: "元表征关系；实验上常关联前额叶元认知。",
      en: "Meta-representational relations; often linked experimentally to prefrontal metacognition.",
    },
    build: {
      zh: "除世界模型外，还需监控、标签与再描述系统。",
      en: "Beyond world models, needs monitoring, labeling, and re-description systems.",
    },
  },
  {
    id: "rpt",
    core: {
      zh: "局部感觉再入足以产生现象意识；全局广播服务通达。",
      en: "Local sensory recurrence can yield phenomenal awareness; broadcast serves access.",
    },
    locus: {
      zh: "感觉皮层局部反馈动力学 vs 前额叶通达系统。",
      en: "Local sensory feedback dynamics vs prefrontal access systems.",
    },
    build: {
      zh: "提醒勿把“可报告”等同“有体验”；局部循环值得独立建模。",
      en: "Warns against equating reportability with experience; local loops deserve separate modeling.",
    },
  },
];

const HOTSPOTS: Array<{
  id: BrainRegionId;
  x: number;
  y: number;
  label: string;
}> = [
  { id: "pfc", x: 28, y: 38, label: "PFC" },
  { id: "parietal", x: 48, y: 28, label: "Par" },
  { id: "hotzone", x: 72, y: 36, label: "Hot" },
  { id: "tpj", x: 62, y: 48, label: "TPJ" },
  { id: "thalamus", x: 50, y: 52, label: "Thal" },
  { id: "motor", x: 34, y: 58, label: "Mot" },
  { id: "sensory", x: 68, y: 62, label: "Sens" },
  { id: "hierarchy", x: 50, y: 78, label: "Hier" },
];

function PersonCard({
  person,
  lang,
  noPortraitLabel,
}: {
  person: MindPerson;
  lang: Lang;
  noPortraitLabel: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(person.portraitUrl) && !imgFailed;
  const isPlaceholder =
    person.portraitUrl?.includes("placeholder") ||
    person.portraitUrl?.includes("scenes/");

  return (
    <article
      className="minds-person"
      style={{ ["--person-accent" as string]: person.accent }}
    >
      <div className="minds-person-portrait" aria-hidden={!showImg}>
        {showImg ? (
          <>
            <img
              src={person.portraitUrl}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
            {isPlaceholder ? (
              <span className="minds-person-monogram-overlay" title={noPortraitLabel}>
                {person.monogram}
              </span>
            ) : null}
          </>
        ) : (
          <span className="minds-person-monogram" title={noPortraitLabel}>
            {person.monogram}
          </span>
        )}
      </div>
      <div className="minds-person-copy">
        <h4>{person.name[lang]}</h4>
        <p className="minds-person-role">{person.role[lang]}</p>
        <p>{person.bio[lang]}</p>
      </div>
    </article>
  );
}

function Scene3D({
  school,
  selectedRegion,
  onSelectRegion,
  lang,
  copy,
}: {
  school: MindSchool;
  selectedRegion: BrainRegionId | null;
  onSelectRegion: (id: BrainRegionId) => void;
  lang: Lang;
  copy: (typeof COPY)[Lang];
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    tiltX: number;
    tiltY: number;
  }>({ active: false, x: 0, y: 0, tiltX: 14, tiltY: -22 });
  const orbitRef = useRef({ baseY: -22, frame: 0 });
  const [tilt, setTilt] = useState({ x: 14, y: -22 });
  const [dragging, setDragging] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);

  const activeRegions = useMemo(
    () => new Set(school.brainRegions),
    [school],
  );
  const activeElements = useMemo(
    () => new Set(school.elements),
    [school],
  );

  useEffect(() => {
    if (!autoOrbit || dragging) {
      return;
    }

    orbitRef.current.baseY = tilt.y;
    orbitRef.current.frame = 0;
    let raf = 0;
    const tick = () => {
      orbitRef.current.frame += 1;
      const t = orbitRef.current.frame;
      setTilt({
        x: 13 + Math.sin(t / 70) * 3.5,
        y: orbitRef.current.baseY + t * 0.12,
      });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart orbit from current tilt only when auto/drag/school changes
  }, [autoOrbit, dragging, school.id]);

  function clampTilt(next: { x: number; y: number }) {
    return {
      x: Math.max(-8, Math.min(28, next.x)),
      y: next.y,
    };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) {
      return;
    }
    const node = stageRef.current;
    if (!node) return;
    node.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      tiltX: tilt.x,
      tiltY: tilt.y,
    };
    setDragging(true);
    setAutoOrbit(false);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setTilt(
      clampTilt({
        x: dragRef.current.tiltX - dy * 0.12,
        y: dragRef.current.tiltY + dx * 0.16,
      }),
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    try {
      stageRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setAutoOrbit(true), 1600);
  }

  function resetView() {
    setTilt({ x: 14, y: -22 });
    setAutoOrbit(true);
  }

  const worldStyle = {
    ["--school-accent" as string]: school.accent,
    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
  } as CSSProperties;

  return (
    <div
      className={`minds-scene3d${dragging ? " is-dragging" : ""}`}
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ ["--school-accent" as string]: school.accent }}
    >
      <div className="minds-scene3d-backdrop" aria-hidden="true">
        <img src="/minds/scenes/filaments.jpg" alt="" />
      </div>
      <div className="minds-scene3d-glow" aria-hidden="true" />
      <div className="minds-scene3d-toolbar">
        <p className="minds-scene3d-hint">{copy.sceneHint}</p>
        <button type="button" className="minds-scene3d-reset" onClick={resetView}>
          {copy.sceneReset}
        </button>
      </div>
      <div className="minds-scene3d-world" style={worldStyle}>
        <div className="minds-scene3d-floor" aria-hidden="true">
          <img src="/minds/scenes/pedestal.jpg" alt="" />
        </div>

        <div
          className={`minds-scene3d-card minds-scene3d-env${
            activeElements.has("environment") ? " is-active" : ""
          }`}
        >
          <img src="/minds/scenes/environment.jpg" alt="" />
          <div className="minds-scene3d-caption">
            <span>environment</span>
            <strong>{copy.envLabel}</strong>
            <em>{copy.envHint}</em>
          </div>
        </div>

        <div
          className={`minds-scene3d-card minds-scene3d-body${
            activeElements.has("body") ? " is-active" : ""
          }`}
        >
          <img src="/minds/scenes/body.jpg" alt="" />
          <div className="minds-scene3d-caption">
            <span>body</span>
            <strong>{copy.bodyLabel}</strong>
            <em>{copy.bodyHint}</em>
          </div>
        </div>

        <div
          className={`minds-scene3d-card minds-scene3d-brain${
            activeElements.has("brain") ? " is-active" : ""
          }`}
        >
          <img src="/minds/scenes/brain.jpg" alt="" />
          <div className="minds-brain-hotspots">
            {HOTSPOTS.map((spot) => (
              <button
                key={spot.id}
                type="button"
                className={`minds-hotspot${
                  activeRegions.has(spot.id) ? " is-active" : ""
                }${selectedRegion === spot.id ? " is-selected" : ""}`}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onClick={() => onSelectRegion(spot.id)}
                aria-label={
                  BRAIN_REGIONS.find((r) => r.id === spot.id)?.label[lang] ??
                  spot.label
                }
              >
                <span>{spot.label}</span>
              </button>
            ))}
          </div>
          <div className="minds-scene3d-caption">
            <span>brain</span>
            <strong>{copy.brainLabel}</strong>
            <em>{copy.brainHint}</em>
          </div>
        </div>

        <svg className="minds-scene3d-links" viewBox="0 0 100 100" aria-hidden="true">
          {school.edges.slice(0, 6).map((edge, index) => {
            const mapPoint = (token: string) => {
              if (token === "environment" || token === "hierarchy") return [22, 28];
              if (token === "body" || token === "motor") return [28, 72];
              if (token === "brain" || token === "pfc") return [68, 42];
              if (token === "sensory" || token === "hotzone") return [78, 58];
              if (token === "parietal" || token === "tpj") return [62, 30];
              if (token === "thalamus") return [58, 50];
              return [50 + index * 3, 50];
            };
            const [x1, y1] = mapPoint(String(edge.from));
            const [x2, y2] = mapPoint(String(edge.to));
            return (
              <path
                key={`${school.id}-link-${index}`}
                className={`minds-scene-link is-${edge.strength}`}
                d={`M ${x1} ${y1} Q 50 ${20 + index * 8} ${x2} ${y2}`}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function SchoolDetail({ school, lang }: { school: MindSchool; lang: Lang }) {
  const copy = COPY[lang];
  const books = school.works.filter((w) => w.kind === "book");
  const papers = school.works.filter((w) => w.kind === "paper");

  return (
    <article
      className="minds-school"
      id={`school-${school.id}`}
      style={{ ["--school-accent" as string]: school.accent }}
    >
      <header className="minds-school-head">
        <span className="minds-school-short">{school.shortName}</span>
        <div>
          <p className="minds-school-year">{school.originYear}</p>
          <h3>{school.name[lang]}</h3>
        </div>
      </header>

      <div className="minds-school-grid">
        <section>
          <h4>{copy.originLabel}</h4>
          {school.origin[lang].split("\n").map((para, index) =>
            para.trim() ? <p key={`origin-${index}`}>{para}</p> : null,
          )}
        </section>
        <section>
          <h4>{copy.traitsLabel}</h4>
          {school.characteristics[lang].split("\n").map((para, index) =>
            para.trim() ? <p key={`traits-${index}`}>{para}</p> : null,
          )}
        </section>
      </div>

      <section className="minds-school-evolution">
        <h4>{copy.evolutionLabel}</h4>
        <ol>
          {school.evolution.map((item, index) => (
            <li key={`${school.id}-evo-${index}`}>{item[lang]}</li>
          ))}
        </ol>
      </section>

      <section className="minds-school-people">
        <h4>{copy.peopleLabel}</h4>
        <div className="minds-people-grid">
          {school.people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              lang={lang}
              noPortraitLabel={copy.noPortrait}
            />
          ))}
        </div>
      </section>

      <section className="minds-school-works">
        <h4>{copy.worksLabel}</h4>
        <div className="minds-works-columns">
          <div>
            <p className="minds-works-kicker">{copy.booksLabel}</p>
            <ul>
              {books.map((work) => (
                <li key={work.id}>
                  <div className="minds-work-main">
                    <strong>{work.title}</strong>
                    <span className="minds-work-meta">
                      {work.year}
                      {work.authors ? ` · ${work.authors}` : ""}
                    </span>
                    <span className="minds-work-note">{work.note[lang]}</span>
                  </div>
                  {work.url ? (
                    <a href={work.url} target="_blank" rel="noreferrer">
                      {copy.openLink}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="minds-works-kicker">{copy.papersLabel}</p>
            <ul>
              {papers.map((work) => (
                <li key={work.id}>
                  <div className="minds-work-main">
                    <strong>{work.title}</strong>
                    <span className="minds-work-meta">
                      {work.year}
                      {work.authors ? ` · ${work.authors}` : ""}
                    </span>
                    <span className="minds-work-note">{work.note[lang]}</span>
                  </div>
                  {work.url ? (
                    <a href={work.url} target="_blank" rel="noreferrer">
                      {copy.openLink}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
}

export function MindSchoolsPage({ lang }: MindSchoolsPageProps) {
  const copy = COPY[lang];
  const [activeSchoolId, setActiveSchoolId] = useState(
    MIND_SCHOOLS[0]?.id ?? "active-inference",
  );
  const [selectedRegion, setSelectedRegion] = useState<BrainRegionId | null>(
    "pfc",
  );

  const school = useMemo(
    () => MIND_SCHOOLS.find((item) => item.id === activeSchoolId) ?? MIND_SCHOOLS[0],
    [activeSchoolId],
  );

  const selectedRegionMeta = selectedRegion
    ? BRAIN_REGIONS.find((region) => region.id === selectedRegion)
    : null;

  if (!school) {
    return null;
  }

  return (
    <article className="minds-page">
      <section className="minds-hero" id="minds-overview">
        <div className="minds-hero-copy">
          <p className="minds-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="minds-hero-deck">{copy.heroDeck}</p>
          <p className="minds-hero-lead">{copy.heroLead}</p>
          <div className="minds-hero-actions">
            <a href="#minds-timeline">{copy.jumpTimeline}</a>
            <a href="#minds-interactive">{copy.jumpInteractive}</a>
            <a href="#minds-schools">{copy.jumpSchools}</a>
          </div>
        </div>
        <figure className="minds-hero-visual">
          <img src="/minds/scenes/hero.jpg" alt="" />
          <figcaption>
            brain · body · environment
          </figcaption>
        </figure>
      </section>

      <section className="minds-section" id="minds-timeline">
        <header className="minds-section-head">
          <h2>{copy.timelineTitle}</h2>
          <p>{copy.timelineLead}</p>
        </header>
        <ol className="minds-timeline">
          {MIND_TIMELINE.map((node) => (
            <li key={`${node.year}-${node.title.en}`}>
              <span className="minds-timeline-year">{node.year}</span>
              <div className="minds-timeline-body">
                <h3>{node.title[lang]}</h3>
                <p>{node.body[lang]}</p>
                {node.schoolId ? (
                  <button
                    type="button"
                    className="minds-timeline-jump"
                    onClick={() => {
                      setActiveSchoolId(node.schoolId!);
                      document
                        .getElementById("minds-interactive")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {MIND_SCHOOLS.find((s) => s.id === node.schoolId)?.shortName ??
                      node.schoolId}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="minds-section minds-interactive-section"
        id="minds-interactive"
      >
        <header className="minds-section-head">
          <h2>{copy.interactiveTitle}</h2>
          <p>{copy.interactiveLead}</p>
        </header>

        <div className="minds-school-switch" role="tablist" aria-label={copy.pickSchool}>
          {MIND_SCHOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === school.id}
              className={item.id === school.id ? "active" : ""}
              style={
                item.id === school.id
                  ? { ["--school-accent" as string]: item.accent }
                  : undefined
              }
              onClick={() => {
                setActiveSchoolId(item.id);
                setSelectedRegion(item.brainRegions[0] ?? null);
              }}
            >
              <span className="minds-switch-short">{item.shortName}</span>
              <span className="minds-switch-name">{item.name[lang]}</span>
            </button>
          ))}
        </div>

        <div className="minds-interactive-stage minds-interactive-stage-3d">
          <Scene3D
            school={school}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            lang={lang}
            copy={copy}
          />

          <aside className="minds-relation-panel">
            <p className="minds-panel-label">
              {copy.activeSchool}: <strong>{school.name[lang]}</strong>
            </p>
            <div className="minds-relation-summary">
              <h3>{copy.relationTitle}</h3>
              {school.relationSummary[lang].split("\n").map((para, index) =>
                para.trim() ? <p key={`rel-${index}`}>{para}</p> : null,
              )}
            </div>

            {selectedRegionMeta ? (
              <div className="minds-region-card">
                <strong>{selectedRegionMeta.label[lang]}</strong>
                <p>{selectedRegionMeta.hint[lang]}</p>
                <p className="minds-region-status">
                  {school.brainRegions.includes(selectedRegionMeta.id)
                    ? copy.legendActive
                    : "—"}
                </p>
              </div>
            ) : null}

            <div className="minds-edges-panel">
              <h3>{copy.edgesTitle}</h3>
              <ul className="minds-edge-list">
                {school.edges.map((edge, index) => (
                  <li
                    key={`${school.id}-edge-${index}`}
                    className={`minds-edge is-${edge.strength}`}
                  >
                    <span className="minds-edge-from">{edge.from}</span>
                    <span className="minds-edge-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="minds-edge-to">{edge.to}</span>
                    <span className="minds-edge-label">{edge.label[lang]}</span>
                  </li>
                ))}
              </ul>
              <div className="minds-legend">
                <span className="is-primary">{copy.legendPrimary}</span>
                <span className="is-secondary">{copy.legendSecondary}</span>
              </div>
            </div>

            <div className="minds-tag-rows">
              <div>
                <p className="minds-works-kicker">{copy.elementsTitle}</p>
                <div className="minds-tags">
                  {school.elements.map((el: MindElement) => (
                    <span key={el} className="minds-tag">
                      {el === "environment"
                        ? copy.envLabel
                        : el === "body"
                          ? copy.bodyLabel
                          : copy.brainLabel}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="minds-works-kicker">{copy.regionsTitle}</p>
                <div className="minds-tags">
                  {school.brainRegions.map((regionId) => {
                    const meta = BRAIN_REGIONS.find((r) => r.id === regionId);
                    return (
                      <button
                        type="button"
                        key={regionId}
                        className={`minds-tag minds-tag-button${
                          selectedRegion === regionId ? " is-selected" : ""
                        }`}
                        onClick={() => setSelectedRegion(regionId)}
                      >
                        {meta?.label[lang] ?? regionId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <a className="minds-to-school" href={`#school-${school.id}`}>
              {copy.deepRead}: {school.name[lang]} →
            </a>
          </aside>
        </div>
      </section>

      <section className="minds-section" id="minds-compare">
        <header className="minds-section-head">
          <h2>{copy.compareTitle}</h2>
          <p>{copy.compareLead}</p>
        </header>
        <div className="minds-compare-wrap">
          <table className="minds-compare-table">
            <thead>
              <tr>
                <th>{copy.compareSchool}</th>
                <th>{copy.compareCore}</th>
                <th>{copy.compareLocus}</th>
                <th>{copy.compareBuild}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => {
                const meta = MIND_SCHOOLS.find((s) => s.id === row.id);
                return (
                  <tr key={row.id}>
                    <th scope="row">
                      <button
                        type="button"
                        className="minds-compare-school"
                        style={
                          meta
                            ? { ["--school-accent" as string]: meta.accent }
                            : undefined
                        }
                        onClick={() => {
                          setActiveSchoolId(row.id);
                          document
                            .getElementById("minds-interactive")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        <span>{meta?.shortName ?? row.id}</span>
                        {meta?.name[lang]}
                      </button>
                    </th>
                    <td>{row.core[lang]}</td>
                    <td>{row.locus[lang]}</td>
                    <td>{row.build[lang]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="minds-section" id="minds-schools">
        <header className="minds-section-head">
          <h2>{copy.schoolsTitle}</h2>
          <p>{copy.schoolsLead}</p>
        </header>
        <div className="minds-schools-list">
          {MIND_SCHOOLS.map((item) => (
            <SchoolDetail key={item.id} school={item} lang={lang} />
          ))}
        </div>
      </section>
    </article>
  );
}

export const MINDS_OUTLINE_ITEMS = [
  { id: "minds-timeline", label: { zh: "时间线", en: "Timeline" } },
  { id: "minds-interactive", label: { zh: "三维", en: "3D map" } },
  { id: "minds-compare", label: { zh: "对照", en: "Compare" } },
  { id: "minds-schools", label: { zh: "学派", en: "Schools" } },
] as const;
