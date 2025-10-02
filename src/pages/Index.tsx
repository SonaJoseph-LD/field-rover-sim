import { useState, useEffect } from "react";
import { SimulationMap } from "@/components/SimulationMap";
import { TractorConfig } from "@/components/TractorConfig";
import { ActionPanel } from "@/components/ActionPanel";
import { CoordinateInput } from "@/components/CoordinateInput";
import { Telemetry } from "@/components/Telemetry";
import { TractorModel, TractorPosition, TRACTOR_MODELS, DEFAULT_POSITION } from "@/types/tractor";
import { toast } from "sonner";

const Index = () => {
  const [selectedModel, setSelectedModel] = useState<TractorModel>(TRACTOR_MODELS[0]);
  const [position, setPosition] = useState<TractorPosition>(DEFAULT_POSITION);
  const [customTurnRadius, setCustomTurnRadius] = useState(selectedModel.turnRadius);
  const [currentAction, setCurrentAction] = useState("idle");
  const [isMoving, setIsMoving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [fuelLevel, setFuelLevel] = useState(100);
  const [efficiency, setEfficiency] = useState(85);

  // Simulate movement
  useEffect(() => {
    if (!isMoving) {
      setSpeed(0);
      return;
    }

    const interval = setInterval(() => {
      setPosition((prev) => {
        // Simple movement simulation - move north
        const distance = 0.00001; // Small increment
        const newHeading = (prev.heading + (Math.random() - 0.5) * 5) % 360;
        
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
  }, [isMoving]);

  const handleModelSelect = (model: TractorModel) => {
    setSelectedModel(model);
    setCustomTurnRadius(model.turnRadius);
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
            onActionChange={setCurrentAction}
            isMoving={isMoving}
            onMovementToggle={() => {
              setIsMoving(!isMoving);
              toast.info(isMoving ? "Movement stopped" : "Movement started");
            }}
          />
        </div>

        {/* Center - Map */}
        <div className="lg:col-span-2 h-[600px]">
          <SimulationMap
            position={position}
            onPositionChange={setPosition}
            isMoving={isMoving}
            currentAction={currentAction}
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
