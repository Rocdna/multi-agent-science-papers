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
- `notes/TEMPLATE.md` 提供阅读笔记模板；阅读标签等尚未集成到展示页。
- 运行 `python scripts/prepare_display.py` 清理公开页面的本地 PDF 链接，原始页面备份到已忽略的 `.local/`。
- `.gitignore` 排除本地 PDF、Zotero 数据库和页面备份。
- 用户已将网站部署到 Cloudflare；具体域名与部署方式尚未记录。
- 网站图标采用用户确认的透明背景橙色猫耳少女头像，在根目录提供 ICO 和 PNG；来源见 `ICON_CREDITS.md`。重新生成展示页时保留 `<head>` 图标声明和页脚说明链接。
- 当前按小项目维护，采用 Bootstrap 5.3.8，不迁移 React/Vue。库文件在 `vendor/bootstrap/`，适配样式在 `assets/responsive.css`；部署时保留这些相对目录。
- 手机和平板的筛选抽屉使用 Bootstrap Offcanvas，与电脑共享同一组控件。外部工具重新生成 HTML 时需保留依赖和筛选交互改动；清理脚本不会自动恢复页面功能。
- 用户当前要求先提交到本地 Git，尚未要求推送本轮图标和适配变更。

记录日期：2026-10-13。
