# 项目背景与文献来源

本目录用于维护计划上传 GitHub 并持续更新的文献分类汇总，涵盖已阅读及已搜集的论文。

## 已确认的本地来源

- 项目目录：`D:/desktop/AI4S/repro/paper`
- Zotero 数据目录：`D:/zotero_doc`
- Zotero 数据库：`D:/zotero_doc/zotero.sqlite`
- 主要汇总分类：`Multi-Agent for science`（用户称为 Multi-agent；已在数据库中确认，collectionID 为 `2`）。这是 Zotero 分类，不是同名文件夹。
- 论文附件存储目录：`D:/zotero_doc/storage`；具体附件与论文的对应关系需通过 Zotero 数据确认。
- 当前汇总文件：`Multi-agent_AI材料文献总结.md`、`index.html`（原展示页已改名）。

## 维护方向

- 以主要分类中的论文为来源，持续维护分类汇总和展示。
- 后续可能添加已阅读标签、论文创新点、贡献点等信息；具体字段和功能暂不确定。
- 后续工作优先沿用上述来源，无需用户重复提供路径；来源变更时更新本文件。
- 阅读笔记优先保证方便阅读：先用直白语言解释问题、过程和结果，必要术语就地解释；实现参数集中在相关方法段落，减少重复和术语堆叠。保留关键数据、来源及结论的适用条件，区分论文事实和个人建议。
- 研究定位偏计算机与材料交叉，用户重视发表评级。文献主列表中的 CCF、JCR 和中科院分区等已有评级信息需默认可见，手机上也应便于一眼识别，不折叠到详情中。可优化其位置、标签和筛选方式，来源及口径说明可展开；不同评级体系分别标明，不合并成自行定义的综合等级。
- 本地文献来源与 GitHub 汇总项目分开维护；是否上传论文原文尚未指定。

## 仓库与维护方式

