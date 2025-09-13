import { Row, Settings, WARNING_NAMES, ScoreOutput } from './types';
import { clusterEvents, rowsInWindow } from './cluster';
const clamp = (v:number, lo:number, hi:number)=> Math.max(lo, Math.min(hi,v));
export function computeSafetyScore(rows: Row[], settings: Settings): ScoreOutput {
  const total = rows.length;
  if (!total) return { score:0, stars:0, breakdown:{ counts:{}, raw_negative:0, neg_effect:0, positive_bonus:0, bump_penalty:0, good_ratio:0 }, notes:['no_data'] };
  const counts: Record<string, number> = {}; WARNING_NAMES.forEach(n=>counts[n]=0);
  let goodRows = 0; const overspeedMags: number[] = [];

  // Only use provided warnings (from CSV/materialized data). No threshold-derived flags.
  for (const r of rows) {
    const rowWarn = new Set<string>(r.warnings);
    // Count warnings from input directly
    for (const w of rowWarn) counts[w] = (counts[w] || 0) + 1;
    // Overspeed magnitude only if warning exists and we have speed_limit
    if (rowWarn.has('Overspeeding') && r.speed_limit !== null && r.speed > r.speed_limit) {
      overspeedMags.push((r.speed - r.speed_limit)/Math.max(1, r.speed_limit));
    }
    // Good row: no warnings
    if (r.warnings.length === 0) goodRows++;
  }

  // Maneuver handling around bumps and potholes
  const bumpEventStarts = clusterEvents(rows, ['Bump'], settings.general.cluster_window_seconds);
  const potholeEventStarts = clusterEvents(rows, ['Pothole'], settings.general.cluster_window_seconds);
  let rawBumpPenalty = 0; let bumpHandlingBonus = 0; const UNSAFE_WARNINGS = new Set(['Overspeeding','Harsh Braking','Sudden Accel','Speedy Turns']);
  const unsafeRatioToError = 0.3; // if >=30% of window rows are unsafe, count as bad handling error
  const evalWindow = (startTs: string, labelBad: 'Bad Bump Handling' | 'Bad Pothole Handling') => {
    const windowRows = rowsInWindow(rows, startTs, settings.general.bump_window_seconds);
    let unsafe = 0; for (const wr of windowRows) if (wr.warnings.some(w=>UNSAFE_WARNINGS.has(w))) unsafe++;
    const prop = unsafe / Math.max(1, windowRows.length);
  // Deprecated: no extra bump penalty or handling bonus in final score; we only count explicit bad handling errors.
  // rawBumpPenalty += prop * settings.general.bump_event_weight;
  // if (prop === 0) bumpHandlingBonus += settings.general.bump_handling_bonus_per_event;
    if (prop >= unsafeRatioToError) counts[labelBad] = (counts[labelBad] || 0) + 1;
  };
  for (const ts of bumpEventStarts) evalWindow(ts, 'Bad Bump Handling');
  for (const ts of potholeEventStarts) evalWindow(ts, 'Bad Pothole Handling');

  const weightFor = (warning: string) => (settings.warning_config[warning]?.risk === 'high'
    ? settings.general.high_risk_weight
    : settings.general.low_risk_weight);
  let rawNegative = 0; for (const w in counts) rawNegative += (counts[w]/total) * (weightFor(w));
  if (counts['Overspeeding']>0 && overspeedMags.length) {
    const avg = overspeedMags.reduce((a,b)=>a+b,0)/overspeedMags.length; const base = (counts['Overspeeding']/total)*(weightFor('Overspeeding')); rawNegative += base*(1+avg)-base;
  }
  // Do not add bump-specific penalty/bonus to score
  const negEffect = Math.min(rawNegative, settings.general.negative_max_weight);
  const goodRatio = goodRows/total; let positiveBonus = goodRatio*settings.general.positive_max_weight; positiveBonus = Math.min(positiveBonus, settings.general.positive_max_weight);
  const score = clamp(100 - negEffect + positiveBonus, settings.general.min_score, settings.general.max_score); const stars = Math.round((score/100)*10)/2;
  const notes: string[] = []; const totalEvents = bumpEventStarts.length + potholeEventStarts.length; const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,2);
  if (top[0]) notes.push(`${top[0][0]} is the largest contributor.`);
  if (totalEvents) notes.push(`${totalEvents} bump/pothole events detected.`);
  if (goodRatio>0.5) notes.push('Good driving majority of the time.');
  const overspeedAvg = overspeedMags.length? overspeedMags.reduce((a,b)=>a+b,0)/overspeedMags.length : undefined;
  return { score, stars, breakdown:{ counts, raw_negative: rawNegative, neg_effect: negEffect, positive_bonus: positiveBonus, bump_penalty: 0, good_ratio: goodRatio, overspeed_magnitude_avg: overspeedAvg }, notes };
}
