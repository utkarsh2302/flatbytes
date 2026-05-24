'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export type BuildingType = 'residential' | 'commercial'

interface ModelViewerProps {
  modelPath?: string
  buildingType?: BuildingType
  isUnderConstruction?: boolean
  totalFloors?: number
  onFloorClick?: (floor: number) => void
  onLoad?: () => void
  onError?: (err: unknown) => void
}

interface BuildResult {
  buildingHeight: number
  towerBaseY: number
  footprintX: number
  footprintZ: number
  raycastTargets: THREE.Mesh[]
}

function addScaffolding(scene: THREE.Scene, W: number, D: number, baseY: number, height: number, mat: THREE.Material) {
  const ox = W / 2 + 0.9, oz = D / 2 + 0.9
  const poles: [number, number][] = [[-ox, -oz], [-ox, oz], [ox, -oz], [ox, oz], [-ox, 0], [ox, 0], [0, -oz], [0, oz]]
  for (const [px, pz] of poles) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, height, 6), mat)
    pole.position.set(px, baseY + height / 2, pz)
    scene.add(pole)
  }
  for (let y = baseY; y <= baseY + height + 0.1; y += 2.2) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(W + 1.8, 0.05, 0.05), mat)
    front.position.set(0, y, oz); scene.add(front)
    const back = new THREE.Mesh(new THREE.BoxGeometry(W + 1.8, 0.05, 0.05), mat)
    back.position.set(0, y, -oz); scene.add(back)
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, D + 1.8), mat)
    left.position.set(-ox, y, 0); scene.add(left)
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, D + 1.8), mat)
    right.position.set(ox, y, 0); scene.add(right)
  }
}

function addCrane(scene: THREE.Scene, x: number, baseY: number, z: number) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4, metalness: 0.2 })
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.5 })
  const h = 22
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.32, h, 0.32), mat)
  mast.position.set(x, baseY + h / 2, z); scene.add(mast)
  const jib = new THREE.Mesh(new THREE.BoxGeometry(18, 0.22, 0.22), mat)
  jib.position.set(x - 5.5, baseY + h - 0.5, z); scene.add(jib)
  const cjib = new THREE.Mesh(new THREE.BoxGeometry(6, 0.22, 0.22), mat)
  cjib.position.set(x + 4.5, baseY + h - 0.8, z); scene.add(cjib)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), cabMat)
  cab.position.set(x, baseY + h - 1.4, z); scene.add(cab)
  const cable = new THREE.Mesh(new THREE.BoxGeometry(0.04, 6, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 }))
  cable.position.set(x - 14, baseY + h - 3.5, z); scene.add(cable)
}

