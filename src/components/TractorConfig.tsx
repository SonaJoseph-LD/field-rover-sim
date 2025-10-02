import React from "react";
import { TractorModel, TRACTOR_MODELS } from "@/types/tractor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface TractorConfigProps {
  selectedModel: TractorModel;
  onModelSelect: (model: TractorModel) => void;
  customTurnRadius: number;
  onTurnRadiusChange: (radius: number) => void;
}

export const TractorConfig = ({
  selectedModel,
  onModelSelect,
  customTurnRadius,
  onTurnRadiusChange,
}: TractorConfigProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 6v4l8 4 8-4V6l-8-4zm0 2.5l5.5 2.75L12 10 6.5 7.25 12 4.5z"/>
          </svg>
          Tractor Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Model</Label>
          <div className="grid grid-cols-1 gap-2">
            {TRACTOR_MODELS.map((model) => (
              <Button
                key={model.id}
                variant={selectedModel.id === model.id ? "default" : "outline"}
                className="justify-start h-auto py-3"
                onClick={() => {
                  onModelSelect(model);
                  toast.success(`Selected ${model.name}`);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{model.name}</div>
                  <div className="text-xs opacity-80">
                    {model.size.length}m × {model.size.width}m
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm">Specifications</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Length</div>
              <div className="font-medium">{selectedModel.size.length}m</div>
            </div>
            <div>
              <div className="text-muted-foreground">Width</div>
              <div className="font-medium">{selectedModel.size.width}m</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Speed</div>
              <div className="font-medium">{selectedModel.maxSpeed} km/h</div>
            </div>
            <div>
              <div className="text-muted-foreground">Base Turn Radius</div>
              <div className="font-medium">{selectedModel.turnRadius}m</div>
            </div>
          </div>
        </div>

        {/* Custom Turn Radius */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Custom Turn Radius</Label>
            <span className="text-sm font-semibold text-primary">
              {customTurnRadius.toFixed(1)}m
            </span>
          </div>
          <Slider
            value={[customTurnRadius]}
            onValueChange={(value) => onTurnRadiusChange(value[0])}
            min={3}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Implements */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Available Implements</Label>
          <div className="flex flex-wrap gap-2">
            {selectedModel.implements.map((implement) => (
              <span
                key={implement}
                className="px-3 py-1 bg-success/20 text-success text-xs rounded-full font-medium"
              >
                {implement}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
