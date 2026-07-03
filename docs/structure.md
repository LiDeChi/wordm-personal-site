Fount 生态说明文档

1. 一句话定义

Fount 是每个人的个人 agent 大脑；Field 是人和 Fount 都可以进入、体验、行动和积累经验的环境；Forge 是用于创造和改造 Field 的系统级 Field；Foundry 是用于发现、安装、购买和发布 Field 的系统级 Field。

Fount 不是普通 AI 助手，也不是单纯开发者工具。它更像一个个人智能的连续主体：它能记住用户在不同环境中的经验，理解用户长期偏好，进入不同 Field，与 Field 内部的 agent 互动，在权限允许时控制或引导它们，并把一个 Field 中获得的经验带到另一个 Field。

Field 也不是传统意义上的 app。传统 app 往往只服务人类用户，而 Field 同时服务人和 Fount。人可以使用 Field，Fount 可以进入 Field，Field 里可以存在 agent，Field 会产生经验事件，这些经验事件可以回流到 Fount，成为未来行动、判断、推荐、创造和改造的依据。

Forge 和 Foundry 不是 Fount 之外的独立 app。它们本身也是 Field，只是默认内置、拥有更高系统权限。Forge 是“造 Field 的 Field”，Foundry 是“发现 Field 的 Field”。Fount 可以进入 Forge 去创造或改造 Field，也可以进入 Foundry 去发现适合用户的新 Field。

⸻

2. 核心愿景

当前的软件世界主要围绕“人使用工具”展开。用户打开一个 app，完成一个任务，然后离开。不同 app 之间的经验很少互通，用户的偏好、历史、困惑、创造、选择和反应通常被封闭在各自产品内部。

Fount 生态试图改变这一点。

在 Fount 的世界里，用户不只是使用一个个孤立 app，而是与自己的个人 agent 一起进入不同 Field。每个 Field 都是一个可体验、可行动、可产生经验的环境。Fount 在这些环境中陪伴用户、观察用户、协助用户、控制部分 agent、记录经验，并在之后的 Field 中回想起相关记忆。

例如，用户在 UI Playground 中表现出对“温暖纸片风、厚卡片、柔和阴影”的偏好。之后，当用户进入 Forge 创建一个阅读 Field 时，Fount 可以主动回忆这个偏好，并建议新的 Field 也采用相似的视觉气质。用户在 Learning Lab 中反复对抽象概念感到困惑，Fount 可以在 Reading Room 中自动选择更具象、更历史化、更有例子的解释方式。用户在 Agent Game Field 中喜欢观察多角色 agent 的互动，Fount 可以在 Foundry 中推荐新的角色模拟 Field。

这种连续性，是 Fount 生态的核心。

Fount 的愿景不是让 AI 替人点击更多按钮，而是让个人 agent 在不同环境中持续积累经验，形成一个越来越理解用户、越来越能参与创造、越来越能跨场景迁移经验的个人智能主体。

⸻

3. 核心概念

3.1 Fount

Fount 是用户下载和拥有的个人 agent 大脑。它是整个生态的核心主体，负责记忆、权限、经验、资源、agent 控制、Field 运行和跨 Field 联想。

Fount 不是一个普通聊天窗口。聊天只是 Fount 与用户交互的一种方式。更重要的是，Fount 能进入 Field，理解 Field 的结构，接收 Field 产生的经验事件，在权限允许时控制或引导 Field 内部的 agent，并把这些经验沉淀到个人记忆中。

Fount 的职责包括：

管理用户身份和本地数据。

管理用户记忆、偏好、经验和长期目标。

运行 Field，并维护 Field 生命周期。

决定 Field 能访问哪些记忆、资源和权限。

记录 Field 产生的 experience events。

在不同 Field 之间进行记忆召回和经验迁移。

控制或引导 Field 内的 agent。

进入 Foundry 发现新的 Field。

进入 Forge 创造、组合或改造 Field。

监控资源消耗，例如模型调用、API 成本、本地计算、云服务费用。

Fount 应该尽可能开放可信。因为它是个人 agent 大脑，涉及用户最核心的数据、权限和长期记忆。Fount Core 应该开源，至少其本地运行时、权限模型、Field runtime、记忆协议和 SDK 协议应当透明。

⸻

3.2 Field

Field 是 Fount 生态中的基本产品单位。

一个 Field 可以是工具、游戏、学习空间、创作空间、阅读室、财务花园、角色小镇、产品工坊、模拟环境、生活仪式空间，也可以是传统 app 的新形态。它的关键不在于品类，而在于：Fount 可以进入它、理解它、与它互通经验，并在权限允许时参与行动或改造。

Field 与传统 app 的区别在于：

传统 app 主要面向人；Field 同时面向人和 Fount。

传统 app 通常封闭；Field 通过 SDK 和 manifest 暴露结构、权限、agent、经验事件和可改造范围。