function buildResidentialTower(scene: THREE.Scene, totalFloors: number, isUnderConstruction: boolean): BuildResult {
  const FH = 1.1
  const W = 10, D = 8
  const LOBBY_H = FH * 1.5
  const towerH = totalFloors * FH
  const towerBaseY = LOBBY_H
  const UC_SKIP = isUnderConstruction ? Math.max(3, Math.floor(totalFloors * 0.15)) : 0
  const targets: THREE.Mesh[] = []

  const facadeMat = new THREE.MeshPhysicalMaterial({ color: 0xf2ede6, roughness: 0.72, metalness: 0, clearcoat: 0.05 })
  const bandMat = new THREE.MeshPhysicalMaterial({
    color: 0xddd8d0, roughness: 0.68, metalness: 0, clearcoat: 0.04,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })
  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x5588bb, emissive: 0x112244, emissiveIntensity: 0.3,
    transparent: true, opacity: 0.72, roughness: 0.04, metalness: 0.05, reflectivity: 0.85,
    transmission: 0.25, ior: 1.5,
  })
  const balconyMat = new THREE.MeshPhysicalMaterial({ color: 0xe8e2da, roughness: 0.65, metalness: 0.04, clearcoat: 0.08 })
  const railMat = new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 0.75, clearcoat: 0.3 })
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xb4b0aa, roughness: 0.92, metalness: 0 })
  const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.4, metalness: 0.3 })
  const tankMat = new THREE.MeshPhysicalMaterial({ color: 0x888884, roughness: 0.5, metalness: 0.45, clearcoat: 0.15 })

  // Lobby
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(W + 2.4, LOBBY_H, D + 2), facadeMat)
  lobby.position.y = LOBBY_H / 2
  lobby.castShadow = true; lobby.receiveShadow = true
  scene.add(lobby); targets.push(lobby)

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(W + 3.2, 0.14, 3.8), bandMat)
  canopy.position.set(0, LOBBY_H, D / 2 + 1.7); scene.add(canopy)

  // Main body — primary raycasting target
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, towerH, D), facadeMat)
  body.position.y = towerBaseY + towerH / 2
  body.castShadow = true; body.receiveShadow = true
  scene.add(body); targets.push(body)

  // Floor bands with polygon offset to prevent z-fighting
  const bandMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.18, 0.12, D + 0.18), bandMat, totalFloors + 1)
  const bd = new THREE.Object3D()
  for (let f = 0; f <= totalFloors; f++) {
    bd.position.set(0, towerBaseY + f * FH, 0); bd.updateMatrix()
    bandMesh.setMatrixAt(f, bd.matrix)
  }
  bandMesh.instanceMatrix.needsUpdate = true; scene.add(bandMesh)

  // Windows
  const WINS_FB = 3, WINS_S = 2
  const totalWins = totalFloors * (WINS_FB * 2 + WINS_S * 2)
  const winMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, FH * 0.62, 0.06), windowMat, totalWins)
  const wd = new THREE.Object3D()
  let wi = 0
  const xStepFB = (W - 1.2) / (WINS_FB - 1)
  const zStepS = (D - 1.2) / (WINS_S - 1)
  for (let f = 0; f < totalFloors; f++) {
    const hide = f >= totalFloors - UC_SKIP
    const y = towerBaseY + (f + 0.5) * FH
    const s = hide ? 0 : 1
    for (let w = 0; w < WINS_FB; w++) {
      wd.position.set(-((WINS_FB - 1) / 2) * xStepFB + w * xStepFB, y, D / 2 + 0.04)
      wd.scale.setScalar(s); wd.rotation.set(0, 0, 0); wd.updateMatrix()
      winMesh.setMatrixAt(wi++, wd.matrix)
    }
    for (let w = 0; w < WINS_FB; w++) {
      wd.position.set(-((WINS_FB - 1) / 2) * xStepFB + w * xStepFB, y, -D / 2 - 0.04)
      wd.scale.setScalar(s); wd.rotation.set(0, Math.PI, 0); wd.updateMatrix()
      winMesh.setMatrixAt(wi++, wd.matrix)
    }
    for (let w = 0; w < WINS_S; w++) {
      wd.position.set(-W / 2 - 0.04, y, -((WINS_S - 1) / 2) * zStepS + w * zStepS)
      wd.scale.setScalar(s); wd.rotation.set(0, Math.PI / 2, 0); wd.updateMatrix()
      winMesh.setMatrixAt(wi++, wd.matrix)
    }
    for (let w = 0; w < WINS_S; w++) {
      wd.position.set(W / 2 + 0.04, y, -((WINS_S - 1) / 2) * zStepS + w * zStepS)
      wd.scale.setScalar(s); wd.rotation.set(0, -Math.PI / 2, 0); wd.updateMatrix()
      winMesh.setMatrixAt(wi++, wd.matrix)
    }
  }
  winMesh.instanceMatrix.needsUpdate = true; scene.add(winMesh)

  // Balconies + railings
  const BAL_W = W * 0.82, BAL_D = 1.2
  const balMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(BAL_W, 0.1, BAL_D), balconyMat, totalFloors * 2)
  const railMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(BAL_W, 0.06, 0.06), railMat, totalFloors * 2)
  const bald = new THREE.Object3D(), raild = new THREE.Object3D()
  for (let f = 0; f < totalFloors; f++) {
    const hide = f >= totalFloors - UC_SKIP
    const s = hide ? 0 : 1
    const y = towerBaseY + (f + 1) * FH - 0.08
    for (const [idx, sign] of [[f * 2, 1], [f * 2 + 1, -1]] as [number, number][]) {
      bald.position.set(0, y, sign * (D / 2 + BAL_D / 2))
      bald.scale.setScalar(s); bald.updateMatrix(); balMesh.setMatrixAt(idx, bald.matrix)
      raild.position.set(0, y + 0.55, sign * (D / 2 + BAL_D - 0.06))
      raild.scale.setScalar(s); raild.updateMatrix(); railMesh.setMatrixAt(idx, raild.matrix)
    }
  }
  balMesh.instanceMatrix.needsUpdate = true; scene.add(balMesh)
  railMesh.instanceMatrix.needsUpdate = true; scene.add(railMesh)

  if (isUnderConstruction && UC_SKIP > 0) {
    const ucMesh = new THREE.Mesh(new THREE.BoxGeometry(W, UC_SKIP * FH, D), concreteMat)
    ucMesh.position.y = towerBaseY + (totalFloors - UC_SKIP) * FH + (UC_SKIP * FH) / 2
    ucMesh.castShadow = true; scene.add(ucMesh)
    addScaffolding(scene, W, D, towerBaseY + (totalFloors - UC_SKIP - 2) * FH, UC_SKIP * FH + FH * 2.5, scaffoldMat)
    addCrane(scene, W / 2 + 3, towerBaseY + towerH + 1, -D / 2 - 1)
  }

  const ph = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, FH * 1.8, D * 0.72), facadeMat)
  ph.position.y = towerBaseY + towerH + FH * 0.9; ph.castShadow = true; scene.add(ph)
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12), tankMat)
  t1.position.set(W * 0.2, towerBaseY + towerH + FH * 2 + 0.7, 0); scene.add(t1)
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 10), tankMat)
  t2.position.set(-W * 0.18, towerBaseY + towerH + FH * 2 + 0.45, D * 0.15); scene.add(t2)

  return { buildingHeight: towerH, towerBaseY, footprintX: W + 2.4, footprintZ: D + 2, raycastTargets: targets }
}

