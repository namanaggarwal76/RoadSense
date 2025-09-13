import { Row } from './types';
export function clusterEvents(rows: Row[], names: string[], windowSeconds: number): string[] {
  const set = new Set(names.map(n=>n.toLowerCase()));
  const events = rows.filter(r => r.warnings.some(w => set.has(w.toLowerCase()))).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  const out: string[] = []; let last: number|undefined;
  for (const r of events) {
    const t = Date.parse(r.timestamp);
    if (!last || (t-last)/1000 > windowSeconds) { out.push(r.timestamp); last = t; }
  }
  return out;
}
export function rowsInWindow(rows: Row[], startTs: string, windowSeconds: number): Row[] {
  const start = Date.parse(startTs); const end = start + windowSeconds*1000;
  return rows.filter(r => { const t = Date.parse(r.timestamp); return t>=start && t<=end; });
}