- GitHub 仓库：`https://github.com/Rocdna/multi-agent-science-papers`。
- Git 远程地址：`https://github.com/Rocdna/multi-agent-science-papers.git`；默认维护分支为 `main`。
- `README.md` 为项目入口，`CONTRIBUTING.md` 记录维护流程，`CHANGELOG.md` 记录主要变化。
- 文献 Markdown 与 HTML 暂时手动同步；HTML 同时包含 `papers` 数据和静态表格，修改时需兼顾两处。
- `notes/TEMPLATE.md` 提供阅读笔记模板；网站已提供阅读状态筛选与笔记弹窗。接入云端前由 `data/reading-status.json` 保存正式状态；D1 接通后该文件作为初始化与静态回退副本。访客只看标签，维护者通过受保护的管理页修改；未标记及没有记录的论文默认未读。
- 运行 `python scripts/prepare_display.py` 清理公开页面的本地 PDF 链接，原始页面备份到已忽略的 `.local/`。
- `.gitignore` 排除本地 PDF、Zotero 数据库和页面备份。
- 用户已将网站部署到 Cloudflare，访问地址为 `https://rocaler.asia`；具体部署配置尚未记录。该地址同时作为 GitHub 仓库的主页链接和 README 在线入口。
- 网站原先没有后端服务。2026-10-21 用户同意为正式阅读状态接入 Cloudflare D1，并确认现有部署类型为 Worker（`multi-agent-science-papers`），不迁移 Pages。代码已准备 Worker 接口与单密码管理页，用户已创建 D1 并确认完成初始化，线上尚待设置密码和发布；接通后 D1 为正式阅读状态来源，本地 JSON 为初始化／静态回退副本。笔记正文、索引仍随仓库部署。阅读位置、字号偏好等仍仅存当前设备、当前浏览器，可能被清除，不承诺长期保存或跨设备同步。
- 网站图标采用用户确认的透明背景橙色猫耳少女头像，在根目录提供 ICO 和 PNG；来源见 `ICON_CREDITS.md`。重新生成展示页时保留 `<head>` 图标声明和页脚说明链接。
- 当前按小项目维护，采用 Bootstrap 5.3.8，不迁移 React/Vue。库文件在 `vendor/bootstrap/`，适配样式在 `assets/responsive.css`；部署时保留这些相对目录。
- 手机和平板的筛选抽屉使用 Bootstrap Offcanvas，与电脑共享同一组控件。外部工具重新生成 HTML 时需保留依赖和筛选交互改动；清理脚本不会自动恢复页面功能。
- 文献分页和笔记交互在 `assets/literature.js`，样式在 `assets/reading.css`。默认电脑 20 篇、平板 12 篇、手机 10 篇；先筛选排序全部数据，再分页。
- 文献列表使用 `assets/catalog.css`（主目录在主题样式之前加载）：电脑固定展示文献、发表、评级／分区、作者代码、阅读、资源六列，类型与方向并入文献单元格；手机依次展示名称、发表与评级、简介、类型／代码及资源。评级区的 CCF、JCR、中科院标签与版本默认可见，SCIE／ESCI 放在发表信息内。三套评级可在筛选面板内独立组合筛选，选项显示符合其他条件的篇数；多学科 JCR 的 Q1 / Q2 同时匹配对应两种分区。简介在 Markdown 汇总、HTML 静态行和 `papers` 数据中同步维护。
- 五个研究方向使用文字与颜色共同标记：知识工程为紫色、假设生成为橙色、计算执行为蓝色、闭环发现为绿色、通用科研为灰蓝色，浅色与深色主题分别适配。此配色用于文献方向标签及选中的方向筛选，与“方法／综述／评测”的文献类型、发表评级分开。
- 研究方向下拉框由 `assets/topic-picker.js` 和 `assets/topic-picker.css` 增强：电脑悬浮选项或用方向键浏览时显示解释气泡，手机直接在选项内显示说明；点击或按 Enter 确认后才筛选。保留原 `#topic` 作为状态来源与脚本未加载时的回退，`assets/literature.js` 在筛选刷新时同步自定义控件；清除条件后的键盘焦点回到可见按钮。支持 Escape、Tab、Home／End、浅深主题与 URL／历史恢复，无新增依赖或进场动效。
- 用户接受“现代文献库列表＋学术出版式笔记”的视觉方向：列表参考 GitHub Primer（https://primer.style/product/components/data-table/），使用白灰底、蓝色操作强调、细分隔线和六列对齐；笔记参考 Distill（https://distill.pub/），采用连续文档、衬线标题、受控正文宽度与段落间距。共用样式在 `assets/library.css`，替代原先墨绿色工作台的 `assets/workbench.css`；主目录和独立笔记页都在主题样式之前加载。保留用户头像图标、Bootstrap、本地字体回退、浅色／深色主题，不引入后端或远程字体。用户要求移除顶部研究方向快捷筛选；方向通过原有下拉框筛选，论文内五色方向标签保留。
- 筛选条件展示为可逐项清除的标签，包含搜索词和文献类型；无结果时仅提供能恢复结果的局部清除入口及全部重置。搜索、筛选、排序、页码和显式页大小写入网址；浏览器历史记录暂存列表滚动位置与展开状态，返回／前进可恢复。笔记弹窗占一个历史记录，返回键关闭，直接访问旧笔记链接也支持；独立笔记的 `return` 参数只接受同目录的 `index.html`，返回时恢复筛选并定位论文。评级说明交互在 `assets/rating-info.js`，仅使用仓库已有记录与来源。
- 按用户要求，网站默认在类别内按年份从旧到新；同年按名称排列，重置筛选时恢复该排序。
- 移除条件标签时区分输入方式：鼠标／触屏点击不强制移动焦点；键盘移除后聚焦相邻条件，最后一项则回到对应且可见的筛选控件，手机抽屉关闭时回到“筛选／排序”按钮。类型标签移除后回到“全部”类型按钮，避免无关操作聚焦搜索框或唤起软键盘。
- `notes/index.json` 用论文稳定 `key` 关联 UTF-8 Markdown 数组，每份笔记有独立 `id`、标题、日期和文件。运行 `python scripts/build_notes.py` 生成 `assets/notes-data.js` 和 `assets/reading-data.js`；脚本兼容旧单笔记对象（默认 id 为 main）。图文和视频支持通过本地 Marked 与 DOMPurify 呈现，笔记内容随公开仓库发布；当前没有网页上传入口。
- 笔记演示内容及示例图片已移除，AutoDFT 不再关联演示笔记。MARS 已有一份用户新增的方法笔记，保留其内容；没有正式笔记的论文不显示笔记入口。
- 笔记弹窗的“独立打开”进入 `note.html?id=论文key&note=笔记id`，是独立文档页。旧的仅含论文 key 的链接仍有效，默认打开最近更新笔记；弹窗和独立页共享 `assets/note-renderer.js` 并支持笔记切换。
- 笔记阅读样式在 `assets/note-reader.css`，由主目录和独立页共同加载，保留在主题样式之前。阅读页合并重复标题，单份笔记隐藏切换控件，“基本信息”默认收起并可从目录展开；目录区分大小章节、标出当前位置，手机可随时打开目录。章节链接使用标题生成的锚点（改章节标题会改变链接）；独立页用 URL hash，弹窗用 hash 中的 `section` 参数。字号可调整，仅尝试保存浏览器偏好，存储不可用时仍正常阅读。
- 卡片用单个“笔记 · 数量”入口；电脑侧栏切换，手机与平板使用顶部选择框。阅读状态属于论文，不受笔记数量影响。
- 2026-10-19 按用户要求，将当前有正式笔记的 MARS，以及 LLEMA、MADE 从未读改为阅读中；状态继续在 `data/reading-status.json` 维护。三种状态用灰色空心圆（未读）、琥珀色半圆（阅读中）、绿色对勾（已读）区分，保留文字，目录与独立笔记页共享样式，适配浅色和深色主题。
- 用户已选择最近更新、笔记全文检索和继续阅读，暂不实现引用复制／导出。最近更新由 `notes/index.json` 的 `updated`、可选 `updateSummary` 和 `data/updates.json` 生成 `assets/updates-data.js`，只展示有明确日期的内容事件，不把论文发表年份当作收录日期；目前已有 MARS 笔记更新一条。
- `assets/discovery.js` 提供最近更新与全文检索入口；`assets/note-tools.js` 共用于安全正文解析、章节 ID、文字高亮和本地阅读位置。检索按段落／列表项／表格匹配关键词，结果按笔记章节合并；网址参数 `noteq` 保存检索词，笔记的 `find` 参数用于高亮，点击结果进入具体章节并保留返回条件。只搜索随站点发布的笔记，不搜索论文 PDF 原文。
- 继续阅读按论文 key／笔记 id 将章节、段内位置、字号和正文版本保存在当前浏览器，最多保留最近 100 份位置；实际滚动或目录导航后记录，不因打开笔记自动覆盖旧位置。用户明确点击后才恢复，支持“从头开始”清除本篇位置；显式章节／检索链接优先，正文更新时仅恢复仍存在的章节，不复用旧段内偏移。浏览器存储禁用、损坏或被清除均不阻碍阅读，不改变正式已读状态。

