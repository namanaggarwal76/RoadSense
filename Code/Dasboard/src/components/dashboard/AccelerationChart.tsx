import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, AlertTriangle } from "lucide-react";

interface AccelerationChartProps {
  rideData: any[] | null;
}

export function AccelerationChart({ rideData }: AccelerationChartProps) {
  if (!rideData) {
    return (
      <Card className="h-80 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a ride to view acceleration data</p>
        </div>
      </Card>
    );
  }

  // Prepare per-axis chart data and mark error points using CSV warnings
  const data = rideData.map((point: any, index: number) => {
    const arr: string[] = Array.isArray(point.warningsArr) ? point.warningsArr : [];
    return {
      index,
      time: new Date(point.timestampNum).toLocaleTimeString(),
      accX: point.accXNum,
      accY: point.accYNum,
      accZ: point.accZNum,
      xError: arr.includes('Harsh Braking') || arr.includes('Sudden Accel'),
      yError: arr.includes('Speedy Turns'),
      zError: false,
    };
  });
  const hardEvents = data.filter(d => d.xError || d.yError || d.zError).length;

  return (
    <Card className="h-80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Acceleration Analysis</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Acc X</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Acc Y</span>
          </div>
          {hardEvents > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{hardEvents} hard events</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* X axis */}
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="index" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Acc X (m/s²)', angle: -90, position: 'insideLeft' }} />
              <Tooltip labelFormatter={(value) => `Time: ${data[value as number]?.time}`} formatter={(value)=> [`${(value as number).toFixed?.(2) ?? value} m/s²`, 'Acc X']} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Line type="monotone" dataKey="accX" stroke="hsl(var(--primary))" strokeWidth={2} dot={(props)=>props?.payload?.xError ? (<circle cx={props.cx} cy={props.cy} r={3} fill="hsl(var(--destructive))" stroke="white" strokeWidth={1} />): null} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Y axis */}
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="index" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Acc Y (m/s²)', angle: -90, position: 'insideLeft' }} />
              <Tooltip labelFormatter={(value) => `Time: ${data[value as number]?.time}`} formatter={(value)=> [`${(value as number).toFixed?.(2) ?? value} m/s²`, 'Acc Y']} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Line type="monotone" dataKey="accY" stroke="hsl(var(--success))" strokeWidth={2} dot={(props)=>props?.payload?.yError ? (<circle cx={props.cx} cy={props.cy} r={3} fill="hsl(var(--warning))" stroke="white" strokeWidth={1} />): null} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Z axis */}
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="index" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Acc Z (m/s²)', angle: -90, position: 'insideLeft' }} />
              <Tooltip labelFormatter={(value) => `Time: ${data[value as number]?.time}`} formatter={(value)=> [`${(value as number).toFixed?.(2) ?? value} m/s²`, 'Acc Z']} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Line type="monotone" dataKey="accZ" stroke="hsl(var(--secondary-foreground))" strokeWidth={2} dot={(props)=>props?.payload?.zError ? (<circle cx={props.cx} cy={props.cy} r={3} fill="hsl(var(--secondary))" stroke="white" strokeWidth={1} />): null} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
        <span>X-axis errors: {data.filter(p => p.xError).length}</span>
        <span>Y-axis errors: {data.filter(p => p.yError).length}</span>
        <span>Z-axis errors: {data.filter(p => p.zError).length}</span>
      </div>
    </Card>
  );
}