# 泰拉 · 命运转盘

明日方舟同人网页游戏：抽取出身、源石技艺与初始战力，在准备日成长，再以回合制行动参与泰拉剧情作战。

[在线游玩](https://terra-fate-wheel.pages.dev/) · [意见反馈](https://terra-fate-wheel.pages.dev/#feedback) · [GitHub Issues](https://github.com/stellarator-0647/terra-fate-wheel/issues)

当前版本：**1.30.1**。包含182项源石技艺、12个穿越节点与48场剧情作战，支持铁人模式、传奇之路和一人成军。进度保存在浏览器，可导出、导入存档。剧情任务失败直接结束本局；铁人模式默认关闭，开启后自身阵亡即结束本局（含矢量突破），复活特性成功生效不算阵亡。

## 本地运行

安装 Node.js 22 或更高版本，然后运行：

```sh
git clone https://github.com/stellarator-0647/terra-fate-wheel.git
cd terra-fate-wheel
npm run serve
```

打开终端显示的地址，默认是 `http://127.0.0.1:4173`。无需安装 npm 依赖或构建；请通过 HTTP 服务打开，直接双击 HTML 无法正常加载模块。

## 验证

```sh
npm test
```

当前133项回归通过。测试覆盖技能分支、召唤物、结算、成长、概率、存档与意见草稿处理；有限场景模拟和界面验收不等同于全部主线平衡验证。

## 项目结构

```text
dist/                 游戏源码及可直接部署的网站
  assets/             随包提供的图片、图标和音乐，含来源记录
tests/                Node.js 回归测试与固定样例
tools/                本地服务、数值审计和模拟工具
deploy/               静态打包、文件校验与 Cloudflare 部署说明
docs/                 版本历史、设计资料与验收记录
.github/              反馈模板
```

`dist/` 即当前完整游戏源码。原生 JavaScript 模块、CSS与素材可直接编辑，不需要另一个未提供的前端工程。

## 部署

将 `dist/` 中全部文件上传到支持 HTTPS 的静态托管。Cloudflare Pages 免费节点已用于在线版本。

使用 Python 3 打包到一个尚不存在的目录：

```sh
python deploy/package.py --cloudflare ../terra-release
```

部署说明见 [Cloudflare Pages](deploy/cloudflare/README.md)。服务器配置、账户凭据和玩家存档不属于公开源码。

## 反馈与参与

首页“意见反馈”可以生成草稿，随后由玩家在 GitHub 登录并确认发布；不会自动发帖。没有账号时也可复制内容，稍后再提交。

结局会显示来源致谢与 GitHub 链接。如果你喜欢这份渣作，欢迎点一个免费的 Star。

[参与说明](CONTRIBUTING.md) · [本轮验收](docs/validation/开源上传与反馈验收_v30.md) · [版本历史](docs/CHANGELOG.md)

## 致谢

玩法灵感来自于 [咒术回战轮盘网页游戏](https://jsdh.de5.net/games/jujutsu-wheel-normal-v1)。世界观、角色与技能资料参考 [PRTS Wiki](https://prts.wiki/)。

明日方舟图片、音乐等第三方素材归原权利人所有，来源见 [素材说明](ASSET_SOURCES.md)。本项目是同人改编；游戏数值不是官方战力结论。
