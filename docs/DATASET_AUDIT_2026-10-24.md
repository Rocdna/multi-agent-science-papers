# 已收录文献的数据集与评测材料核查

核查日期：2026-10-24。范围为当前 `index.html` 中的全部 **30 篇**，不包括 Zotero 全库或尚未收录到网站的论文。

本次读取了本地论文、作者仓库的 README 和文件清单，并对重点 JSON、CSV、Excel 与补充数据 ZIP 做了内容检查。未运行模型或复现评分，未核验所有样本的科学正确性。论文声称公开、归档列出了文件、文件已经实际读取，是不同的核查程度；“未确认入口”也不等于作者一定没有公开。

用户随后要求下载到本机：资源已按论文保存至 `D:/desktop/AI4S/data/`，入口为该目录的 `README.md`，并附逐文件来源、版本、大小和校验清单。后续重试已成功取得并解压 ChemGraph 原论文评测 ZIP 和开源综述的 `share.zip`；下文中较早的 403 状态保留为初次核查记录，以本段补充及本地清单为准。另下载了 ChemGraph 当前 Hugging Face 的 40 条参考记录，与论文归档分开保存。

## 优先关注的资源

| 用途 | 资源 | 实际提供的内容 | 使用条件与边界 |
|---|---|---|---|
| 科研工具调用与工作流评测 | [ChemGraph 论文评测包](https://zenodo.org/records/17290519) | 记录说明评测扩展到 360；包含实验输入、人工参考工作流、模型工具调用结果、绘图数据，并归档论文源码 1.0.0 | 有参考输出，适合评测调用正确性；重新执行分子计算需要对应计算工具。此前已核查源码归档，本次确认归档目录与描述，评测 ZIP 下载受到 403 限制 |
| 科研工具调用与工作流评测 | [SciAgentGym 数据目录](https://github.com/CMarsRover/SciAgentGYM/tree/main/dataset) | 实读 83 个多模态原始案例、48 个文本原始案例，合计 131；另外有 128 个 refined variants，共 259 个任务。JSON 包含问题、答案、参考步骤、工具协议等 | 原始 131 个案例中 `subject=Materials Science` 的有 20 个；多模态题还需要图片与工具依赖。259 是原题与变体合计，不是 259 个独立来源题 |
| 材料问答和抽取 | [HoneyComb 数据目录](https://github.com/BangLab-UdeM-Mila/NLP4MatSci-HoneyComb/tree/main/dataset) | 实读 `mascqa-eval-with_answer.json`：14 个类别、650 道题；`glass.json` 和 `sofc_sent.json` 各有 500 条，含标签；另有 SciQ 文件 | 主要复用已有基准，并非全是 HoneyComb 新建数据。无需重新做 DFT；完整作者系统仍有模型与搜索依赖 |
| 材料假设生成 | [ACCELMAT / MATDESIGN 仓库](https://github.com/shri071/Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM) | `Materials Discovery & Design Dataset.xlsx` 实读 51 条非空记录，字段为题名、目标、约束、材料、方法、KG 信息；另有评估 Excel | 论文称 50 篇，当前文件为 51 条，需固定版本。评估 Excel 只有 24 条主题记录，并有省略评分和主题不对应等已发现问题，不能直接作为完整可靠评分表 |
| 材料设计任务定义 | [LLEMABench](https://huggingface.co/datasets/nikhilsa/LLEMABench) | 14 条任务，字段 `Task / Goal / Properties`；作者仓库的 `src/all_tasks.csv` 同样实读 14 条 | 是目标与性能约束，不是大规模带正确结构答案的数据集；评价还需数据库、性质模型与搜索流程 |
| 真实实验表格与优化历史 | [MARS 的 rf_bo](https://github.com/tangger2000/MARS/tree/main/rf_bo) | `round_0.xlsx` 至 `round_12.xlsx`；实读第 0 轮表头为 CsBr、CsCl、PbBr2、PbCl2、Oam、OA、峰位 | 可用于数据分析或研究历史优化过程；每张表的“已测样本/待选候选”等角色需对照 notebook 确认，不能把所有行都当实测数据。重新完成实物实验仍需设备 |
| 真实材料数据分析 | [Kosmos 钙钛矿案例](https://github.com/EdisonScientific/kosmos-figures/tree/main/Figure_3_perovskite_solar_cell) | 实读 `Summary table analysis.xlsx` 为 37 条数据，含旋涂/退火环境、Jsc、Voc、FF、PCE 等，另有分析脚本 | 小型案例表格，可用于分析任务；不是完整 Kosmos 系统，也不是统一的跨领域标准测试集 |
| 电池仿真闭环 | [Battery-Sim-Agent 仿真任务](https://github.com/opqrst-chen/Battery-Sim-Agent/tree/main/generate_simulated_data) | 已提交单参数、多参数和 SEI 退化任务 YAML，以及生成脚本。README 描述过滤后的单参数、多参数设置各 100 个案例 | YAML 是仿真设定，可通过 PyBaMM 生成目标曲线；不能把这些配置称为已经下载好的真实测量曲线。真实电池数据使用 CALCE 等外部来源，路径和下载需另核 |
| 材料推理与搜索日志分析 | [MASTER 补充数据入口](https://www.nature.com/articles/s41524-026-02139-1) | 实际下载约 16.9 MB 的补充 ZIP，剔除 macOS 元数据后有 491 个 PDF，包含原子位置、推理/材料选择日志、图表源数据 | 数据公开，但不是现成 CSV/JSON。适合先提取、核对为查表任务；尚未完成这个整理，不能称作开箱即用的离线发现环境 |

对当前没有自有 DFT 数据、希望研究 Agent 方法的情况，优先考虑 **ChemGraph、SciAgentGym、HoneyComb**。前两者适合工具调用和工作流，后者适合材料问答与抽取。希望分析真实材料实验数据时，可查看 **MARS 与 Kosmos**。这是基于数据形式与依赖作出的使用建议，并非这些数据足以支持新材料发现的结论。

## 全部 30 篇逐项结果

“已读文件”表示实际打开了相关数据文件；“已核目录”表示确认仓库存在文件，尚未逐条检验；“归档元数据”表示核对了记录及文件名/大小，未下载归档。这里的状态不表示已成功复现论文。

| 序号 | 文献 | 找到的数据或评测材料 | 核查结论与限制 |
|---|---|---|---|
| 1 | AutoDFT | 论文提出 VASPBench：34 个任务、9 类 DFT 计算；另使用 Materials Project | 已查本地正文与[论文入口](https://arxiv.org/abs/2605.26179)，未确认作者独立可下载的 VASPBench 文件或实现入口；正文中的任务介绍不等于完整测试包 |
| 2 | Battery-Sim-Agent | 单参数、多参数、SEI 任务 YAML 和生成脚本；真实电池数据引用外部来源 | [已核目录与 README](https://github.com/opqrst-chen/Battery-Sim-Agent/tree/main/generate_simulated_data)。重点是仿真任务，不是材料结构数据集 |
| 3 | ChatMat | 训练与实验结果的 Zenodo 归档；仓库内还有 CSV/XLSX、结构和运行结果 | [Zenodo 18459314](https://zenodo.org/records/18459314) 元数据核实为 `Xiaobu-USTC/ChatMat-v1.1.zip`，约 1.18 GB；未整包下载，不能确认归档覆盖所有论文任务。[作者仓库](https://github.com/Xiaobu-USTC/ChatMat)已核文件清单 |
| 4 | Co-Scientist | GPQA Diamond、DepMap Q2 2024、Open Targets 等外部数据；生物实验与补充信息 | [正式论文 Data availability](https://www.nature.com/articles/s41586-026-10644-y#data-availability)给出外部入口。不是公开的材料专用测试包；本地附件含较早预印本，数据开放结论以正式论文为准；完整系统源码未公开 |
| 5 | LLEMA | LLEMABench 的 14 个目标/约束任务；仓库有 `all_tasks.csv` | [已读任务文件及 HF 预览](https://huggingface.co/datasets/nikhilsa/LLEMABench)。不含每道任务唯一的正确材料答案 |
| 6 | MAESTRO | `data/structures/` 中 9 个 POSCAR 初始结构与 `modification_knowledge.txt` | [已核目录](https://github.com/ahrehd0506/Catalyst-Design-Agent/tree/main/data)。是初始材料/规则，不等于带完整吸附能标签与实验结果的评测集；未确认独立完整数据包 |
| 7 | MARS | 多轮实验 Excel、GraphRAG 图谱产物、评测集构建脚本 | [作者仓库](https://github.com/tangger2000/MARS)已核目录，第 0 轮 Excel 已读。适合实验表格/历史分析，完整机器人闭环不能仅凭数据复现 |
| 8 | MASTER | 原子位置、选择日志、图表数据，均在补充 ZIP | [正式论文 Supplementary Information](https://www.nature.com/articles/s41524-026-02139-1)。补充 ZIP 已下载并打开；491 个有效文件全部是 PDF，机器可读整理尚待完成 |
| 9 | MatSciAgent | 四类任务 notebook；论文声明案例与可靠性结果在 supplementary data | [仓库](https://github.com/cakshat/MatSci-LLM-Agents)已核目录；[论文数据声明](https://doi.org/10.1038/s43246-025-00994-x)在本地正文确认。未下载并核对全部补充数据，不列作统一大规模基准 |
| 10 | PeroMAS | 数据准备脚本、特征矩阵、优化数据库；依赖 Perovskite Database Project | [dataset/README.md](https://github.com/DEFENSE-SEU/PeroMAS/blob/main/dataset/README.md)中的 Zenodo DOI 仍是 `XXXXXXX`；目录未见文档声称的全部训练 CSV/指令 JSON，不能认定完整归档已公开。文档对部分数据规模的表述也不一致 |
| 11 | ACCELMAT | MATDESIGN Excel 与假设评估 Excel | [仓库](https://github.com/shri071/Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM)两份 Excel 已读：51 条设计记录、24 条评估主题。Excel XML 有 1000 个格式化行，不应误报为 999 个样本 |
| 12 | AtomAgents | 实验 notebook、对话 PDF、势函数文件与 LAMMPS 输入 | [作者仓库](https://github.com/lamm-mit/AtomAgents)已核目录。找到案例与计算资源，未确认可独立下载的统一带标签测试集；势函数不是测试数据集 |
| 13 | Atomic Layer Processing | ALD 反应器模拟器、示例和教程；可输出传感器时间序列与模拟参数 | [ALDReactor](https://github.com/awwerbro/ALDReactor)已核目录/说明。可生成数据，但未确认论文全部 Agent 实验的固定输入与参考答案包 |
| 14 | Kosmos | 多个发现案例的 CSV/XLSX 和分析脚本；论文列出外部数据来源 | [作者分析仓库](https://github.com/EdisonScientific/kosmos-figures)已核目录，钙钛矿表格已读。部分发现数据在预印本中注明后续另发；不得把局部分析材料当成完整平台与全量数据 |
| 15 | LLaMP | 查询/计算实验 notebook、部分 CIF/XYZ 和输出；在线 Materials Project 数据 | [作者仓库](https://github.com/chiang-yuan/llamp/tree/main/experiments)已核目录。能提取任务案例，未发现独立统一问答测试 JSON；API 数据会随版本变化 |
| 16 | MatAgent | 带隙、超导、热容、合金、混凝土等 CSV | [作者实验目录](https://github.com/adibgpt/MatAgent)已核；实读带隙 82 行、热容 229 行、合金 160 行、混凝土 1030 行；清洗超导表仅 194 行。原超导 CSV 较大，本次未完整下载；这些案例不是已验证可靠的完整 Agent 评测集 |
| 17 | Perovskite-LLM | 论文提出 Perovskite-Chat：55,101 QA，以及 Perovskite-Reasoning：2,217 问题 | [正式论文](https://aclanthology.org/2025.findings-emnlp.27/)和本地正文已查，未确认对应作者可下载入口。不能把其他名字相似的 Perovskite-R1 数据集当作本论文发布物 |
| 18 | SciAgents | 生物启发材料知识图谱与嵌入 | [bio-graph-1K](https://huggingface.co/lamm-mit/bio-graph-1K)及[作者说明](https://github.com/lamm-mit/SciAgentsDiscovery)确认下载方式。是知识资源，不是带正确假设答案的标准评测集；未下载大图文件 |
| 19 | SLEUTH | 使用 MMLongBench-Doc、LongDocURL、PaperTab、FetaTab 等既有长文档基准 | 本地正文已查；[MMLongBench-Doc 作者仓库](https://github.com/mayubo2333/MMLongBench-Doc)有文档、问题、答案和证据页。未确认 SLEUTH 新建数据包；它偏文档理解，并非材料发现数据集 |
| 20 | SLM-MATRIX | 复用 BulkModulus、MSPTC 派生 MatSynTriplet，以及数学基准 | [正式论文 Data availability](https://www.nature.com/articles/s41524-025-01719-x#data-availability)确认来源；[有效作者仓库](https://github.com/AmberGTP5/SLM-MATRIX)仅 7 个代码/说明文件，未捆绑数据。MatSynTriplet 派生版本的独立文件未确认，不能直接以原 MSPTC 代替 |
| 21 | ChemCrow | 论文实验运行记录和源数据，另外有工具侧 CSV | [chemcrow-runs](https://github.com/ur-whitelab/chemcrow-runs)与[论文数据声明](https://doi.org/10.1038/s42256-024-00832-8)确认入口。主要是实验记录与案例，不是统一大规模问答训练集；未逐条解析全部记录 |
| 22 | HoneyComb | MaScQA、SciQ、玻璃与 SOFC 标注文件 | [dataset 目录](https://github.com/BangLab-UdeM-Mila/NLP4MatSci-HoneyComb/tree/main/dataset)确认，重点 JSON 已读。MaScQA 文件来源指向[原作者仓库](https://github.com/M3RG-IITD/MaScQA)，使用时区分数据原作者与框架作者 |
| 23 | AI 材料：模型、数据与工具 | 综述汇总材料数据库、模型与工具 | [论文](https://doi.org/10.1145/3822503)与本地正文已查。未确认该综述新建的独立评测数据集；引用数据库需逐个回到原始发布物 |
| 24 | LLM 材料设计 | 综述材料设计中的模型、数据与任务 | [论文](https://doi.org/10.1002/adfm.202525897)本地正文的数据声明为文章内提供。未确认独立公开测试包 |
| 25 | 晶体材料：LLM、RAG 与 Agent | 系统综述中的数据库和应用案例 | [论文](https://doi.org/10.1557/s43577-026-01057-3)与本地正文已查。未确认综述自建、可直接下载的标准数据集 |
| 26 | 材料 Agent：设计到实验 | 综述与补充信息中的任务、数据基础设施 | [论文](https://doi.org/10.1002/adfm.78275)本地正文声明支持数据可向通讯作者合理索取；未确认独立公开下载包 |
| 27 | 材料 LLM 与开源路线 | 基准测试与微调代码/数据的 Zenodo 记录 | [Zenodo 17548056](https://zenodo.org/records/17548056)的 `share.zip` 约 1.18 MB；后续重试已下载解包，实读 `prediction/dataset_train.jsonl` 为 4,990 条，`dataset_test.jsonl` 为 1,039 条，另有抽取 benchmark Excel |
| 28 | MADE | 化学体系 JSON、基线配置、环境、系统生成脚本 | [作者 README](https://github.com/diffractivelabs/MADE)提供 `data/systems_10_mp_20/` 中的体系列表与使用方式。是动态发现评测环境，需要 Oracle/模型，不是静态问答表；用户已运行 |
| 29 | SciAgentGym | 两份问题 JSON、参考答案/步骤、工具协议、图片 | [作者数据目录](https://github.com/CMarsRover/SciAgentGYM/tree/main/dataset)两份 JSON 已读；131 原始案例 + 128 变体。仓库中的 Hugging Face 按钮为占位链接，实际使用已存在的 GitHub 文件 |
| 30 | ChemGraph | 分子输入、人工参考工作流、模型轨迹、绘图数据和论文源码归档 | [Zenodo 17290519](https://zenodo.org/records/17290519)确认。论文复现优先采用归档 1.0.0，与当前主分支评测功能分开 |

## 已核实文件的固定版本

为避免后续仓库更新导致样本数或路径变化，本次内容检查对应以下提交：

| 项目 | 提交 |
|---|---|
| HoneyComb | `70b9a26ecaa4a48afa1a9219994c55043e1e3c34` |
| SciAgentGym | `e9dbbea4369d67694e38bf8be67bedbcaf9e9300` |
| ACCELMAT | `923a842db8ffacbe7464cebea93fd1dfeba92ad8` |
| MARS | `0b3fb88c4ef0a9f37f5af711eed546eeb976862c` |
| Kosmos 图表与分析 | `819447258cb53782fb3b7ddd63be8d65acf8f078` |
| LLEMA | `9663c3f811a6e7671c91e1c2f8abaccbeadc1f98` |
| MatAgent | `314776746f198dafbe618791ba62c2fcd2892778` |
| Battery-Sim-Agent | `354f2ddcbb8d14d6dfe9673aac55199976d2d42c` |
| PeroMAS | `c9eeb78e01c1a873fd46c03b5f502cf264fd5022` |

重点文件、仓库目录和核查脚本保存在忽略目录 `.local/dataset-audit-20261024/`，不随公开仓库发布。ChatMat 的大型归档、图谱嵌入和模型权重未下载。公开数据的具体再利用范围应以各数据原始发布物的许可为准，不能直接套用框架代码许可证。

后续收集补充：SciAgents 的 GraphML 与嵌入已下载至上述 `data/SciAgents/` 并核对 HF SHA-256；MatSciAgent 出版社补充文件 2/3 已下载，文件头识别为 ASE ULM trajectory，按 `.traj` 保存。ChatMat 仅收集仓库中的实际所选数据文件与评测结果，大型全仓库归档仍未下载。