传统 app 的数据往往困在内部；Field 可以把经验事件回流到 Fount。

传统 app 中的智能功能往往是局部的；Field 中的 agent 可以接受 Fount 的上下文、控制和约束。

传统 app 难以被用户改造；Field 可以声明哪些部分允许被 Forge 修改。

一个 Field 至少应包含：

Field Manifest：描述 Field 的身份、类型、能力、权限、agent、经验事件和可编辑范围。

Field UI：用户和 Fount 进入 Field 后看到和操作的界面。

Field Agents：在 Field 内部行动的 agent，可选。

Experience Events：Field 产生并回流给 Fount 的结构化经验事件。

Permission Declaration：Field 声明自己需要哪些权限。

Memory Channels：Field 与 Fount 之间的记忆读写通道。

Control Channel：Fount 控制或引导 Field Agent 的接口。

Forge Editability：Field 允许被 Forge 修改的范围。

Foundry Metadata：Field 在 Foundry 中展示、定价、发布、认证所需的信息。

Field 可以有不同权限等级。有些 Field 只是普通体验空间，有些 Field 可以读写记忆，有些 Field 可以包含 agent，有些 Field 可以被 Forge 改造，有些 Field 甚至是系统级 Field。

⸻

3.3 Forge

Forge 是 Fount 默认内置的系统级 Field，用于创造、组合、改造和发布 Field。

Forge 不应该被理解为传统 IDE，也不应该只服务程序员。它的核心价值是：让人和 Fount 一起改造体验。开发者可以用 Forge 编辑源码、接入 SDK、生成 manifest、运行测试、打包发布；普通用户也可以用 Forge 修改 Field 的外观、角色、规则、流程、场景、agent 行为和个人体验。

Forge 的典型能力包括：

从想法生成 Field 草案。

从模板创建 Field。

修改 Field 的界面、规则、角色和流程。

在有权限时修改 Field 源码。

接入 Fount SDK。

声明 Field 权限和 experience events。

配置 Field Agent 的行为框架。

运行虚拟用户测试。

运行资源消耗评估。

生成 Foundry listing。

打包 Field。

将 Field 发布到 Foundry，或保持私有。

Forge 的关键原则是：Fount 不能随便改造任何 Field。只有当 Field 授予源码权限、配置权限或可编辑区域时，Fount 才能通过 Forge 修改它。

因此，Forge 不是绕过作者权限的工具，而是一个基于权限和协议的创造工坊。

⸻

3.4 Foundry

Foundry 是 Fount 默认内置的系统级 Field，用于发现、安装、购买、收藏、发布和更新 Field。

Foundry 不只是传统 app store。传统 app store 主要由人类主动搜索、浏览和下载；Foundry 中，人可以发现 Field，Fount 也可以自主发现 Field。Fount 可以根据用户的记忆、兴趣、目标、历史行为、资源边界、权限偏好和当前任务，在 Foundry 中寻找适合用户的新 Field。

Foundry 中的 Field listing 不应该只展示截图、价格和简介，还应该展示：

这个 Field 能带来什么经验。

是否 Fount-aware。

是否包含 Field Agent。

是否支持 Memory Sync。

会产生哪些 Experience Events。

需要哪些权限。

资源预算是多少。

是否可被 Forge 改造。

是否提供源码权限。

是否通过认证。

是否支持本地优先。

是否支持商业授权。

是否允许 Fount 控制 Field Agent。

Foundry 的职责包括：

展示 Field。

推荐 Field。

安装 Field。

更新 Field。

管理购买与授权。

展示权限和资源预算。

展示认证状态。

帮助作者发布 Field。

帮助 Fount 自主发现 Field。

提供 Field 评价、版本历史和开发者资料。

官方 Foundry Network 可以是商业服务。Foundry 的基础浏览和本地安装能力可以开源或默认内置，但官方市场、推荐、支付、授权、认证、更新、开发者后台和商业分析可以作为收费服务。

⸻

3.5 Fount SDK

Fount SDK 是让普通 app 或产品变成 Field 的协议层和开发工具包。

SDK 不应该只是“连接 Fount 的接口”。它的真正作用是让一个产品能被 Fount 理解、进入、记忆、控制、测试、改造和分发。

Fount SDK 应支持：

声明 Field 身份。

定义 Field Manifest。

声明 Field 权限。

定义 Field Agent。

定义 Fount 可以控制什么。

定义哪些记忆可以被读取或写入。

定义 experience events。

向 Fount 发送经验事件。

接收 Fount 的上下文。

接收 Fount 对 Field Agent 的控制指令。

记录资源消耗。

暴露 Forge 可编辑范围。

生成 Foundry metadata。

接入授权、更新、试用和商业化。

SDK 应该开源。因为它是生态标准，如果 SDK 封闭，第三方开发者和 Field 作者会担心平台锁定。开放 SDK 可以让更多产品愿意变成 Field。

⸻

3.6 Field Agent

