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
- 本地文献来源与 GitHub 汇总项目分开维护；是否上传论文原文尚未指定。

## 仓库与维护方式

- GitHub 仓库：`https://github.com/Rocdna/multi-agent-science-papers`。
- Git 远程地址：`https://github.com/Rocdna/multi-agent-science-papers.git`；默认维护分支为 `main`。
- `README.md` 为项目入口，`CONTRIBUTING.md` 记录维护流程，`CHANGELOG.md` 记录主要变化。
- 文献 Markdown 与 HTML 暂时手动同步；HTML 同时包含 `papers` 数据和静态表格，修改时需兼顾两处。
- `notes/TEMPLATE.md` 提供阅读笔记模板；网站已提供阅读状态筛选与笔记弹窗。正式阅读状态在 `data/reading-status.json`，页面只展示标签，部署后各设备读取同一份记录；按用户要求，原先未标记及没有记录的论文默认“未读”。
- 运行 `python scripts/prepare_display.py` 清理公开页面的本地 PDF 链接，原始页面备份到已忽略的 `.local/`。
- `.gitignore` 排除本地 PDF、Zotero 数据库和页面备份。
- 用户已将网站部署到 Cloudflare，访问地址为 `https://rocaler.asia`；具体部署配置尚未记录。该地址同时作为 GitHub 仓库的主页链接和 README 在线入口。
- 网站图标采用用户确认的透明背景橙色猫耳少女头像，在根目录提供 ICO 和 PNG；来源见 `ICON_CREDITS.md`。重新生成展示页时保留 `<head>` 图标声明和页脚说明链接。
- 当前按小项目维护，采用 Bootstrap 5.3.8，不迁移 React/Vue。库文件在 `vendor/bootstrap/`，适配样式在 `assets/responsive.css`；部署时保留这些相对目录。
- 手机和平板的筛选抽屉使用 Bootstrap Offcanvas，与电脑共享同一组控件。外部工具重新生成 HTML 时需保留依赖和筛选交互改动；清理脚本不会自动恢复页面功能。
- 文献分页和笔记交互在 `assets/literature.js`，样式在 `assets/reading.css`。默认电脑 20 篇、平板 12 篇、手机 10 篇；先筛选排序全部数据，再分页。
- `notes/index.json` 用论文稳定 `key` 关联 UTF-8 Markdown；运行 `python scripts/build_notes.py` 生成 `assets/notes-data.js` 和 `assets/reading-data.js`。图文和视频支持通过本地 Marked 与 DOMPurify 呈现，笔记内容随公开仓库发布；当前没有网页上传入口。
- AutoDFT 当前仅关联一份明确标注的界面演示笔记，不代表真实论文阅读记录。
- 笔记弹窗的“独立打开”进入 `note.html?id=论文key`，是独立文档页，不是新标签页中的弹窗。弹窗和独立页共享 `assets/note-renderer.js`。

记录日期：2026-10-13。