- 网站主题入口只提供太阳（浅色）和月亮（深色）两个图标按钮；没有手动选择时按系统明暗显示并响应系统变化，手动选择后记住浏览器偏好。主目录与独立笔记页共用 `assets/theme.js` 和 `assets/theme.css`，主题脚本在样式前加载、主题样式最后加载；重新生成页面时保留主题入口及依赖。显示偏好与仓库正式阅读状态分开维护。

- 设计优化也参考 Taste Skill 的 `redesign-existing-projects`（https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md），沿用现有技术栈，优先检查阅读、评级辨识、筛选和键盘操作。用户明确要求功能优先，视觉与动效不得增加阅读障碍或操作等待；保留五色研究方向，不照搬面向营销页的装饰建议。
- 用户反馈新增动画有问题后，已撤掉筛选标签、详情、评级说明和手机目录的自定义进场动效及按压位移，移除 GSAP 与 `assets/motion.js`。保留基础悬停颜色反馈和 Bootstrap 原有弹窗／抽屉过渡，响应减少动态效果。内容与筛选即时更新，不为低收益动效新增依赖。2026-11-03 仅对导图“更多”菜单加入约 160 ms 的展开／收起过渡、箭头旋转和菜单项悬停反馈，仍遵循减少动态效果设置。两页保留键盘跳转入口，跳转不改变筛选及章节历史。

## 最近文献同步

- 2026-11-03：从 Zotero 主分类新增 4 篇——LAMMPS-Agents（Digital Discovery 2026）、Rep-CodeGen（ICML 2025）、GoT-Nano（AAAI 2026 Bridge 立场论文）、MACS（NeurIPS 2025）；汇总 34 篇（方法 26、综述 6、评测 2）。GoT-Nano 按 Bridge 处理，不套用 AAAI 主会 CCF A。
- 2026-10-19：主要 Zotero 分类按 DOI、arXiv ID 或规范化标题比对后新增 ChemGraph；现有汇总 30 篇（方法 23、综述 5、评测 2），计算执行方向方法 6 篇。
- 网站已有论文的稳定 `key` 部分来自历史附件标识，与当前 Zotero 父条目标识不同；同步时不能仅按 key 判断新增，已有 key 保留以维持笔记、阅读状态与链接关联。
- Zotero 正在使用时可能锁定数据库；仅在已忽略的 `.local/` 中复制数据库与可用 WAL 后读取，不改动原库。本次仅增补，不因条目未出现在当前分类中删除网站历史文献。

