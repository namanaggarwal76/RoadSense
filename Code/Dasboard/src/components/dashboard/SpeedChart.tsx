import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { Gauge, AlertTriangle } from "lucide-react";

interface SpeedChartProps {
  rideData: any[] | null;
}

export function SpeedChart({ rideData }: SpeedChartProps) {
  if (!rideData) {
    return (
      <Card className="h-80 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Gauge className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a ride to view speed data</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = rideData.map((point, index) => ({
    index,
    time: new Date(point.timestampNum).toLocaleTimeString(),
    speed: point.speedNum,
    speedLimit: point.speedLimitNum,
    isViolation: Array.isArray(point.warningsArr) ? point.warningsArr.includes('Overspeeding') : point.isSpeedViolation,
    lstm: point.lstm_prediction,
  }));

  const violations = chartData.filter(point => point.isViolation).length;
  const maxSpeed = Math.max(...chartData.map(point => point.speed));

  return (
    <Card className="h-80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Speed vs Time</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Speed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>Speed Limit</span>
          </div>
          {violations > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{violations} violations</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="index" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(value) => `Time: ${chartData[value as number]?.time}${chartData[value as number]?.lstm ? ` • LSTM: ${chartData[value as number]?.lstm}` : ''}`}
              formatter={(value, name) => [
                `${value} km/h`, 
                name === 'speed' ? 'Current Speed' : 'Speed Limit'
              ]}
            />
            
            {/* Speed limit as area */}
            <Area
              type="monotone"
              dataKey="speedLimit"
              stroke="hsl(var(--warning))"
              fill="hsl(var(--warning) / 0.1)"
              strokeWidth={2}
            />
            
            {/* Actual speed line */}
            <Line
              type="monotone"
              dataKey="speed"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return payload?.isViolation ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="hsl(var(--destructive))"
                    stroke="white"
                    strokeWidth={2}
                  />
                ) : null;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
        <span>Max Speed: {maxSpeed.toFixed(1)} km/h</span>
        <span>Duration: {Math.floor(rideData.length / 60)}m {rideData.length % 60}s</span>
      </div>
    </Card>
  );
}