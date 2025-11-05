import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";

interface AccelChartProps { rideData: any[] | null; }

export function AccelerationYChart({ rideData }: AccelChartProps) {
  if (!rideData) {
    return (
      <Card className="h-80 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a ride to view Acc Y</p>
        </div>
      </Card>
    );
  }
  const data = rideData.map((point: any, index: number) => ({
    index,
    time: new Date(point.timestampNum).toLocaleTimeString(),
    acc: point.accYNum,
    error: Array.isArray(point.warningsArr) && point.warningsArr.includes('Speedy Turns'),
    lstm: point.lstm_prediction,
  }));
  return (
    <Card className="h-80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Acceleration Y</h3>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="index" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Acc Y (m/s²)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              labelFormatter={(value) => `Time: ${data[value as number]?.time}${data[value as number]?.lstm ? ` • LSTM: ${data[value as number]?.lstm}` : ''}`}
              formatter={(value)=> [`${(value as number).toFixed?.(2) ?? value} m/s²`, 'Acc Y']}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Line type="monotone" dataKey="acc" stroke="hsl(var(--success))" strokeWidth={2}
              dot={(props:any)=>props?.payload?.error ? (<circle cx={props.cx} cy={props.cy} r={3} fill="hsl(var(--warning))" stroke="white" strokeWidth={1} />): null} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
