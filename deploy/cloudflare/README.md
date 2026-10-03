# Cloudflare Pages 部署

## v29.1 当前发布

2026-10-03 已发布 v29.1（1.29.1）。隐藏抽取结果及角色档案增加明确标记，技能分支移到行动按钮上方，并保留尚未执行的选择。124 项回归通过；手机小屏、横屏及桌面布局已验收，公开页面已验证分支保留与隐藏角色标记。本轮未重测大陆网络。

正式网址：[terra-fate-wheel.pages.dev](https://terra-fate-wheel.pages.dev/)；本次部署：[708e6710.terra-fate-wheel.pages.dev](https://708e6710.terra-fate-wheel.pages.dev)，源码提交 `8d3adaa8df18a9e7da1401fe35fa25696c12896f`。发布包：`E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_v29.1`。


本游戏可用免费静态托管，无需 Functions、数据库或付费服务器。

## 当前状态

2026-10-03 已发布 v28（1.28.0）手机适配版本，使用 Cloudflare Pages 免费静态托管。72 个游戏文件中，本轮修改 3 个、复用 69 个；已校验 3 个新改文件的公网 SHA-256、响应类型和首页缓存，实际浏览器验证手机战斗、技能资源更新和完整档案。详细验收见项目根目录的 `手机适配验收_v28.md`。

本次部署：[583a9b23.terra-fate-wheel.pages.dev](https://583a9b23.terra-fate-wheel.pages.dev)，源码提交 `1065ecfea18a70173e14944f2a2d76a908e71727`。发布包：`E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_v28`。

以下保留 v27.1 的首次发布记录，其中大陆节点检测是此前的实测结果，本轮未重测：

- 正式网址：[terra-fate-wheel.pages.dev](https://terra-fate-wheel.pages.dev/)
- 本次部署：[51e61ea4.terra-fate-wheel.pages.dev](https://51e61ea4.terra-fate-wheel.pages.dev)
- 生产分支：`main`。
- 游戏源码提交：`06751b7b18f4bfe863ecbce75014b7097a180973`。
- 71 个公开游戏文件全部返回 HTTP 200，SHA-256 与本地发布包一致；JS、CSS、音乐类型正确，首页缓存为 `no-cache`。文件检查经本机已有代理执行，不能作为大陆直连证据。
- 实际浏览器验证：首页、素材、出生地转盘和 BGM 播放正常。
- [站长工具大陆节点检测](https://tool.chinaz.com/speedtest/terra-fate-wheel.pages.dev)：35 个节点中 24 个返回 HTTP 200、10 个超时、1 个检测系统异常。成功节点响应约 1.0～9.1 秒。这是首页 HTTP 检测，不代表所有地区完整游戏及音乐加载顺畅，也不保证长期可达。

本地发布包目录：`E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_v27.1`。其中 `public-check.json` 保存文件验证结果，`mainland-check.json` 保存实际大陆检测行，`deployment-state.json` 保存发布状态。首次检查的 `prts.css` 发生连接中断；复测后文件哈希一致，报告保留了原失败记录。

## 直接上传

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 Workers & Pages。
2. 创建 Pages 应用，选择直接上传。项目名建议 `terra-fate-wheel`；若已占用则由平台分配可用名称。
3. 上传本包的 `static-site.zip`。ZIP 根目录直接包含 `index.html`、脚本和 `assets`，不要上传外层说明文件夹。
4. 发布到生产环境，记录控制台实际显示的 `.pages.dev` 网址。
5. 验证首页、JS 模块、图片、BGM、缓存响应头、转盘和存档；再检查大陆网络实际访问情况。

网站共 71 个游戏文件，最大文件约 7.5 MiB；另加一个 `_headers` 配置。符合直接上传最多 1,000 文件、单文件最大 25 MiB 的限制。`_headers` 由平台读取，网页不会展示此文件。

直接上传项目不能原地切换为 Git 自动部署。后续发布到 GitHub 时，如需自动部署，可另建 Git 集成项目或用 Wrangler/CI 更新本项目。

## 官方工具发布

本次使用 Wrangler 4.147.0。此版本新建 Pages 项目时默认可能委派到 Workers，创建命令中的 `--force` 用于明确创建 Pages 项目。已有项目部署无需这个参数。本项目已经创建，更新时只执行最后一条命令；不要重复创建。

```powershell
npx wrangler pages project list --json
npx wrangler pages project create terra-fate-wheel --production-branch main --force
npx wrangler pages deploy "E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_v27.1/www" --project-name terra-fate-wheel --branch main
```

使用直接上传或命令行方式之一即可，不需要同时创建两个项目。公开网址以平台实际返回的地址为准。

## 更新与存档

未带版本哈希的文件采用 `Cache-Control: no-cache`，允许浏览器缓存但每次使用前进行校验，减少旧脚本残留。更换域名后，玩家需要从原网址导出存档，再在新网址导入。

## 重新打包

在项目根目录运行，使用一个尚不存在的输出目录：

```powershell
python deploy/package.py --cloudflare "E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_下一版"
```

官方参考：[直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)、[自定义响应头](https://developers.cloudflare.com/pages/configuration/headers/)。