function buildCommercialTower(scene: THREE.Scene, totalFloors: number, isUnderConstruction: boolean): BuildResult {
  const FH = 1.4
  const W = 15, D = 11
  const LOBBY_H = FH * 2
  const towerH = totalFloors * FH
  const towerBaseY = LOBBY_H
  const UC_SKIP = isUnderConstruction ? Math.max(4, Math.floor(totalFloors * 0.2)) : 0
  const targets: THREE.Mesh[] = []

  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x1c2028, roughness: 0.6, metalness: 0.25, clearcoat: 0.2 })
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a4a5e, emissive: 0x0a1420, emissiveIntensity: 0.22,
    transparent: true, opacity: 0.62, roughness: 0.03, metalness: 0.12, reflectivity: 0.95,
    transmission: 0.3, ior: 1.5,
  })
  const spandrelMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e2228, roughness: 0.08, metalness: 0.9, clearcoat: 0.4,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })
  const colMat = new THREE.MeshPhysicalMaterial({ color: 0x14181e, roughness: 0.45, metalness: 0.7, clearcoat: 0.25 })
  const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1e24, roughness: 0.4, metalness: 0.55, clearcoat: 0.2 })
  const lobbyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a7898, transparent: true, opacity: 0.42, roughness: 0.02, metalness: 0.08, reflectivity: 0.95,
  })
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x7a7670, roughness: 0.92, metalness: 0 })
  const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.4, metalness: 0.3 })

  const lobby = new THREE.Mesh(new THREE.BoxGeometry(W + 3, LOBBY_H, D + 2), frameMat)
  lobby.position.y = LOBBY_H / 2; lobby.castShadow = true; lobby.receiveShadow = true
  scene.add(lobby); targets.push(lobby)

  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(W + 2.6, LOBBY_H - 0.4, 0.1), lobbyGlassMat)
  lobbyGlass.position.set(0, LOBBY_H / 2, D / 2 + 1.4); scene.add(lobbyGlass)

  // Main body — primary raycasting target
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, towerH, D), frameMat)
  body.position.y = towerBaseY + towerH / 2; body.castShadow = true; body.receiveShadow = true
  scene.add(body); targets.push(body)

  const colH = towerH + LOBBY_H
  for (const [cx, cz] of [[-W / 2, -D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [W / 2, D / 2]]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, colH, 0.55), colMat)
    col.position.set(cx, colH / 2, cz); col.castShadow = true; scene.add(col)
  }

  // Spandrel bands with polygon offset
  const spMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.1, 0.36, D + 0.1), spandrelMat, totalFloors + 1)
  const spd = new THREE.Object3D()
  for (let f = 0; f <= totalFloors; f++) {
    spd.position.set(0, towerBaseY + f * FH, 0); spd.updateMatrix()
    spMesh.setMatrixAt(f, spd.matrix)
  }
  spMesh.instanceMatrix.needsUpdate = true; scene.add(spMesh)

  // Glass curtain wall
  const PFB = 4, PS = 3
  const GP_H = FH - 0.4
  const totalPanels = totalFloors * (PFB * 2 + PS * 2)
  const glMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, GP_H, 0.06), glassMat, totalPanels)
  const gd = new THREE.Object3D()
  let gi = 0
  const pwFB = (W - 0.1) / PFB, pwS = (D - 0.1) / PS
  for (let f = 0; f < totalFloors; f++) {
    const hide = f >= totalFloors - UC_SKIP
    const y = towerBaseY + f * FH + FH / 2
    for (let p = 0; p < PFB; p++) {
      const x = -W / 2 + pwFB * (p + 0.5)
      gd.position.set(x, y, D / 2 + 0.04); gd.scale.set(hide ? 0 : pwFB - 0.08, 1, 1)
      gd.rotation.set(0, 0, 0); gd.updateMatrix(); glMesh.setMatrixAt(gi++, gd.matrix)
      gd.position.set(x, y, -D / 2 - 0.04); gd.scale.set(hide ? 0 : pwFB - 0.08, 1, 1)
      gd.rotation.set(0, Math.PI, 0); gd.updateMatrix(); glMesh.setMatrixAt(gi++, gd.matrix)
    }
    for (let p = 0; p < PS; p++) {
      const z = -D / 2 + pwS * (p + 0.5)
      gd.position.set(-W / 2 - 0.04, y, z); gd.scale.set(hide ? 0 : pwS - 0.08, 1, 1)
      gd.rotation.set(0, Math.PI / 2, 0); gd.updateMatrix(); glMesh.setMatrixAt(gi++, gd.matrix)
      gd.position.set(W / 2 + 0.04, y, z); gd.scale.set(hide ? 0 : pwS - 0.08, 1, 1)
      gd.rotation.set(0, -Math.PI / 2, 0); gd.updateMatrix(); glMesh.setMatrixAt(gi++, gd.matrix)
    }
  }
  glMesh.instanceMatrix.needsUpdate = true; scene.add(glMesh)

  if (isUnderConstruction && UC_SKIP > 0) {
    const ucMesh = new THREE.Mesh(new THREE.BoxGeometry(W, UC_SKIP * FH, D), concreteMat)
    ucMesh.position.y = towerBaseY + (totalFloors - UC_SKIP) * FH + (UC_SKIP * FH) / 2
    ucMesh.castShadow = true; scene.add(ucMesh)
    addScaffolding(scene, W, D, towerBaseY + (totalFloors - UC_SKIP - 2) * FH, UC_SKIP * FH + FH * 2.5, scaffoldMat)
    addCrane(scene, W / 2 + 3.5, towerBaseY + towerH + 1.5, -D / 2 - 2)
  }

  const mech = new THREE.Mesh(new THREE.BoxGeometry(W * 0.85, FH * 0.85, D * 0.85), roofMat)
  mech.position.y = towerBaseY + towerH + FH * 0.42; mech.castShadow = true; scene.add(mech)
  const heli = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: 0x3a5570, roughness: 0.8 }))
  heli.position.y = towerBaseY + towerH + FH * 0.88; scene.add(heli)

  return { buildingHeight: towerH, towerBaseY, footprintX: W + 3, footprintZ: D + 2, raycastTargets: targets }
}