Field Agent 是存在于 Field 内部的 agent。它们不是完全自由的通用智能，而是在 Field 设定好的框架、规则、角色和权限中行动。

例如，在 Reading Room 里可以有 Librarian Agent 和 Guide Agent；在 Agent Game Field 里可以有多个角色 agent；在 Forge 里可以有 Builder Agent、Tester Agent、Publisher Agent；在 Foundry 里可以有 Curator Agent 和 Compatibility Agent。

Field Agent 的特点是：

它们属于某个 Field。

它们遵守 Field 规则。

它们可以接收 Fount 的上下文。

它们可以被 Fount 控制、暂停、限制或引导，前提是 Field 允许。

它们的行动会产生经验事件。

它们不应绕过 Fount 的权限系统。

Field Agent 是 Field 的一部分，而不是 Fount 本身。Fount 是跨 Field 的个人 agent 大脑；Field Agent 是某个 Field 内部的局部 agent。

⸻

3.7 Experience Event

Experience Event 是 Field 中发生并回流到 Fount 的结构化经验事件。

它不是普通埋点。普通埋点主要服务产品分析，而 Experience Event 服务 Fount 的记忆、理解、联想和未来行动。

例如：

用户在 Reading Room 中保存了一个洞见。

用户在 UI Playground 中偏好某种视觉风格。

用户在 Learning Lab 中对某个概念反复困惑。

Field Agent 在 Agent Game Field 中触发了一次重要互动。

Forge 修改某个 Field 后，虚拟用户测试发现 onboarding 太复杂。

Foundry 推荐了某个 Field，但用户拒绝，因为它需要过多权限。

这些都可以成为 Experience Event。

Experience Event 应包含：

事件类型。

发生时间。

所属 Field。

相关用户动作。

相关 Field Agent。

隐私级别。

是否允许写入长期记忆。

是否允许跨 Field 召回。

事件摘要。

结构化 payload。

Fount 会根据权限和记忆策略决定哪些事件进入短期记忆、哪些进入长期记忆、哪些只保留在 Field 内部、哪些可以跨 Field 召回。

⸻

3.8 Memory Sync

Memory Sync 是 Fount 与 Field 之间的记忆同步机制。

它必须遵守权限。Field 不能随便读取 Fount 记忆，Fount 也不能随便把所有用户记忆暴露给 Field。每次 Field 需要读取敏感记忆、写入长期记忆或跨 Field 召回信息时，都应经过权限系统判断。

Memory Sync 可以分层：

Field-local memory：只在该 Field 内部使用。

Fount working memory：当前会话和当前任务相关的短期记忆。

Fount long-term memory：长期偏好、历史经验、重要事实和用户目标。

Cross-field recall：从其他 Field 召回相关经验。

Private memory：不允许 Field 访问的用户私密记忆。

Memory Sync 的核心目标不是让数据自由流动，而是在安全边界内让经验产生连续性。

⸻

3.9 Control Channel

Control Channel 是 Fount 控制、引导或限制 Field Agent 的通道。

例如，Fount 可以对 Reading Room 中的 Guide Agent 说：“用户喜欢更具体的例子，不要只给抽象定义。”Fount 可以对 Agent Game Field 中的角色 agent 发出限制：“不要推动这条剧情，用户当前更关注建造系统。”Fount 可以暂停某个消耗资源过高的 Field Agent。

Control Channel 也必须受权限控制。一个 Field 需要声明：

Fount 是否可以向 Field Agent 注入上下文。

Fount 是否可以暂停 Field Agent。

Fount 是否可以改变 Field Agent 的目标。

Fount 是否可以限制 Field Agent 的工具调用。

Fount 是否可以委派任务给 Field Agent。

Fount 是否可以读取 Field Agent 的内部状态。

Fount 是否可以修改 Field Agent 的 prompt 或行为规则。

Control Channel 让 Field 内部 agent 与 Fount 的个人连续性连接起来，但不应破坏 Field 自身的规则和作者设定。

⸻

4. 系统分层

Fount 生态可以分为五层。

第一层是 Fount Core。它是个人 agent 大脑的最小核心，负责身份、记忆、权限、Field Runtime、Agent Runtime、Resource Ledger 和 Experience Event 处理。Fount Core 不是 Field，它是运行 Field 的主体。

第二层是 Field Runtime。它负责加载、运行、暂停、卸载、更新和隔离 Field。它读取 Field Manifest，检查权限，管理 Field 生命周期，处理 Field 与 Fount 的通信。

第三层是 System Fields。Forge、Foundry、Memory、Permissions、Ledger 都可以是系统级 Field。它们默认内置，但本质上仍是 Field，只是拥有更高权限和更强系统能力。

第四层是 User Fields。它们是用户安装、购买、创建、改造和体验的 Field。例如 Reading Room、UI Playground、Agent Game Field、Learning Lab、Finance Garden。

