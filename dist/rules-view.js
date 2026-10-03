import {nativeIcon} from './interface-icons.js';
export function rulesMarkup(data){return `<div class="player-rules">
<section class="rules-first"><h3>先看本场任务</h3><p>击败敌人、坚守、护送或破坏设施，都可能是胜利条件。以战场上方的任务为准。</p><ul><li>未开启铁人模式时，你退场后存活队友和召唤物会继续战斗，完成任务仍算胜利。</li><li>队友和召唤物自动行动。你只需要操作自己的回合。</li><li>剧情作战未达成目标或全队覆灭，即结束本局；所有模式均适用，不可重试。矢量突破未通过可继续准备；模拟作战不影响旅程。</li></ul></section>
<h3>轮到你时，选一个行动</h3><div class="rules-actions">
<article>${nativeIcon('martial')}<h4>体术</h4><p>不消耗技力，造成100%体术强度的物理伤害。</p></article>
<article>${nativeIcon('arts')}<h4>源石技艺</h4><p>点击A、B或C直接释放，E表示技力。消耗和释放条件写在技能旁；不选目标时自动选择。</p></article>
<article>${nativeIcon('health')}<h4>休整</h4><p>恢复8%最大生命；恢复32技力或技力上限的16%，取较高值。</p></article>
<article>${nativeIcon('defense')}<h4>防御</h4><p>获得12%最大生命的护盾，直接伤害降低40%，持续到下次自身行动。</p></article>
</div><p class="rules-tip">沉默只封锁源石技艺。每次自身行动还会自然恢复12技力或技力上限的6%，取较高值。</p>
<details class="rules-detail"><summary>补给与战后恢复</summary><ul><li>急救：消耗2补给，回复存活友方25%最大生命。</li><li>野战护理：消耗4补给，回复存活友方75%最大生命。</li><li>使用补给占用本次行动，不能复活阵亡单位。</li><li>你退场后队伍获胜，会在战后获救并恢复30%最大生命。</li><li>完成每日训练或矢量突破结算后，生命回满。</li></ul></details>
<details class="rules-detail"><summary>初始属性与分级</summary><p>出生地和种族只补充背景。五项战力分别抽取：</p><dl class="rules-pairs"><dt>生理耐受</dt><dd>生命上限</dd><dt>物理强度</dt><dd>防御</dd><dt>战斗技巧</dt><dd>体术强度</dd><dt>源石技艺强度</dt><dd>源石技艺伤害</dd><dt>源石技艺适应性</dt><dd>技力上限、魔抗</dd></dl><p>感染者：源石技艺强度+15%，生命上限−10%。非感染者：生命上限+10%。分级随成长更新，等级差本身不加减伤害。</p></details>
<details class="rules-detail"><summary>准备日、天赋与矢量突破</summary><p>每天转动成长盘决定训练项目。成长天赋决定五项属性的提升倍率，不影响熟练度和升变强度。</p><p>矢量突破分别抽取对手源石技艺和分级。50%抽到同级，50%抽到较低级；最下位只抽同级。获胜提升五项属性和熟练度。</p><p>王庭之主及以上训练成长变慢，需要同水平实战积累突破。</p><div class="rules-talents">${data.talents.grades.map(g=>`<span><b>${g.grade}</b> ×${g.training_multiplier}</span>`).join('')}</div></details>
<details class="rules-detail"><summary>熟练度：100专精，200升变</summary><p>战斗与源石技艺修行积累熟练度，达到门槛自动生效，无需配置。</p><ul><li>100专精：A/B伤害系数提升15%，基础消耗各降低3技力。</li><li>200升变：A/B系数再提升20%，基础消耗各再降2技力；C解锁或强化，系数提升20%，基础消耗降低4技力。</li><li>异格收益叠加，原有招式保留。资源、轮次等特殊释放条件仍需满足。</li></ul></details>
<details class="rules-detail"><summary>控制、护盾与长时间作战</summary><p>连续硬控最多跳过2次行动机会，随后获得2次机会的硬控保护。敌方持续扣行动条达到2轮时长时，会获得一次受保护的行动机会。</p><p>物理伤害由防御减免，法术伤害由魔抗减免，真实伤害忽略双抗。护盾先承受伤害。</p><p>普通源石技艺护盾上限为50%最大生命，隐藏源石技艺为80%；单次技能治疗上限分别为25%和35%。</p><p>第18轮开始，技能治疗减半并出现逐渐增强的力竭伤害。拖延不能无限维持战斗。</p><details class="rules-calculation"><summary>伤害怎么算</summary><p>实际伤害＝技能伤害×（1−减伤率）。减伤率＝防御÷（防御＋4×本次攻击使用的强度）；法术伤害将防御替换为魔抗。技能的破防、增伤等效果再按描述计算。</p></details></details>
<details class="rules-detail"><summary>开局模式与存档</summary><ul><li>铁人模式：默认关闭；开启后自身阵亡即结束本局，包括矢量突破。复活特性生效、仍有生命时不算阵亡。剧情目标失败无论是否开启铁人模式都结束本局。</li><li>传奇之路：隐藏源石技艺抽取概率提高至30%。</li><li>一人成军：取消剧情队友，保留召唤物和任务设施；初始五项战力更容易抽到高阶。两个需要协同的终局可通过防御或休整独立推进。</li><li>模式在开局选择。进度自动保存在浏览器；导出存档可备份或换设备继续，刷新不会重抽。</li></ul></details>
</div>`;}
