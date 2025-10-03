import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sprout, Droplets, Eye, Play, Square, AlertCircle, Download, Timer } from "lucide-react";
import { toast } from "sonner";

interface ActionPanelProps {
  currentAction: string;
  onActionChange: (action: string) => void;
  isMoving: boolean;
  onMovementToggle: () => void;
  obstacleDetectionEnabled: boolean;
  onObstacleDetectionToggle: () => void;
  obstacleDetected: boolean;
  controlMode: "manual" | "automatic";
  onControlModeChange: (mode: "manual" | "automatic") => void;
  onTurn: (direction: "left" | "right") => void;
  onClearPath: () => void;
  currentActivityDuration: number;
  totalHarvestTime: number;
  totalSprayTime: number;
  onExportData: () => void;
}

export const ActionPanel = ({
  currentAction,
  onActionChange,
  isMoving,
  onMovementToggle,
  obstacleDetectionEnabled,
  onObstacleDetectionToggle,
  obstacleDetected,
  controlMode,
  onControlModeChange,
  onTurn,
  onClearPath,
  currentActivityDuration,
  totalHarvestTime,
  totalSprayTime,
  onExportData,
}: ActionPanelProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const actions = [
    { id: "harvest", label: "Harvest", icon: Sprout, color: "success" },
    { id: "spray", label: "Spray", icon: Droplets, color: "warning" },
    { id: "observe", label: "Observe", icon: Eye, color: "primary" },
  ];

  const handleAction = (actionId: string) => {
    onActionChange(actionId);
    toast.success(`Action: ${actionId}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Action Controls
          </span>
          <Badge
            variant={isMoving ? "default" : "outline"}
            className={isMoving ? "bg-success animate-pulse" : ""}
          >
            {isMoving ? "ACTIVE" : "IDLE"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Control Mode</label>
          <div className="flex gap-2">
            <Button
              onClick={() => onControlModeChange("manual")}
              className="flex-1"
              variant={controlMode === "manual" ? "default" : "outline"}
            >
              Manual
            </Button>
            <Button
              onClick={() => onControlModeChange("automatic")}
              className="flex-1"
              variant={controlMode === "automatic" ? "default" : "outline"}
            >
              Automatic
            </Button>
          </div>
        </div>

        {/* Manual Controls */}
        {controlMode === "manual" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual Controls</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-2">
                <Button onClick={() => {}} className="w-full" variant="outline" size="sm" disabled>
                  ↑
                </Button>
              </div>
              <div className="col-start-1">
                <Button onClick={() => onTurn("left")} className="w-full" variant="outline" size="sm">
                  ←
                </Button>
              </div>
              <div className="col-start-3">
                <Button onClick={() => onTurn("right")} className="w-full" variant="outline" size="sm">
                  →
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Use arrow keys: ↑ forward, ↓ backward, ← left, → right
            </p>
          </div>
        )}

        {/* Movement Control (Automatic Mode) */}
        {controlMode === "automatic" && (
          <div className="space-y-2">
            <Button
              onClick={onMovementToggle}
              className="w-full"
              variant={isMoving ? "destructive" : "default"}
              size="lg"
            >
              {isMoving ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Movement
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Movement
                </>
              )}
            </Button>
          </div>
        )}

        {/* Obstacle Detection Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <Label htmlFor="obstacle-detection" className="text-sm font-medium cursor-pointer flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Obstacle Detection
          </Label>
          <Switch
            id="obstacle-detection"
            checked={obstacleDetectionEnabled}
            onCheckedChange={onObstacleDetectionToggle}
          />
        </div>

        {/* Obstacle Warning */}
        {obstacleDetected && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg animate-pulse">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm font-semibold text-destructive">Obstacle Detected!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium mb-3">Field Operations</h4>
          <div className="grid grid-cols-1 gap-2">
            {actions.map(({ id, label, icon: Icon, color }) => (
              <Button
                key={id}
                onClick={() => handleAction(id)}
                variant={currentAction === id ? "default" : "outline"}
                className="justify-start h-12"
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Activity Tracking */}
        {(currentAction === "harvest" || currentAction === "spray") && (
          <div className="p-3 bg-primary/10 border border-primary rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Timer className="w-4 h-4 text-primary animate-pulse" />
              Current Activity Duration
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatTime(currentActivityDuration)}
            </div>
          </div>
        )}

        {/* Activity Summary */}
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Total Time Spent</div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sprout className="w-3 h-3 text-success" />
                <span className="text-xs">Harvest</span>
              </div>
              <span className="text-xs font-mono">{formatTime(totalHarvestTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplets className="w-3 h-3 text-warning" />
                <span className="text-xs">Spray</span>
              </div>
              <span className="text-xs font-mono">{formatTime(totalSprayTime)}</span>
            </div>
          </div>
        </div>

        {/* Path Controls */}
        <div className="space-y-2">
          <Button onClick={onClearPath} className="w-full" variant="outline" size="sm">
            Clear Path
          </Button>
          <Button onClick={onExportData} className="w-full" variant="default" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Activity Data
          </Button>
        </div>

        {/* Current Action Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Current Operation</div>
          <div className="font-semibold capitalize">{currentAction}</div>
        </div>
      </CardContent>
    </Card>
  );
};
