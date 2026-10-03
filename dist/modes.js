// Mode rewards and enemy panels share these constants across UI and combat.
export const HAZARD_TILT=1.22;
export const HAZARD_GROWTH=1.5;
export const HAZARD_ENEMY={H:1.5,A:1.3,P:1.3,D:1.2,R:1.2,Emax:1.2};
export const hazardGrowth=s=>s.hazard?HAZARD_GROWTH:1;
export function enemyStats(stats,hazard){
 if(!hazard)return stats;
 const next={...stats};
 for(const [key,mult] of Object.entries(HAZARD_ENEMY))next[key]=Math.round(stats[key]*mult*10)/10;
 next.H=Math.round(next.H);next.Emax=Math.round(next.Emax);
 return next;
}
