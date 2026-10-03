export const numberText=n=>Number.isFinite(n)?String(Number(n.toFixed(2))):'—';
export const cleanNumbers=s=>String(s).replace(/-?\d+\.\d{3,}/g,n=>numberText(Number(n)));