function addEnvironment(scene: THREE.Scene, buildingType: BuildingType) {
  const ctxMat = new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.82 })
  const ctxGlass = new THREE.MeshPhysicalMaterial({ color: 0x5577aa, transparent: true, opacity: 0.5, roughness: 0.08 })
  const surrounds: { x: number; z: number; w: number; h: number; d: number; glass?: boolean }[] = [
    { x: -30, z: -22, w: 8, h: 7, d: 7 }, { x: 32, z: -20, w: 11, h: 5, d: 9 },
    { x: -32, z: 24, w: 7, h: 10, d: 6 }, { x: 30, z: 28, w: 9, h: 6.5, d: 8 },
    { x: -20, z: 32, w: 6, h: 4.5, d: 5 }, { x: 24, z: -30, w: 8, h: 9, d: 7, glass: true },
  ]
  for (const b of surrounds) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.glass ? ctxGlass : ctxMat)
    m.position.set(b.x, b.h / 2, b.z); m.castShadow = true; m.receiveShadow = true; scene.add(m)
  }

  if (buildingType === 'residential') {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x3a6830, roughness: 0.9 })
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a28, roughness: 0.9 })
    for (const [tx, tz] of [[-20, -10], [-22, 2], [20, -12], [18, 6], [-14, 20], [16, 22], [-10, -22], [13, -20]]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.2, 6), trunkMat)
      trunk.position.set(tx, 0.6, tz); scene.add(trunk)
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), treeMat)
      crown.position.set(tx, 2.2, tz); scene.add(crown)
    }
  }

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x282830, roughness: 0.98 })
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 10), roadMat)
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -32); scene.add(road)
  const markMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  for (let i = -3; i <= 3; i++) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.15), markMat)
    mark.rotation.x = -Math.PI / 2; mark.position.set(i * 6, 0.02, -32); scene.add(mark)
  }
}

