import React, { useState, useEffect } from "react";
import { SimulationMap } from "@/components/SimulationMap";
import { TractorConfig } from "@/components/TractorConfig";
import { ActionPanel } from "@/components/ActionPanel";
import { CoordinateInput } from "@/components/CoordinateInput";
import { Telemetry } from "@/components/Telemetry";
import { TractorModel, TractorPosition, TRACTOR_MODELS, DEFAULT_POSITION } from "@/types/tractor";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<TractorModel>(TRACTOR_MODELS[0]);
  const [position, setPosition] = useState<TractorPosition>(DEFAULT_POSITION);
  const [customTurnRadius, setCustomTurnRadius] = useState(selectedModel.turnRadius);
  const [currentAction, setCurrentAction] = useState("idle");
  const [isMoving, setIsMoving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [fuelLevel, setFuelLevel] = useState(100);
  const [efficiency, setEfficiency] = useState(85);
  const [obstacleDetectionEnabled, setObstacleDetectionEnabled] = useState(true);
  const [obstacleDetected, setObstacleDetected] = useState(false);
  const [controlMode, setControlMode] = useState<"manual" | "automatic">("manual");
  const [path, setPath] = useState<[number, number][]>([[position.lat, position.lng]]);
  const [coveredArea, setCoveredArea] = useState<[number, number][]>([]);
  
  // Activity tracking
  const [activityLog, setActivityLog] = useState<{
    activity: string;
    coordinates: [number, number];
    timestamp: string;
    duration: number;
  }[]>([]);
  const [activityStartTime, setActivityStartTime] = useState<number | null>(null);
  const [currentActivityDuration, setCurrentActivityDuration] = useState(0);
  const [totalHarvestTime, setTotalHarvestTime] = useState(0);
  const [totalSprayTime, setTotalSprayTime] = useState(0);

  // Keyboard controls for manual mode
  useEffect(() => {
    if (controlMode !== "manual") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const moveDistance = 0.00003; // Distance per key press
      const turnAngle = 10; // Degrees per turn

      setPosition((prev) => {
        let newLat = prev.lat;
        let newLng = prev.lng;
        let newHeading = prev.heading;

        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            newLat += moveDistance * Math.cos((prev.heading * Math.PI) / 180);
            newLng += moveDistance * Math.sin((prev.heading * Math.PI) / 180);
            break;
          case "ArrowDown":
            e.preventDefault();
            newLat -= moveDistance * Math.cos((prev.heading * Math.PI) / 180);
            newLng -= moveDistance * Math.sin((prev.heading * Math.PI) / 180);
            break;
          case "ArrowLeft":
            e.preventDefault();
            newHeading = (prev.heading - turnAngle + 360) % 360;
            break;
          case "ArrowRight":
            e.preventDefault();
            newHeading = (prev.heading + turnAngle) % 360;
            break;
          default:
            return prev;
        }

        return { lat: newLat, lng: newLng, heading: newHeading };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controlMode]);

  // Automatic movement with obstacle detection
  useEffect(() => {
    if (!isMoving || controlMode !== "automatic") {
      if (!isMoving) {
        setSpeed(0);
        setObstacleDetected(false);
      }
      return;
    }

    const interval = setInterval(() => {
      // Random obstacle detection (5% chance per update)
      if (obstacleDetectionEnabled && Math.random() < 0.05) {
        setObstacleDetected(true);
        setIsMoving(false);
        setSpeed(0);
        setCurrentAction("Obstacle Detected!");
        toast.error("⚠️ Obstacle detected! Tractor stopped for safety.", {
          duration: 5000,
        });
        return;
      }

      setPosition((prev) => {
        // Simple movement simulation - move forward
        const distance = 0.00001; // Small increment
        const newHeading = (prev.heading + (Math.random() - 0.5) * 3) % 360;
        
        return {
          lat: prev.lat + distance * Math.cos((newHeading * Math.PI) / 180),
          lng: prev.lng + distance * Math.sin((newHeading * Math.PI) / 180),
          heading: newHeading,
        };
      });

      setSpeed(Math.random() * 10 + 15); // Random speed between 15-25 km/h
      setFuelLevel((prev) => Math.max(0, prev - 0.1));
      setEfficiency(Math.random() * 10 + 80); // Random efficiency 80-90%
    }, 1000);

    return () => clearInterval(interval);
  }, [isMoving, obstacleDetectionEnabled, controlMode]);

  // Track path and covered area
  useEffect(() => {
    setPath((prev) => [...prev, [position.lat, position.lng]]);
    if (isMoving || controlMode === "manual") {
      setCoveredArea((prev) => [...prev, [position.lat, position.lng]]);
    }
  }, [position, isMoving, controlMode]);

  // Track activity time and log activities
  useEffect(() => {
    if (currentAction === "harvest" || currentAction === "spray") {
      if (!activityStartTime) {
        setActivityStartTime(Date.now());
      }

      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (activityStartTime || Date.now())) / 1000);
        setCurrentActivityDuration(elapsed);

        // Log activity with coordinates every 5 seconds
        if (elapsed % 5 === 0 && (isMoving || controlMode === "manual")) {
          setActivityLog((prev) => [
            ...prev,
            {
              activity: currentAction,
              coordinates: [position.lat, position.lng],
              timestamp: new Date().toISOString(),
              duration: elapsed,
            },
          ]);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Save duration when stopping activity
      if (activityStartTime) {
        const duration = Math.floor((Date.now() - activityStartTime) / 1000);
        if (currentAction === "harvest") {
          setTotalHarvestTime((prev) => prev + duration);
        } else if (currentAction === "spray") {
          setTotalSprayTime((prev) => prev + duration);
        }
        setActivityStartTime(null);
        setCurrentActivityDuration(0);
      }
    }
  }, [currentAction, activityStartTime, position, isMoving, controlMode]);

  const handleModelSelect = (model: TractorModel) => {
    setSelectedModel(model);
    setCustomTurnRadius(model.turnRadius);
  };

  const handleTurn = (direction: "left" | "right") => {
    const turnAngle = customTurnRadius * 10; // Use turn radius for turn angle
    setPosition((prev) => ({
      ...prev,
      heading: direction === "left" 
        ? (prev.heading - turnAngle + 360) % 360
        : (prev.heading + turnAngle) % 360,
    }));
    toast.success(`Turned ${direction}`);
  };

  const clearPath = () => {
    setPath([[position.lat, position.lng]]);
    setCoveredArea([]);
    setActivityLog([]);
    setTotalHarvestTime(0);
    setTotalSprayTime(0);
    setCurrentActivityDuration(0);
    setActivityStartTime(null);
    toast.info("Path and activity data cleared");
  };

  const exportActivityData = () => {
    const data = {
      summary: {
        totalHarvestTime: `${Math.floor(totalHarvestTime / 60)}m ${totalHarvestTime % 60}s`,
        totalSprayTime: `${Math.floor(totalSprayTime / 60)}m ${totalSprayTime % 60}s`,
        totalActivities: activityLog.length,
      },
      activities: activityLog,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tractor-activity-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Activity data exported!");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-glow">
              <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 6v4l8 4 8-4V6l-8-4zm0 2.5l5.5 2.75L12 10 6.5 7.25 12 4.5zM4 11.5v4l8 4 8-4v-4l-8 4-8-4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">John Deere Precision Ag Simulator</h1>
              <p className="text-muted-foreground">Advanced Field Operations Control Center</p>
            </div>
          </div>
          <Button onClick={() => navigate("/map")} className="gap-2">
            <Box className="w-4 h-4" />
            View 3D Simulation
          </Button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-1 space-y-4">
          <TractorConfig
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            customTurnRadius={customTurnRadius}
            onTurnRadiusChange={setCustomTurnRadius}
          />
          
          <ActionPanel
            currentAction={currentAction}
            onActionChange={(action) => {
              setCurrentAction(action);
              setObstacleDetected(false);
            }}
            isMoving={isMoving}
            onMovementToggle={() => {
              setIsMoving(!isMoving);
              setObstacleDetected(false);
              toast.info(isMoving ? "Movement stopped" : "Movement started");
            }}
            obstacleDetectionEnabled={obstacleDetectionEnabled}
            onObstacleDetectionToggle={() => {
              setObstacleDetectionEnabled(!obstacleDetectionEnabled);
              toast.info(
                !obstacleDetectionEnabled
                  ? "Obstacle detection enabled"
                  : "Obstacle detection disabled"
              );
            }}
            obstacleDetected={obstacleDetected}
            controlMode={controlMode}
            onControlModeChange={(mode) => {
              setControlMode(mode);
              setIsMoving(false);
              toast.info(`Switched to ${mode} control`);
            }}
            onTurn={handleTurn}
            onClearPath={clearPath}
            currentActivityDuration={currentActivityDuration}
            totalHarvestTime={totalHarvestTime}
            totalSprayTime={totalSprayTime}
            onExportData={exportActivityData}
          />
        </div>

        {/* Center - Map */}
        <div className="lg:col-span-2 h-[600px]">
          <SimulationMap
            position={position}
            onPositionChange={setPosition}
            isMoving={isMoving}
            currentAction={currentAction}
            path={path}
            coveredArea={coveredArea}
            activityLog={activityLog}
          />
        </div>

        {/* Right Sidebar - Position & Telemetry */}
        <div className="lg:col-span-1 space-y-4">
          <CoordinateInput
            currentPosition={position}
            onPositionSet={setPosition}
          />
          
          <Telemetry
            position={position}
            speed={speed}
            fuelLevel={fuelLevel}
            efficiency={efficiency}
          />
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>John Deere Operations Center Integration • Precision Agriculture Simulation</p>
      </footer>
    </div>
  );
};

export default Index;
