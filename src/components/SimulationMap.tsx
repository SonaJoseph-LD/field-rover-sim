import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TractorPosition } from "@/types/tractor";
import { toast } from "sonner";

interface SimulationMapProps {
  position: TractorPosition;
  onPositionChange: (position: TractorPosition) => void;
  isMoving: boolean;
  currentAction: string;
  path: [number, number][];
  coveredArea: [number, number][];
}

const create3DTractorIcon = (heading: number, currentAction: string, isMoving: boolean) => {
  return L.divIcon({
    className: "tractor-marker-3d",
    html: `
      <div class="relative" style="transform: rotate(${heading}deg); transition: transform 0.3s ease-out;">
        <div class="relative w-20 h-20 flex items-center justify-center">
          <!-- Tractor body with 3D effect -->
          <div class="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-900 rounded-lg shadow-2xl transform-gpu" style="transform: perspective(200px) rotateX(25deg);">
            <!-- Engine compartment -->
            <div class="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg border border-gray-700"></div>
            <!-- Cabin with glass effect -->
            <div class="absolute top-7 left-1/2 -translate-x-1/2 w-10 h-8 bg-gradient-to-br from-blue-900/40 to-blue-950/60 rounded-lg border-2 border-gray-700 backdrop-blur-sm">
              <div class="absolute inset-1 bg-gradient-to-br from-cyan-400/20 to-transparent rounded"></div>
            </div>
          </div>
          
          <!-- Front wheels -->
          <div class="absolute top-2 left-1 w-3 h-3 bg-gradient-to-br from-gray-800 to-black rounded-full border-2 border-gray-900 shadow-lg ${isMoving ? 'animate-spin' : ''}"></div>
          <div class="absolute top-2 right-1 w-3 h-3 bg-gradient-to-br from-gray-800 to-black rounded-full border-2 border-gray-900 shadow-lg ${isMoving ? 'animate-spin' : ''}"></div>
          
          <!-- Rear wheels (larger) -->
          <div class="absolute bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-gray-700 to-black rounded-full border-3 border-gray-900 shadow-2xl ${isMoving ? 'animate-spin' : ''}"></div>
          <div class="absolute bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-gray-700 to-black rounded-full border-3 border-gray-900 shadow-2xl ${isMoving ? 'animate-spin' : ''}"></div>
          
          <!-- Exhaust pipe -->
          <div class="absolute top-0 right-2 w-1.5 h-4 bg-gradient-to-b from-gray-600 to-gray-800 rounded-t-full"></div>
          ${isMoving ? '<div class="absolute -top-2 right-2 w-3 h-3 bg-gray-400/50 rounded-full animate-pulse"></div>' : ''}
          
          <!-- Turn indicators -->
          ${isMoving ? `
            <div class="absolute -left-2 top-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-glow"></div>
            <div class="absolute -right-2 top-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-glow"></div>
          ` : ''}
          
          <!-- Movement trail effect -->
          ${isMoving ? '<div class="absolute inset-0 rounded-lg bg-primary/20 animate-pulse"></div>' : ''}
        </div>
        
        <!-- Action label -->
        <div class="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-card to-card/90 text-card-foreground px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-2xl border-2 border-primary backdrop-blur-sm">
          <div class="flex items-center gap-2">
            ${isMoving ? '<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>' : '<div class="w-2 h-2 bg-gray-400 rounded-full"></div>'}
            <span>${currentAction}</span>
          </div>
        </div>
      </div>
    `,
    iconSize: [80, 80],
    iconAnchor: [40, 40],
  });
};

export const SimulationMap = ({
  position,
  onPositionChange,
  isMoving,
  currentAction,
  path,
  coveredArea,
}: SimulationMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const tractorMarkerRef = useRef<L.Marker | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const coveredAreaRef = useRef<L.Polyline | null>(null);
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
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
    }).addTo(map);

    const tractorIcon = create3DTractorIcon(position.heading, currentAction, isMoving);

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
    map.whenReady(() => {
      setMapReady(true);
      map.invalidateSize();
      toast.success("Map initialized");
    });

    // Add path visualization
    const pathLine = L.polyline([], {
      color: "#10b981",
      weight: 2,
      opacity: 0.7,
      dashArray: "5, 10",
    }).addTo(map);
    pathLineRef.current = pathLine;

    // Add covered area visualization
    const coveredAreaLine = L.polyline([], {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.5,
    }).addTo(map);
    coveredAreaRef.current = coveredAreaLine;

    return () => {
      try { map.remove(); } catch {}
      tractorMarkerRef.current = null;
      pathLineRef.current = null;
      coveredAreaRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Update marker position
  useEffect(() => {
    if (tractorMarkerRef.current && mapReady) {
      tractorMarkerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position, mapReady]);

  // Update path visualization
  useEffect(() => {
    if (pathLineRef.current && mapReady && path.length > 0) {
      pathLineRef.current.setLatLngs(path);
    }
  }, [path, mapReady]);

  // Update covered area visualization
  useEffect(() => {
    if (coveredAreaRef.current && mapReady && coveredArea.length > 0) {
      coveredAreaRef.current.setLatLngs(coveredArea);
    }
  }, [coveredArea, mapReady]);

  // Update marker when action or heading changes
  useEffect(() => {
    if (tractorMarkerRef.current && mapReady) {
      const tractorIcon = create3DTractorIcon(position.heading, currentAction, isMoving);
      tractorMarkerRef.current.setIcon(tractorIcon);
    }
  }, [currentAction, isMoving, position.heading, mapReady]);

  // Center map on tractor
  const centerOnTractor = () => {
    const map = mapRef.current;
    if (map && mapReady) {
      map.invalidateSize();
      map.setView([position.lat, position.lng], 15, { animate: true });
      toast.info("Centered on tractor");
    } else {
      toast.info("Map is still loading. Please try again in a moment.");
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
