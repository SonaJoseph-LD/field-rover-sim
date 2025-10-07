import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TractorPosition, TractorAction, DEFAULT_POSITION, TRACTOR_MODELS } from "@/types/tractor";
import { ActionPanel } from "@/components/ActionPanel";
import { CoordinateInput } from "@/components/CoordinateInput";
import { TractorConfig } from "@/components/TractorConfig";
import { Telemetry } from "@/components/Telemetry";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Map() {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tractorGroupRef = useRef<THREE.Group | null>(null);
  const pathLineRef = useRef<THREE.Line | null>(null);
  const sprayParticlesRef = useRef<THREE.Points | null>(null);
  const harvestParticlesRef = useRef<THREE.Points | null>(null);

  const [position, setPosition] = useState<TractorPosition>({
    lat: 40.7128,
    lng: -74.006,
    heading: 90, // Moving east along the crop row
  });
  const [selectedModel, setSelectedModel] = useState(TRACTOR_MODELS[0]);
  const [customTurnRadius, setCustomTurnRadius] = useState(selectedModel.turnRadius);
  const [customMaxSpeed, setCustomMaxSpeed] = useState(selectedModel.maxSpeed);
  const [currentAction, setCurrentAction] = useState("idle");
  const [isMoving, setIsMoving] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [fuelLevel, setFuelLevel] = useState(100);
  const [efficiency, setEfficiency] = useState(85);
  const [obstacleDetectionEnabled, setObstacleDetectionEnabled] = useState(true);
  const [obstacleDetected, setObstacleDetected] = useState(false);
  const [controlMode, setControlMode] = useState<"manual" | "automatic">("automatic");
  const [path, setPath] = useState<[number, number][]>([]);
  const [coveredArea, setCoveredArea] = useState<[number, number][]>([]);
  const [activityLog, setActivityLog] = useState<{ activity: string; coordinates: [number, number]; timestamp: string; duration: number }[]>([]);
  const [activityStartTime, setActivityStartTime] = useState<number | null>(null);
  const [currentActivityDuration, setCurrentActivityDuration] = useState(0);
  const [totalHarvestTime, setTotalHarvestTime] = useState(0);
  const [totalSprayTime, setTotalSprayTime] = useState(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Farm field ground with crop rows
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a7c3a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Add crop row pattern
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1];
      const row = Math.floor((x + 100) / 10) % 2;
      vertices[i + 2] = row === 0 ? Math.random() * 0.5 : Math.random() * 0.3;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    scene.add(ground);

    // Add crop rows
    for (let i = -90; i < 90; i += 10) {
      const rowGeometry = new THREE.BoxGeometry(200, 0.8, 4);
      const rowMaterial = new THREE.MeshStandardMaterial({
        color: i % 20 === 0 ? 0xd4a574 : 0x6b9e4a,
      });
      const row = new THREE.Mesh(rowGeometry, rowMaterial);
      row.position.set(0, 0.4, i);
      row.receiveShadow = true;
      row.castShadow = true;
      scene.add(row);
    }

    // Add hay bales
    const hayBaleGeometry = new THREE.CylinderGeometry(2, 2, 3, 16);
    const hayBaleMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    
    const balePositions = [
      [-60, 0, -40],
      [-40, 0, 50],
      [70, 0, -30],
      [50, 0, 60],
    ];
    
    balePositions.forEach(([x, y, z]) => {
      const bale = new THREE.Mesh(hayBaleGeometry, hayBaleMaterial);
      bale.position.set(x, 1.5, z);
      bale.rotation.z = Math.PI / 2;
      bale.castShadow = true;
      bale.receiveShadow = true;
      scene.add(bale);
    });

    // Create 3D tractor
    const tractorGroup = new THREE.Group();
    
    // Tractor body
    const bodyGeometry = new THREE.BoxGeometry(4, 3, 6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5f1e });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    tractorGroup.add(body);

    // Cabin
    const cabinGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      transparent: true,
      opacity: 0.8,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 4, 0);
    cabin.castShadow = true;
    tractorGroup.add(cabin);

    // Engine hood
    const hoodGeometry = new THREE.BoxGeometry(3, 1.5, 2);
    const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(0, 2, 3.5);
    hood.castShadow = true;
    tractorGroup.add(hood);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    const wheelPositions = [
      [-2.2, 1.2, 2],
      [2.2, 1.2, 2],
      [-2.2, 1.5, -2],
      [2.2, 1.5, -2],
    ];
    
    wheelPositions.forEach(([x, y, z], i) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x, y, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.userData.isWheel = true;
      wheel.userData.index = i;
      tractorGroup.add(wheel);
    });

    // Exhaust pipe
    const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(1.5, 4, 3);
    exhaust.castShadow = true;
    tractorGroup.add(exhaust);

    tractorGroup.position.set(0, 0, 0);
    scene.add(tractorGroup);

    // Path line
    const pathGeometry = new THREE.BufferGeometry();
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    tractorGroupRef.current = tractorGroup;
    pathLineRef.current = pathLine;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (isMoving && tractorGroupRef.current) {
        // Rotate wheels
        tractorGroupRef.current.children.forEach((child) => {
          if (child.userData.isWheel) {
            child.rotation.x += 0.1;
          }
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Orbit controls with mouse
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !camera) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      camera.position.x += deltaX * 0.1;
      camera.position.y -= deltaY * 0.1;
      camera.lookAt(tractorGroupRef.current?.position || new THREE.Vector3(0, 0, 0));
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!camera) return;
      const zoomSpeed = 0.1;
      camera.position.z += e.deltaY * zoomSpeed;
      camera.position.z = Math.max(20, Math.min(150, camera.position.z));
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("wheel", handleWheel);

    toast.success("3D Farm simulation initialized");

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update tractor position in 3D
  useEffect(() => {
    if (!tractorGroupRef.current) return;
    
    // Convert lat/lng to 3D coordinates (simplified mapping)
    const x = (position.lng + 74.006) * 10000;
    const z = -(position.lat - 40.7128) * 10000;
    
    tractorGroupRef.current.position.x = x;
    tractorGroupRef.current.position.z = z;
    // Correct rotation: heading 90° (East) should face +X direction (-90° in Three.js)
    tractorGroupRef.current.rotation.y = (Math.PI / 2) - (position.heading * Math.PI / 180);
  }, [position]);

  // Update path visualization
  useEffect(() => {
    if (!pathLineRef.current || path.length === 0) return;
    
    const points = path.map(([lat, lng]) => {
      const x = (lng + 74.006) * 10000;
      const z = -(lat - 40.7128) * 10000;
      return new THREE.Vector3(x, 0.5, z);
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    pathLineRef.current.geometry.dispose();
    pathLineRef.current.geometry = geometry;
  }, [path]);

  // Spray particles effect
  useEffect(() => {
    if (!sceneRef.current || !tractorGroupRef.current) return;
    
    if (currentAction === "spray" && isMoving) {
      if (!sprayParticlesRef.current) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 10;
        }
        
        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0x3b82f6,
          size: 0.3,
          transparent: true,
          opacity: 0.6,
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.position.copy(tractorGroupRef.current.position);
        particles.position.y = 3;
        sceneRef.current.add(particles);
        sprayParticlesRef.current = particles;
      }
    } else if (sprayParticlesRef.current) {
      sceneRef.current.remove(sprayParticlesRef.current);
      sprayParticlesRef.current = null;
    }
  }, [currentAction, isMoving]);

  // Harvest particles effect
  useEffect(() => {
    if (!sceneRef.current || !tractorGroupRef.current) return;
    
    if (currentAction === "harvest" && isMoving) {
      if (!harvestParticlesRef.current) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 8;
        }
        
        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0xfbbf24,
          size: 0.4,
          transparent: true,
          opacity: 0.8,
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.position.copy(tractorGroupRef.current.position);
        particles.position.y = 2;
        sceneRef.current.add(particles);
        harvestParticlesRef.current = particles;
      }
    } else if (harvestParticlesRef.current) {
      sceneRef.current.remove(harvestParticlesRef.current);
      harvestParticlesRef.current = null;
    }
  }, [currentAction, isMoving]);

  // Movement logic (same as 2D version)
  useEffect(() => {
    if (!isMoving || controlMode !== "automatic") return;

    const interval = setInterval(() => {
      setPosition((prev) => {
        const speedInMetersPerSecond = (customMaxSpeed * 1000) / 3600;
        const metersPerStep = speedInMetersPerSecond * 0.1;
        const latChange = (metersPerStep / 111320) * Math.cos((prev.heading * Math.PI) / 180);
        const lngChange = (metersPerStep / (111320 * Math.cos((prev.lat * Math.PI) / 180))) * Math.sin((prev.heading * Math.PI) / 180);

        const newLat = prev.lat + latChange;
        const newLng = prev.lng + lngChange;

        setPath((prevPath) => [...prevPath, [newLat, newLng]]);
        if (currentAction === "harvest" || currentAction === "spray") {
          setCoveredArea((prevArea) => [...prevArea, [newLat, newLng]]);
        }

        return { ...prev, lat: newLat, lng: newLng };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isMoving, customMaxSpeed, currentAction, controlMode]);

  // Activity tracking (same as 2D version)
  useEffect(() => {
    if ((currentAction === "harvest" || currentAction === "spray") && isMoving) {
      if (!activityStartTime) {
        setActivityStartTime(Date.now());
      }

      const durationInterval = setInterval(() => {
        const duration = Date.now() - (activityStartTime || Date.now());
        setCurrentActivityDuration(duration);

        if (duration > 0 && duration % 5000 < 100) {
          setActivityLog((prev) => [
            ...prev,
            {
              activity: currentAction,
              coordinates: [position.lat, position.lng],
              timestamp: new Date().toISOString(),
              duration: Math.floor(duration / 1000),
            },
          ]);
        }
      }, 100);

      return () => clearInterval(durationInterval);
    } else {
      if (activityStartTime) {
        const totalDuration = Date.now() - activityStartTime;
        if (currentAction === "harvest") {
          setTotalHarvestTime((prev) => prev + totalDuration);
        } else if (currentAction === "spray") {
          setTotalSprayTime((prev) => prev + totalDuration);
        }
        setActivityStartTime(null);
        setCurrentActivityDuration(0);
      }
    }
  }, [currentAction, isMoving, activityStartTime, position]);

  // Keyboard controls
  useEffect(() => {
    if (controlMode !== "manual") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const speedInMetersPerSecond = (customMaxSpeed * 1000) / 3600;
      const metersPerStep = speedInMetersPerSecond * 0.05;

      switch (e.key) {
        case "ArrowUp":
          setPosition((prev) => {
            const latChange = (metersPerStep / 111320) * Math.cos((prev.heading * Math.PI) / 180);
            const lngChange = (metersPerStep / (111320 * Math.cos((prev.lat * Math.PI) / 180))) * Math.sin((prev.heading * Math.PI) / 180);
            const newLat = prev.lat + latChange;
            const newLng = prev.lng + lngChange;
            setPath((prevPath) => [...prevPath, [newLat, newLng]]);
            if (currentAction === "harvest" || currentAction === "spray") {
              setCoveredArea((prevArea) => [...prevArea, [newLat, newLng]]);
            }
            return { ...prev, lat: newLat, lng: newLng };
          });
          break;
        case "ArrowDown":
          setPosition((prev) => {
            const latChange = (metersPerStep / 111320) * Math.cos((prev.heading * Math.PI) / 180);
            const lngChange = (metersPerStep / (111320 * Math.cos((prev.lat * Math.PI) / 180))) * Math.sin((prev.heading * Math.PI) / 180);
            const newLat = prev.lat - latChange;
            const newLng = prev.lng - lngChange;
            setPath((prevPath) => [...prevPath, [newLat, newLng]]);
            if (currentAction === "harvest" || currentAction === "spray") {
              setCoveredArea((prevArea) => [...prevArea, [newLat, newLng]]);
            }
            return { ...prev, lat: newLat, lng: newLng };
          });
          break;
        case "ArrowLeft":
          setPosition((prev) => ({ ...prev, heading: (prev.heading - 5 + 360) % 360 }));
          break;
        case "ArrowRight":
          setPosition((prev) => ({ ...prev, heading: (prev.heading + 5) % 360 }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controlMode, customMaxSpeed, currentAction]);

  // Handle control mode change
  useEffect(() => {
    if (controlMode === "manual") {
      setIsMoving(false);
      toast.info("Manual mode: Use arrow keys to control the tractor");
    } else {
      setIsMoving(true);
      toast.info("Automatic mode: Tractor will move automatically");
    }
  }, [controlMode]);

  const handleTurn = (direction: "left" | "right") => {
    const turnAngle = (180 / Math.PI) * Math.atan(selectedModel.size.length / customTurnRadius);
    setPosition((prev) => ({
      ...prev,
      heading: direction === "left" ? (prev.heading - turnAngle + 360) % 360 : (prev.heading + turnAngle) % 360,
    }));
    toast.info(`Turned ${direction}`);
  };

  const exportActivityData = () => {
    const data = {
      summary: {
        totalHarvestTime: Math.floor(totalHarvestTime / 1000),
        totalSprayTime: Math.floor(totalSprayTime / 1000),
        totalActivities: activityLog.length,
      },
      activities: activityLog,
      path: path,
      coveredArea: coveredArea,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tractor-activity-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Activity data exported");
  };

  const handleClearPath = () => {
    setPath([]);
    setCoveredArea([]);
    setActivityLog([]);
    setTotalHarvestTime(0);
    setTotalSprayTime(0);
    setCurrentActivityDuration(0);
    setActivityStartTime(null);
    toast.success("Path and activity data cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to 2D Map
            </Button>
            <h1 className="text-4xl font-bold text-primary">3D Farm Simulation</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div ref={mountRef} className="w-full h-[600px] rounded-lg border-2 border-primary/20 bg-card shadow-xl" />

            <ActionPanel
              currentAction={currentAction}
              onActionChange={setCurrentAction}
              isMoving={isMoving}
              onMovementToggle={() => setIsMoving(!isMoving)}
              obstacleDetectionEnabled={obstacleDetectionEnabled}
              onObstacleDetectionToggle={() => setObstacleDetectionEnabled(!obstacleDetectionEnabled)}
              obstacleDetected={obstacleDetected}
              controlMode={controlMode}
              onControlModeChange={setControlMode}
              onTurn={handleTurn}
              onClearPath={handleClearPath}
              currentActivityDuration={currentActivityDuration}
              totalHarvestTime={totalHarvestTime}
              totalSprayTime={totalSprayTime}
              onExportData={exportActivityData}
            />
          </div>

          <div className="space-y-6">
            <TractorConfig
              selectedModel={selectedModel}
              onModelSelect={(model) => {
                setSelectedModel(model);
                setCustomTurnRadius(model.turnRadius);
                setCustomMaxSpeed(model.maxSpeed);
              }}
              customTurnRadius={customTurnRadius}
              onTurnRadiusChange={setCustomTurnRadius}
              customMaxSpeed={customMaxSpeed}
              onMaxSpeedChange={setCustomMaxSpeed}
            />

            <CoordinateInput currentPosition={position} onPositionSet={setPosition} />

            <Telemetry position={position} speed={speed} fuelLevel={fuelLevel} efficiency={efficiency} />
          </div>
        </div>
      </div>
    </div>
  );
}
