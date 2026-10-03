// Source marks identify the art prototype; a copied art does not change the Doctor's allegiance.
export const FACTIONS={
 rhodes:{name:'罗德岛',file:'rhodes',kind:'faction'},elite:{name:'罗德岛·精英干员',file:'elite',kind:'faction'},
 lgd:{name:'龙门近卫局',file:'lgd',kind:'team'},penguin:{name:'企鹅物流',file:'penguin',kind:'team'},
 rhine:{name:'莱茵生命',file:'rhine',kind:'team'},glasgow:{name:'格拉斯哥帮',file:'glasgow',kind:'team'},
 dublin:{name:'深池',file:'dublin',kind:'faction'},babel:{name:'巴别塔',file:'babel',kind:'faction'},sui:{name:'炎·岁',file:'sui',kind:'faction'}
};
const names={elite:['Ace','Scout','煌','迷迭香','逻各斯','Misery','Mechanist','Outcast','Touch','Pith'],lgd:['陈','星熊','诗怀雅','琳琅诗怀雅'],penguin:['能天使','新约能天使','德克萨斯','缄默德克萨斯','空','可颂'],rhine:['塞雷娅','赫默','伊芙利特','梅尔','白面鸮','麦哲伦','缪尔赛思','淬羽赫默','克丽斯腾'],glasgow:['推进之王','维娜','因陀罗','达格达','摩根'],dublin:['蔓德拉','苇草','焰影苇草'],babel:['特蕾西娅','魔王特蕾西娅'],sui:['年','夕','令','重岳','黍','余','朔']};
// Only explicit confirmed names are used. Similar substrings must not mislabel units.
export function sourceFaction(source=''){const plain=String(source).replace(/·.*$/,'').replace(/^全盛/, '');for(const [id,list]of Object.entries(names))if(list.some(n=>n===plain))return FACTIONS[id];return null;}
const npc={amiya:'rhodes',amiya_sword:'rhodes',amiya_final:'rhodes',dobermann:'rhodes',nearl:'rhodes',frostleaf:'rhodes',meteorite:'rhodes',ace:'elite',blaze:'elite',rosmontis:'elite',logos:'elite',chen:'lgd',hoshi:'lgd',siege:'glasgow',siege_sword:'glasgow',mandragora:'dublin',deep:'dublin',flame:'dublin',theresa:'babel'};
export function unitFaction(unit,source=''){if(unit.owner||unit.facility||unit.relay)return null;if(unit.isPlayer)return FACTIONS.rhodes;return FACTIONS[npc[unit.npcId]]||sourceFaction(source||unit.name);}
// These are the organizations involved in the operation, not an allegiance assigned to every combatant.
export const nodeFactions=id=>({N01:['rhodes'],N02:['rhodes','lgd'],N03:['rhodes'],N04:['lgd','rhodes'],N05:['rhodes'],N06:['rhodes'],N07:['rhodes','dublin'],N08:['rhodes','glasgow'],N09:['rhodes','glasgow'],N10:['rhodes','glasgow'],N11:['rhodes','glasgow'],N12:['rhodes','babel']}[id]||['rhodes']).map(k=>FACTIONS[k]);
export function factionImage(faction,cls='faction-mark'){return faction?`<img class="${cls} ${faction.kind}-mark" src="assets/prts/factions/${faction.file}.png" alt="${faction.name}标志" title="${faction.name}">`:'';}
