import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Gauge, Activity, Clock } from "lucide-react";

interface Warning {
  type: 'speed' | 'acceleration' | 'braking' | 'turn';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  value?: number;
}

interface WarningsListProps {
  rideData: any[] | null;
}

export function WarningsList({ rideData }: WarningsListProps) {
  if (!rideData) {
    return (
      <Card className="h-80 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a ride to view warnings</p>
        </div>
      </Card>
    );
  }

  // Generate warnings exclusively from CSV-provided warnings list
  const warnings: Warning[] = [];
  rideData.forEach((point) => {
    const time = point.timestampNum as number;
    const arr: string[] = Array.isArray(point.warningsArr) ? point.warningsArr : [];
    for (const w of arr) {
      if (w === 'Overspeeding') {
        warnings.push({
          type: 'speed',
          message: `Overspeeding at ${point.speedNum?.toFixed(1)} km/h (limit: ${point.speedLimitNum ?? 'n/a'} km/h)${point.lstm_prediction ? ` • LSTM: ${point.lstm_prediction}` : ''}`,
          timestamp: time,
          severity: point.speedNum && point.speedLimitNum && point.speedNum > point.speedLimitNum + 10 ? 'high' : 'medium',
          value: point.speedNum
        });
      } else if (w === 'Harsh Braking' || w === 'Sudden Accel') {
        const isBraking = w === 'Harsh Braking';
        warnings.push({
          type: isBraking ? 'braking' : 'acceleration',
          message: (isBraking
            ? `Harsh braking: ${Math.abs(point.accXNum).toFixed(2)} m/s²`
            : `Sudden acceleration: ${Math.abs(point.accXNum).toFixed(2)} m/s²`) + (point.lstm_prediction ? ` • LSTM: ${point.lstm_prediction}` : ''),
          timestamp: time,
          severity: Math.abs(point.accXNum) > 4 ? 'high' : 'medium',
          value: Math.abs(point.accXNum)
        });
      } else if (w === 'Speedy Turns') {
        warnings.push({
          type: 'turn',
          message: `Speedy turn: ${Math.abs(point.accYNum).toFixed(2)} m/s²${point.lstm_prediction ? ` • LSTM: ${point.lstm_prediction}` : ''}`,
          timestamp: time,
          severity: Math.abs(point.accYNum) > 3 ? 'high' : 'medium',
          value: Math.abs(point.accYNum)
        });
      }
    }
  });

  // Sort warnings by timestamp
  warnings.sort((a, b) => a.timestamp - b.timestamp);

  const getWarningIcon = (type: Warning['type']) => {
    switch (type) {
      case 'speed': return <Gauge className="w-4 h-4" />;
      case 'acceleration':
      case 'braking': return <Activity className="w-4 h-4" />;
      case 'turn': return <Activity className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: Warning['severity']) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Warnings Timeline</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {warnings.length} total warnings
        </Badge>
      </div>

      <ScrollArea className="h-60">
        {warnings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No warnings for this ride</p>
            <p className="text-xs">Great driving!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className={`p-1 rounded-full ${
                  warning.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                  warning.severity === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-secondary/10 text-secondary-foreground'
                }`}>
                  {getWarningIcon(warning.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {warning.message}
                    </p>
                    <Badge variant={getSeverityColor(warning.severity) as any} className="text-xs shrink-0">
                      {warning.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(warning.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}