记录日期：2026-11-03。

## 复现进展与选题（2026-10-22）

- 用户确认 ChemGraph 将部署在较老的曙光集群，使用 Slurm，只有登录节点可访问外网。CPU/GPU 型号、系统和 glibc 版本、共享存储及登录节点控制进程限制尚待核实。API 路线需要联网控制端与计算节点分开；论文版 `run_ase` 在当前进程直接执行计算，尚未实现 Slurm 作业适配，不能直接把整套 API 工作流提交到离线计算节点。已在独立源码仓库添加只读检测作业 `scripts/repro/collect_cluster_info.sbatch`，不安装依赖、不下载模型、不请求 API，待用户在集群提交后提供结果。
- 按用户要求，ChemGraph 实验源码独立放在 `D:/desktop/AI4S/repro/ChemGraph`，与 `paper` 同级。已克隆作者仓库 `https://github.com/argonne-lcf/ChemGraph.git` 的 `v1.0.0`（提交 `e00472d4822310cb44e03c0a9edeeb2f587d7c3b`），创建本地分支 `repro/chemgraph-paper`；统一换行后与 Zenodo 论文源码归档的 179 个文件全部匹配。未安装依赖或运行模型。归档的 Exp12/Exp14 默认调用 `gpt-4o-mini` API，本地执行 GFN2-xTB 计算；本地 LLM 是可选接入方式，不是默认要求。
- ChemGraph 复现来源补充：论文对应源码与评测材料已由作者归档在 `https://zenodo.org/records/17290519`（2025-10-07，记录版本 1.3），包含 `ChemGraph-1.0.0.zip`、`ChemGraph_evaluation_data.zip` 和 `evaluation_plot_data.json`。已下载源码归档到内存并核查其中实验脚本与参考答案，未安装或执行框架。当前主分支文档的“未内置默认数据集”不代表论文数据未公开；严格复现优先使用该归档并按论文锁定依赖、模型与评分方式，不混用当前版本的结构化评分。
- 用户确认已复现 MADE，以及其称为 SciAgent 的项目；后者具体对应 SciAgents、SciAgentGym 或其他项目仍待确认，后续推荐先排除二者，不自动推断或修改正式阅读状态。
- 本次核对发现 SLM-MATRIX 的有效作者仓库为 `https://github.com/AmberGTP5/SLM-MATRIX`，原目录中的 `AmberGTP5/SLMMATRIX` 返回 404。复现可行性须查看代码、依赖、数据和评测入口，不能仅凭“公开代码”标签判断；本次只做静态核查，未安装运行这些论文项目。

## 云端阅读状态（2026-10-21）