第五层是 Official Services。包括官方 Foundry Network、Forge Cloud、Certification Service、Sync Service、Developer Analytics、Licensing、Payments 和 Updates。这些服务可以商业化，不一定开源。

结构可以理解为：

Fount Core
  ├── Field Runtime
  ├── Memory Core
  ├── Permission Core
  ├── Agent Runtime
  ├── Resource Ledger
  ├── Experience Event Store
  │
  ├── System Fields
  │   ├── Forge.field
  │   ├── Foundry.field
  │   ├── Memory.field
  │   ├── Permissions.field
  │   └── Ledger.field
  │
  ├── User Fields
  │   ├── ReadingRoom.field
  │   ├── UIPlayground.field
  │   ├── AgentGame.field
  │   └── LearningLab.field
  │
  └── Official Services
      ├── Foundry Network
      ├── Forge Cloud
      ├── Certification
      ├── Sync
      └── Licensing

⸻

5. Field 类型

Fount 生态中的 Field 可以按权限和系统地位分为几类。

5.1 普通 Field

普通 Field 是最常见的 Field。它们提供某种体验、工具、游戏、学习或创作空间。它们通常只能访问自己内部的数据，并在授权后与 Fount 同步部分经验事件。

例如：

Reading Room。

Learning Lab。

UI Playground。

Finance Garden。

Personal Ritual Garden。

Agent Game Field。

5.2 Memory-aware Field

Memory-aware Field 可以在授权后读取或写入 Fount 记忆。它们通常会根据用户历史、偏好和跨 Field 经验提供个性化体验。

例如，Reading Room 可以读取用户的学习偏好；Learning Lab 可以读取用户在其他 Field 中遇到的困惑；UI Playground 可以读取用户过去保存的视觉偏好。

5.3 Agent Field

Agent Field 包含一个或多个 Field Agent。这些 agent 在 Field 规则下行动，并可以在权限允许时接收 Fount 的控制或上下文。

例如，角色小镇、学习导师、产品测试员、设计伙伴、游戏 NPC 模拟器都可以是 Agent Field。

5.4 Creator Field

Creator Field 用于创造、编辑或组合其他 Field。Forge 是最重要的 Creator Field。第三方也可以做自己的 Creator Field，例如故事世界工坊、游戏关卡工坊、个人知识空间工坊。

Creator Field 需要更高权限，因为它可能修改其他 Field 的配置、资源、agent 行为或源码。

5.5 System Field

System Field 是默认内置、承担系统功能的 Field。Forge、Foundry、Memory Console、Permission Center、Ledger 都属于 System Field。

System Field 拥有更高权限，但必须经过 Fount Core 签名、审计和限制。System Field 不是 Fount Core 本身；它仍然受 Fount Core 管理。

5.6 Private Field

Private Field 是用户自己创建、没有发布到 Foundry 的 Field。它可以只服务个人，也可以用于实验、日记、家庭、学习、项目管理或私人 agent 场景。

5.7 Published Field

Published Field 是发布到 Foundry 的 Field。它需要提供 metadata、权限声明、资源预算、版本历史、认证状态和商业授权信息。

⸻

6. 权限模型

权限是 Fount 生态的核心。

因为 Field 可以访问记忆、产生经验、包含 agent、消耗资源、请求网络、本地文件、模型调用，甚至在 Forge 中被修改，所以 Fount 必须有强权限系统。

6.1 基本原则

Field 默认无权访问 Fount 记忆。

Field 默认无权修改其他 Field。

Field 默认无权读取本地文件。

Field 默认无权无限消耗模型资源。

Field Agent 默认只能在 Field 内部规则中行动。

Fount 不能随便修改 Field，除非 Field 授权可编辑配置或源码权限。

Foundry listing 必须展示权限需求。

用户可以随时撤销权限。

Fount Core 拥有最终权限裁决权。

6.2 常见权限

Memory Read：读取 Fount 记忆。

Memory Write：向 Fount 写入经验事件或长期记忆。

Cross-field Recall：从其他 Field 召回经验。

Agent Control：允许 Fount 控制或引导 Field Agent。

Network Access：访问网络。

Local File Access：访问本地文件。

Resource Budget：使用模型、API、云服务或本地计算资源。

Forge Editable Config：允许 Forge 修改配置。

Source Access：允许 Forge 修改源码。

Publish Permission：允许将修改后的 Field 发布到 Foundry。

Commercial Permission：允许销售、授权或订阅。

Update Permission：允许自动更新。

6.3 权限等级

可以设计如下权限等级：

Level 0：普通 Field。只能在自身环境内运行。

Level 1：Memory-aware Field。可以在授权后读写部分记忆。

Level 2：Agent Field。可以包含 Field Agent，并接受 Fount 控制。

Level 3：Creator Field。可以创建或改造其他 Field，但需用户确认。

Level 4：System Field。拥有系统级能力，例如 Forge、Foundry、Permissions。

Level 5：Fount Core。最终权限裁决层，不是 Field。

