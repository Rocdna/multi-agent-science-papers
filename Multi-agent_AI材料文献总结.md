# Multi-agent × AI 材料文献速览

原有文献核验：2026-10-12 · 展示与摘要表述更新：2026-10-16 · 新增文献核验与同步：2026-10-19 · 共 30 篇：方法 23、综述 5、评测 2。各组按年份从新到旧，同年按名称排列。点击论文名或代码状态可打开链接。

> 评级口径：CCF 2026 目录；JCR 2025 发布版；中科院 2025 大类分区（公开来源参考值）。SCIE 与 ESCI 分开标注；Findings、Workshop 不套用主会等级。正式发表按会议／期刊年份，未确认发表的按预印本年份。

## 方法 · 知识工程

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2025 · [LLaMP](https://aclanthology.org/2025.emnlp-main.1280/) | 通过分层智能体查询材料数据库，并调用模拟工具开展计算。 | EMNLP | CCF B | [公开代码](https://github.com/chiang-yuan/llamp) |
| 2025 · [Perovskite-LLM](https://aclanthology.org/2025.findings-emnlp.27/) | 用知识图谱和多智能体生成领域训练数据，构建钙钛矿语言模型。 | EMNLP Findings | 不计入主会 CCF | 未找到 |
| 2025 · [SLEUTH](https://arxiv.org/abs/2511.22850) | 让多个智能体整理长文档中的文本与图表，定位回答所需证据。 | arXiv | 预印本，暂无正式评级 | 未找到 |
| 2025 · [SLM-MATRIX](https://doi.org/10.1038/s41524-025-01719-x) | 让小模型通过多条推理路径协作核对，提取材料数据。 | npj Computational Materials | SCIE；JCR Q1；中科院1区 | [公开代码](https://github.com/AmberGTP5/SLMMATRIX) |
| 2024 · [HoneyComb](https://aclanthology.org/2024.findings-emnlp.192/) | 结合材料知识库和工具调用，提高材料领域问答与任务表现。 | EMNLP Findings | 不计入主会 CCF | [公开代码](https://github.com/BangLab-UdeM-Mila/NLP4MatSci-HoneyComb) |

## 方法 · 假设生成

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2025 · [ACCELMAT](https://aclanthology.org/2025.findings-naacl.420/) | 结合研究目标、约束和多模型评议，改进材料研究假设。 | NAACL Findings | 不计入主会 CCF | [公开代码](https://github.com/shri071/Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM) |
| 2025 · [SciAgents](https://doi.org/10.1002/adma.202413523) | 沿知识图谱关联推理，提出仿生材料的设计假设和验证方案。 | Advanced Materials | SCIE；JCR Q1；中科院1区 · Top | [公开代码](https://github.com/lamm-mit/SciAgentsDiscovery) |

## 方法 · 计算执行

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2026 · [AutoDFT](https://arxiv.org/abs/2605.26179) | 自动规划和执行 DFT 计算，并在失败后尝试恢复。 | arXiv | 预印本，暂无正式评级 | 未找到 |
| 2026 · [ChatMat](https://doi.org/10.1039/d5dd00582e) | 让多个智能体协调 DFT、数据管理与机器学习势计算。 | Digital Discovery | ESCI；JCR Q1 / Q2；中科院2区 | [公开代码](https://github.com/Xiaobu-USTC/ChatMat) |
| 2026 · [ChemGraph](https://doi.org/10.1038/s42004-025-01776-9) | 把分子模拟拆成多个智能体子任务，调用计算工具完成结构优化与热化学计算。 | Communications Chemistry | SCIE；JCR Q1；中科院1区 · Top | [公开代码](https://github.com/argonne-lcf/ChemGraph) |
| 2026 · [MatSciAgent](https://doi.org/10.1038/s43246-025-00994-x) | 用模块化智能体整合材料知识检索、结构生成与模拟。 | Communications Materials | ESCI；JCR Q1；中科院2区 | [公开代码](https://github.com/cakshat/MatSci-LLM-Agents) |
| 2025 · [AtomAgents](https://doi.org/10.1073/pnas.2414074122) | 结合原子模拟与多模态分析，辅助合金性质计算和设计。 | PNAS | SCIE；JCR Q1；中科院1区 · Top | [公开代码](https://github.com/lamm-mit/AtomAgents) |
| 2024 · [ChemCrow](https://doi.org/10.1038/s42256-024-00832-8) | 让大模型调用专家化学工具，完成分析与合成相关任务。 | Nature Machine Intelligence | SCIE；JCR Q1；中科院1区 · Top | [部分公开](https://github.com/ur-whitelab/chemcrow-public) |

## 方法 · 闭环发现

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2026 · [Battery-Sim-Agent](https://doi.org/10.1145/3770855.3818856) | 根据电池模拟结果调整参数，用于反推电池模型参数。 | KDD | CCF A | [公开代码](https://github.com/opqrst-chen/Battery-Sim-Agent) |
| 2026 · [LLEMA](https://proceedings.iclr.cc/paper_files/paper/2026/hash/e1afaedf81656c0b5e12f4508bed96ad-Abstract-Conference.html) | 结合规则与记忆开展多目标搜索，评估材料候选方案。 | ICLR | CCF A | [公开代码](https://github.com/scientific-discovery/LLEMA) |
| 2026 · [MAESTRO](https://doi.org/10.1021/acscentsci.6c01260) | 用多智能体推理和计算反馈，迭代设计单原子催化剂。 | ACS Central Science | SCIE；JCR Q1；中科院1区 · Top | [公开代码](https://github.com/ahrehd0506/Catalyst-Design-Agent) |
| 2026 · [MARS](https://doi.org/10.1016/j.matt.2025.102577) · [方法笔记](notes/2026-MARS.md) | 结合文献检索、多智能体设计与机器人实验，探索材料方案。 | Matter | SCIE；JCR Q1；中科院1区 · Top | [公开代码](https://github.com/tangger2000/MARS) |
| 2026 · [MASTER](https://doi.org/10.1038/s41524-026-02139-1) | 让分层智能体根据计算反馈，选择下一次催化剂计算。 | npj Computational Materials | SCIE；JCR Q1；中科院1区 | 未找到 |
| 2026 · [PeroMAS](https://doi.org/10.1145/3770855.3818858) | 设计兼顾多个目标的钙钛矿方案，并进行真实合成验证。 | KDD | CCF A | [公开代码](https://github.com/DEFENSE-SEU/PeroMAS) |
| 2025 · [Atomic Layer Processing](https://arxiv.org/abs/2509.26201) | 在模拟反应器中探索未知反应规则，研究探索路径的影响。 | NeurIPS AI4MAT Workshop | 不计入主会 CCF | [公开代码](https://github.com/awwerbro/ALDReactor) |

## 方法 · 通用科研

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2026 · [Co-Scientist](https://doi.org/10.1038/s41586-026-10644-y) | 通过生成、评议和筛选提出科研假设，主要在生物医学中验证。 | Nature | SCIE；JCR Q1；中科院1区 · Top | 完整源码未公开 |
| 2025 · [Kosmos](https://arxiv.org/abs/2511.02824) | 让智能体共享研究记录，持续开展文献检索和数据分析。 | arXiv | 预印本，暂无正式评级 | [部分公开](https://github.com/EdisonScientific/kosmos-figures) |
| 2025 · [MatAgent](https://openreview.net/search?term=MATAGENT) | 由研究者参与指导，让多个智能体协作完成材料科研任务。 | ICLR AI4MAT Workshop | 不计入主会 CCF | [部分公开](https://github.com/adibgpt/MatAgent) |

## 综述

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2026 · [AI 材料：模型、数据与工具](https://doi.org/10.1145/3822503) | 梳理材料科研中的基础模型、智能体、数据集和工具。 | ACM Computing Surveys | SCIE；JCR Q1；中科院1区 · Top | 不适用 |
| 2026 · [LLM 材料设计](https://doi.org/10.1002/adfm.202525897) | 综述 LLM 在材料性质预测、逆向设计与计算流程中的应用。 | Advanced Functional Materials | SCIE；JCR Q1；中科院1区 · Top | 不适用 |
| 2026 · [晶体材料：LLM、RAG 与 Agent](https://doi.org/10.1557/s43577-026-01057-3) | 梳理 LLM、RAG 和智能体用于晶体材料发现与表征的方法。 | MRS Bulletin | SCIE；JCR Q2；中科院3区 | 不适用 |
| 2026 · [材料 Agent：设计到实验](https://doi.org/10.1002/adfm.78275) | 梳理材料科研中从信息提取、设计到实验执行的智能体流程。 | Advanced Functional Materials | SCIE；JCR Q1；中科院1区 · Top | 不适用 |
| 2026 · [材料 LLM 与开源路线](https://doi.org/10.1039/d5dd00499c) | 讨论材料领域 LLM 的复现和成本，并提供开源模型基准。 | Digital Discovery | ESCI；JCR Q1 / Q2；中科院2区 | [附基准代码](https://doi.org/10.5281/zenodo.17548056) |

## 评测／基准

| 年份 · 论文 | 核心工作 | 发表渠道 | 评级／分区 | 作者代码 |
|---|---|---|---|---|
| 2026 · [MADE](https://proceedings.mlr.press/v306/malik26a.html) | 提供材料发现模拟环境，评估有限计算预算下的闭环搜索。 | ICML | CCF A | [公开代码](https://github.com/diffractivelabs/MADE) |
| 2026 · [SciAgentGym](https://openreview.net/forum?id=0Moj0YgFEF) | 评测智能体多步调用科学工具和处理任务失败的能力。 | ICML | CCF A | [公开代码](https://github.com/CMarsRover/SciAgentGYM) |

## 阅读与复现提示

- **LLaMP**：2024 年预印本，正式发表于 EMNLP 2025；侧重工具驱动检索、层级 ReAct 与材料计算。
- **SciAgentGym**：已确认 ICML 2026 正式录用，CCF A；[作者确认](https://www.huayusha.org/publication/SciAgentGym/)。
- **ChemGraph**：2026-10-19 核验：[正式论文](https://www.nature.com/articles/s42004-025-01776-9)发表于 2026-01-08，不能按 DOI 中的 2025 判断年份；作者仓库可访问，Apache-2.0，未运行复现实验。JCR Q1 见 [2025 发布版第 92 页](https://cercetare.ubbcluj.ro/wp-content/uploads/2018/02/JCR_iunie_2025.pdf#page=92)；中科院化学大类1区 · Top 采用[公开汇总参考值](https://www.ablesci.com/journal/detail?id=5QjOMD)。
- **AutoDFT**：目前可查为 2026 年预印本，未确认正式发表；[作者发表列表](https://rainwangphy.github.io/publications.html)。
- **MatAgent**：公开案例脚本、部分数据和日志，核心编排缺失；超导数据清洗及部分图表存在复现问题。
- **ChemCrow／Kosmos**：分别为部分工具、分析与验证脚本公开，不能视为完整系统开源。
- **SLM-MATRIX**：论文给出代码链接，但仓库访问未核验；“未找到代码”也不代表断言不存在。
- **Co-Scientist／MAESTRO**：表中使用正式发表信息，本地附件为早期版本；MAESTRO 与 MASTER 是两项不同研究。

评级来源：[CCF 目录说明](https://www.ccf.org.cn/Academic_Evaluation/By_category/) · [JCR 2025 表](https://cercetare.ubbcluj.ro/wp-content/uploads/2018/02/JCR_iunie_2025.pdf)。期刊中科院参考来源和详细结果见 HTML 展示页。