- `worker/index.js` 提供公开只读 `/api/reading-status` 与受保护的 `/admin/`、`/api/admin/state`、`PUT /api/admin/reading-status`。使用 D1 绑定 `DB`，保存带版本号的完整状态快照，条件更新保证批量原子提交与冲突检测。`db/initial-reading.sql` 为显式首次导入，不在部署时执行，不覆盖已有状态。
- 用户已确认在 D1 控制台执行完建表与初始导入 SQL（尚未独立远程核验）；用户要求简化，不使用 Zero Trust 或第三方授权；用户截图确认线上仍为仅静态资源的 Worker，不能先添加运行时密钥；正确顺序为先提交／发布带 `worker/index.js` 和 Wrangler 配置的新版本，再设置 `ADMIN_PASSWORD` Secret。无需重建 Worker。
- 管理员使用单个 `ADMIN_PASSWORD` Worker Secret（16～128 字符）登录，不依赖 Zero Trust、绑卡或 OAuth。`jose` 签发并验证 8 小时 HS256 会话，放在 HttpOnly／Secure／SameSite=Strict 的主机 Cookie 中，绑定站点；密码更换即撤销旧会话，退出清除当前浏览器 Cookie。管理页空表单公开，管理数据与保存操作均验证会话；同源检查、请求大小与论文 key 校验保留。Worker 配置带 `LOGIN_LIMITER` 内置限速，每来源地址约 5 次／分钟；无密码或限速绑定时拒绝登录，无开发认证旁路。用户只需设置密码，不再配置 Access 的三个 Secret，步骤见 `docs/CLOUDFLARE_SETUP.md`。
- `assets/cloud-reading.js` 为目录与独立笔记页同步状态，不将正式状态写浏览器存储；无法连接时清楚标明静态副本／最近同步记录，保留阅读能力。管理页支持逐篇和批量修改、保存确认、失败保留、版本冲突提示和 JSON 备份导出。访客仍只读。
- 用户主要通过双击本地 `index.html` 预览；阅读管理入口使用相对路径 `admin/index.html`，资源及返回入口也使用相对路径。`file:` 下直接展示完整 34 篇管理列表，支持查看、搜索筛选和批量试改，无需登录；试改仅在本页内存中，刷新／恢复预览即还原，禁用云端保存并明确说明。`assets/paper-catalog.js` 由构建脚本从公开论文数据生成，配合静态阅读状态供本地预览；不请求云端接口，不假装已保存。本地静态服务未接入接口时给出说明与重试入口。
- 用户明确要求简单：始终只有全站共享的一份正式阅读状态，不引入用户注册、个人状态、按账号隔离或多角色权限。单一管理员密码只用于限制修改，普通读者查看同一份结果。
- 通过 `npm run build` 生成 `dist/` 公开目录和 `worker/catalog.json`；Wrangler 只上传公开目录与 Worker，不上传工作目录、SQL 或本机数据。用户提供的 D1 ID `ed7f8f0e-38a0-452a-9dad-c2cbda28c127` 已填入 `wrangler.jsonc`，数据库名称按 `paper-library` 配置，尚未远程核验；Secret 不写仓库，无生产部署或远程数据库操作。区域建议面向亚洲用户选择亚太位置提示，若已自动创建则可沿用，不将建议记作实际区域。新增依赖 `jose` 与开发工具 Wrangler，不迁移前端框架。
- 2026-10-21 按用户要求将 ACCELMAT、AtomAgents、LLaMP、SciAgents、MADE 设为已读；初始导入及静态回退已包含这些状态。
- 2026-11-03 按用户要求将 MACS、SLEUTH、ChatMat、ChemGraph 设为已读；更新 `data/reading-status.json`、`assets/reading-data.js` 与 `db/initial-reading.sql`。线上 D1 若已初始化，仍需在管理页保存或单独更新云端记录。

## 文献思维导图（2026-10-21）

- 2026-10-21 用户要求暂时搁置思维导图，保留现有工作，暂停功能迭代与库迁移。
- 用户确认使用“自己维护导图，发布到网站供阅读”的方式。2026-11-03 调整为默认只读的“上传文件展示”：`mindmap.html` 支持打开 `.xmind` 或本页导出的 JSON，上传内容仅在当前浏览中显示，刷新恢复公开版，不写入网站或浏览器存储。
- `?edit=1` 的编辑实现仍保留供内部维护，但页面默认不显示入口，也不在帮助中宣传。编辑能力包括节点文字、层级拖动、图片文件／截图粘贴、撤销重做和 JSON 导入／导出。
- 使用本地 Mind Elixir 5.15.1（MIT，`vendor/mind-elixir/`），沿用纯静态与原生 JavaScript，不迁移框架、不依赖运行时 CDN。XMind 读取在 `assets/xmind-import.js`，使用浏览器原生 `DecompressionStream` 解压，不新增运行时依赖；新版读取 `content.json`，旧版读取 `content.xml`。
- 编辑模式的本机草稿存在 IndexedDB `paper-mindmaps` 的 `drafts` 表，键为 `library`；公开页和上传展示都不读草稿。草稿可能被清除，不跨设备同步，导出包含图片的 JSON 作为文件备份。编辑入口不提供管理员认证，访客仅修改自身副本。
- 正式源文件 `mindmaps/library.json` 当前沿用目录 34 篇文献及已有评级；五个方向分别配色。此后独立手工维护，避免自动更新覆盖布局与图片。发布前运行 `python scripts/build_mindmap.py` 生成 `assets/mindmap-data.js`，二者随网站部署。
- 每节点一张 PNG／JPG／WebP（单张最多 8 MB，原图数据随 JSON 保存），多图用子节点；支持点击原图放大。最多 500 节点、40 层，文件上限 32 MB。XMind 导入读取文字层级、http(s) 链接和内嵌图片；联系线、概要、外框、备注暂不显示。维护流程见 `CONTRIBUTING.md`。

## 画布体验迭代（2026-10-21）