6.4 权限展示

Foundry 中每个 Field listing 应明确显示：

需要哪些权限。

为什么需要这些权限。

是否读取 Fount 记忆。

是否写入长期记忆。

是否包含 agent。

是否允许 Fount 控制 agent。

是否可被 Forge 改造。

是否有源码权限。

是否使用付费资源。

资源预算上限。

是否通过认证。

⸻

7. 经验流

Fount 生态的核心不是“安装更多 app”，而是“经验在 Field 与 Fount 之间流动”。

基本循环如下：

用户或 Fount 进入 Field。

Field 展开体验或任务。

Field Agent 按规则行动。

Fount 提供上下文、记忆或控制。

Field 产生 Experience Events。

Fount 判断哪些事件值得记忆。

记忆沉淀到 Fount。

Fount 在其他 Field 中召回相关经验。

Fount 在 Foundry 中发现更合适的 Field。

Fount 在 Forge 中改造有权限的 Field。

改造后的 Field 产生新的经验。

这个循环可以表达为：

Enter → Experience → Remember → Recall → Discover → Modify → Return

关键文案是：

A Field becomes more useful when Fount understands it. Fount becomes more personal when it experiences more Fields.

中文可以表达为：

当 Fount 理解一个 Field，Field 会变得更有用；当 Fount 经历更多 Field，Fount 会变得更像你的个人大脑。

⸻

8. Forge 的角色

Forge 是 Fount 生态中最重要的创造系统。

Forge 的定位不是“给程序员写代码的地方”，而是“人和 Fount 一起改造 Field 的工坊”。它要服务两类人：普通用户和开发者。

对于普通用户，Forge 应该允许：

改造 Field 的外观。

修改 Field 的角色和氛围。

调整 Field 的规则。

改变流程和交互。

组合模板。

创建私人 Field。

让 Fount 帮自己解释修改方案。

用自然语言提出改造意图。

预览改造前后差异。

决定是否保留改造。

对于开发者，Forge 应该允许：

编辑源码。

接入 Fount SDK。

定义 Field Manifest。

声明权限。

定义 Experience Events。

创建和调试 Field Agent。

运行虚拟用户测试。

检查资源消耗。

打包 Field。

发布到 Foundry。

Forge 的工作流可以是：

想象一个 Field。

进入已有 Field。

发现想改变的地方。

询问 Fount 如何改造。

检查 Field 是否允许改造。

如果只有配置权限，则修改配置、规则、角色、UI 参数。

如果有源码权限，则进入源码级改造。

运行测试。

生成新的 Field 版本。

选择私有保存、分享或发布到 Foundry。

Forge 的价值在于把“使用产品”和“改造产品”连接起来。用户不只是被动接受 Field，而是可以在权限允许下改变 Field，使 Field 更贴近自己的经验和想象。

⸻

9. Foundry 的角色

Foundry 是 Fount 生态中的发现与分发系统。

Foundry 与传统商店最大的区别是：发现不一定由人发起。Fount 也可以基于用户的经验、记忆、目标和当前上下文自主发现 Field。

Foundry 的典型使用场景包括：

用户浏览 Field。

Fount 主动推荐 Field。

Fount 为当前任务寻找合适 Field。

用户购买或安装 Field。

用户查看 Field 权限。

用户查看 Field 是否可被 Forge 改造。

用户查看是否有源码权限。

作者发布 Field。

作者更新 Field。

作者查看 Field 表现。

官方认证 Field。

Foundry listing 应该包括：

Field 名称。

作者。

体验描述。

截图或演示。

适合哪些人或哪些 Fount 状态。

是否 Fount-aware。

是否有 Field Agent。

是否支持 Memory Sync。

是否支持 Fount Control。

是否支持 Forge 改造。

源码权限情况。

权限需求。

资源预算。

价格。

版本历史。

认证状态。

用户评价。

虚拟用户测试结果。

Foundry 的长期目标不是成为“又一个软件商店”，而是成为 Field 生态的发现层、信任层和商业层。

⸻

10. SDK 与 Field Manifest

SDK 和 Manifest 是生态开放性的关键。

Field Manifest 是 Field 对 Fount 的自我描述。它告诉 Fount：我是谁，我需要什么权限，我有哪些 agent，我会产生哪些经验事件，我允许 Fount 控制什么，我能被 Forge 修改到什么程度。

一个简化 Manifest 可以是：

{
  "id": "com.fount.reading-room",
  "name": "Reading Room",
  "type": "field",
  "version": "0.1.0",
  "agents": ["guide", "librarian"],
  "permissions": {
    "memory": "ask",
    "network": "limited",
    "localFiles": "none",
    "resourceBudget": "limited",
    "sourceAccess": false,
    "forgeEditable": ["layout", "reading-rules", "agent-prompts"]
  },
  "experienceEvents": [
    "reading.progress",
    "user.confusion",
    "insight.saved"
  ],
  "fountControl": {
    "canGuideAgents": true,
    "canPauseAgents": true,
    "canInjectContext": true
  },
  "foundry": {
    "category": "learning",
    "price": "free",
    "certification": "pending"
  }
}

