import React, { useEffect, useMemo, useState } from 'react';
import { computeSafetyScore, defaultSettings, Settings, WARNING_NAMES, ScoreOutput, type Row } from '@/lib/safety';
import { subscribeToSafetySettings, setSafetySettings } from '@/services/firebaseApi';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFleet } from '@/contexts/FleetContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export default function SafetyScoreDemo() {
  const { state } = useFleet();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings });
  // Draft copy for staged edits before explicit Save
  const [draft, setDraft] = useState<Settings>({ ...defaultSettings });
  const [output, setOutput] = useState<ScoreOutput | null>(null);

  const rows: Row[] = useMemo(() => {
    const rideData = state.rideData;
    if (!rideData || !rideData.length) return [];
    const DEG2RAD = Math.PI / 180;
    return rideData.map((p) => ({
      timestamp: p.timestamp,
      accel_x: p.accXNum,
      accel_y: p.accYNum,
      accel_z: p.accZNum,
      angular_x: p.gyroXNum * DEG2RAD,
      angular_y: p.gyroYNum * DEG2RAD,
      angular_z: p.gyroZNum * DEG2RAD,
      latitude: p.latitudeNum,
      longitude: p.longitudeNum,
      speed: p.speedNum,
      speed_limit: Number.isFinite(p.speedLimitNum) ? p.speedLimitNum : null,
      warnings: Array.isArray((p as any).warningsArr) ? (p as any).warningsArr as string[] : [],
    }));
  }, [state.rideData]);

  // Subscribe to global settings
  useEffect(() => {
    const unsub = subscribeToSafetySettings((s) => {
      const next = s ?? defaultSettings;
      setSettings(next);
      setDraft(next); // sync draft with remote on load/update
    });
    return () => { unsub && unsub(); };
  }, []);
  // Auto-apply: recompute whenever rows or settings change
  useEffect(() => {
    // Live preview the score using the draft (unsaved) settings
    if (rows.length) setOutput(computeSafetyScore(rows, draft));
    else setOutput(null);
  }, [rows, draft]);
  const saveSettings = async () => {
    await setSafetySettings(draft);
    setSettings(draft);
    toast({ title: 'Settings saved', description: 'Global safety settings have been updated.' });
  };
  const setRisk = (name: string, risk: 'high' | 'low') => {
    const wc = { ...draft.warning_config, [name]: { risk } } as Settings['warning_config'];
    const next = { ...draft, warning_config: wc } as Settings;
    setDraft(next);
  };
  const computeRisk = (name: string): 'high' | 'low' => {
    return draft.warning_config[name]?.risk ?? 'low';
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Safety Score - Advanced Settings</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Card className="p-4 space-y-3 min-w-[280px] flex-1">
          <h2 className="font-semibold">Risk Categories</h2>
          <p className="text-xs text-muted-foreground">Assign each warning as High or Low risk.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WARNING_NAMES.map((name) => {
              const value = computeRisk(name);
              return (
                <div key={name} className="space-y-1">
                  <div className="text-xs text-muted-foreground">{name}</div>
                  <Select
                    value={value}
                    onValueChange={(v: 'high' | 'low') => setRisk(name, v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low risk</SelectItem>
                      <SelectItem value="high">High risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-4 space-y-4 min-w-[260px] flex-1">
          <h2 className="font-semibold">Weights</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>High Risk Weight</span><span className="font-semibold">{draft.general.high_risk_weight}</span></div>
            <Slider value={[draft.general.high_risk_weight]} max={50} step={1} onValueChange={(v) => setDraft({ ...draft, general: { ...draft.general, high_risk_weight: v[0] } } as Settings)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Low Risk Weight</span><span className="font-semibold">{draft.general.low_risk_weight}</span></div>
            <Slider value={[draft.general.low_risk_weight]} max={50} step={1} onValueChange={(v) => setDraft({ ...draft, general: { ...draft.general, low_risk_weight: v[0] } } as Settings)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Positive Weight</span><span className="font-semibold">{draft.general.positive_max_weight}</span></div>
            <Slider value={[draft.general.positive_max_weight]} max={50} step={1} onValueChange={(v) => setDraft({ ...draft, general: { ...draft.general, positive_max_weight: v[0] } } as Settings)} />
          </div>
        </Card>
        <Card className="p-4 space-y-2 min-w-[260px] flex-1">
          <h2 className="font-semibold">Global Settings</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col">Bump Window<input type="number" value={draft.general.bump_window_seconds} onChange={e=>setDraft({ ...draft, general:{...draft.general, bump_window_seconds: parseInt(e.target.value)||0}} as Settings)} className="border rounded px-1" /></label>
            <label className="flex flex-col">Cluster Window<input type="number" value={draft.general.cluster_window_seconds} onChange={e=>setDraft({ ...draft, general:{...draft.general, cluster_window_seconds: parseInt(e.target.value)||0}} as Settings)} className="border rounded px-1" /></label>
            <label className="flex flex-col">Negative Max<input type="number" value={draft.general.negative_max_weight} onChange={e=>setDraft({ ...draft, general:{...draft.general, negative_max_weight: parseInt(e.target.value)||0}} as Settings)} className="border rounded px-1" /></label>
          </div>
        </Card>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={saveSettings}>Save</Button>
        <Button size="sm" variant="outline" onClick={()=>setDraft(settings)}>Reset draft</Button>
        <span className="text-xs text-muted-foreground">Rows: {rows.length}</span>
      </div>
    </div>
  );
}

function renderStars(stars:number) {
  const full = Math.floor(stars); const half = stars - full >= 0.5; const arr:string[] = [];
  for (let i=0;i<full;i++) arr.push('★'); if (half) arr.push('☆'); while (arr.length<5) arr.push('✩');
  return <span className="text-yellow-500">{arr.join(' ')}</span>;
}
