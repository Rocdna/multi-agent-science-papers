# Cloudflare Workers 云端阅读状态接入

现有 Worker 为 `multi-agent-science-papers`，网站为 `https://rocaler.asia`。采用单个管理员密码登录，不需要 Zero Trust、绑卡或第三方账号授权。笔记和论文信息仍随仓库发布，思维导图暂停迭代。

D1 数据库 ID 已填入 `wrangler.jsonc`：`ed7f8f0e-38a0-452a-9dad-c2cbda28c127`。用户已确认执行完建表和初始导入 SQL，无需重新创建数据库或重导数据。

## 1. 先发布带接口的 Worker 代码

现在线上是仅静态资源的 Worker，控制台会提示“不能将变量添加到只有静态资产的 Worker”。必须先部署带 `main: "worker/index.js"` 的新版本，再添加运行时密码；无需重新创建 Worker。

现有 Worker 已连接 GitHub。先在 Worker **Settings → Build** 中设置下列命令，再提交／推送包含 Worker 代码和 `wrangler.jsonc` 的新版本并部署；重新部署旧的静态版本不能解决此问题：

| 项目 | 值 |
|---|---|
| Root directory | 仓库根目录 |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

`wrangler.jsonc` 已配置 `build.command: npm run build`，部署时会先生成 `dist/`；控制台 Build command 留空也应可用，填相同命令也可以，只是会重复构建一次。

若原命令为 `npx wrangler deploy --assets=.`，改为表中的部署命令，让 Wrangler 使用仓库配置和 `dist/` 公开目录。构建环境依据 `package-lock.json` 安装依赖。保留现有自定义域名和路由。

部署配置会绑定名为 `DB` 的 D1 和名为 `LOGIN_LIMITER` 的内置登录限速器；无需额外创建登录数据库。构建和部署均不执行初始 SQL，也不覆盖云端记录。本地实现不等于线上已接通，当前尚未代替用户执行生产部署。

## 2. 设置一个管理员密码

打开 Cloudflare **Workers 和 Pages → multi-agent-science-papers → Settings → Variables and Secrets → Add**：

| 项目 | 填写内容 |
|---|---|
| 类型 | Secret／密钥 |
| 名称 | `ADMIN_PASSWORD` |
| 值 | 自己生成并保存的 16～128 字符密码，推荐密码管理器生成至少 24 字符随机密码 |

密码直接填在 Cloudflare 控制台，不发到聊天、不写进 GitHub 或网页。不需要设置 `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`、`ADMIN_EMAILS`，此前的 Zero Trust 流程可以跳过。

如果之前已经给管理路径创建 Access 应用，请停用该应用或移除这两个路径的 Access 保护，让新密码页面可以正常显示。仅停用本网站此前配置的管理应用，不影响其他应用。

## 3. 登录并修改状态

双击本地 `index.html` 时，页脚“阅读管理”直接展示完整 34 篇列表，可搜索、筛选和试改状态，不需要登录。试改只在当前页面中，刷新或“恢复预览”后还原，云端保存按钮禁用；可通过网站入口登录保存正式记录。普通静态预览服务缺少接口时显示服务未接通与重试入口。

始终只有全站共用的一份正式阅读状态，没有注册、个人状态或多角色权限；管理员密码仅限制修改，普通读者看到同一份结果。

打开 `https://rocaler.asia/admin/`，输入刚设置的密码。登录后可搜索论文、逐篇修改或勾选多篇批量标记，最后点击“保存修改”。保存成功即写入云端，无需为每次修改重新部署。

普通读者仍可直接阅读。公开列表和独立笔记页使用同一个云端状态；重新打开页面、恢复联网或返回浏览器标签页时重新同步。

可打开 `https://rocaler.asia/api/reading-status` 检查，正常返回 JSON，包含 `source: "cloud"`、`revision` 和 `statuses`。不会返回密码或会话。

## 登录和保存行为

