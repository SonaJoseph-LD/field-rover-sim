import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TractorPosition } from "@/types/tractor";
import { toast } from "sonner";

interface SimulationMapProps {
  position: TractorPosition;
  onPositionChange: (position: TractorPosition) => void;
  isMoving: boolean;
  currentAction: string;
}

export const SimulationMap = ({
  position,
  onPositionChange,
  isMoving,
  currentAction,
}: SimulationMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const tractorMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      [position.lat, position.lng],
      15
    );

    // Use satellite imagery for field visibility
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create custom tractor icon
    const tractorIcon = L.divIcon({
      className: "tractor-marker",
      html: `
        <div class="relative">
          <div class="w-8 h-12 bg-primary rounded-lg shadow-glow flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
            <svg class="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 6v4l8 4 8-4V6l-8-4zm0 2.5l5.5 2.75L12 10 6.5 7.25 12 4.5zM4 11.5v4l8 4 8-4v-4l-8 4-8-4z"/>
            </svg>
          </div>
          <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md">
            ${currentAction}
          </div>
        </div>
      `,
      iconSize: [32, 48],
      iconAnchor: [16, 24],
    });

    const marker = L.marker([position.lat, position.lng], {
      icon: tractorIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const newPos = marker.getLatLng();
      onPositionChange({
        lat: newPos.lat,
        lng: newPos.lng,
        heading: position.heading,
      });
      toast.success("Tractor repositioned");
    });

    tractorMarkerRef.current = marker;
    mapRef.current = map;
    setMapReady(true);

    toast.success("Map initialized");

    return () => {
      map.remove();
    };
  }, []);

  // Update marker position
  useEffect(() => {
    if (tractorMarkerRef.current && mapReady) {
      tractorMarkerRef.current.setLatLng([position.lat, position.lng]);
      
      // Update icon rotation based on heading
      const icon = tractorMarkerRef.current.getElement();
      if (icon) {
        icon.style.transform = `rotate(${position.heading}deg)`;
      }
    }
  }, [position, mapReady]);

  // Update marker when action changes
  useEffect(() => {
    if (tractorMarkerRef.current && mapReady) {
      const tractorIcon = L.divIcon({
        className: "tractor-marker",
        html: `
          <div class="relative">
            <div class="w-8 h-12 bg-primary rounded-lg shadow-glow flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 ${
              isMoving ? "animate-pulse" : ""
            }">
              <svg class="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 6v4l8 4 8-4V6l-8-4zm0 2.5l5.5 2.75L12 10 6.5 7.25 12 4.5zM4 11.5v4l8 4 8-4v-4l-8 4-8-4z"/>
              </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md border border-border">
              ${currentAction}
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24],
      });
      tractorMarkerRef.current.setIcon(tractorIcon);
    }
  }, [currentAction, isMoving, mapReady]);

  // Center map on tractor
  const centerOnTractor = () => {
    if (mapRef.current) {
      mapRef.current.setView([position.lat, position.lng], 15);
      toast.info("Centered on tractor");
    }
  };

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border-2 border-primary/20">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      <button
        onClick={centerOnTractor}
        className="absolute bottom-4 right-4 bg-card text-card-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors z-[1000] border border-border"
      >
        Center on Tractor
      </button>
    </div>
  );
};
