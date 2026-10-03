# 公网部署

## v29.1 当前发布

2026-10-03 已发布 v29.1（1.29.1）。隐藏抽取结果及角色档案增加明确标记，技能分支移到行动按钮上方，并保留尚未执行的选择。124 项回归通过；手机小屏、横屏及桌面布局已验收，公开页面已验证分支保留与隐藏角色标记。本轮未重测大陆网络。

正式网址：[terra-fate-wheel.pages.dev](https://terra-fate-wheel.pages.dev/)；本次部署：[708e6710.terra-fate-wheel.pages.dev](https://708e6710.terra-fate-wheel.pages.dev)，源码提交 `8d3adaa8df18a9e7da1401fe35fa25696c12896f`。发布包：`E:/Desktop/新建文件夹/泰拉命运转盘_Cloudflare_v29.1`。


当前游戏是独立静态网站，无数据库、无后端服务、无构建依赖。部署 `dist` 的全部内容即可运行；图片、字体及背景音乐随包携带。打开 HTML 需要 HTTP/HTTPS 服务，不能直接双击文件。

## 本次发布状态

当前版本：v28（1.28.0），包含手机适配修复，详情见 [Cloudflare 部署说明](cloudflare/README.md)。

此前 v27.1：2026-10-03 已部署至 [Cloudflare Pages 正式站点](https://terra-fate-wheel.pages.dev/)，71 个公开游戏文件通过完整性校验。大陆首页多节点检测中，35 个节点有 24 个返回 HTTP 200、10 个超时、1 个检测系统异常，不能保证所有大陆网络稳定访问。详细记录见 [Cloudflare 部署说明](cloudflare/README.md)。


## 部署包

- `www/`：网站全部文件，网站根目录应包含 `index.html`。
- `static-site.zip`：ZIP 根目录直接包含 `index.html`，可用于支持 ZIP 上传的静态托管。
- `nginx.conf.example`：Nginx 服务配置示例，部署前替换域名和网站目录。此配置为 HTTP，HTTPS 需根据实际域名配置证书。
- `manifest.json`、`SHA256SUMS`：版本、源码提交与文件校验记录，不需上传到网站目录。

将 `www` 或 ZIP 解压内容放入网站根目录；不要将项目的 `.git`、`.openai`、测试报告和部署说明放入公开目录。

## 选定服务器后的操作

1. 检查服务器地区、已有站点、域名解析、Web 服务和可用端口。
2. 将网站上传到独立版本目录，例如 `/srv/terra-fate-wheel/releases/v27.1/www`。
3. 校验上传文件，将 `/srv/terra-fate-wheel/current` 指向本次版本的 `www`。
4. 为实际域名单独设置站点。先通过 `nginx -t`，再加载配置；不覆盖其他站点。
5. 根据域名配置 HTTPS，检查首页、模块脚本、图片和音乐响应。
6. 在电脑和手机浏览器验证建角、转盘、技能操作、存档、音量控制。外网访问与中国大陆网络访问分别记录，验证完成后交付真实网址。

中国大陆服务器用于公开网站时应按服务商要求完成备案；香港等非大陆节点无需大陆 ICP 备案，但面向大陆的访问效果仍需实测。平台参考：[阿里云备案说明](https://help.aliyun.com/en/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)、[腾讯云服务器备案条件](https://cloud.tencent.com/document/api/243/19630)。

## 存档迁移

存档保存在各浏览器的网站本地存储中。更换网址不会自动搬迁旧存档。请先在原网站导出本局档案，再在新网站导入；原有网站和存档可继续保留。

## 重新生成部署包

安装 Python 3 后，在项目根目录运行（目标必须是尚不存在的新文件夹）：

```powershell
python deploy/package.py "E:/Desktop/新建文件夹/泰拉命运转盘_公网部署_下一版"
```

打包脚本只复制 `dist`，校验复制结果和 ZIP 内容；不会上传服务器或修改游戏。

Nginx 配置依据：[官方静态文件部署说明](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)。
