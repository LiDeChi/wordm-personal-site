import type { Lang } from "../i18n/lang";

export type LocalizedText = Record<Lang, string>;

export type MindPerson = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  /** Wikimedia / public portrait when available; monogram used as fallback. */
  portraitUrl?: string;
  monogram: string;
  accent: string;
};

export type MindWork = {
  id: string;
  kind: "book" | "paper";
  title: string;
  year: string;
  authors?: string;
  note: LocalizedText;
  url?: string;
};

export type MindElement = "environment" | "body" | "brain";

export type BrainRegionId =
  | "pfc"
  | "parietal"
  | "sensory"
  | "motor"
  | "thalamus"
  | "tpj"
  | "hotzone"
  | "hierarchy";

export type MindRelationEdge = {
  from: MindElement | BrainRegionId;
  to: MindElement | BrainRegionId;
  label: LocalizedText;
  strength: "primary" | "secondary";
};

export type MindSchool = {
  id: string;
  shortName: string;
  name: LocalizedText;
  originYear: string;
  origin: LocalizedText;
  evolution: LocalizedText[];
  characteristics: LocalizedText;
  people: MindPerson[];
  works: MindWork[];
  /** How this school maps brain / body / environment. */
  relationSummary: LocalizedText;
  elements: MindElement[];
  brainRegions: BrainRegionId[];
  edges: MindRelationEdge[];
  accent: string;
};

export type TimelineNode = {
  year: string;
  title: LocalizedText;
  body: LocalizedText;
  schoolId?: string;
};

export const BRAIN_REGIONS: Array<{
  id: BrainRegionId;
  label: LocalizedText;
  hint: LocalizedText;
}> = [
  {
    id: "pfc",
    label: { zh: "前额叶 (PFC)", en: "Prefrontal cortex" },
    hint: {
      zh: "规划、报告、元认知与全局广播的关键节点。",
      en: "Planning, reportability, metacognition, and global broadcast.",
    },
  },
  {
    id: "parietal",
    label: { zh: "顶叶网络", en: "Parietal network" },
    hint: {
      zh: "与前额叶共同构成全局工作空间点火回路。",
      en: "Partners with PFC in workspace ignition loops.",
    },
  },
  {
    id: "sensory",
    label: { zh: "感觉皮层", en: "Sensory cortex" },
    hint: {
      zh: "前馈特征提取与局部再入处理的主场。",
      en: "Feedforward feature extraction and local recurrence.",
    },
  },
  {
    id: "motor",
    label: { zh: "运动系统", en: "Motor systems" },
    hint: {
      zh: "行动、主动采样与主动推理的输出端。",
      en: "Action, active sampling, and active inference outputs.",
    },
  },
  {
    id: "thalamus",
    label: { zh: "丘脑回路", en: "Thalamic loops" },
    hint: {
      zh: "门控、注意与皮层—皮层协调的中继。",
      en: "Gating, attention, and cortico-cortical coordination.",
    },
  },
  {
    id: "tpj",
    label: { zh: "TPJ / 注意控制", en: "TPJ / attention control" },
    hint: {
      zh: "注意图式与社会注意推断的相关区域。",
      en: "Attention schema and social attention inference.",
    },
  },
  {
    id: "hotzone",
    label: { zh: "后部热区", en: "Posterior hot zone" },
    hint: {
      zh: "IIT 语境下常被强调的整合信息候选区。",
      en: "A candidate locus for integrated information in IIT debates.",
    },
  },
  {
    id: "hierarchy",
    label: { zh: "层级预测栈", en: "Predictive hierarchy" },
    hint: {
      zh: "自上而下预测与自下而上误差的多层栈。",
      en: "Top-down prediction and bottom-up error stacks.",
    },
  },
];

export const MIND_TIMELINE: TimelineNode[] = [
  {
    year: "1860s",
    title: {
      zh: "Helmholtz：无意识推理",
      en: "Helmholtz: unconscious inference",
    },
    body: {
      zh: "感知被重新理解为一种推理过程：神经系统并非被动登记刺激，而是用先验结构解释感觉数据。这一“无意识推理”传统成为后来预测编码与预测加工的哲学与概念源头，也提示机器感知不应只做特征映射，而应做可修正的解释。",
      en: "Perception is reconceived as inference: nervous systems do not merely register stimuli but explain sensory data with prior structure. This tradition of unconscious inference becomes a conceptual root of predictive coding and predictive processing, and suggests machine perception should revise explanations rather than only map features.",
    },
  },
  {
    year: "1950s–70s",
    title: {
      zh: "认知架构与工作记忆",
      en: "Cognitive architectures & working memory",
    },
    body: {
      zh: "认知革命把心智建成可计算对象。Newell、Simon 等的符号架构，以及工作记忆与控制注意的研究，为后来的“全局广播 / 有限容量平台”隐喻准备了工程直觉：智能系统既需要专门模块，也需要可共享的中心舞台。",
      en: "The cognitive revolution makes mind a computable object. Symbolic architectures from Newell, Simon, and others, plus research on working memory and controlled attention, prepare the engineering intuition later used by global-broadcast metaphors: intelligent systems need both specialized modules and a shareable central stage.",
    },
  },
  {
    year: "1988",
    title: {
      zh: "Baars 提出 Global Workspace",
      en: "Baars proposes Global Workspace",
    },
    body: {
      zh: "Baars 的全局工作空间理论用认知架构语言定义意识：专门化无意识处理器竞争进入有限容量广播平台。意识首先被当作通达与协调功能，这为后续神经科学化提供了清晰的系统接口。",
      en: "Baars's Global Workspace Theory defines consciousness in architectural language: specialized unconscious processors compete for a limited-capacity broadcast stage. Consciousness is first a function of access and coordination — a clean systems interface for later neuronal formalization.",
    },
    schoolId: "gwt",
  },
  {
    year: "1990s",
    title: {
      zh: "预测编码与高阶理论成形",
      en: "Predictive coding & HOT take shape",
    },
    body: {
      zh: "多条线索并行：Rao & Ballard 给出预测编码模型；Rosenthal 系统化高阶理论；Dehaene 等开始把工作空间神经化。意识与认知研究从单一学派叙事进入可对照的理论 plural。",
      en: "Parallel strands: Rao & Ballard formalize predictive coding; Rosenthal systematizes higher-order theory; Dehaene and colleagues begin neuronalizing the workspace. Consciousness and cognition enter a plural, contrastable theory space.",
    },
  },
  {
    year: "2000s",
    title: {
      zh: "FEP / IIT / GNW 并行爆发",
      en: "FEP, IIT, and GNW surge",
    },
    body: {
      zh: "Friston 的自由能与主动推理、Tononi 的 IIT、Dehaene–Changeux 的 GNW 几乎同时把领域推入高理论密度阶段。机器构建心智所需的“原理 / 度量 / 机制”三类资源同时出现。",
      en: "Friston's free energy and Active Inference, Tononi's IIT, and Dehaene–Changeux GNW push the field into high theoretical density. The three resources machine minds need — principles, measures, and mechanisms — appear together.",
    },
  },
  {
    year: "2010s",
    title: {
      zh: "预测加工、AST、RPT 成熟",
      en: "PP, AST, and RPT mature",
    },
    body: {
      zh: "Clark、Hohwy、Seth 等系统化预测加工；Graziano 提出可工程的注意图式；Lamme 的再入处理与 GWT 形成现象/通达对照。理论开始明确回答“如何建造”而不只是“如何命名”。",
      en: "Clark, Hohwy, Seth and others systematize predictive processing; Graziano proposes an engineerable attention schema; Lamme's recurrent processing contrasts with GWT on phenomenal vs access. Theories increasingly answer how to build, not only how to name.",
    },
  },
  {
    year: "2020s",
    title: {
      zh: "实验对抗与工程实现",
      en: "Adversarial tests & engineering",
    },
    body: {
      zh: "对抗性实验、算法实现与 agent 工程并行加速。主动推理进入可运行库与教材化实现，AST 给出明确的工程分解，意识理论争论越来越像可测试、可实现的研究纲领集合。",
      en: "Adversarial experiments, algorithmic implementation, and agent engineering accelerate together. Active Inference enters runnable libraries and textbook implementations; AST offers a clear engineering decomposition; consciousness debates increasingly look like testable, implementable research programs.",
    },
  },
];

