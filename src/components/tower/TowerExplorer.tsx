"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { Tower, Flat, FlatStatus } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";

interface Props {
  towers: Tower[];
  selectedFloor: number | null;
  onFloorSelect: (floor: number) => void;
  onFlatSelect: (flat: Flat) => void;
  totalFloors: number;
}

export default function TowerExplorer({
  towers,
  selectedFloor,
  onFloorSelect,
  onFlatSelect,
  totalFloors,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotY = useRef(0.3);
  const rotX = useRef(0.15);
  const floorMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const flatMeshes = useRef<Map<string, { mesh: THREE.Mesh; flat: Flat }>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredMesh = useRef<THREE.Mesh | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  // Build the 3D building procedurally from data
  const buildScene = useCallback(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear previous
    floorMeshes.current.clear();
    flatMeshes.current.clear();
    while (scene.children.length > 0) scene.remove(scene.children[0]);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x3a5fd4, 0.4);
    fill.position.set(-10, 5, -10);
    scene.add(fill);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060f27,
      roughness: 0.95,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // Grid lines on ground
    const gridHelper = new THREE.GridHelper(50, 25, 0x162868, 0x0f1f50);
    scene.add(gridHelper);

    const FLOOR_HEIGHT = 0.55;
    const FLOOR_GAP = 0.05;
    const towerCount = towers.length;

    towers.forEach((tower, towerIdx) => {
      const offsetX = (towerIdx - (towerCount - 1) / 2) * 8;

      // Building base/podium
      const podiumGeo = new THREE.BoxGeometry(6.5, 0.5, 5.5);
      const podiumMat = new THREE.MeshStandardMaterial({ color: 0x0a1638, roughness: 0.7 });
      const podium = new THREE.Mesh(podiumGeo, podiumMat);
      podium.position.set(offsetX, 0.25, 0);
      scene.add(podium);

      // Tower label sign
      const FLOORS = tower.total_floors;

      for (let floor = 1; floor <= FLOORS; floor++) {
        const y = 0.5 + (floor - 1) * (FLOOR_HEIGHT + FLOOR_GAP) + FLOOR_HEIGHT / 2;
        const isSelected = selectedFloor === floor;

        // Floor slab
        const slabGeo = new THREE.BoxGeometry(6.2, 0.08, 5.2);
        const slabMat = new THREE.MeshStandardMaterial({
          color: 0x0f1f50,
          roughness: 0.6,
          transparent: true,
          opacity: isSelected ? 0.9 : 0.5,
        });
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(offsetX, y + FLOOR_HEIGHT / 2, 0);
        scene.add(slab);

        // Floor plate (clickable)
        const floorGeo = new THREE.BoxGeometry(6.0, FLOOR_HEIGHT - 0.1, 5.0);
        const floorColor = isSelected ? 0x1cc77f : getFloorColor(floor, tower.flats, FLOORS);
        const floorMat = new THREE.MeshStandardMaterial({
          color: floorColor,
          roughness: 0.5,
          metalness: 0.1,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.75,
          emissive: isSelected ? new THREE.Color(0x1cc77f) : new THREE.Color(0x000000),
          emissiveIntensity: isSelected ? 0.3 : 0,
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(offsetX, y, 0);
        floorMesh.userData = { type: "floor", floor, towerId: tower.id, towerIdx };
        scene.add(floorMesh);

        const key = `${tower.id}-${floor}`;
        floorMeshes.current.set(key, floorMesh);

        // Window rows — 2 rows per floor
        const windowMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x3ed99a : 0x3a5fd4,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.8,
          emissive: isSelected ? new THREE.Color(0x3ed99a) : new THREE.Color(0x3a5fd4),
          emissiveIntensity: 0.15,
        });
        for (let wx = -2; wx <= 2; wx += 2) {
          for (let side of [-1, 1]) {
            const wGeo = new THREE.BoxGeometry(0.7, 0.25, 0.05);
            const w = new THREE.Mesh(wGeo, windowMat);
            w.position.set(
              offsetX + wx * 0.85,
              y + 0.05,
              side * 2.52
            );
            scene.add(w);
          }
        }
      }

      // Roof
      const roofGeo = new THREE.BoxGeometry(6.4, 0.3, 5.4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x162868, roughness: 0.6 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      const topY = 0.5 + FLOORS * (FLOOR_HEIGHT + FLOOR_GAP) + 0.15;
      roof.position.set(offsetX, topY, 0);
      scene.add(roof);

      // Rooftop antenna
      const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
      const antMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(offsetX + 2.5, topY + 1.05, 2);
      scene.add(ant);

      // Tower name label plane
      const namePlaneGeo = new THREE.BoxGeometry(5.5, 0.4, 0.08);
      const namePlaneMat = new THREE.MeshStandardMaterial({ color: 0x1e3580, roughness: 0.9 });
      const namePlane = new THREE.Mesh(namePlaneGeo, namePlaneMat);
      namePlane.position.set(offsetX, 0.7, 2.6);
      scene.add(namePlane);
    });

    // Surrounding environment — simple low buildings
    const envPositions = [[-20, 0, -15], [20, 0, -15], [-18, 0, 12], [18, 0, 12]];
    envPositions.forEach(([x, , z]) => {
      const h = 2 + Math.random() * 4;
      const bGeo = new THREE.BoxGeometry(4 + Math.random() * 2, h, 3 + Math.random() * 2);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x060f27, roughness: 0.9 });
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.set(x, h / 2, z);
      scene.add(b);
    });
  }, [towers, selectedFloor]);

  // Initialize Three.js
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020917);
    scene.fog = new THREE.Fog(0x020917, 35, 80);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    camera.position.set(0, 12, 22);
    camera.lookAt(0, 6, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const r = 22;
      camera.position.x = r * Math.sin(rotY.current) * Math.cos(rotX.current);
      camera.position.y = r * Math.sin(rotX.current) + 8;
      camera.position.z = r * Math.cos(rotY.current) * Math.cos(rotX.current);
      camera.lookAt(0, towers.length > 0 ? (towers[0].total_floors * 0.3) : 5, 0);
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild scene when data changes
  useEffect(() => {
    buildScene();
  }, [buildScene]);

  // Mouse / touch drag to rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      rotY.current -= dx * 0.008;
      rotX.current = Math.max(-0.05, Math.min(0.6, rotX.current + dy * 0.005));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setTooltip(null);
      return;
    }

    // Hover detection
    if (!cameraRef.current || !sceneRef.current) return;
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const hits = raycaster.current.intersectObjects(
      Array.from(floorMeshes.current.values())
    );

    if (hits.length > 0) {
      const hit = hits[0];
      const { floor } = hit.object.userData;
      if (hoveredMesh.current !== hit.object) {
        hoveredMesh.current = hit.object as THREE.Mesh;
      }
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: `Floor ${floor}`,
      });
    } else {
      hoveredMesh.current = null;
      setTooltip(null);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const hits = raycaster.current.intersectObjects(
      Array.from(floorMeshes.current.values())
    );

    if (hits.length > 0) {
      const { floor } = hits[0].object.userData;
      onFloorSelect(floor);
    }
  };

  return (
    <div className="relative w-full h-full select-none">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-lg glass border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 16 }}
        >
          {tooltip.label} — click to view flats
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-blue-400 text-xs flex items-center gap-1.5 pointer-events-none">
        <span className="w-4 h-4 border border-blue-600 rounded flex items-center justify-center text-[9px]">↔</span>
        Drag to rotate · Click a floor to explore flats
      </div>

      {/* Floor indicator */}
      {selectedFloor && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm font-medium">Floor {selectedFloor}</span>
        </div>
      )}
    </div>
  );
}

// Determine overall floor color based on flat statuses on that floor
function getFloorColor(floor: number, flats: Flat[], totalFloors: number): number {
  const floorFlats = flats.filter((f) => f.floor === floor);
  if (floorFlats.length === 0) return 0x162868;

  const allSold = floorFlats.every((f) => f.status === "sold");
  const anyAvailable = floorFlats.some((f) => f.status === "available");
  const allReserved = floorFlats.every((f) => f.status === "reserved");

  if (allSold) return 0x3b1515;
  if (allReserved) return 0x3b2010;
  if (anyAvailable) {
    // Top floors glow slightly more
    return floor > totalFloors * 0.7 ? 0x0f3028 : 0x0d2a22;
  }
  return 0x1a2540;
}