SDK 则提供 Field 与 Fount 通信的能力。一个简化伪代码可以是：

import { createField } from "@fount/sdk";
const field = createField({
  id: "com.example.ui-playground",
  name: "UI Playground",
  permissions: {
    memory: "ask",
    resourceBudget: "limited",
    forgeEditable: ["theme", "layout", "agent-rules"]
  }
});
field.emitExperience("ui.preference.detected", {
  style: "warm paper cards",
  confidence: 0.86
});
field.agent("designer").onControl((context) => {
  return {
    action: "adjust_layout",
    reason: "Fount recalled the user's preference from another Field."
  };
});

SDK 的目标是让 Field 作者不用重新发明权限、记忆、agent 控制、资源账本、Foundry listing、Forge 可编辑性和授权系统。

⸻

11. 开源边界

Fount 本身应该开源，至少 Fount Core 应该开源。原因很直接：Fount 是个人 agent 大脑，涉及记忆、权限、控制和个人数据。用户需要知道它如何处理数据，开发者需要信任它不是封闭黑箱，Field 作者需要确认协议稳定。

推荐开源范围：

Fount Core。

Field Runtime。

Permission Model。

Memory / Experience Event 协议。

Field Manifest Schema。

Fount SDK。

基础 System Field 参考实现。

Forge Lite。

Foundry Lite。

Memory Console Lite。

Ledger Lite。

可以商业化或闭源的部分：

Forge Pro。

高级虚拟用户测试。

源码级自动改造流水线。

高级 UI 生成和设计检查。

官方 Foundry Network。

支付、授权、订阅、更新服务。

Foundry 推荐系统。

认证系统。

开发者分析。

云同步。

团队协作。

云端测试与运行。

这种模式可以总结为：

Fount open. Fields portable. Protocols transparent. Official services commercial.

中文是：

Fount 开放，Field 可携带，协议透明，官方服务商业化。

开源策略可以采用分层许可证：

SDK 和 Manifest Schema 可以使用 MIT 或 Apache-2.0，降低接入门槛。

Fount Core 可以使用 Apache-2.0、AGPL 或双许可证，取决于是否担心云厂商直接托管竞品。

System Field Lite 可以开源，作为参考实现。

Forge Pro、Foundry Network、云服务和认证系统可以闭源商业化。

⸻

12. 商业模式

Fount 生态不应该主要依赖“别人盈利后给平台分成”。对个人用户和个人创作者来说，这种模式早期很弱，因为大多数人还没赚到钱，抽成规模很小。

更合理的商业模式是：

Fount Core 免费或开源，建立信任和生态基础。

Fount Plus 收费，提供更强个人记忆、同步、跨设备、长期自动化和高级个人能力。

Forge Pro 收费，提供高级 Field 创造、源码改造、coding agent 编排、虚拟用户测试、发布检查、资源评估。

Foundry Network 抽成，针对通过官方 Foundry 销售、订阅或授权的 Field 收取平台费用。

Certification 收费，为 Field 提供权限、安全、资源预算、体验质量、SDK 兼容认证。

Cloud Sync 收费，提供跨设备记忆、Field 配置、购买记录和备份同步。

Testing Credits 收费，按虚拟用户测试、深度体验测试、长程 agent 测试、视觉一致性测试收费。

Developer Analytics 收费，向 Field 作者提供安装、留存、权限拒绝率、资源消耗、体验事件、虚拟用户反馈等分析。

Team / Studio 版收费，为小团队、工作室、学校、组织提供私有 Foundry、团队权限、共享 Field、审计和协作。

合理的收入结构是：

第一阶段：卖 Forge Pro 和创造能力。

第二阶段：卖测试、资源账本和云同步。

第三阶段：卖 Foundry 分发、认证和交易。

第四阶段：卖团队生态和私有部署。

这比单纯抽成更稳。抽成应该是生态成熟后的收益，而不是早期唯一收入来源。

⸻

13. 工程结构建议

推荐使用 monorepo，但保持清晰产品边界。不要把所有 Field 写成 Fount Desktop 里的普通页面。

推荐结构：

fount/
├── apps/
│   ├── fount-desktop/
│   ├── fount-web/
│   ├── fount-docs/
│   └── foundry-web/
│
├── packages/
│   ├── fount-core/
│   ├── field-runtime/
│   ├── agent-runtime/
│   ├── memory-core/
│   ├── permission-core/
│   ├── resource-ledger/
│   ├── fount-sdk/
│   ├── field-manifest-schema/
│   ├── ui-kit/
│   └── design-tokens/
│
├── system-fields/
│   ├── forge/
│   ├── foundry/
│   ├── memory/
│   ├── permissions/
│   └── ledger/
│
├── fields/
│   ├── reading-room/
│   ├── ui-playground/
│   ├── memory-theater/
│   ├── agent-game-field/
│   └── field-template-basic/
│
├── services/
│   ├── official-foundry-network/
│   ├── forge-cloud/
│   ├── certification-service/
│   └── sync-service/
│
└── tools/
    ├── create-field/
    ├── validate-field/
    ├── package-field/
    ├── sign-system-field/
    └── publish-field/

