import { Row, WARNING_NAMES } from './types';
export function parseCSV(csvText: string): Row[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const header = lines[0].split(',').map(h=>h.trim());
  const out: Row[] = [];
  for (let i=1;i<lines.length;i++) {
    const parts = lines[i].split(',');
    const rec: Record<string, string | undefined> = {};
    header.forEach((h,idx)=> rec[h] = parts[idx]);
    out.push(normalizeRow(rec));
  }
  return out;
}
export function normalizeRow(raw: Record<string, unknown>): Row {
  const warningsStr: string = String(raw.warnings ?? '');
  const warnings = warningsStr.split(/[,;]/).map(w=>w.trim()).filter(Boolean).map(w => {
    const match = WARNING_NAMES.find(c => c.toLowerCase() === w.toLowerCase());
    return match || w;
  });
  const num = (v: unknown)=>{ const n = parseFloat(String(v)); return Number.isFinite(n)?n:0; };
  const maybe = (v: unknown)=>{ const n = parseFloat(String(v)); return Number.isFinite(n)?n:null; };
  return {
    timestamp: String(raw.timestamp ?? ''),
    accel_x: num(raw.accel_x), accel_y: num(raw.accel_y), accel_z: num(raw.accel_z),
    angular_x: num(raw.angular_x), angular_y: num(raw.angular_y), angular_z: num(raw.angular_z),
    latitude: num(raw.latitude), longitude: num(raw.longitude),
    speed: num(raw.speed), speed_limit: maybe(raw.speed_limit),
    lstm_prediction: raw.lstm_prediction as string | undefined,
    warnings
  };
}
export function parseJSONRows(data: unknown[]): Row[] { return (data as Record<string, unknown>[]).map(normalizeRow); }
