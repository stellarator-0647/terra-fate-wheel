# Cloudflare Pages 部署

## v30 当前发布

2026-10-03 已发布 1.30.0。首页新增意见页面，结局新增灵感来源、GitHub 链接与 Star 邀请弹窗。127 项测试通过；线上验证反馈生成、复制、刷新草稿恢复，以及手机结局弹窗关闭与再次打开。

正式网址：[terra-fate-wheel.pages.dev](https://terra-fate-wheel.pages.dev/)；本次部署：[d5db1a97.terra-fate-wheel.pages.dev](https://d5db1a97.terra-fate-wheel.pages.dev)。公开游戏源码提交 `e293dd4d131dd9e060cc30cf9735dc63bad9dffe`，项目地址：[GitHub](https://github.com/stellarator-0647/terra-fate-wheel)。

74 个游戏文件加一个 `_headers` 配置；本轮 5 个新增或修改文件的公开 SHA-256、MIME 与首页缓存检查全部通过。文件请求经已有代理执行，本轮未重测中国大陆网络。反馈提交须由玩家在 GitHub 登录确认；网站无需后台或数据库。

## 发布方法

现有项目使用直接上传，GitHub 上传不会自动触发部署。可用免费静态托管，无需 Functions、数据库或付费服务器。

### 打包

在项目根目录运行，输出目录必须尚不存在：

```sh
python deploy/package.py --cloudflare ../terra-release
```

生成 `www/`、`static-site.zip`、`manifest.json` 和 `SHA256SUMS`。ZIP 根目录直接包含 `index.html`、脚本及素材；不要上传外层说明目录。

### 上传现有 Pages 项目

使用官方 Wrangler 登录并上传：

```sh
npx wrangler login
npx wrangler pages deploy ../terra-release/www --project-name terra-fate-wheel --branch main
```

也可在 Cloudflare 控制台的 Workers & Pages 中打开现有项目，上传 `static-site.zip`。后续开发者应部署到自己的项目；项目名以实际账号为准。

### 发布核对

```sh
python deploy/check_release.py https://your-project.pages.dev ../terra-release/manifest.json ../terra-release/public-check.json
```

检查首页、模块、图片、音乐、转盘、存档及意见链接，并用浏览器验证手机排版。使用代理的文件校验不能证明大陆直连效果。

## 存档与缓存

未带内容哈希的文件使用 `Cache-Control: no-cache`，浏览器使用前校验版本。玩家存档保存在各浏览器的网站本地存储；换网址需先在原站导出，再在新站导入。

## 历史网络检测

v27.1 首次发布时，站长工具大陆首页检测：35 个节点中 24 个 HTTP 200、10 个超时、1 个检测系统异常。这是历史首页检测，不代表当前全部地区完整游戏加载效果。后续版本未重新执行该检测。

官方参考：[直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)、[自定义响应头](https://developers.cloudflare.com/pages/configuration/headers/)。