- 密码在 Worker Secret 中，页面不保存密码；登录成功后清空输入框。
- 会话通过 `HttpOnly`、`Secure`、`SameSite=Strict`、仅当前主机的签名 Cookie 保存，有效期 8 小时；签名使用已有 JOSE 库。会话受访问站点限制，不写入 localStorage。
- 退出会清除当前浏览器 Cookie。修改 `ADMIN_PASSWORD` 后，已有会话全部失效；没有忘记密码邮件流程，直接在 Cloudflare 修改 Secret 即可。退出前已复制的会话到过期前仍可能有效，需立即使所有会话失效时更换密码。
- 登录尝试通过 Workers 内置 Rate Limit 按来源地址限制为每分钟约 5 次；这是各 Cloudflare 位置的近似限额，不作为全局精确计数。超过限额返回稍后重试，不增加前端验证码或其他服务配置。
- 登录、退出和保存都验证同源请求，保存接口始终在服务端验证会话。未配置密码或限速绑定时不开放登录。管理页面的空表单可公开访问，论文管理数据和写入操作需要登录。
- 保存失败保留待修改内容；会话失效时可在同页重新登录继续。其他页面先保存时，当前页面提示版本冲突，需重新加载再操作，不静默覆盖。
- 公开接口不可用时，网页明确标注静态副本或最近同步记录，继续提供阅读；不会声称保存成功。

## 备份和新增论文

管理页“导出备份”下载最近读取／保存成功的云端记录，格式兼容 `data/reading-status.json`，不包括待保存修改。更新静态回退副本时，将导出文件替换该 JSON，运行 `python scripts/build_notes.py` 并部署；不会反向覆盖 D1。

新增论文仍走原有仓库流程。`npm run build` 生成服务端目录，云端还没有记录的新论文默认未读，首次保存后记入 D1。D1 用带版本号的 JSON 快照和单条条件更新保证批量原子保存。

## 首次初始化或迁移参考

已有数据库无需重复执行。新环境可在 D1 的 Console 中执行项目 `db/initial-reading.sql` **文件里的 SQL 内容**，不能把文件路径当 SQL 粘贴。脚本为建表加 `INSERT OR IGNORE`，重复运行不重置现有记录，不加入每次部署流程。

检查语句：

```sql
SELECT revision, json_extract(statuses_json, '$.3EUZQ7ES') AS ACCELMAT
FROM reading_state WHERE id = 1;
```

初次应为 `revision = 1`、`ACCELMAT = read`。初始数据包括 30 篇，其中 ACCELMAT、AtomAgents、LLaMP、SciAgents、MADE、MatAgent 已读，MARS、LLEMA 阅读中。

区域可选亚太（`apac`）位置提示；已经按自动区域创建的数据库可沿用。不要为此重新建库。

## 常见问题

| 现象 | 处理 |
|---|---|
| 页面仍跳转 Zero Trust | 移除本网站此前创建的 Access 管理路径保护 |
| 不能将变量添加到只有静态资产的 Worker | 先完成第 1 步，部署带接口的新版本，再添加密码 |
| 提示设置 ADMIN_PASSWORD | 在现有 Worker 添加同名 Secret，满足 16～128 字符要求，再保存部署 |
| 提示登录服务尚未配置 | 使用仓库 `wrangler.jsonc` 部署，确保 `LOGIN_LIMITER` 绑定存在 |
| 密码错误 | 检查大小写和空格；忘记时在 Cloudflare 重设 Secret |
| 尝试次数较多 | 等一分钟再试 |
| 接口返回网页或 404 | 检查是否仍只上传静态资源，部署命令应为 `npx wrangler deploy` |
| 云端状态不可用 | 检查 `DB` 绑定、Database ID、表和初始记录 |
| 保存提示其他页面已更新 | 重新加载云端记录，再修改保存 |

## 本地验证

```powershell
npm ci
npm run build
npm test
npx wrangler d1 execute paper-library --local --file=db/initial-reading.sql
npm run dev
```

本地可在已忽略的 `.dev.vars` 中设置自己的 `ADMIN_PASSWORD`，仍走相同密码验证；没有开发认证旁路。上述 D1 命令只修改本地模拟数据库。公开目录只包含网站资源，排除 SQL、Worker 源码、Secret、依赖和本机草稿。

官方参考：[Workers Secret](https://developers.cloudflare.com/workers/configuration/secrets/)、[Workers 登录限速绑定](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[Workers 静态资源与脚本路由](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)。