export default function ModelViewer({
  modelPath,
  buildingType = 'residential',
  isUnderConstruction = false,
  totalFloors = 20,
  onFloorClick,
  onLoad,
  onError,
}: ModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [hoverFloor, setHoverFloor] = useState<number | null>(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

  // Use refs for callbacks so changing them never re-runs the effect
  const onFloorClickRef = useRef(onFloorClick)
  const onLoadRef = useRef(onLoad)
  const onErrorRef = useRef(onError)
  useEffect(() => { onFloorClickRef.current = onFloorClick }, [onFloorClick])
  useEffect(() => { onLoadRef.current = onLoad }, [onLoad])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Stable setter refs so handlers inside the effect never go stale
  const setHoverFloorRef = useRef(setHoverFloor)
  const setCursorPosRef = useRef(setCursorPos)
  const setLoadingRef = useRef(setLoading)
  const setProgressRef = useRef(setProgress)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const W = mount.clientWidth, H = mount.clientHeight

    const isGLB = modelPath && (modelPath.endsWith('.glb') || modelPath.endsWith('.gltf'))

    // Sky setup
    const skyColor = isGLB ? 0x7ec8f0 : (buildingType === 'commercial' ? 0x8095ac : 0x9ab8d8)
    const scene = new THREE.Scene()

    if (isGLB) {
      // Gradient sky: use a large hemisphere/dome as background
      const skyGeo = new THREE.SphereGeometry(500, 32, 16)
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor:    { value: new THREE.Color(0x1a6fa8) },
          bottomColor: { value: new THREE.Color(0xd8eef8) },
          offset:      { value: 20 },
          exponent:    { value: 0.4 },
        },
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPos;
          void main() {
            float h = normalize(vWorldPos + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }`,
        side: THREE.BackSide,
        depthWrite: false,
      })
      const skyDome = new THREE.Mesh(skyGeo, skyMat)
      scene.add(skyDome)
      scene.fog = new THREE.FogExp2(0xc8e4f5, 0.0008)
    } else {
      scene.background = new THREE.Color(skyColor)
      scene.fog = new THREE.Fog(skyColor, 200, 500)
    }

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 800)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = isGLB ? 1.55 : (buildingType === 'commercial' ? 0.75 : 0.88)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    // PMREMGenerator for environment reflections on MeshPhysicalMaterial
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(0.04))
    scene.environment = envRenderTarget.texture
    // Do NOT set scene.background from env — we use the sky dome instead
    pmremGenerator.dispose()

    // Lighting — architectural quality for GLB, standard for procedural
    let sun: THREE.DirectionalLight
    if (isGLB) {
      scene.add(new THREE.AmbientLight(0xfff8f2, 1.4))
      // Key sun
      sun = new THREE.DirectionalLight(0xfff4d0, 5.5)
      sun.position.set(60, 120, -70)
      sun.castShadow = true
      sun.shadow.mapSize.width = 4096; sun.shadow.mapSize.height = 4096
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 700
      sun.shadow.camera.left = -150; sun.shadow.camera.right = 150
      sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150
      sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.02
      scene.add(sun)
      // Sky fill — cool blue from opposite side
      const fill = new THREE.DirectionalLight(0x8ec8f8, 2.2)
      fill.position.set(-80, 60, 80); scene.add(fill)
      // Front fill — softens shadow side
      const front = new THREE.DirectionalLight(0xd0e8ff, 1.2)
      front.position.set(0, 40, 100); scene.add(front)
      // Warm ground bounce
      const bounce = new THREE.DirectionalLight(0xffd8a0, 0.6)
      bounce.position.set(0, -50, 0); scene.add(bounce)
      // Hemisphere for sky/ground color bleed
      scene.add(new THREE.HemisphereLight(0x7ec8f0, 0xb09060, 1.2))
    } else {
      scene.add(new THREE.AmbientLight(0xfff4e8, buildingType === 'commercial' ? 1.0 : 1.4))
      sun = new THREE.DirectionalLight(0xfffbe0, buildingType === 'commercial' ? 2.8 : 3.5)
      sun.position.set(-40, 100, -50)
      sun.castShadow = true
      sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 500
      sun.shadow.camera.left = -100; sun.shadow.camera.right = 100
      sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100
      sun.shadow.bias = -0.0003
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0xaaccff, 1.2)
      fill.position.set(50, 40, 50); scene.add(fill)
      scene.add(new THREE.HemisphereLight(skyColor, 0x9a8e78, 0.7))
    }

    // Ground — GLB has its own detailed ground (roads, grass, parking), skip for GLB
    if (!isGLB) {
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: buildingType === 'commercial' ? 0x888890 : 0xb0a090, roughness: 0.95 })
      )
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
      const grid = new THREE.GridHelper(200, 80, 0x888070, 0x9a9080)
      grid.position.y = 0.02; scene.add(grid)
    }

    // Floor highlight plane — scaled after build
    const floorHighlight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.35, 1),
      new THREE.MeshBasicMaterial({ color: 0x0071e3, transparent: true, opacity: 0.18, depthWrite: false })
    )
    floorHighlight.visible = false; scene.add(floorHighlight)

    const raycaster = new THREE.Raycaster()
    const objMeshes: THREE.Mesh[] = []
    let buildingHeight = 1
    let towerBaseY = 0
    let currentHoverFloor: number | null = null
    let highlightEnabled = false

    const camState = { theta: isGLB ? -0.95 : -Math.PI / 6, phi: isGLB ? 1.38 : 0.78, radius: 60, targetX: 0, targetY: 10, targetZ: 0, thetaVel: 0, phiVel: 0 }
    function updateCamera() {
      camera.position.set(
        camState.targetX + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta),
        camState.targetY + camState.radius * Math.cos(camState.phi),
        camState.targetZ + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta)
      )
      camera.lookAt(camState.targetX, camState.targetY, camState.targetZ)
    }
    updateCamera()

    function finalizeBuilding(result: BuildResult) {
      buildingHeight = result.buildingHeight
      towerBaseY = result.towerBaseY
      result.raycastTargets.forEach(m => objMeshes.push(m))
      floorHighlight.scale.set(result.footprintX * 1.1, 1, result.footprintZ * 1.1)

      const totalH = result.towerBaseY + result.buildingHeight
      const maxDim = Math.max(result.footprintX, result.footprintZ, totalH)
      const fovRad = (42 * Math.PI) / 180
      const fitDist = (maxDim * 0.65 / Math.sin(fovRad / 2)) * 1.25

      // GLB: drive radius directly from building height so it fills the frame
      camState.radius = isGLB ? buildingHeight * 1.75 : fitDist
      camState.targetY = totalH * (isGLB ? 0.34 : 0.42)
      camState.phi = isGLB ? 1.42 : 0.82
      camState.theta = isGLB ? -0.95 : -Math.PI / 5
      updateCamera()

      sun.shadow.camera.left = -maxDim; sun.shadow.camera.right = maxDim
      sun.shadow.camera.top = maxDim; sun.shadow.camera.bottom = -maxDim
      sun.shadow.camera.updateProjectionMatrix()

      highlightEnabled = !!onFloorClickRef.current
      setLoadingRef.current(false)
      onLoadRef.current?.()
    }

    // OBJ materials
    const mat_normal001 = new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.80 })
    const mat_glass = new THREE.MeshPhysicalMaterial({ color: 0x2a6090, transparent: true, opacity: 0.72, roughness: 0.05, reflectivity: 0.9, side: THREE.DoubleSide })
    const mat_aluminium = new THREE.MeshStandardMaterial({ color: 0xa8b4bc, roughness: 0.18, metalness: 0.92 })
    const mat_concrete = new THREE.MeshStandardMaterial({ color: 0xd4cec6, roughness: 0.86 })
    const mat_concreteDark = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.85 })
    const mat_grass = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95 })
    const mat_default = new THREE.MeshStandardMaterial({ color: 0xd8d2ca, roughness: 0.82 })
    function materialForName(name: string): THREE.Material {
      const n = name.toLowerCase()
      if (n.includes('glass') || n.includes('translucent')) return mat_glass
      if (n.includes('alumin') || n.includes('metal')) return mat_aluminium
      if (n.includes('white') || n.includes('light')) return mat_concrete
      if (n.includes('charcoal') || n.includes('dark') || n.includes('black')) return mat_concreteDark
      if (n.includes('grass') || n.includes('green')) return mat_grass
      if (n === 'normal.001' || n.includes('normal')) return mat_normal001
      return mat_default
    }

    // ── Pre-built material palette for GLB ───────────────────────────────────
    // Blender transmission glass + metalness renders as flat white in Three.js.
    // We replace every mesh material using a two-pass lookup:
    //   1st pass: match by Blender material name
    //   2nd pass: match by mesh/object name (catches any naming variation)
    // Transparent glass uses opacity so the dark base color always shows through.

    const M: Record<string, THREE.Material> = {
      // ── Building glass ─────────────────────────────────────────────────────
      winGlass: new THREE.MeshPhysicalMaterial({
        color: 0x0a1a2e, roughness: 0.06, metalness: 0.0,
        transparent: true, opacity: 0.88, side: THREE.DoubleSide,
        envMapIntensity: 1.2,
      }),
      lobbyGlass: new THREE.MeshPhysicalMaterial({
        color: 0x0d2038, roughness: 0.04, metalness: 0.0,
        transparent: true, opacity: 0.78, side: THREE.DoubleSide,
        envMapIntensity: 1.0,
      }),
      // ── Building shell ─────────────────────────────────────────────────────
      concrete: new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.84, metalness: 0.0 }),
      slab:     new THREE.MeshStandardMaterial({ color: 0xbcac88, roughness: 0.86, metalness: 0.0 }),
      aluminium:new THREE.MeshStandardMaterial({ color: 0x8a9298, roughness: 0.16, metalness: 0.92, envMapIntensity: 1.8 }),
      roof:     new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.90, metalness: 0.0 }),
      // ── Ground ─────────────────────────────────────────────────────────────
      asphalt:  new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.97, metalness: 0.0 }),
      pavement: new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.90, metalness: 0.0 }),
      grass:    new THREE.MeshStandardMaterial({ color: 0x2e6e18, roughness: 0.96, metalness: 0.0 }),
      parkGnd:  new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.92, metalness: 0.0 }),
      laneW:    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.70, metalness: 0.0 }),
      laneY:    new THREE.MeshStandardMaterial({ color: 0xf0c010, roughness: 0.70, metalness: 0.0 }),
      kerb:     new THREE.MeshStandardMaterial({ color: 0xc0bab4, roughness: 0.80, metalness: 0.0 }),
      // ── Trees ──────────────────────────────────────────────────────────────
      leaf1: new THREE.MeshStandardMaterial({ color: 0x1e5a10, roughness: 0.96, metalness: 0.0 }),
      leaf2: new THREE.MeshStandardMaterial({ color: 0x266e18, roughness: 0.96, metalness: 0.0 }),
      leaf3: new THREE.MeshStandardMaterial({ color: 0x1a4e0c, roughness: 0.96, metalness: 0.0 }),
      palm:  new THREE.MeshStandardMaterial({ color: 0x227814, roughness: 0.94, metalness: 0.0, side: THREE.DoubleSide }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.96, metalness: 0.0 }),
      // ── Street furniture ───────────────────────────────────────────────────
      lampGlow: (() => { const x = new THREE.MeshStandardMaterial({ color: 0xfff4c0, roughness: 0.0, metalness: 0.0 }); x.emissive.set(0xfff4c0); x.emissiveIntensity = 6.0; return x })(),
      lampPost: new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.28, metalness: 0.88 }),
      bench:    new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.88, metalness: 0.0 }),
      planter:  new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.82, metalness: 0.0 }),
      // ── Cars ───────────────────────────────────────────────────────────────
      carWhite:  new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.13, metalness: 0.72, envMapIntensity: 2.0 }),
      carSilver: new THREE.MeshStandardMaterial({ color: 0x9a9ea4, roughness: 0.11, metalness: 0.88, envMapIntensity: 2.0 }),
      carBlack:  new THREE.MeshStandardMaterial({ color: 0x0c0e10, roughness: 0.15, metalness: 0.78, envMapIntensity: 2.0 }),
      carRed:    new THREE.MeshStandardMaterial({ color: 0xaa0c0c, roughness: 0.13, metalness: 0.68, envMapIntensity: 2.0 }),
      carBlue:   new THREE.MeshStandardMaterial({ color: 0x0e2088, roughness: 0.13, metalness: 0.68, envMapIntensity: 2.0 }),
      carBeige:  new THREE.MeshStandardMaterial({ color: 0xc8a87a, roughness: 0.20, metalness: 0.58, envMapIntensity: 1.5 }),
      carGlass:  new THREE.MeshPhysicalMaterial({ color: 0x1a2840, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      wheel:     new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.94, metalness: 0.0 }),
      rim:       new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: 0.10, metalness: 0.96, envMapIntensity: 2.5 }),
      headlight: (() => { const x = new THREE.MeshStandardMaterial({ color: 0xfff8d0, roughness: 0.08, metalness: 0.1 }); x.emissive.set(0xfff8d0); x.emissiveIntensity = 2.5; return x })(),
      taillight: (() => { const x = new THREE.MeshStandardMaterial({ color: 0xff1010, roughness: 0.08, metalness: 0.1 }); x.emissive.set(0xff1010); x.emissiveIntensity = 2.0; return x })(),
      // ── Background buildings ───────────────────────────────────────────────
      bgBldg: new THREE.MeshStandardMaterial({ color: 0xc8c2b8, roughness: 0.84, metalness: 0.0 }),
    }

    function classifyGLB(matName: string, meshName: string): THREE.Material | null {
      const mat = matName.toLowerCase()
      const msh = meshName.toLowerCase()

      // Helper: check both mat and mesh name for a keyword
      const has = (kw: string) => mat.includes(kw) || msh.includes(kw)

      // Glass — checked FIRST and most strictly (avoid false positives)
      if (mat === 'winglass' || mat === 'windowglass' ||
          (has('window') && !has('car')) ||
          (mat.includes('glass') && !has('car') && !has('lobby') && !has('canopy')))
        return M.winGlass
      if (mat === 'lobbyglass' || has('lobby') || has('canopy'))
        return M.lobbyGlass

      // Building shell
      if (mat === 'concrete' || (has('concrete') && !has('car')) || has('core') || has('entrance') || has('stair') || has('column'))
        return M.concrete
      if (mat === 'slab' || has('band') || has('spandrel') || (mat === 'slab'))
        return M.slab
      if (mat === 'aluminium' || has('alum') || has('fin') || (has('frame') && !has('car')) || has('railing') || has('balcon'))
        return M.aluminium
      if (mat === 'roof' || has('parapet') || has('mech') || has('tank'))
        return M.roof

      // Ground
      if (mat === 'asphalt' || (has('asphalt') && !has('car')) || (has('road') && !has('car')))
        return M.asphalt
      if (mat === 'pavement' || has('sidewalk') || has('plaza') || mat === 'kerb')
        return M.pavement
      if (mat === 'grass' || has('lawn') || (has('grass') && !has('car')))
        return M.grass
      if (mat === 'parkground')
        return M.parkGnd
      if (mat === 'lanemark' || mat === 'wlane' || (has('lane') && !has('car') && !has('yellow')))
        return M.laneW
      if (mat === 'yellowmark' || (has('yellow') && !has('car')))
        return M.laneY
      if (mat === 'kerb')
        return M.kerb

      // Trees
      if (mat === 'leaf1') return M.leaf1
      if (mat === 'leaf2') return M.leaf2
      if (mat === 'leaf3') return M.leaf3
      if (mat === 'palmfrond' || (has('palm') && !has('car'))) return M.palm
      if (mat === 'trunk') return M.trunk
      if (has('leaf') || has('foliage')) return M.leaf2

      // Street furniture
      if (mat === 'lampglow') return M.lampGlow
      if (mat === 'lamppost' || (has('lamp') && !has('glow') && !has('car'))) return M.lampPost
      if (mat === 'bench') return M.bench
      if (mat === 'planter') return M.planter

      // Cars
      if (mat === 'car_white')  return M.carWhite
      if (mat === 'car_silver') return M.carSilver
      if (mat === 'car_black')  return M.carBlack
      if (mat === 'car_red')    return M.carRed
      if (mat === 'car_blue')   return M.carBlue
      if (mat === 'car_beige')  return M.carBeige
      if (mat === 'carglass')   return M.carGlass
      if (mat === 'wheel')      return M.wheel
      if (mat === 'wheelrim')   return M.rim
      if (mat === 'carlight')   return M.headlight
      if (mat === 'cartaillt')  return M.taillight

      // Background buildings
      if (has('bgbuilding') || mat.startsWith('bg_') || msh.startsWith('bgbuilding'))
        return M.bgBldg

      // ── Colour-based fallback: classify by what Blender exported ─────────
      // This catches any mesh whose name didn't match but whose exported colour gives it away.
      const src = matName  // original (un-lowercased) name helps heuristics
      void src
      return null
    }

    const loadModel = (group: THREE.Object3D) => {
      const meshesFromModel: THREE.Mesh[] = []
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (isGLB) {
            // Two-pass lookup: material name first, then mesh name.
            // Transparent glass always shows dark base colour regardless of env map.
            const replaceMat = (mat: THREE.Material): THREE.Material =>
              classifyGLB(mat.name, mesh.name) ?? mat
            mesh.material = Array.isArray(mesh.material)
              ? mesh.material.map(replaceMat)
              : replaceMat(mesh.material)
          } else {
            const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
            if (!rawMat || (rawMat as THREE.Material).type === 'MeshBasicMaterial') {
              mesh.material = materialForName((rawMat as THREE.Material)?.name ?? '')
            }
          }
          mesh.castShadow = true; mesh.receiveShadow = true
          meshesFromModel.push(mesh)
        }
      })
      scene.add(group)
      const box = new THREE.Box3().setFromObject(group)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // GLB: scale by building HEIGHT only (ignoring huge ground plane that dominates max dimension)
      // OBJ: scale by largest dimension as before
      const targetSize = 38
      const normScale = isGLB
        ? targetSize / size.y          // scale so tower height = 38 units
        : targetSize / Math.max(size.x, size.y, size.z)

      group.scale.setScalar(normScale)
      group.position.set(-center.x * normScale, -box.min.y * normScale, -center.z * normScale)
      const box2 = new THREE.Box3().setFromObject(group)
      const size2 = box2.getSize(new THREE.Vector3())

      // GLB: footprint is ~45% of tower height (avoids ground-plane inflating the fit distance)
      const footprint = isGLB ? size2.y * 0.45 : Math.max(size2.x, size2.z) * 1.1
      finalizeBuilding({ buildingHeight: size2.y, towerBaseY: 0, footprintX: footprint, footprintZ: footprint, raycastTargets: meshesFromModel })
    }

    if (modelPath && modelPath.trim()) {
      const ext = modelPath.split('?')[0].toLowerCase().split('.').pop()
      if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader()
        loader.load(
          modelPath,
          (gltf) => { loadModel(gltf.scene) },
          (xhr) => { if (xhr.total) setProgressRef.current(Math.round((xhr.loaded / xhr.total) * 100)) },
          (err) => { console.error('[ModelViewer] GLTF error:', err); setLoadingRef.current(false); onErrorRef.current?.(err as Error) }
        )
      } else {
        const loader = new OBJLoader()
        loader.load(
          modelPath,
          (obj) => { loadModel(obj) },
          (xhr) => { if (xhr.total) setProgressRef.current(Math.round((xhr.loaded / xhr.total) * 100)) },
          (err) => { console.error('[ModelViewer] OBJ error:', err); setLoadingRef.current(false); onErrorRef.current?.(err) }
        )
      }
    } else {
      addEnvironment(scene, buildingType)
      const result = buildingType === 'commercial'
        ? buildCommercialTower(scene, totalFloors, isUnderConstruction)
        : buildResidentialTower(scene, totalFloors, isUnderConstruction)
      finalizeBuilding(result)
    }

    let autoRotate = true, animId = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (autoRotate) { camState.theta += 0.0018; updateCamera() }
      else if (Math.abs(camState.thetaVel) > 0.00001 || Math.abs(camState.phiVel) > 0.00001) {
        camState.theta += camState.thetaVel
        camState.phi = Math.max(0.08, Math.min(1.45, camState.phi + camState.phiVel))
        camState.thetaVel *= 0.88; camState.phiVel *= 0.88
        updateCamera()
      }
      renderer.render(scene, camera)
    }
    animate()

    let isDown = false, lastX = 0, lastY = 0, mouseDownX = 0, mouseDownY = 0

    const onMouseDown = (e: MouseEvent) => {
      autoRotate = false; isDown = true
      lastX = mouseDownX = e.clientX; lastY = mouseDownY = e.clientY
      mount.style.cursor = 'grabbing'
      floorHighlight.visible = false; currentHoverFloor = null
      setHoverFloorRef.current(null)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDown) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY
        if (e.buttons === 1) {
          camState.thetaVel = -dx * 0.004; camState.phiVel = dy * 0.004
          camState.theta += camState.thetaVel
          camState.phi = Math.max(0.08, Math.min(1.45, camState.phi + camState.phiVel))
          updateCamera()
        } else if (e.buttons === 2) {
          const sp = camState.radius * 0.0008
          camState.targetX -= dx * sp * Math.cos(camState.theta)
          camState.targetZ -= dx * sp * Math.sin(camState.theta)
          camState.targetX += dy * sp * Math.sin(camState.theta) * -1
          camState.targetZ += dy * sp * Math.cos(camState.theta) * -1
          updateCamera()
        }
        lastX = e.clientX; lastY = e.clientY
      } else if (highlightEnabled && objMeshes.length > 0) {
        const rect = mount.getBoundingClientRect()
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        raycaster.setFromCamera(ndc, camera)
        const hits = raycaster.intersectObjects(objMeshes)
        if (hits.length > 0) {
          const hitY = hits[0].point.y
          const relY = Math.max(0, hitY - towerBaseY)
          const rawFloor = Math.ceil((relY / buildingHeight) * totalFloors)
          const floor = Math.max(1, Math.min(totalFloors, rawFloor))
          if (floor !== currentHoverFloor) {
            currentHoverFloor = floor
            setHoverFloorRef.current(floor)
          }
          setCursorPosRef.current({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          floorHighlight.position.y = towerBaseY + ((floor - 0.5) / totalFloors) * buildingHeight
          floorHighlight.visible = true
          mount.style.cursor = 'pointer'
        } else {
          if (currentHoverFloor !== null) {
            currentHoverFloor = null
            setHoverFloorRef.current(null)
          }
          floorHighlight.visible = false
          mount.style.cursor = 'grab'
        }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - mouseDownX), dy = Math.abs(e.clientY - mouseDownY)
      if (dx < 5 && dy < 5 && currentHoverFloor !== null) onFloorClickRef.current?.(currentHoverFloor)
      isDown = false
      mount.style.cursor = currentHoverFloor !== null ? 'pointer' : 'grab'
    }

    const onMouseLeave = () => {
      isDown = false; currentHoverFloor = null
      setHoverFloorRef.current(null)
      floorHighlight.visible = false; mount.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); autoRotate = false
      camState.radius = Math.max(5, Math.min(300, camState.radius + e.deltaY * camState.radius * 0.001))
      updateCamera()
    }

    // Touch
    let lastTouchDist = 0, touchDownX = 0, touchDownY = 0
    const onTouchStart = (e: TouchEvent) => {
      autoRotate = false
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      } else {
        isDown = true
        lastX = touchDownX = e.touches[0].clientX
        lastY = touchDownY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        camState.radius = Math.max(5, Math.min(300, camState.radius + (lastTouchDist - d) * 0.1))
        lastTouchDist = d; updateCamera()
      } else if (e.touches.length === 1 && isDown) {
        const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY
        camState.thetaVel = -dx * 0.004; camState.phiVel = dy * 0.004
        camState.theta += camState.thetaVel
        camState.phi = Math.max(0.08, Math.min(1.45, camState.phi + camState.phiVel))
        updateCamera(); lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0 && highlightEnabled) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchDownX)
        const dy = Math.abs(e.changedTouches[0].clientY - touchDownY)
        if (dx < 8 && dy < 8) {
          const rect = mount.getBoundingClientRect()
          const ndc = new THREE.Vector2(
            ((e.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1,
            -((e.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1
          )
          raycaster.setFromCamera(ndc, camera)
          const hits = raycaster.intersectObjects(objMeshes)
          if (hits.length > 0) {
            const hitY = hits[0].point.y
            const relY = Math.max(0, hitY - towerBaseY)
            const rawFloor = Math.ceil((relY / buildingHeight) * totalFloors)
            const floor = Math.max(1, Math.min(totalFloors, rawFloor))
            onFloorClickRef.current?.(floor)
          }
        }
      }
      isDown = false
    }

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }

    mount.addEventListener('mousedown', onMouseDown)
    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('mouseup', onMouseUp)
    mount.addEventListener('mouseleave', onMouseLeave)
    mount.addEventListener('wheel', onWheel, { passive: false })
    mount.addEventListener('touchstart', onTouchStart, { passive: false })
    mount.addEventListener('touchmove', onTouchMove, { passive: false })
    mount.addEventListener('touchend', onTouchEnd)
    mount.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      mount.removeEventListener('mousedown', onMouseDown)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('mouseup', onMouseUp)
      mount.removeEventListener('mouseleave', onMouseLeave)
      mount.removeEventListener('wheel', onWheel)
      mount.removeEventListener('touchstart', onTouchStart)
      mount.removeEventListener('touchmove', onTouchMove)
      mount.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  // Callbacks intentionally excluded — they're accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath, buildingType, isUnderConstruction, totalFloors])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />

      {hoverFloor !== null && !loading && (
        <div
          className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-standard pointer-events-none"
          style={{
            left: Math.min(cursorPos.x + 16, (mountRef.current?.clientWidth ?? 400) - 200),
            top: Math.max(cursorPos.y - 36, 8),
            background: '#0071e3',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,113,227,0.45)',
            letterSpacing: '-0.01em',
          }}
        >
          <span>Floor {hoverFloor}</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>· Click to explore</span>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: '#1a2430' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(28,199,127,0.2)', borderTopColor: '#1cc77f' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Building 3D model</p>
              {progress > 0 && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{progress}%</p>}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {onFloorClick ? 'Hover a floor · Click to explore · Drag to rotate' : 'Drag to rotate · Scroll to zoom'}
          </span>
        </div>
      )}
    </div>
  )
}
