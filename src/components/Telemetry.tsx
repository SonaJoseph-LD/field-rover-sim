import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TractorPosition } from "@/types/tractor";
import { Activity, Gauge, Fuel } from "lucide-react";

interface TelemetryProps {
  position: TractorPosition;
  speed: number;
  fuelLevel: number;
  efficiency: number;
}

export const Telemetry = ({
  position,
  speed,
  fuelLevel,
  efficiency,
}: TelemetryProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Telemetry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Speed</span>
            </div>
            <span className="text-sm font-semibold">{speed.toFixed(1)} km/h</span>
          </div>
          <Progress value={(speed / 40) * 100} className="h-2" />
        </div>

        {/* Fuel Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Fuel</span>
            </div>
            <span className="text-sm font-semibold">{fuelLevel.toFixed(0)}%</span>
          </div>
          <Progress 
            value={fuelLevel} 
            className="h-2"
          />
        </div>

        {/* Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Efficiency</span>
            <span className="text-sm font-semibold">{efficiency.toFixed(0)}%</span>
          </div>
          <Progress value={efficiency} className="h-2" />
        </div>

        {/* GPS Data */}
        <div className="p-3 bg-muted rounded-lg space-y-1">
          <div className="text-xs text-muted-foreground">GPS Data</div>
          <div className="font-mono text-xs space-y-0.5">
            <div>Lat: {position.lat.toFixed(6)}</div>
            <div>Lng: {position.lng.toFixed(6)}</div>
            <div>Heading: {position.heading.toFixed(1)}°</div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-success/10 text-success rounded text-center font-medium">
            GPS Active
          </div>
          <div className="p-2 bg-success/10 text-success rounded text-center font-medium">
            Systems OK
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
