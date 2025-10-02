import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { TractorPosition } from "@/types/tractor";
import { toast } from "sonner";

interface CoordinateInputProps {
  currentPosition: TractorPosition;
  onPositionSet: (position: TractorPosition) => void;
}

export const CoordinateInput = ({
  currentPosition,
  onPositionSet,
}: CoordinateInputProps) => {
  const [lat, setLat] = useState(currentPosition.lat.toString());
  const [lng, setLng] = useState(currentPosition.lng.toString());

  const handleSetPosition = () => {
    const newLat = parseFloat(lat);
    const newLng = parseFloat(lng);

    if (isNaN(newLat) || isNaN(newLng)) {
      toast.error("Invalid coordinates");
      return;
    }

    if (newLat < -90 || newLat > 90 || newLng < -180 || newLng > 180) {
      toast.error("Coordinates out of range");
      return;
    }

    onPositionSet({
      lat: newLat,
      lng: newLng,
      heading: currentPosition.heading,
    });
    toast.success(`Tractor moved to ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Position Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Position Display */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="text-sm text-muted-foreground">Current Position</div>
          <div className="font-mono text-sm">
            <div>Lat: {currentPosition.lat.toFixed(6)}</div>
            <div>Lng: {currentPosition.lng.toFixed(6)}</div>
            <div>Heading: {currentPosition.heading.toFixed(1)}°</div>
          </div>
        </div>

        {/* Coordinate Input */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-90 to 90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="-180 to 180"
            />
          </div>

          <Button onClick={handleSetPosition} className="w-full">
            Set Position
          </Button>
        </div>

        {/* Quick Locations */}
        <div className="space-y-2">
          <Label className="text-sm">Quick Locations</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLat("40.7128");
                setLng("-74.0060");
              }}
            >
              New York Farmland
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLat("41.8781");
                setLng("-87.6298");
              }}
            >
              Illinois Corn Belt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLat("38.5816");
                setLng("-121.4944");
              }}
            >
              California Central Valley
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
