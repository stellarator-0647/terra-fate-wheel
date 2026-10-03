export const WHEEL_SPEEDS=[1,2,4];
export const normalizeSpeed=value=>WHEEL_SPEEDS.includes(Number(value))?Number(value):1;
export function wheelSpeed(storage=globalThis.localStorage){return normalizeSpeed(storage?.getItem('terra-wheel-speed'));}
export const wheelDuration=(speed=1,reduced=false)=>(reduced?450:3900)/normalizeSpeed(speed);
export function reducedMotion(storage=globalThis.localStorage){const mode=storage?.getItem('terra-ui-motion');return mode==='reduced'||mode!=='full'&&!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