- 用户要求先分析 Xmind 功能模式再借鉴，强调少文字说明、大展示区域、顶部紧凑图标导航；复制的文字和图片应可作为独立画布元素，再接入导图。分享链接 `https://app.xmind.cn/qVdWb9LT` 在无登录浏览器中跳转登录页，未访问其编辑内容；以截图与 Xmind 官方自由主题、图片、浮动工具栏指南为依据，分析记录在 `docs/MINDMAP_UX.md`。
- 画布页改为 52 px 顶栏、48 px 工具栏和剩余画布（手机顶栏 48 px）；属性与定位面板浮层按需显示，帮助与发布说明收进菜单。2026-11-03 起默认只读并隐藏编辑入口，公开页只保留查看、导入文件、定位、全屏和主题等展示控件；原有目录与笔记入口不变。
- 编辑模式（现由 `?edit=1` 内部访问）新增独立文字／图片元素：空白双击、粘贴、拖入图片文件，移动与调宽度，拖到主题上或按钮选目标接入；末级主题可移回画布。自由元素是单节点，不支持将含子主题的整棵分支拆出；任意联系线、概要、外框后续另行考虑，不显示空功能按钮。
- 文件格式第 2 版兼容读取第 1 版，`data.canvasItems` 存自由元素及世界坐标，与树共享缩放／平移和 ID 校验。树布局继续由本地 Mind Elixir 处理；统一文档历史覆盖节点、自由元素与转换，最多 40 状态并按约 64 MB 内存预算收缩、至少保留 2 状态。旧本机草稿自动兼容，数据库与公开发布流程不变。
- 当前公开导图仍仅有 34 篇文献文字，没有自动补论文配图；画布支持图片不等于初始内容已配图。发布时导出包含图片与自由元素的 JSON，运行构建脚本，避免只在本机草稿里可见。

## 数据集核查（2026-10-24）

- 用户要求检索当前全部文献的数据集；本次按网站已收录的 30 篇逐项核查，完整入口、数据形式、限制与重点文件版本记录在 `docs/DATASET_AUDIT_2026-10-24.md`。不将代码示例、知识图谱、任务约束和带答案测试集混为一类，不将作者声明公开等同于已下载验证。
- 已实际读取 HoneyComb 的 MaScQA 650 道题及 glass/SOFC 各 500 条、SciAgentGym 的 131 个原始案例及 128 个变体、ACCELMAT 的两份 Excel、LLEMA 的 14 个任务、MARS 第 0 轮表格和 Kosmos 钙钛矿案例表格。MASTER 补充 ZIP 已下载，剔除 macOS 元数据后为 491 个 PDF，尚未整理成程序可直接读取的评测集。
- ChatMat 的 Zenodo 18459314 和开源材料 LLM 综述的 Zenodo 17548056 已核实归档元数据，未解包核验；PeroMAS 的数据说明仍使用 Zenodo 占位 DOI。Perovskite-LLM 与 AutoDFT 虽在论文中提出数据/任务集，本次仍未确认独立下载入口。SLM-MATRIX 的有效仓库为 `https://github.com/AmberGTP5/SLM-MATRIX`，目录未捆绑论文数据，原网站旧链接尚未修改。
- 下载样本、目录快照和核查脚本仅保存在忽略目录 `.local/dataset-audit-20261024/`；未运行模型、修改网站数据或推送远程。用户已复现 MADE；其另称 SciAgent 的已复现项目具体身份仍待确认。
- 用户随后明确要求将数据集中存放在 `D:/desktop/AI4S/data/`，该目录独立于文献网站 Git 仓库，按论文分成 18 组资源。总入口为 `data/README.md`，逐文件来源/版本在 `download-plan.json`，下载结果与 SHA-256 在 `download-manifest.json`，汇总在 `collection-summary.json`。后续同类下载优先沿用此目录。
- 重试后 ChemGraph 论文评测包及开源材料 LLM 综述的 `share.zip` 均已下载解压，前者 MD5 与 Zenodo 一致；综述微调数据实读训练 4,990 条、测试 1,039 条。ChemGraph 当前 HF 的 40 条参考记录另存 `ChemGraph/current-groundtruth/`，不与原论文评测归档混用。SciAgentGym 原题的 81 张不重复输入图齐全；嵌套数据另有 13 个 `tool_images` 引用未在作者仓库中找到，已单列记录。SciAgents 图谱/嵌入、MatSciAgent 的两份 ASE 轨迹也已收集。未安装依赖或运行模型，未推送数据到 GitHub。