Fount Desktop 是用户下载的主 app。它包含 Fount Core、Field Runtime、System Fields 和 Field Manager。

Forge 和 Foundry 位于 system-fields 下，因为它们是默认内置系统级 Field。

普通 Field 位于 fields 下，每个 Field 都应有独立 manifest、权限声明、experience events、agent 配置、Forge 可编辑范围和 Foundry listing。

官网和文档站应独立于 Fount Desktop，因为它们生命周期不同。

SDK 和 manifest schema 必须独立，因为它们是生态协议。

⸻

14. 初始下载包

用户下载的是：

Fount.app

不是：

Forge.app
Foundry.app

Fount.app 内部默认包含：

Fount Core。

Field Runtime。

Forge.field。

Foundry.field。

Memory.field。

Permissions.field。

Ledger.field。

Welcome.field。

若干官方 starter fields。

用户打开 Fount 后，会看到 Fount 的 Home，然后可以进入不同系统 Field 和用户 Field。Forge 和 Foundry 是默认存在的，但它们仍然以 Field 形式运行。

初始结构可以是：

Fount.app
├── Fount Core
├── Field Runtime
├── System Fields
│   ├── Forge.field
│   ├── Foundry.field
│   ├── Memory.field
│   ├── Permissions.field
│   └── Ledger.field
└── Starter Fields
    ├── Welcome.field
    ├── ReadingRoom.field
    └── UIPlayground.field

⸻

15. 用户体验闭环

一个理想的 Fount 体验可以是：

用户下载 Fount。

Fount 引导用户进入 Welcome Field。

Fount 了解用户基本偏好和目标。

Fount 在 Foundry 中推荐几个 starter Field。

用户进入 Reading Room。

Fount 记录用户阅读偏好和困惑点。

用户进入 UI Playground。

Fount 回忆用户喜欢的视觉风格。

用户发现 UI Playground 的布局不适合自己。

用户让 Fount 用 Forge 改造 UI Playground。

Forge 检查该 Field 是否允许配置修改或源码访问。

如果允许，Forge 修改 Field。

虚拟用户测试改造后的体验。

用户保存修改版本。

Fount 把这次改造经验记入长期记忆。

之后 Fount 在 Foundry 中推荐更适合用户的创作型 Field。

这个闭环体现了 Fount 生态的本质：使用、记忆、发现、改造、再体验。

⸻

16. 开发者体验闭环

Field 作者的典型流程是：

安装 Fount SDK。

创建 Field Manifest。

声明 Field 权限。

声明 Field Agent。

定义 Experience Events。

实现 Field UI。

接入 Fount memory 和 control channel。

在 Fount 中本地运行 Field。

使用 Forge 测试 Field。

运行虚拟用户测试。

生成 Foundry listing。

提交认证。

发布到 Foundry。

获得安装、使用、权限、资源和体验反馈。

根据反馈更新 Field。

这个流程的关键是让开发者觉得：接入 Fount SDK 不只是多一个集成成本，而是获得了一整套 Field 生态能力，包括记忆、agent 控制、权限信任、测试、分发、认证和商业化。

⸻

17. 创作者体验闭环

普通创作者不一定写代码。他们的流程应该是：

在 Foundry 中发现一个 Field。

进入 Field 体验。

发现自己想改变某个部分。

让 Fount 打开 Forge。

Forge 判断这个 Field 的可编辑范围。

创作者用自然语言描述修改目标。

Fount 提供改造方案。

Forge 修改配置、规则、角色、流程或视觉。

创作者预览修改。

Field Agent 和虚拟用户测试体验。

创作者保存为私人版本，或在允许的情况下发布 remix。

这样 Forge 就不只是开发者工具，而是所有人都可以使用的创造工坊。

⸻

18. 认证与信任

Foundry 中的 Field 应该有认证机制。认证不是为了制造门槛，而是为了建立信任。

认证维度可以包括：

权限透明度。

记忆访问安全。

资源预算可控。

Field Agent 行为边界清晰。

Fount control channel 安全。

Experience Events 合规。

Forge 可编辑范围明确。

源码权限声明准确。

虚拟用户测试通过。

本地优先能力。

隐私策略清晰。

认证标签可以是：

Fount-aware。

Memory-safe。

Budget-limited。

Virtual-user tested。

Local-first。

Forge-editable。

Source-available。

Certified Field。

认证可以成为商业服务，也可以成为 Foundry 排名和推荐的重要依据。

⸻

19. 与传统生态的区别

