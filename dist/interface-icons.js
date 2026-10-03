// Native game artwork selected from PRTS; provenance lives alongside the assets.
export const ICONS={archive:'factions/rhodes',health:'medic',defense:'defender',martial:'guard',arts:'caster',energy:'supporter',training:'vanguard',vector:'specialist',combat:'sniper'};
export function nativeIcon(kind='archive',cls='interface-icon'){
 return `<img class="${cls}" src="assets/prts/${ICONS[kind]||ICONS.archive}.png" alt="" aria-hidden="true">`;
}
export function headingIcon(kicker,title){
 const kind=/生理耐受/.test(title)?'health':/物理强度/.test(title)?'defense':/战斗技巧/.test(title)?'martial':/适应性/.test(title)?'energy':/源石技艺/.test(title)?'arts':/CAMP/.test(kicker)?'training':/VECTOR/.test(kicker)?'vector':/OPERATION/.test(kicker)?'combat':'archive';
 return nativeIcon(kind,'field-heading-mark');
}