export const MIND_SCHOOLS: MindSchool[] = [
  {
    id: "active-inference",
    shortName: "AIF",
    name: {
      zh: "主动推理 / 自由能原理",
      en: "Active Inference / Free Energy Principle",
    },
    originYear: "2000s",
    origin: {
      zh: "2000 年代中期，Karl Friston 在 UCL 的工作把脑成像统计建模与自组织系统理论接在一起，逐渐形成后来被称为自由能原理（Free Energy Principle, FEP）的一般性主张。它的核心不是“大脑喜欢做预测”这一经验口号，而是一条更强的生存论—信息论命题：任何能在波动环境中持续存在的系统，都必须把自己的内部状态约束在与自身结构相容的边界之内；变分自由能正是对“惊讶”的可计算上界。\n\n在这一框架中，感知、学习与行动不再是彼此独立的模块，而是同一条自由能最小化路径上的不同投影。感知对应在固定行动下更新信念，行动对应在固定信念下改变感觉输入，学习则对应在更长时间尺度上改写生成模型本身。因此，主动推理（Active Inference）并不是给预测编码额外加一层运动控制，而是把行动纳入同一个生成模型推理问题。",
      en: "In the mid-2000s, Karl Friston's work at UCL joined statistical modeling in neuroimaging with theories of self-organizing systems, crystallizing what became the Free Energy Principle (FEP). The claim is stronger than the slogan that “brains like to predict”: any system that persists in a fluctuating environment must keep its internal states within bounds compatible with its own structure, and variational free energy is a tractable upper bound on surprise.\n\nWithin this frame, perception, learning, and action are not separate modules but projections of one free-energy minimization path. Perception updates beliefs under fixed action; action changes sensory input under fixed beliefs; learning rewrites the generative model on a slower timescale. Active Inference therefore does not bolt motor control onto predictive coding — it folds action into the same generative-model inference problem.",
    },
    evolution: [
      {
        zh: "早期工作把预测编码形式化，并明确扩展到行动：系统不仅更新对世界的信念，还选择能改变感觉输入的策略，从而在主动采样中降低期望自由能。",
        en: "Early work formalizes predictive coding and extends it to action: systems update beliefs about the world and select policies that change sensory input, reducing expected free energy through active sampling.",
      },
      {
        zh: "2010 年前后，框架从感知进一步覆盖规划、学习与社会交互，形成“生成模型 + 变分推理 + 策略选择”的完整理论栈，并与机器人与计算精神病学产生交叉。",
        en: "Around 2010 the framework expands from perception to planning, learning, and social interaction, yielding a full stack of generative models, variational inference, and policy selection, with crossovers into robotics and computational psychiatry.",
      },
      {
        zh: "2022 年，Parr、Pezzulo 与 Friston 合著《Active Inference》，把离散与连续设定、期望自由能与认知现象连接起来，成为领域内最常被引用的标准教材。",
        en: "In 2022, Parr, Pezzulo, and Friston published Active Inference, connecting discrete and continuous settings, expected free energy, and cognitive phenomena — now a standard textbook reference.",
      },
      {
        zh: "2026 年前后，Namjoshi 的工程向教材《Fundamentals of Active Inference》系统整理算法路径与实现细节，使理论更容易进入机器学习与 agent 工程实践。",
        en: "Around 2026, Namjoshi's engineering-facing Fundamentals of Active Inference systematizes algorithms and implementation details, making the theory more enterable for machine learning and agent engineering.",
      }
    ],
    characteristics: {
      zh: "主动推理把“理解世界”与“在世界中行动”写成同一类变分推理问题。系统持有关于外部原因与内部状态的生成模型；感觉证据通过预测误差驱动信念更新；策略（policies）则通过期望自由能（expected free energy）在探索与利用之间权衡。离散状态空间版本便于与规划、语言和符号控制对接，连续状态空间版本则更接近运动控制与动力学系统。对机器构建心智而言，它提供的是可实现的算法骨架，而不仅是隐喻。",
      en: "Active Inference casts understanding the world and acting in it as one family of variational inference problems. The system holds generative models of external causes and internal states; sensory evidence drives belief updates through prediction error; policies trade exploration and exploitation via expected free energy. Discrete-state formulations connect naturally to planning, language, and symbolic control, while continuous-state versions track motor control and dynamical systems. For machine minds, this is an implementable algorithmic skeleton, not merely a metaphor.",
    },
    people: [
      {
        id: "friston",
        name: { zh: "Karl Friston", en: "Karl Friston" },
        role: { zh: "理论创始人", en: "Founder of the theory" },
        bio: {
          zh: "UCL 理论神经科学家，自由能原理与主动推理的核心提出者。他的工作把统计脑成像、动力学系统与变分推理织成同一套第一性原理语言，使“心智如何在不确定世界中持续存在”变成可写方程、可做仿真的问题。",
          en: "Theoretical neuroscientist at UCL and principal architect of the Free Energy Principle and Active Inference. His work braids statistical neuroimaging, dynamical systems, and variational inference into one first-principles language, turning “how minds persist under uncertainty” into equations and simulations.",
        },
        portraitUrl:
          "/minds/portraits/friston.jpg",
        monogram: "KF",
        accent: "#2f6fed",
      },
      {
        id: "parr",
        name: { zh: "Thomas Parr", en: "Thomas Parr" },
        role: { zh: "理论—现象桥梁", en: "Theory–phenomena bridge" },
        bio: {
          zh: "在主动推理教材与系列论文中，把抽象变分原则连接到感知、注意、记忆与规划等具体认知现象，是理论进入认知科学主流对话的关键桥梁人物之一。",
          en: "Through the Active Inference textbook and related papers, connects abstract variational principles to perception, attention, memory, and planning — a key bridge into mainstream cognitive science.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-neuro.jpg",
        monogram: "TP",
        accent: "#2f6fed",
      },
      {
        id: "pezzulo",
        name: { zh: "Giovanni Pezzulo", en: "Giovanni Pezzulo" },
        role: { zh: "认知与具身连接", en: "Cognition & embodiment" },
        bio: {
          zh: "长期研究具身认知、目标导向行为与内部模拟，把主动推理与认知控制、规划及机器人场景中的可执行模型连接起来。",
          en: "Long-standing work on embodied cognition, goal-directed behavior, and internal simulation links Active Inference to cognitive control, planning, and executable models in robotics-relevant settings.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-neuro.jpg",
        monogram: "GP",
        accent: "#2f6fed",
      },
      {
        id: "namjoshi",
        name: { zh: "Sanjeev Namjoshi", en: "Sanjeev Namjoshi" },
        role: { zh: "工程实现视角", en: "Engineering implementation" },
        bio: {
          zh: "从机器学习与工程实现角度系统整理主动推理算法、离散/连续状态空间与代码路径，降低理论进入应用研究的门槛。",
          en: "From a machine-learning and engineering standpoint, systematizes Active Inference algorithms, discrete/continuous state spaces, and code paths, lowering the barrier from theory to application.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "SN",
        accent: "#2f6fed",
      },
    ],
    works: [
      {
        id: "aif-book-2022",
        kind: "book",
        title: "Active Inference: The Free Energy Principle in Mind, Brain, and Behavior",
        year: "2022",
        authors: "Thomas Parr, Giovanni Pezzulo, Karl J. Friston",
        note: {
          zh: "当前最完整的理论教材与标准参考。",
          en: "The current standard textbook reference for the framework.",
        },
        url: "https://mitpress.mit.edu/9780262045353/active-inference/",
      },
      {
        id: "aif-fundamentals-2026",
        kind: "book",
        title: "Fundamentals of Active Inference",
        year: "2026",
        authors: "Sanjeev Namjoshi",
        note: {
          zh: "工程向：算法、状态空间与实现路径。",
          en: "Engineering-facing: algorithms, state spaces, implementation paths.",
        },
        url: "https://www.amazon.com/s?k=Fundamentals+of+Active+Inference+Namjoshi",
      },
      {
        id: "fep-2005",
        kind: "paper",
        title: "A theory of cortical responses",
        year: "2005",
        authors: "Karl Friston",
        note: {
          zh: "把预测编码与皮层响应统一到自由能框架。",
          en: "Unifies predictive coding and cortical responses under free energy.",
        },
        url: "https://doi.org/10.1098/rstb.2005.1622",
      },
      {
        id: "aif-action-2010",
        kind: "paper",
        title: "Action and behavior: a free-energy formulation",
        year: "2010",
        authors: "Karl J. Friston, Jean Daunizeau, James Kilner",
        note: {
          zh: "行动作为主动推理的关键节点论文。",
          en: "Key paper casting action as active inference.",
        },
        url: "https://doi.org/10.1007/s00422-010-0364-z",
      },
      {
        id: "fep-life-2013",
        kind: "paper",
        title: "Life as we know it",
        year: "2013",
        authors: "Karl Friston",
        note: {
          zh: "从自组织与生存边界阐述自由能原理。",
          en: "Frames FEP from self-organization and survival boundaries.",
        },
        url: "https://doi.org/10.1098/rsif.2013.0475",
      },
    ],
    relationSummary: {
      zh: "在主动推理中，环境不是被动背景，而是被主动采样的证据场；身体是可控制的感觉—运动界面，也是内感受与本体感觉的来源；大脑（或代理）维护层级生成模型，用自上而下预测与自下而上误差不断收紧对世界与自身的后验信念。行动之所以重要，是因为它能改变未来感觉，从而把“降低预测误差”从纯感知问题扩展为具身闭环。",
      en: "In Active Inference the environment is not a passive backdrop but an evidence field that is actively sampled; the body is a controllable sensorimotor interface and a source of interoception and proprioception; the brain (or agent) maintains hierarchical generative models that tighten posteriors over world and self through top-down predictions and bottom-up errors. Action matters because it changes future sensations, extending prediction-error reduction from pure perception into an embodied closed loop.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["hierarchy", "sensory", "motor", "pfc", "thalamus"],
    edges: [
      {
        from: "brain",
        to: "environment",
        label: {
          zh: "预测与主动采样",
          en: "Prediction & active sampling",
        },
        strength: "primary",
      },
      {
        from: "environment",
        to: "body",
        label: { zh: "感觉刺激", en: "Sensory stimulation" },
        strength: "primary",
      },
      {
        from: "body",
        to: "brain",
        label: { zh: "内感 / 外感输入", en: "Intero / extero input" },
        strength: "primary",
      },
      {
        from: "brain",
        to: "body",
        label: { zh: "运动指令", en: "Motor commands" },
        strength: "primary",
      },
      {
        from: "hierarchy",
        to: "sensory",
        label: { zh: "自上而下预测", en: "Top-down predictions" },
        strength: "secondary",
      },
      {
        from: "sensory",
        to: "hierarchy",
        label: { zh: "预测误差", en: "Prediction errors" },
        strength: "secondary",
      },
      {
        from: "motor",
        to: "body",
        label: { zh: "行动策略", en: "Action policies" },
        strength: "secondary",
      },
    ],
    accent: "#2f6fed",
  },
  {
    id: "predictive-processing",
    shortName: "PP",
    name: {
      zh: "预测加工",
      en: "Predictive Processing",
    },
    originYear: "2010s",
    origin: {
      zh: "预测加工的思想史可追溯到 Helmholtz 的“无意识推理”：感知被理解为大脑用先验知识解释感觉数据。1990 年代末，Rao 与 Ballard 给出视觉皮层中的预测编码计算模型，使“自上而下预测 / 自下而上误差”成为可实现的算法图式。真正把它提升为独立认知框架的，是 2010 年代哲学家与认知科学家的系统化工作——他们不再把预测误差最小化当作视觉皮层的局部技巧，而是当作心智组织的一般原则。\n\n与主动推理相比，预测加工文献更常停留在层级皮层叙事与具身认知哲学，而不强制采用自由能的完整数学形式；也因此更容易与注意、情绪、自我与意识等主题做概念嫁接。",
      en: "Predictive processing's intellectual history reaches back to Helmholtz's “unconscious inference”: perception as the brain explaining sensory data with priors. In the late 1990s, Rao and Ballard offered a computational model of predictive coding in visual cortex, turning top-down prediction / bottom-up error into an implementable schema. What made it a freestanding cognitive framework was 2010s work by philosophers and cognitive scientists, who treated prediction-error minimization not as a local visual trick but as a general principle of mind.\n\nRelative to Active Inference, PP literature more often stays with hierarchical cortical narratives and embodied cognitive philosophy, without mandating the full free-energy math — which makes conceptual bridges to attention, emotion, self, and consciousness easier to draw.",
    },
    evolution: [
      {
        zh: "2013 年，Hohwy 在《The Predictive Mind》中以哲学严格性论证：若把心智理解为预测误差最小化，许多传统认识论与知觉问题会获得统一表述。",
        en: "In 2013 Hohwy's The Predictive Mind argued with philosophical rigor that casting mind as prediction-error minimization unifies many classical problems of epistemology and perception.",
      },
      {
        zh: "2016 年，Clark 的《Surfing Uncertainty》把预测加工写成具身、行动导向、与环境耦合的统一故事，强调行动与世界共同完成预测循环。",
        en: "In 2016 Clark's Surfing Uncertainty cast PP as an embodied, action-oriented, environment-coupled story in which action and world jointly complete the predictive loop.",
      },
      {
        zh: "Seth 将预测加工用于意识、自我模型与“受控幻觉”叙事，使该框架进入更广泛的公众科学与意识研究对话。",
        en: "Seth applied PP to consciousness, self-models, and “controlled hallucination,” bringing the framework into broader public science and consciousness debates.",
      },
      {
        zh: "Barrett 用预测脑重构情绪理论，主张情绪是大脑在概念化过程中对身体信号与情境的建构，而非固定基本情绪模块的直接读出。",
        en: "Barrett reconstrues emotion via the predictive brain, treating emotions as constructions over bodily signals and context rather than direct readouts of fixed basic-emotion modules.",
      }
    ],
    characteristics: {
      zh: "预测加工强调多层生成模型：高层生成对低层活动的预期，低层把未能解释的残差作为误差信号回传。精度加权（precision weighting）使系统能够动态调节哪一层误差“值得相信”，从而把注意、信心与学习率统一到同一机制。身体与行动在 Clark 等人的表述中不是外加附件，而是预测循环的组成部分：行动可以理解为让世界符合预测的手段。",
      en: "Predictive processing stresses multi-layer generative models: higher levels generate expectations over lower-level activity, and lower levels return unexplained residuals as error. Precision weighting lets the system dynamically decide which errors are “worth believing,” unifying attention, confidence, and learning rates in one mechanism. In Clark and related accounts, body and action are not add-ons but parts of the predictive loop: action can be read as making the world conform to prediction.",
    },
    people: [
      {
        id: "clark",
        name: { zh: "Andy Clark", en: "Andy Clark" },
        role: { zh: "具身统一框架", en: "Embodied unification" },
        bio: {
          zh: "以《Surfing Uncertainty》等著作把预测加工写成具身、行动导向的统一认知故事，强调心智是与环境耦合的预测引擎，而非封闭的符号盒子。",
          en: "With Surfing Uncertainty and related work, casts predictive processing as an embodied, action-oriented unified story of mind — a prediction engine coupled to the world, not a sealed symbol box.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "AC",
        accent: "#0f9d8a",
      },
      {
        id: "hohwy",
        name: { zh: "Jakob Hohwy", en: "Jakob Hohwy" },
        role: { zh: "哲学严格化", en: "Philosophical rigor" },
        bio: {
          zh: "以哲学严格性论证预测误差最小化作为认知的核心机制，澄清预测加工的认识论含义与边界条件。",
          en: "Argues with philosophical rigor that prediction-error minimization is a core mechanism of cognition, clarifying PP's epistemic commitments and boundary conditions.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "JH",
        accent: "#0f9d8a",
      },
      {
        id: "seth",
        name: { zh: "Anil Seth", en: "Anil Seth" },
        role: { zh: "意识与自我", en: "Consciousness & self" },
        bio: {
          zh: "意识科学家与公共科学作者，把预测加工用于自我、身体拥有感与“受控幻觉”等主题，使该框架同时进入实验室与公众讨论。",
          en: "Consciousness scientist and public-science author applying predictive processing to selfhood, body ownership, and controlled hallucination — in the lab and in public debate.",
        },
        portraitUrl:
          "/minds/portraits/seth.jpg",
        monogram: "AS",
        accent: "#0f9d8a",
      },
      {
        id: "barrett",
        name: { zh: "Lisa Feldman Barrett", en: "Lisa Feldman Barrett" },
        role: { zh: "情绪建构论", en: "Constructed emotion" },
        bio: {
          zh: "情绪建构论的代表人物，主张情绪并非固定模块的直接读出，而是预测脑在概念化身体信号与情境时生成的事件。",
          en: "Leading figure in the theory of constructed emotion: emotions are not direct readouts of fixed modules, but events generated when a predictive brain conceptualizes bodily signals and context.",
        },
        portraitUrl:
          "/minds/portraits/barrett.jpg",
        monogram: "LB",
        accent: "#0f9d8a",
      },
      {
        id: "rao-ballard",
        name: { zh: "Rao & Ballard", en: "Rao & Ballard" },
        role: { zh: "预测编码模型", en: "Predictive coding model" },
        bio: {
          zh: "1999 年提出视觉皮层预测编码经典计算模型，为后来的预测加工浪潮提供了可引用的算法原型。",
          en: "Proposed the 1999 classic computational model of predictive coding in visual cortex — an algorithmic prototype for the later predictive-processing wave.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "RB",
        accent: "#0f9d8a",
      },
    ],
    works: [
      {
        id: "pp-surfing",
        kind: "book",
        title: "Surfing Uncertainty",
        year: "2016",
        authors: "Andy Clark",
        note: {
          zh: "预测加工的具身与行动导向经典。",
          en: "Canonical embodied, action-oriented PP statement.",
        },
        url: "https://global.oup.com/academic/product/surfing-uncertainty-9780190217013",
      },
      {
        id: "pp-mind",
        kind: "book",
        title: "The Predictive Mind",
        year: "2013",
        authors: "Jakob Hohwy",
        note: {
          zh: "哲学上最系统的预测误差最小化论证。",
          en: "Most systematic philosophical case for PEM.",
        },
        url: "https://global.oup.com/academic/product/the-predictive-mind-9780199686735",
      },
      {
        id: "pp-being-you",
        kind: "book",
        title: "Being You: A New Science of Consciousness",
        year: "2021",
        authors: "Anil Seth",
        note: {
          zh: "意识、自我与受控幻觉的大众—学术桥梁。",
          en: "Bridge book on consciousness, self, and controlled hallucination.",
        },
        url: "https://www.anilseth.com/being-you/",
      },
      {
        id: "pp-how-emotions",
        kind: "book",
        title: "How Emotions Are Made",
        year: "2017",
        authors: "Lisa Feldman Barrett",
        note: {
          zh: "情绪建构论与预测脑。",
          en: "Constructed emotion and the predictive brain.",
        },
        url: "https://lisafeldmanbarrett.com/books/how-emotions-are-made/",
      },
      {
        id: "pp-rao-1999",
        kind: "paper",
        title: "Predictive coding in the visual cortex: a functional interpretation of some extra-classical receptive-field effects",
        year: "1999",
        authors: "Rajesh P. N. Rao, Dana H. Ballard",
        note: {
          zh: "预测编码计算模型奠基论文。",
          en: "Foundational predictive coding computational paper.",
        },
        url: "https://doi.org/10.1038/4580",
      },
    ],
    relationSummary: {
      zh: "大脑被写成层级预测机器；身体提供多模态感觉通道与行动杠杆；环境既是被预测的对象，也是被行动改写的证据流。理论重心在“预测—误差—精度”回路，而不是全局广播或 Φ 一类整合度量。因此它与主动推理高度亲和，却通常以更松散的数学与更广的哲学外延出现。",
      en: "The brain is cast as a hierarchical prediction engine; the body supplies multimodal sensory channels and action levers; the environment is both predicted object and evidence rewritten by action. The theoretical center of mass is the prediction–error–precision loop, not global broadcast or Φ-style integration measures. Hence its close affinity with Active Inference, usually with looser math and broader philosophical reach.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["hierarchy", "sensory", "motor", "pfc"],
    edges: [
      {
        from: "brain",
        to: "environment",
        label: { zh: "自上而下预测", en: "Top-down prediction" },
        strength: "primary",
      },
      {
        from: "environment",
        to: "brain",
        label: { zh: "预测误差", en: "Prediction error" },
        strength: "primary",
      },
      {
        from: "body",
        to: "brain",
        label: { zh: "多模态感觉", en: "Multimodal sensation" },
        strength: "secondary",
      },
      {
        from: "brain",
        to: "body",
        label: { zh: "具身行动", en: "Embodied action" },
        strength: "secondary",
      },
      {
        from: "hierarchy",
        to: "sensory",
        label: { zh: "层级预测", en: "Layered predictions" },
        strength: "secondary",
      },
    ],
    accent: "#0f9d8a",
  },
  {
    id: "gwt",
    shortName: "GWT",
    name: {
      zh: "全局工作空间理论",
      en: "Global Workspace Theory",
    },
    originYear: "1988",
    origin: {
      zh: "1988 年，Bernard Baars 在《A Cognitive Theory of Consciousness》中提出全局工作空间理论。灵感来自早期认知架构（Newell、Simon 等）与工作记忆研究：大量专门化的无意识处理器并行工作，但只有少数内容能够进入一个有限容量的“全局广播”平台，从而被广泛模块读取。意识在此首先是一种架构功能——通达、报告、协调与控制——而不是对感受质的第一人称描述。\n\n1990 年代末至 2000 年代，Stanislas Dehaene 与 Jean-Pierre Changeux 把这一认知架构落地为全局神经元工作空间（Global Neuronal Workspace）。他们用“点火”（ignition）描述信息突然被前额叶—顶叶长程网络放大并全局可用的动力学过程，并积累脑成像与电生理证据，使 GWT/GNW 成为实验意识科学中最常被拿来做对抗性测试的框架之一。",
      en: "In 1988 Bernard Baars proposed Global Workspace Theory in A Cognitive Theory of Consciousness. The inspiration was early cognitive architectures (Newell, Simon, and others) and working-memory research: many specialized unconscious processors run in parallel, but only a few contents enter a limited-capacity “global broadcast” stage that many modules can read. Consciousness here is first an architectural function — access, report, coordination, and control — not a first-person description of qualia.\n\nFrom the late 1990s through the 2000s, Stanislas Dehaene and Jean-Pierre Changeux grounded this architecture as the Global Neuronal Workspace. “Ignition” names the dynamics by which information is suddenly amplified in fronto-parietal long-range networks and made globally available. With accumulating imaging and electrophysiology, GWT/GNW became one of the frameworks most often put under adversarial experimental test.",
    },
    evolution: [
      {
        zh: "从 Baars 的认知架构表述，到实验可操作的“全局可用性”标准：意识内容应能被多种下游过程读取，包括报告、推理与策略调整。",
        en: "From Baars's architectural statement to experimentally operational “global availability”: conscious contents should be readable by many downstream processes, including report, reasoning, and policy adjustment.",
      },
      {
        zh: "Dehaene 与 Changeux 用点火动力学把工作空间神经化：局部联觉不足以解释突然的全脑广播，需要前额叶—顶叶长程放大。",
        en: "Dehaene and Changeux neuronalize the workspace with ignition dynamics: local coalitions do not explain sudden brain-wide broadcast without fronto-parietal long-range amplification.",
      },
      {
        zh: "大量掩蔽、注意瞬脱与颅内电生理研究被用来检验 GNW 预测，使其成为对抗性意识实验中的主要对照框架之一。",
        en: "Masking, attentional blink, and intracranial electrophysiology studies test GNW predictions, making it a primary contrast framework in adversarial consciousness experiments.",
      }
    ],
    characteristics: {
      zh: "GWT/GNW 的解释目标主要是可报告、可通达的意识。前馈加工可以完成复杂分类，但若无点火与全局广播，内容往往停留在局部、难以报告的状态。理论因此天然强调前额叶—顶叶网络、长程同步与“赢家通吃”式竞争。它与 RPT 的对照尤其尖锐：现象体验是否必须依赖全局通达系统，还是局部感觉再入已足够。",
      en: "GWT/GNW primarily targets reportable, accessible consciousness. Feedforward processing can achieve complex classification, yet without ignition and global broadcast contents often remain local and hard to report. The theory therefore stresses fronto-parietal networks, long-range synchrony, and winner-take-all competition. Its contrast with RPT is especially sharp: must phenomenal experience depend on global access systems, or does local sensory recurrence already suffice?",
    },
    people: [
      {
        id: "baars",
        name: { zh: "Bernard Baars", en: "Bernard Baars" },
        role: { zh: "认知架构创始", en: "Cognitive-architecture origin" },
        bio: {
          zh: "全局工作空间理论的提出者，用认知架构语言把意识定义为有限容量的全局广播平台，为后续神经科学化奠定概念骨架。",
          en: "Originator of Global Workspace Theory, defining consciousness in architectural terms as a limited-capacity global broadcast stage — the conceptual skeleton for later neuronal formalizations.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "BB",
        accent: "#c45c26",
      },
      {
        id: "dehaene",
        name: { zh: "Stanislas Dehaene", en: "Stanislas Dehaene" },
        role: { zh: "神经科学化主将", en: "Neuronal formalization" },
        bio: {
          zh: "把 GWT 发展为全局神经元工作空间，用点火、全脑广播与大量实证范式解释可报告意识，是实验意识科学的核心人物之一。",
          en: "Developed GWT into the Global Neuronal Workspace, explaining reportable awareness via ignition, brain-wide broadcast, and extensive empirical paradigms — a central figure in experimental consciousness science.",
        },
        portraitUrl:
          "/minds/portraits/dehaene.jpg",
        monogram: "SD",
        accent: "#c45c26",
      },
      {
        id: "changeux",
        name: { zh: "Jean-Pierre Changeux", en: "Jean-Pierre Changeux" },
        role: { zh: "神经模型共创", en: "Neural model co-creator" },
        bio: {
          zh: "神经生物学家，与 Dehaene 合作构建全局神经元工作空间模型，把认知架构与神经动力学、受体与皮层回路传统连接起来。",
          en: "Neurobiologist who co-built the global neuronal workspace model with Dehaene, linking cognitive architecture to neural dynamics and traditions of receptors and cortical circuits.",
        },
        portraitUrl:
          "/minds/portraits/changeux.jpg",
        monogram: "JC",
        accent: "#c45c26",
      },
    ],
    works: [
      {
        id: "gwt-baars-1988",
        kind: "book",
        title: "A Cognitive Theory of Consciousness",
        year: "1988",
        authors: "Bernard J. Baars",
        note: {
          zh: "全局工作空间理论源头著作。",
          en: "Source book of Global Workspace Theory.",
        },
        url: "https://www.cambridge.org/core/books/cognitive-theory-of-consciousness/0B4B0C0F5F7E5E0E0",
      },
      {
        id: "gwt-consciousness-brain",
        kind: "book",
        title: "Consciousness and the Brain",
        year: "2014",
        authors: "Stanislas Dehaene",
        note: {
          zh: "GNW 的公众与学术综合陈述。",
          en: "Public–academic synthesis of GNW.",
        },
        url: "https://www.penguinrandomhouse.com/books/220738/consciousness-and-the-brain-by-stanislas-dehaene/",
      },
      {
        id: "gwt-dehaene-2001",
        kind: "paper",
        title: "Towards a cognitive neuroscience of consciousness: basic evidence and a workspace framework",
        year: "2001",
        authors: "Stanislas Dehaene, Lionel Naccache",
        note: {
          zh: "认知神经科学视角的工作空间框架。",
          en: "Workspace framework for cognitive neuroscience of consciousness.",
        },
        url: "https://doi.org/10.1016/S0010-0277(00)00123-2",
      },
      {
        id: "gwt-dehaene-2011",
        kind: "paper",
        title: "Experimental and theoretical approaches to conscious processing",
        year: "2011",
        authors: "Stanislas Dehaene, Jean-Pierre Changeux",
        note: {
          zh: "点火与全局广播的理论—实验综述。",
          en: "Theory–experiment review of ignition and global broadcast.",
        },
        url: "https://doi.org/10.1016/j.neuron.2011.03.018",
      },
    ],
    relationSummary: {
      zh: "环境与身体提供需要被处理的信息源；专门化感觉与运动回路在局部完成特征提取与准备反应；真正使内容成为“意识中的”东西的，是它是否赢得进入前额叶—顶叶工作空间并被全局广播。身体与环境因此是必要输入，但意识门槛主要落在大脑内部的全局可用性机制上。",
      en: "Environment and body supply information sources to be processed; specialized sensory and motor circuits extract features and prepare responses locally; what makes a content “in consciousness” is whether it wins entry into the fronto-parietal workspace and is globally broadcast. Body and environment are necessary inputs, but the threshold of awareness mainly sits in brain-internal global availability.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["pfc", "parietal", "sensory", "thalamus"],
    edges: [
      {
        from: "environment",
        to: "sensory",
        label: { zh: "感觉输入", en: "Sensory input" },
        strength: "secondary",
      },
      {
        from: "body",
        to: "sensory",
        label: { zh: "内感 / 本体感", en: "Intero / proprio" },
        strength: "secondary",
      },
      {
        from: "sensory",
        to: "pfc",
        label: { zh: "竞争进入工作空间", en: "Compete for workspace" },
        strength: "primary",
      },
      {
        from: "pfc",
        to: "parietal",
        label: { zh: "点火 / 全局广播", en: "Ignition / broadcast" },
        strength: "primary",
      },
      {
        from: "pfc",
        to: "motor",
        label: { zh: "报告与控制", en: "Report & control" },
        strength: "secondary",
      },
    ],
    accent: "#c45c26",
  },
  {
    id: "iit",
    shortName: "IIT",
    name: {
      zh: "整合信息理论",
      en: "Integrated Information Theory",
    },
    originYear: "2000s",
    origin: {
      zh: "Giulio Tononi 在 2000 年代提出整合信息理论时，刻意避开了从功能、报告或计算角色出发的路线。起点是现象学：意识经验具有统一性、信息性、组合性、排他性等内在结构；理论的任务是倒推物理系统必须满足怎样的因果结构，才能产生这样的经验。Φ（phi）被用来度量系统整体相对其部分所携带的不可还原信息量。\n\nChristof Koch 从早期与 Francis Crick 合作寻找神经相关物（NCC），逐渐转向支持并推广 IIT。IIT 因此同时具有度量野心与本体论野心：它不只问“大脑如何报告意识”，也问“什么样的系统在原则上有意识”。这使它与 GWT、HOT、AST 等更偏功能或机制消解的路线持续处于张力之中。",
      en: "When Giulio Tononi proposed Integrated Information Theory in the 2000s, he deliberately avoided starting from function, report, or computational role. The starting point is phenomenology: conscious experience has intrinsic structure — unity, information, composition, exclusion — and theory must reverse-engineer the causal structure a physical system needs to support such experience. Φ (phi) measures irreducible information the whole carries beyond its parts.\n\nChristof Koch, after early NCC work with Francis Crick, moved toward supporting and promoting IIT. The theory therefore carries both metric and ontological ambition: it asks not only how brains report consciousness, but which systems can be conscious in principle. That keeps it in tension with more functional or deflationary routes such as GWT, HOT, and AST.",
    },
    evolution: [
      {
        zh: "提出 Φ 作为意识程度的形式度量，并把公理—公设—物理对应写成可争论但可明确的理论结构。",
        en: "Φ is proposed as a formal measure of consciousness level, and axioms–postulates–physical mappings are written as a disputable but explicit theoretical structure.",
      },
      {
        zh: "Koch 等把 IIT 与 NCC 研究传统衔接，推动后部热区、扰动复杂性等经验指标进入意识科学工具箱。",
        en: "Koch and colleagues bridge IIT to the NCC tradition, pushing posterior hot-zone ideas and perturbation-complexity indices into the consciousness toolkit.",
      },
      {
        zh: "理论对“什么系统有意识”给出较强本体论主张，引发关于机器、泛心论边界与可计算性的持续争论。",
        en: "Strong ontological claims about which systems are conscious fuel ongoing debate about machines, panpsychist boundaries, and computability.",
      }
    ],
    characteristics: {
      zh: "IIT 强调系统内部的内在因果力：意识程度取决于系统在自身状态上所能产生的整合信息，而不是取决于它是否对观察者有用、是否能报告、是否接入环境。后部皮层“热区”常在经验讨论中被当作高 Φ 候选，但理论本身是一般性的系统论主张。批评者质疑 Φ 的可计算性与意识归属的广泛性；支持者则认为它第一次认真对待“经验本身有结构”这一前提。",
      en: "IIT stresses intrinsic causal power: the degree of consciousness depends on integrated information a system can generate over its own states, not on usefulness to an observer, reportability, or environmental coupling. The posterior “hot zone” often appears in empirical discussion as a high-Φ candidate, but the theory itself is a general systems claim. Critics question the computability of Φ and the breadth of systems it would count as conscious; advocates argue it is one of the few theories that take seriously the premise that experience itself has structure.",
    },
    people: [
      {
        id: "tononi",
        name: { zh: "Giulio Tononi", en: "Giulio Tononi" },
        role: { zh: "理论提出者", en: "Theory originator" },
        bio: {
          zh: "整合信息理论的提出者，坚持从现象学结构倒推物理条件，并以 Φ 度量意识程度，重塑了“什么系统可能有意识”的讨论方式。",
          en: "Originator of Integrated Information Theory, reverse-engineering physical conditions from phenomenological structure and measuring consciousness with Φ — reshaping debates about which systems can be conscious.",
        },
        portraitUrl:
          "/minds/portraits/tononi.jpg",
        monogram: "GT",
        accent: "#7a3ee0",
      },
      {
        id: "koch",
        name: { zh: "Christof Koch", en: "Christof Koch" },
        role: { zh: "推广与 NCC 桥接", en: "Promotion & NCC bridge" },
        bio: {
          zh: "长期研究意识的神经相关物，后成为 IIT 的重要推广者与合作者，把理论主张与实验指标、公共科学论述同时推进。",
          en: "Long-time researcher of neural correlates of consciousness and later a major advocate and collaborator on IIT, advancing theoretical claims alongside empirical indices and public science.",
        },
        portraitUrl:
          "/minds/portraits/koch.jpg",
        monogram: "CK",
        accent: "#7a3ee0",
      },
    ],
    works: [
      {
        id: "iit-phi",
        kind: "book",
        title: "Phi: A Voyage from the Brain to the Soul",
        year: "2012",
        authors: "Giulio Tononi",
        note: {
          zh: "面向更广读者的 IIT 思想旅程。",
          en: "A broader-audience voyage through IIT ideas.",
        },
        url: "https://www.pantheonbooks.com/books/9780307907219",
      },
      {
        id: "iit-feeling",
        kind: "book",
        title: "The Feeling of Life Itself",
        year: "2019",
        authors: "Christof Koch",
        note: {
          zh: "Koch 对意识与 IIT 立场的综合陈述。",
          en: "Koch's synthesis of consciousness and the IIT stance.",
        },
        url: "https://mitpress.mit.edu/9780262538367/the-feeling-of-life-itself/",
      },
      {
        id: "iit-2004",
        kind: "paper",
        title: "An information integration theory of consciousness",
        year: "2004",
        authors: "Giulio Tononi",
        note: {
          zh: "IIT 早期系统表述。",
          en: "Early systematic statement of IIT.",
        },
        url: "https://doi.org/10.1186/1471-2202-5-42",
      },
      {
        id: "iit-2016",
        kind: "paper",
        title: "Integrated information theory: from consciousness to its physical substrate",
        year: "2016",
        authors: "Giulio Tononi, Melanie Boly, Marcello Massimini, Christof Koch",
        note: {
          zh: "从意识到物理基底的综述更新。",
          en: "Review update from consciousness to physical substrate.",
        },
        url: "https://doi.org/10.1038/nrn.2016.44",
      },
    ],
    relationSummary: {
      zh: "在 IIT 的图景中，身体与环境可以提供输入输出，却不是意识的充分条件。真正决定“有没有体验、体验有多丰富”的，是系统内部因果结构是否足够整合且不可还原。大脑（或任何候选基质）的内在机制占据解释中心；脑—身—环境耦合可以改变系统状态，但不自动等于产生高 Φ。",
      en: "In IIT's picture, body and environment may supply inputs and outputs without being sufficient for consciousness. What decides whether there is experience — and how rich it is — is whether the system's internal causal structure is sufficiently integrated and irreducible. Intrinsic mechanisms of the brain (or any candidate substrate) sit at the explanatory center; brain–body–world coupling can change system state without automatically yielding high Φ.",
    },
    elements: ["brain"],
    brainRegions: ["hotzone", "sensory", "thalamus", "hierarchy"],
    edges: [
      {
        from: "hotzone",
        to: "sensory",
        label: { zh: "内在整合", en: "Intrinsic integration" },
        strength: "primary",
      },
      {
        from: "sensory",
        to: "hotzone",
        label: { zh: "因果相互依赖", en: "Causal interdependence" },
        strength: "primary",
      },
      {
        from: "environment",
        to: "brain",
        label: { zh: "可选输入（非充分）", en: "Optional input (not sufficient)" },
        strength: "secondary",
      },
      {
        from: "body",
        to: "brain",
        label: { zh: "可选界面（非充分）", en: "Optional interface (not sufficient)" },
        strength: "secondary",
      },
    ],
    accent: "#7a3ee0",
  },
  {
    id: "ast",
    shortName: "AST",
    name: {
      zh: "注意图式理论",
      en: "Attention Schema Theory",
    },
    originYear: "2010s",
    origin: {
      zh: "Michael Graziano 在 2010 年代提出注意图式理论，起点是他此前对身体图式的研究：大脑并不直接“拥有”身体，而是维护一个简化、可控的身体模型，以便运动规划与空间推理。他由此类比：大脑同样应维护一个关于自身注意过程的简化模型——注意图式。主观体验的“感觉”在此被重新解释为系统读取该模型后产生的结论与控制信号，而不是额外的神秘实体。\n\nAST 明确以可工程化为目标。它解释的是：一个信息处理系统为何会声称自己有意识、为何会用“体验”语言描述内部状态，以及这种图式如何有助于控制注意并推断他人注意。",
      en: "Michael Graziano proposed Attention Schema Theory in the 2010s from earlier work on body schema: the brain does not simply “have” a body; it maintains a simplified, controllable body model for motor planning and spatial reasoning. By analogy, it should also maintain a simplified model of its own attention — an attention schema. The “feel” of subjective experience is re-read as the conclusion and control signal that follows when higher systems read that model, not as an extra mysterious entity.\n\nAST is explicitly engineerable. It explains why an information-processing system would claim to be conscious, why it would describe internal states in experiential language, and how such a schema helps control attention and infer the attention of others.",
    },
    evolution: [
      {
        zh: "注意被界定为真实的计算过程（如信号增强与竞争选择），与对注意的内部描述区分开。",
        en: "Attention is defined as real computation (signal enhancement and competitive selection), distinguished from internal descriptions of attention.",
      },
      {
        zh: "注意图式是对注意过程的简化模型，服务于控制与预测，因此可以有偏差，却仍然有用。",
        en: "The attention schema is a simplified model of attention for control and prediction — biased, yet useful.",
      },
      {
        zh: "当更高层读取该图式时，系统产生主观体验式的自我描述，并用于调节自身注意与推断他人注意。",
        en: "When higher layers read the schema, the system produces experiential self-descriptions used to regulate its own attention and infer others' attention.",
      },
      {
        zh: "工程演示把 AST 放入神经网络 agent，显示“可声称有意识”不必依赖不可计算的神秘附加物。",
        en: "Engineering demos place AST in neural-network agents, showing that “claiming consciousness” need not depend on noncomputable mystery add-ons.",
      }
    ],
    characteristics: {
      zh: "AST 区分注意本身与注意模型：前者是信号增强等真实计算过程，后者是对前者的简化、有偏差但可用的内部表征。当元认知系统读取注意图式时，系统会生成类似“我正拥有主观体验”的描述，并把它用于自我控制与社会认知。对机器心智来说，这意味着可落地的三件套：实现注意机制、实现注意的内部模型、实现基于该模型的自我报告与控制策略。",
      en: "AST distinguishes attention itself from the model of attention: the former is real computation such as signal enhancement; the latter is a simplified, biased but useful internal representation of the former. When metacognitive systems read the attention schema, the system generates descriptions like “I am having a subjective experience,” and uses them for self-control and social cognition. For machine minds this yields a concrete trio: implement attention, implement an internal model of attention, and implement self-report and control policies based on that model.",
    },
    people: [
      {
        id: "graziano",
        name: { zh: "Michael Graziano", en: "Michael S. A. Graziano" },
        role: { zh: "理论提出者", en: "Theory originator" },
        bio: {
          zh: "从身体图式研究出发提出注意图式理论，主张主观体验语言来自大脑对自身注意过程的简化模型，目标明确指向可工程实现。",
          en: "From body-schema research to Attention Schema Theory: experiential language arises from a simplified model of one's own attention, with an explicit aim of engineerability.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-neuro.jpg",
        monogram: "MG",
        accent: "#d4a017",
      },
    ],
    works: [
      {
        id: "ast-consciousness",
        kind: "book",
        title: "Consciousness and the Social Brain",
        year: "2013",
        authors: "Michael S. A. Graziano",
        note: {
          zh: "注意图式理论的完整书级阐述。",
          en: "Book-length statement of Attention Schema Theory.",
        },
        url: "https://global.oup.com/academic/product/consciousness-and-the-social-brain-9780199928644",
      },
      {
        id: "ast-rethinking",
        kind: "book",
        title: "Rethinking Consciousness",
        year: "2019",
        authors: "Michael S. A. Graziano",
        note: {
          zh: "更新版 AST 与工程化意识讨论。",
          en: "Updated AST and engineerable consciousness discussion.",
        },
        url: "https://wwnorton.com/books/9780393652611",
      },
      {
        id: "ast-2011",
        kind: "paper",
        title: "The attention schema theory: a mechanistic account of subjective awareness",
        year: "2015",
        authors: "Michael S. A. Graziano, Taylor W. Webb",
        note: {
          zh: "机制化主观觉知的核心论文表述。",
          en: "Core paper framing mechanistic subjective awareness.",
        },
        url: "https://doi.org/10.3389/fpsyg.2015.00500",
      },
      {
        id: "ast-2019-review",
        kind: "paper",
        title: "The Attention Schema Theory in a neural network agent",
        year: "2019",
        authors: "Andrew I. Wilterson, Michael S. A. Graziano",
        note: {
          zh: "神经网络 agent 中的 AST 工程演示。",
          en: "Engineering demo of AST in a neural-network agent.",
        },
        url: "https://doi.org/10.1073/pnas.1918199117",
      },
    ],
    relationSummary: {
      zh: "环境与身体是注意所指向的对象；大脑中的注意控制系统实际分配加工资源；注意图式则是大脑对这一分配过程的简化自模型。主观体验语言出现在更高层读取该自模型之时。AST 因此把脑—身—环境关系写成“对象—控制—自我模型—报告”的可工程链路，而不是不可还原的本体论跳跃。",
      en: "Environment and body are targets of attention; attention-control systems in the brain actually allocate processing resources; the attention schema is the brain's simplified self-model of that allocation. Experiential language appears when higher layers read the self-model. AST therefore writes brain–body–world relations as an engineerable chain — object, control, self-model, report — rather than an irreducible ontological leap.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["tpj", "pfc", "parietal", "sensory", "thalamus"],
    edges: [
      {
        from: "environment",
        to: "sensory",
        label: { zh: "被注意的对象", en: "Attended objects" },
        strength: "secondary",
      },
      {
        from: "body",
        to: "tpj",
        label: { zh: "身体图式类比", en: "Body-schema analogy" },
        strength: "secondary",
      },
      {
        from: "tpj",
        to: "pfc",
        label: { zh: "注意图式被读取", en: "Schema read-out" },
        strength: "primary",
      },
      {
        from: "pfc",
        to: "tpj",
        label: { zh: "控制与推断注意", en: "Control & infer attention" },
        strength: "primary",
      },
      {
        from: "brain",
        to: "environment",
        label: { zh: "「我体验到…」报告", en: "“I experience…” report" },
        strength: "primary",
      },
    ],
    accent: "#d4a017",
  },
  {
    id: "hot",
    shortName: "HOT",
    name: {
      zh: "高阶理论",
      en: "Higher-Order Theories",
    },
    originYear: "1980s–90s",
    origin: {
      zh: "高阶理论的哲学传统可追溯到 Locke 等：一个心理状态要成为意识状态，似乎需要某种“被觉知到”。David Rosenthal 在 1980–90 年代将其系统化为现代高阶理论：一阶状态（例如看见红色）本身尚不足以构成意识；还需要一个更高阶的心理状态以适当方式表征该一阶状态（“我正在看到红色”）。意识在此是元表征关系的产物。\n\nHakwan Lau 等人把高阶理论与前额叶元认知、感知信心与现实监测等实验传统结合，发展出更可检验的神经科学版本。这使得 HOT 不再只是概念分析，而成为可与 GWT、IIT 等框架同台比较的经验假说家族。",
      en: "Higher-order theories inherit a philosophical tradition that runs through Locke and others: for a mental state to be conscious, it seems to need to be somehow “apprehended.” David Rosenthal systematized this in the 1980s–90s: a first-order state (seeing red) is not enough; a higher-order state must suitably represent it (“I am seeing red”). Consciousness is a product of meta-representational relations.\n\nHakwan Lau and others joined higher-order theory to experimental traditions on prefrontal metacognition, perceptual confidence, and reality monitoring, yielding more testable neuroscientific versions. HOT thus moved beyond pure conceptual analysis into a family of empirical hypotheses that can be compared with GWT, IIT, and related frameworks.",
    },
    evolution: [
      {
        zh: "Rosenthal 系统化高阶思维理论：意识状态 = 被适当高阶状态表征的一阶状态。",
        en: "Rosenthal systematizes higher-order thought theory: a conscious state is a first-order state suitably represented by a higher-order state.",
      },
      {
        zh: "Lau 等把高阶理论与前额叶元认知、感知信心与现实监测实验结合，形成可检验假说。",
        en: "Lau and others join HOT to prefrontal metacognition, confidence, and reality-monitoring experiments, yielding testable hypotheses.",
      },
      {
        zh: "与 GWT 的比较研究成为焦点：广播与元表征何者更接近意识的神经充分条件。",
        en: "Comparative work with GWT becomes central: is broadcast or meta-representation closer to the neural sufficient conditions of consciousness?",
      }
    ],
    characteristics: {
      zh: "HOT 与 GWT 都重视高层过程，但机制主张不同：GWT 强调信息被广播到许多消费模块，HOT 强调状态被另一个状态所表征。因此 HOT 更关注元认知、信心、错误觉知与“是否意识到自己处于某状态”。在机器实现上，它提示：仅有丰富的一阶世界模型可能不够，还需要关于这些表征的监控、标签与再描述系统。",
      en: "HOT and GWT both privilege higher processes, but their mechanisms differ: GWT emphasizes broadcast to many consumer modules; HOT emphasizes one state being represented by another. HOT therefore focuses on metacognition, confidence, error awareness, and whether one is aware of being in a given state. For machine implementation it suggests that rich first-order world models may not suffice without monitoring, labeling, and re-description systems over those representations.",
    },
    people: [
      {
        id: "rosenthal",
        name: { zh: "David Rosenthal", en: "David Rosenthal" },
        role: { zh: "现代哲学系统化", en: "Modern philosophical system" },
        bio: {
          zh: "当代高阶理论的哲学奠基人之一，系统论证意识状态依赖适当的高阶表征关系，而非仅仅依赖一阶内容本身。",
          en: "A founding figure of contemporary higher-order theory, arguing that conscious states depend on suitable higher-order representational relations rather than first-order content alone.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "DR",
        accent: "#c0265a",
      },
      {
        id: "lau",
        name: { zh: "Hakwan Lau", en: "Hakwan Lau" },
        role: { zh: "神经科学可检验版", en: "Testable neural versions" },
        bio: {
          zh: "把高阶理论与前额叶元认知、感知信心和现实监测实验对接，推动 HOT 成为可与其他意识理论对照的经验研究纲领。",
          en: "Links higher-order theory to prefrontal metacognition, confidence, and reality-monitoring experiments, turning HOT into an empirical research program comparable with rival theories.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-cog.jpg",
        monogram: "HL",
        accent: "#c0265a",
      },
    ],
    works: [
      {
        id: "hot-rosenthal-2005",
        kind: "book",
        title: "Consciousness and Mind",
        year: "2005",
        authors: "David Rosenthal",
        note: {
          zh: "高阶理论哲学论文集。",
          en: "Philosophical essays on higher-order theory.",
        },
        url: "https://global.oup.com/academic/product/consciousness-and-mind-9780198236979",
      },
      {
        id: "hot-lau-2011",
        kind: "paper",
        title: "Empirical support for higher-order theories of conscious awareness",
        year: "2011",
        authors: "Hakwan Lau, David Rosenthal",
        note: {
          zh: "高阶理论与实验证据的对话。",
          en: "Dialogue between HOT and experimental evidence.",
        },
        url: "https://doi.org/10.1016/j.tics.2011.05.009",
      },
      {
        id: "hot-lau-2019",
        kind: "paper",
        title: "What is consciousness, and could machines have it?",
        year: "2017",
        authors: "Stanislas Dehaene, Hakwan Lau, Sid Kouider",
        note: {
          zh: "机器意识讨论中常用的功能分层（含高阶视角）。",
          en: "Widely cited functional layering for machine consciousness debates (includes higher-order view).",
        },
        url: "https://doi.org/10.1126/science.aan8871",
      },
      {
        id: "hot-prm",
        kind: "paper",
        title: "Perceptual reality monitoring: Neural mechanisms dissociating imagination from reality",
        year: "2022",
        authors: "Nadine Dijkstra, Peter Kok, Stephen M. Fleming",
        note: {
          zh: "与高阶 / 元认知路线紧密相关的现实监测研究。",
          en: "Reality-monitoring research tightly related to higher-order / metacognitive routes.",
        },
        url: "https://doi.org/10.1016/j.neubiorev.2022.104557",
      },
    ],
    relationSummary: {
      zh: "环境与身体首先被编码为一阶内容；这些内容可以影响行为，却不必是意识的。意识出现在大脑以高阶状态对一阶状态做出元表征之时，实验上常与前额叶及相关元认知回路关联。脑—身—环境链条因此被切成两段：一阶耦合提供内容，高阶监控决定内容是否进入意识。",
      en: "Environment and body are first encoded as first-order contents; those contents can guide behavior without being conscious. Consciousness appears when the brain meta-represents first-order states with higher-order states, often linked experimentally to prefrontal and related metacognitive circuits. The brain–body–world chain is thus cut into two stages: first-order coupling supplies content; higher-order monitoring decides whether content enters consciousness.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["pfc", "sensory", "parietal"],
    edges: [
      {
        from: "environment",
        to: "sensory",
        label: { zh: "一阶内容", en: "First-order content" },
        strength: "secondary",
      },
      {
        from: "body",
        to: "sensory",
        label: { zh: "一阶身体状态", en: "First-order body state" },
        strength: "secondary",
      },
      {
        from: "sensory",
        to: "pfc",
        label: { zh: "被元表征", en: "Meta-represented" },
        strength: "primary",
      },
      {
        from: "pfc",
        to: "sensory",
        label: { zh: "「我正在感知…」", en: "“I am perceiving…”" },
        strength: "primary",
      },
    ],
    accent: "#c0265a",
  },
  {
    id: "rpt",
    shortName: "RPT",
    name: {
      zh: "再入处理理论",
      en: "Recurrent Processing Theory",
    },
    originYear: "2000s",
    origin: {
      zh: "Victor Lamme 基于视觉皮层电生理提出再入处理理论。关键观察是时间结构上的分离：快速前馈扫掠足以支持复杂特征提取甚至高层次分类，但稳定的现象觉知似乎依赖感觉皮层内部及区间的局部反馈 / 再入连接。若这些再入被干扰，报告与全局通达可能受损，但理论主张现象体验的生成点仍应首先在局部感觉动力学中寻找。\n\nRPT 因此与 GWT 构成直接对照：意识是否必须依赖前额叶主导的全局网络，还是局部再入已经足够产生现象意识，而全局广播主要服务通达、报告与认知控制。",
      en: "Victor Lamme proposed Recurrent Processing Theory from visual-cortex electrophysiology. The key observation is temporal structure: a fast feedforward sweep can support complex feature extraction and even high-level classification, yet stable phenomenal awareness seems to depend on local feedback / recurrent connections within and between sensory areas. If recurrence is disrupted, report and global access may fail, but the theory still locates the generation of phenomenal experience primarily in local sensory dynamics.\n\nRPT therefore stands in direct contrast with GWT: must consciousness depend on prefrontal-led global networks, or does local recurrence already suffice for phenomenal consciousness, with global broadcast mainly serving access, report, and cognitive control?",
    },
    evolution: [
      {
        zh: "前馈与再入在时间与功能上被分离：前馈可完成复杂提取，再入更贴近稳定现象觉知。",
        en: "Feedforward and recurrent processing are separated in time and function: feedforward can extract complex features; recurrence tracks stable phenomenal awareness.",
      },
      {
        zh: "主张局部感觉再入足以产生现象意识，全局广播属于通达意识的额外机制。",
        en: "Local sensory recurrence is claimed sufficient for phenomenal consciousness; global broadcast belongs to additional mechanisms of access consciousness.",
      },
      {
        zh: "与 GWT 的对抗推动更精细的无报告与报告范式，以及前额叶是否必要的实验争论。",
        en: "Adversarial contrast with GWT drives finer no-report and report paradigms, and debates over whether prefrontal cortex is necessary.",
      }
    ],
    characteristics: {
      zh: "RPT 明确区分现象意识与通达意识。前者可以在缺乏报告能力时存在；后者依赖更广的前额叶参与与工作空间式可用性。这一区分使实验设计变得关键：若测量手段强依赖报告，就可能系统低估局部现象内容。对机器心智而言，RPT 提醒：把“能报告”等同于“有体验”可能过窄，局部循环动力学本身值得被当作独立的工程对象。",
      en: "RPT sharply separates phenomenal from access consciousness. The former may exist without reportability; the latter depends on broader prefrontal involvement and workspace-like availability. That split makes experimental design crucial: report-heavy measures may systematically undercount local phenomenal content. For machine minds, RPT warns that equating “can report” with “has experience” may be too narrow; local recurrent dynamics deserve to be engineered as objects in their own right.",
    },
    people: [
      {
        id: "lamme",
        name: { zh: "Victor Lamme", en: "Victor A. F. Lamme" },
        role: { zh: "理论提出者", en: "Theory originator" },
        bio: {
          zh: "基于视觉电生理提出再入处理理论，主张局部感觉再入即可支持现象意识，从而与强调前额叶全局网络的框架形成持续对照。",
          en: "From visual electrophysiology to Recurrent Processing Theory: local sensory recurrence can support phenomenal awareness, sustaining contrast with prefrontal global-network frameworks.",
        },
        portraitUrl:
          "/minds/portraits/placeholder-neuro.jpg",
        monogram: "VL",
        accent: "#1f8a4c",
      },
    ],
    works: [
      {
        id: "rpt-2006",
        kind: "paper",
        title: "Towards a true neural stance on consciousness",
        year: "2006",
        authors: "Victor A. F. Lamme",
        note: {
          zh: "再入处理与现象意识的核心立场。",
          en: "Core stance on recurrent processing and phenomenal awareness.",
        },
        url: "https://doi.org/10.1016/j.tics.2006.09.001",
      },
      {
        id: "rpt-2010",
        kind: "paper",
        title: "How neuroscience will change our view on consciousness",
        year: "2010",
        authors: "Victor A. F. Lamme",
        note: {
          zh: "进一步区分现象与通达意识的神经基础。",
          en: "Further separates neural bases of phenomenal vs access consciousness.",
        },
        url: "https://doi.org/10.1016/j.concog.2010.03.013",
      },
      {
        id: "rpt-2000",
        kind: "paper",
        title: "Neural mechanisms of visual awareness: A linking proposition",
        year: "2000",
        authors: "Victor A. F. Lamme, Pieter R. Roelfsema",
        note: {
          zh: "前馈 vs 再入与视觉觉知的关键早期综述。",
          en: "Key early review of feedforward vs recurrent processing in visual awareness.",
        },
        url: "https://doi.org/10.1016/S0165-0173(00)00030-0",
      },
    ],
    relationSummary: {
      zh: "环境刺激经前馈进入感觉皮层后，局部再入环路即可支持现象体验；身体相关信号同样可在局部感觉—联合区中成为体验内容。前额叶与全局网络主要把这些内容变成可报告、可推理、可控制的通达状态。脑—身—环境关系在此被重写为：外围耦合提供输入，局部脑动力学产生现象，中心全局系统负责通达。",
      en: "After environmental stimulation reaches sensory cortex via feedforward sweep, local recurrent loops can support phenomenal experience; bodily signals can likewise become experiential content in local sensory–association circuits. Prefrontal and global networks mainly turn those contents into reportable, reason-ready, controllable access states. Brain–body–world relations are rewritten as: peripheral coupling supplies input, local brain dynamics generate the phenomenal, and central global systems handle access.",
    },
    elements: ["environment", "body", "brain"],
    brainRegions: ["sensory", "hierarchy", "pfc"],
    edges: [
      {
        from: "environment",
        to: "sensory",
        label: { zh: "前馈特征提取", en: "Feedforward extraction" },
        strength: "secondary",
      },
      {
        from: "body",
        to: "sensory",
        label: { zh: "局部身体感觉", en: "Local body signals" },
        strength: "secondary",
      },
      {
        from: "sensory",
        to: "sensory",
        label: { zh: "局部再入 → 现象意识", en: "Local recurrence → phenomenal" },
        strength: "primary",
      },
      {
        from: "sensory",
        to: "pfc",
        label: { zh: "通达 / 报告（可选）", en: "Access / report (optional)" },
        strength: "secondary",
      },
    ],
    accent: "#1f8a4c",
  },
];

export function getMindSchool(id: string): MindSchool | undefined {
  return MIND_SCHOOLS.find((school) => school.id === id);
}
