import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sprout, Droplets, Eye, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface ActionPanelProps {
  currentAction: string;
  onActionChange: (action: string) => void;
  isMoving: boolean;
  onMovementToggle: () => void;
}

export const ActionPanel = ({
  currentAction,
  onActionChange,
  isMoving,
  onMovementToggle,
}: ActionPanelProps) => {
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
        {/* Movement Control */}
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

        {/* Current Action Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Current Operation</div>
          <div className="font-semibold capitalize">{currentAction}</div>
        </div>
      </CardContent>
    </Card>
  );
};