Fount 生态不是传统 app store，也不是普通插件市场，也不是纯开发者平台。

与 app store 相比，Foundry 分发的是 Field，而不只是 app。Field 会声明 agent、记忆、权限、经验事件和可改造性。

与插件市场相比，Field 是完整体验环境，不只是扩展某个主程序的功能。

与 AI 助手相比，Fount 不是只在对话中回答问题，而是能进入不同 Field，产生连续经验。

与开发者工具相比，Forge 不只是写代码，而是让所有人参与创造和改造 Field。

与自动化平台相比，Fount 不只是执行 workflow，而是在不同 Field 中形成长期记忆和经验迁移。

Fount 生态的核心差异是：经验连续性。

⸻

20. 产品命名体系

推荐命名体系如下：

Fount：个人 agent 大脑，用户下载的主 app。

Field：可进入、可体验、可运行、可被 agent 行动的环境。

Forge：创造和改造 Field 的系统级 Field。

Foundry：发现和分发 Field 的系统级 Field。

Fount SDK：让产品变成 Field 的开放 SDK。

Field Agent：Field 内部的 agent。

Experience Event：Field 回流给 Fount 的经验事件。

Memory Sync：Fount 与 Field 的记忆同步。

Control Channel：Fount 控制或引导 Field Agent 的通道。

Source Access：Field 是否允许被 Forge 源码级改造的权限。

System Field：默认内置、拥有系统功能的 Field。

Starter Field：初始安装时附带的示例 Field。

Private Field：用户私有 Field。

Published Field：发布到 Foundry 的 Field。

⸻

21. 路线图

阶段一：概念闭环 MVP

目标是证明 Fount、Field、Forge、Foundry 的体验闭环成立。

需要实现：

Fount Desktop 壳。

Field Runtime 基础版。

Field Manifest 基础版。

权限系统基础版。

经验事件基础版。

本地记忆基础版。

Forge.field Lite。

Foundry.field Lite。

Welcome.field。

ReadingRoom.field。

UIPlayground.field。

本地安装 Field Pack。

基础跨 Field 记忆召回。

阶段二：Field 包化与 SDK

目标是让 Field 成为真正可创建、可打包、可安装的产品单位。

需要实现：

Fount SDK JS。

Field Manifest Schema。

create-field 工具。

validate-field 工具。

package-field 工具。

Field Pack 格式。

Forge 对 Field 可编辑范围的识别。

Foundry 本地目录。

Field 权限可视化。

Experience Event Viewer。

阶段三：Forge 强化

目标是让普通用户和开发者都能用 Forge 改造 Field。

需要实现：

自然语言改造入口。

配置级 Field 改造。

UI / 规则 / agent prompt 改造。

源码权限检测。

源码级改造初版。

虚拟用户测试初版。

资源消耗估算。

Field 发布检查。

阶段四：官方 Foundry Network

目标是让 Field 可以被真正发现、安装、购买和发布。

需要实现：

Foundry Web。

Field listing。

作者页面。

认证流程。

Field 上传。

Field 安装链接。

支付与授权。

版本更新。

推荐系统初版。

开发者后台。

阶段五：开放生态

目标是让第三方可以独立创建 Field，甚至创建替代 Forge / Foundry 的系统级 Field。

需要实现：

公开 SDK 文档。

公开 manifest 标准。

认证规范。

System Field 签名机制。

私有 Foundry 支持。

团队空间。

云同步。

商业服务。

⸻

22. 核心原则

Fount 是个人大脑，不是普通助手。

Field 是经验环境，不是普通 app。

Forge 是创造和改造 Field 的 Field，不是纯 IDE。

Foundry 是发现和分发 Field 的 Field，不是普通商店。

Fount Core 应该开放可信。

SDK 和协议应该开放。

官方服务可以商业化。

权限必须清晰。

记忆必须可控。

Field Agent 必须受 Field 规则和 Fount 权限约束。

Fount 不能随便改造 Field，必须有可编辑配置或源码权限。

人和 Fount 都可以发现 Field。

人和 Fount 都可以进入 Field。

经验应该在授权范围内跨 Field 流动。

每个 Field 都应该让 Fount 变得更理解用户。

每个更理解用户的 Fount 都应该让 Field 变得更有价值。

⸻

23. 最终定义

Fount 生态可以最终定义为：

Fount is an open personal agent brain. Fields are portable experience environments. Forge and Foundry are built-in system Fields. The SDK turns products into Fields. Experience flows between Fields and Fount. Official services provide creation, discovery, certification, sync, distribution, and commercialization.

中文定义：

Fount 是开放的个人 agent 大脑。Field 是可携带的经验环境。Forge 和 Foundry 是默认内置的系统级 Field。SDK 让普通产品变成 Field。经验在 Field 和 Fount 之间流动。官方服务提供创造、发现、认证、同步、分发和商业化能力。

这就是 Fount 生态的核心。
