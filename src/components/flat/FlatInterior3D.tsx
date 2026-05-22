'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Flat } from '@/lib/types'

type RoomKind = 'living' | 'bedroom' | 'master' | 'kitchen' | 'bathroom' | 'balcony' | 'office'

interface Room {
  id: string
  name: string
  kind: RoomKind
  x: number
  z: number
  w: number
  d: number
}

// ── Apartment layouts per flat type ───────────────────────────────────────────
function getLayout(flatType: string): Room[] {
  const t = flatType.toLowerCase()

  if (t === 'studio') {
    return [
      { id: 'living', name: 'Studio', kind: 'living', x: 0, z: 0, w: 5.5, d: 5 },
      { id: 'bath', name: 'Bathroom', kind: 'bathroom', x: 0, z: 5, w: 2.4, d: 2.2 },
      { id: 'foyer', name: 'Foyer', kind: 'living', x: 2.4, z: 5, w: 3.1, d: 2.2 },
      { id: 'balcony', name: 'Balcony', kind: 'balcony', x: 0, z: -1.4, w: 5.5, d: 1.4 },
    ]
  }
  if (t === '1bhk') {
    return [
      { id: 'living', name: 'Living & Dining', kind: 'living', x: 0, z: 0, w: 5, d: 8.5 },
      { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', x: 5, z: 0, w: 4, d: 3 },
      { id: 'bath', name: 'Bathroom', kind: 'bathroom', x: 5, z: 3, w: 4, d: 2.3 },
      { id: 'bed', name: 'Bedroom', kind: 'master', x: 5, z: 5.3, w: 4, d: 3.2 },
      { id: 'balcony', name: 'Balcony', kind: 'balcony', x: 0, z: -1.4, w: 9, d: 1.4 },
    ]
  }
  if (t === '3bhk' || t === '4bhk' || t === 'penthouse') {
    const rooms: Room[] = [
      { id: 'living', name: 'Living & Dining', kind: 'living', x: 0, z: 0, w: 7.5, d: 6 },
      { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', x: 7.5, z: 0, w: 6, d: 3.5 },
      { id: 'master', name: 'Master Bedroom', kind: 'master', x: 7.5, z: 3.5, w: 6, d: 5 },
      { id: 'bed2', name: 'Bedroom 2', kind: 'bedroom', x: 0, z: 6, w: 4, d: 5.5 },
      { id: 'bed3', name: 'Bedroom 3', kind: 'bedroom', x: 4, z: 6, w: 3.5, d: 5.5 },
      { id: 'bath1', name: 'Bathroom', kind: 'bathroom', x: 7.5, z: 8.5, w: 3.75, d: 3 },
      { id: 'bath2', name: 'Powder Room', kind: 'bathroom', x: 11.25, z: 8.5, w: 2.25, d: 3 },
      { id: 'balcony', name: 'Balcony', kind: 'balcony', x: 0, z: -1.6, w: 13.5, d: 1.6 },
    ]
    return rooms
  }
  // default 2bhk
  return [
    { id: 'living', name: 'Living & Dining', kind: 'living', x: 0, z: 0, w: 7, d: 5 },
    { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', x: 7, z: 0, w: 5, d: 3 },
    { id: 'master', name: 'Master Bedroom', kind: 'master', x: 7, z: 3, w: 5, d: 6 },
    { id: 'bed2', name: 'Bedroom 2', kind: 'bedroom', x: 0, z: 5, w: 4.5, d: 4 },
    { id: 'bath', name: 'Bathroom', kind: 'bathroom', x: 4.5, z: 5, w: 2.5, d: 4 },
    { id: 'balcony', name: 'Balcony', kind: 'balcony', x: 0, z: -1.6, w: 12, d: 1.6 },
  ]
}

function getOfficeLayout(flatType: string): Room[] {
  if (flatType.toLowerCase() === 'office_floor') {
    return [
      { id: 'work', name: 'Open Workspace', kind: 'office', x: 0, z: 0, w: 10, d: 11 },
      { id: 'conf', name: 'Conference Room', kind: 'office', x: 10, z: 0, w: 6, d: 4 },
      { id: 'huddle', name: 'Huddle Room', kind: 'office', x: 10, z: 4, w: 3, d: 4 },
      { id: 'pantry', name: 'Pantry', kind: 'kitchen', x: 13, z: 4, w: 3, d: 4 },
      { id: 'rest', name: 'Restrooms', kind: 'bathroom', x: 10, z: 8, w: 6, d: 3 },
    ]
  }
  return [
    { id: 'work', name: 'Open Workspace', kind: 'office', x: 0, z: 0, w: 7.5, d: 9 },
    { id: 'meeting', name: 'Meeting Room', kind: 'office', x: 7.5, z: 0, w: 3.5, d: 4.5 },
    { id: 'pantry', name: 'Pantry', kind: 'kitchen', x: 7.5, z: 4.5, w: 3.5, d: 2.5 },
    { id: 'rest', name: 'Restroom', kind: 'bathroom', x: 7.5, z: 7, w: 3.5, d: 2 },
  ]
}

const ROOM_TINT: Record<RoomKind, number> = {
  living: 0xc9a878,
  bedroom: 0xbe9a72,
  master: 0xc4a07a,
  kitchen: 0xd8d2c6,
  bathroom: 0xd4dadd,
  balcony: 0x9a9088,
  office: 0xb0aca4,
}

// ── Furniture helpers ─────────────────────────────────────────────────────────
function box(w: number, h: number, d: number, color: number, opts?: { metal?: number; rough?: number }) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, metalness: opts?.metal ?? 0, roughness: opts?.rough ?? 0.85 })
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function furnishRoom(scene: THREE.Scene, room: Room) {
  const cx = room.x + room.w / 2
  const cz = room.z + room.d / 2
  const g = new THREE.Group()
  const wide = room.w >= room.d

  if (room.kind === 'living' && room.id !== 'foyer') {
    // Sofa
    const sofaSeat = box(2.4, 0.45, 0.95, 0x707683)
    sofaSeat.position.set(0, 0.32, 0)
    const sofaBack = box(2.4, 0.55, 0.22, 0x646a76)
    sofaBack.position.set(0, 0.62, -0.42)
    const armL = box(0.22, 0.55, 0.95, 0x646a76); armL.position.set(-1.1, 0.42, 0)
    const armR = box(0.22, 0.55, 0.95, 0x646a76); armR.position.set(1.1, 0.42, 0)
    const sofa = new THREE.Group()
    sofa.add(sofaSeat, sofaBack, armL, armR)
    sofa.position.set(cx, 0, room.z + 0.75)
    g.add(sofa)
    // Coffee table
    const ct = box(1.1, 0.12, 0.6, 0x6b4a2e, { rough: 0.5 })
    ct.position.set(cx, 0.32, cz - 0.1)
    g.add(ct)
    // Rug
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.95 }))
    rug.rotation.x = -Math.PI / 2; rug.position.set(cx, 0.03, cz - 0.1); rug.receiveShadow = true
    g.add(rug)
    // TV unit + screen on far wall
    const tvUnit = box(2.2, 0.4, 0.4, 0x3a2e22)
    tvUnit.position.set(cx, 0.22, room.z + room.d - 0.32)
    const tv = box(1.7, 0.95, 0.06, 0x0a0a0c, { rough: 0.2 })
    tv.position.set(cx, 1.25, room.z + room.d - 0.26)
    g.add(tvUnit, tv)
    // Dining set (if room is large)
    if (room.w * room.d > 30) {
      const dt = box(1.5, 0.1, 0.85, 0x6b4a2e, { rough: 0.5 })
      const dtX = room.x + room.w - 1.4
      dt.position.set(dtX, 0.74, cz)
      const leg = (ox: number, oz: number) => { const l = box(0.08, 0.74, 0.08, 0x4a3420); l.position.set(dtX + ox, 0.37, cz + oz); g.add(l) }
      leg(-0.6, -0.3); leg(0.6, -0.3); leg(-0.6, 0.3); leg(0.6, 0.3)
      g.add(dt)
      for (const [ox, oz] of [[-0.55, -0.6], [0.55, -0.6], [-0.55, 0.6], [0.55, 0.6]]) {
        const ch = box(0.42, 0.5, 0.42, 0x55504a)
        ch.position.set(dtX + ox, 0.5, cz + oz)
        const chb = box(0.42, 0.5, 0.08, 0x55504a)
        chb.position.set(dtX + ox, 0.78, cz + oz + (oz > 0 ? 0.17 : -0.17))
        g.add(ch, chb)
      }
    }
    // Plant
    const pot = box(0.3, 0.35, 0.3, 0x8a6a4a)
    pot.position.set(room.x + 0.5, 0.18, room.z + room.d - 0.5)
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 }))
    plant.position.set(room.x + 0.5, 0.7, room.z + room.d - 0.5)
    g.add(pot, plant)
  }

  if (room.kind === 'master' || room.kind === 'bedroom') {
    const bedW = room.kind === 'master' ? 2.0 : 1.5
    const bed = new THREE.Group()
    const mattress = box(bedW, 0.4, 2.1, 0xe6e0d4)
    mattress.position.y = 0.42
    const headboard = box(bedW + 0.15, 0.9, 0.18, 0x6b4a2e, { rough: 0.5 })
    headboard.position.set(0, 0.55, -1.14)
    const p1 = box(bedW * 0.42, 0.18, 0.5, 0xf4f0e8); p1.position.set(-bedW * 0.24, 0.7, -0.78)
    const p2 = box(bedW * 0.42, 0.18, 0.5, 0xf4f0e8); p2.position.set(bedW * 0.24, 0.7, -0.78)
    const duvet = box(bedW + 0.05, 0.12, 1.4, 0x8a95a8); duvet.position.set(0, 0.66, 0.25)
    bed.add(mattress, headboard, p1, p2, duvet)
    bed.position.set(cx, 0, room.z + 1.45)
    g.add(bed)
    // Nightstands
    for (const sgn of [-1, 1]) {
      const ns = box(0.5, 0.5, 0.45, 0x5a4636)
      ns.position.set(cx + sgn * (bedW / 2 + 0.4), 0.25, room.z + 0.65)
      g.add(ns)
    }
    // Wardrobe
    const wr = box(Math.min(2.2, room.w - 1), 2.0, 0.6, 0x6b5644)
    wr.position.set(cx, 1.0, room.z + room.d - 0.4)
    g.add(wr)
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(room.w * 0.55, 1.3), new THREE.MeshStandardMaterial({ color: 0xb0a8b4, roughness: 0.95 }))
    rug.rotation.x = -Math.PI / 2; rug.position.set(cx, 0.03, room.z + 2.9)
    g.add(rug)
  }

  if (room.kind === 'kitchen') {
    const counterMat = 0x2e2a26
    const cab = 0xd8d2c6
    // L-shaped counter along two walls
    const c1 = box(room.w - 0.4, 0.9, 0.65, cab)
    c1.position.set(cx, 0.45, room.z + 0.42)
    const top1 = box(room.w - 0.35, 0.06, 0.68, counterMat, { rough: 0.3 })
    top1.position.set(cx, 0.92, room.z + 0.42)
    g.add(c1, top1)
    const c2 = box(0.65, 0.9, room.d - 1.2, cab)
    c2.position.set(room.x + 0.42, 0.45, cz + 0.3)
    const top2 = box(0.68, 0.06, room.d - 1.15, counterMat, { rough: 0.3 })
    top2.position.set(room.x + 0.42, 0.92, cz + 0.3)
    g.add(c2, top2)
    // Upper cabinets
    const uc = box(room.w - 0.6, 0.7, 0.35, cab)
    uc.position.set(cx, 1.85, room.z + 0.28)
    g.add(uc)
    // Sink
    const sink = box(0.5, 0.08, 0.4, 0x9aa0a8, { metal: 0.7, rough: 0.3 })
    sink.position.set(cx - 0.4, 0.96, room.z + 0.42)
    g.add(sink)
    // Cooktop
    const ck = box(0.55, 0.04, 0.45, 0x14141a, { rough: 0.2 })
    ck.position.set(cx + 0.6, 0.96, room.z + 0.42)
    g.add(ck)
    // Fridge
    const fr = box(0.7, 1.8, 0.7, 0xc4c8cc, { metal: 0.4, rough: 0.4 })
    fr.position.set(room.x + room.w - 0.5, 0.9, room.z + room.d - 0.5)
    g.add(fr)
  }

  if (room.kind === 'bathroom') {
    // Toilet
    const tBase = box(0.4, 0.4, 0.55, 0xf4f4f2, { rough: 0.3 })
    tBase.position.set(room.x + 0.5, 0.2, room.z + 0.5)
    const tTank = box(0.42, 0.4, 0.2, 0xf4f4f2, { rough: 0.3 })
    tTank.position.set(room.x + 0.5, 0.55, room.z + 0.32)
    g.add(tBase, tTank)
    // Sink + vanity
    const van = box(0.9, 0.8, 0.5, 0x5a4636)
    van.position.set(cx, 0.4, room.z + 0.3)
    const basin = box(0.55, 0.12, 0.38, 0xf4f4f2, { rough: 0.25 })
    basin.position.set(cx, 0.86, room.z + 0.3)
    g.add(van, basin)
    // Mirror
    const mirror = box(0.7, 0.8, 0.04, 0x9fc4d4, { metal: 0.3, rough: 0.1 })
    mirror.position.set(cx, 1.45, room.z + 0.1)
    g.add(mirror)
    // Shower tray + glass
    const tray = box(1.0, 0.06, 1.0, 0xe4e8ea, { rough: 0.4 })
    tray.position.set(room.x + room.w - 0.6, 0.03, room.z + room.d - 0.6)
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.9, 1.0),
      new THREE.MeshPhysicalMaterial({ color: 0xbcd4dc, transparent: true, opacity: 0.32, roughness: 0.05 })
    )
    glass.position.set(room.x + room.w - 1.1, 0.95, room.z + room.d - 0.6)
    g.add(tray, glass)
  }

  if (room.kind === 'balcony') {
    const railMat = 0x6a6a72
    for (let i = 0; i < 2; i++) {
      const ch = box(0.5, 0.4, 0.5, 0x8a7a5a)
      ch.position.set(cx + (i === 0 ? -0.8 : 0.8), 0.2, cz)
      const chb = box(0.5, 0.45, 0.08, 0x8a7a5a)
      chb.position.set(cx + (i === 0 ? -0.8 : 0.8), 0.55, cz - 0.2)
      g.add(ch, chb)
    }
    const tbl = box(0.5, 0.5, 0.5, railMat, { metal: 0.3 })
    tbl.position.set(cx, 0.25, cz)
    g.add(tbl)
    const pot = box(0.35, 0.4, 0.35, 0x8a6a4a)
    pot.position.set(room.x + 0.4, 0.2, cz)
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 }))
    plant.position.set(room.x + 0.4, 0.75, cz)
    g.add(pot, plant)
  }

  if (room.kind === 'office') {
    const isMeeting = /meeting|conference|huddle/i.test(room.name)
    if (isMeeting) {
      const tbl = box(Math.min(room.w - 1.5, 3), 0.1, Math.min(room.d - 1.5, 1.4), 0x4a3a2a, { rough: 0.4 })
      tbl.position.set(cx, 0.74, cz)
      g.add(tbl)
      const seats = Math.min(8, Math.floor(room.w))
      for (let i = 0; i < seats; i++) {
        const side = i % 2 === 0 ? -1 : 1
        const idx = Math.floor(i / 2)
        const ch = box(0.42, 0.5, 0.42, 0x2a2e36)
        ch.position.set(cx - 1.2 + idx * 1.0, 0.25, cz + side * 1.1)
        g.add(ch)
      }
    } else {
      // Desk grid
      const cols = Math.max(1, Math.floor((room.w - 1) / 1.8))
      const rows = Math.max(1, Math.floor((room.d - 1) / 1.8))
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = room.x + 1 + c * 1.8
          const dz = room.z + 1 + r * 1.8
          const desk = box(1.3, 0.06, 0.7, 0xe4e0d8, { rough: 0.4 })
          desk.position.set(dx, 0.73, dz)
          const ch = box(0.42, 0.5, 0.42, 0x2a2e36)
          ch.position.set(dx, 0.25, dz + 0.55)
          const mon = box(0.55, 0.34, 0.04, 0x12141a, { rough: 0.2 })
          mon.position.set(dx, 1.05, dz - 0.22)
          g.add(desk, ch, mon)
        }
      }
    }
  }

  scene.add(g)
}

// ── Wall grid computation ─────────────────────────────────────────────────────
interface WallRun {
  orient: 'h' | 'v'
  fixed: number
  from: number
  to: number
  leftKind: RoomKind | null
  rightKind: RoomKind | null
  leftId: string | null
  rightId: string | null
}

function computeWalls(rooms: Room[]) {
  const cs = 0.25
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
  for (const r of rooms) {
    minX = Math.min(minX, r.x); minZ = Math.min(minZ, r.z)
    maxX = Math.max(maxX, r.x + r.w); maxZ = Math.max(maxZ, r.z + r.d)
  }
  const gw = Math.round((maxX - minX) / cs)
  const gd = Math.round((maxZ - minZ) / cs)
  const cell: (number)[][] = []
  for (let i = 0; i < gw; i++) {
    cell[i] = []
    for (let j = 0; j < gd; j++) {
      const wx = minX + (i + 0.5) * cs
      const wz = minZ + (j + 0.5) * cs
      let found = -1
      for (let k = 0; k < rooms.length; k++) {
        const r = rooms[k]
        if (wx >= r.x && wx < r.x + r.w && wz >= r.z && wz < r.z + r.d) { found = k; break }
      }
      cell[i][j] = found
    }
  }
  const runs: WallRun[] = []
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= gw || j >= gd) ? -1 : cell[i][j]

  // vertical walls (constant x)
  for (let i = 0; i <= gw; i++) {
    let j = 0
    while (j < gd) {
      const L = at(i - 1, j), R = at(i, j)
      if (L === R) { j++; continue }
      let j2 = j
      while (j2 < gd && at(i - 1, j2) === L && at(i, j2) === R) j2++
      runs.push({
        orient: 'v', fixed: minX + i * cs, from: minZ + j * cs, to: minZ + j2 * cs,
        leftKind: L >= 0 ? rooms[L].kind : null, rightKind: R >= 0 ? rooms[R].kind : null,
        leftId: L >= 0 ? rooms[L].id : null, rightId: R >= 0 ? rooms[R].id : null,
      })
      j = j2
    }
  }
  // horizontal walls (constant z)
  for (let j = 0; j <= gd; j++) {
    let i = 0
    while (i < gw) {
      const L = at(i, j - 1), R = at(i, j)
      if (L === R) { i++; continue }
      let i2 = i
      while (i2 < gw && at(i2, j - 1) === L && at(i2, j) === R) i2++
      runs.push({
        orient: 'h', fixed: minZ + j * cs, from: minX + i * cs, to: minX + i2 * cs,
        leftKind: L >= 0 ? rooms[L].kind : null, rightKind: R >= 0 ? rooms[R].kind : null,
        leftId: L >= 0 ? rooms[L].id : null, rightId: R >= 0 ? rooms[R].id : null,
      })
      i = i2
    }
  }
  return { runs, minX, minZ, maxX, maxZ }
}

const WALL_H = 2.7
const WALL_T = 0.1
const DOOR_H = 2.05
const DOOR_W = 0.95

function buildWalls(scene: THREE.Scene, rooms: Room[]) {
  const { runs } = computeWalls(rooms)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 0.9, side: THREE.DoubleSide })
  const railMat = new THREE.MeshStandardMaterial({ color: 0x55555e, roughness: 0.4, metalness: 0.5 })
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.25, roughness: 0.05 })

  // pick entrance: longest exterior run touching a living room
  let entrance: WallRun | null = null
  for (const r of runs) {
    const exterior = (r.leftKind === null) !== (r.rightKind === null)
    const touchesLiving = r.leftKind === 'living' || r.rightKind === 'living'
    if (exterior && touchesLiving) {
      if (!entrance || (r.to - r.from) > (entrance.to - entrance.from)) entrance = r
    }
  }

  for (const run of runs) {
    const len = run.to - run.from
    if (len < 0.05) continue
    const interior = run.leftKind !== null && run.rightKind !== null
    const exterior = (run.leftKind === null) !== (run.rightKind === null)
    const isBalcony = run.leftKind === 'balcony' || run.rightKind === 'balcony'
    const otherKind = run.leftKind === 'balcony' ? run.rightKind : run.leftKind

    // Balcony edges
    if (isBalcony) {
      if (otherKind === null) {
        addRailing(scene, run, railMat, glassMat)
        continue
      }
      if (otherKind === 'living') {
        // wide sliding-door opening
        addWallRun(scene, run, wallMat, Math.min(len - 0.4, 2.6))
        continue
      }
      addWallRun(scene, run, wallMat, 0)
      continue
    }

    if (interior) {
      addWallRun(scene, run, wallMat, len >= 1.3 ? DOOR_W : 0)
      continue
    }
    if (exterior) {
      const isEntrance = run === entrance
      addWallRun(scene, run, wallMat, isEntrance ? 1.0 : 0, !isEntrance && len >= 1.8 ? glassMat : undefined)
      continue
    }
  }
}

function segMesh(mat: THREE.Material, orient: 'h' | 'v', fixed: number, a: number, b: number, y: number, h: number) {
  const len = b - a
  const geo = orient === 'h'
    ? new THREE.BoxGeometry(len, h, WALL_T)
    : new THREE.BoxGeometry(WALL_T, h, len)
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true; m.receiveShadow = true
  if (orient === 'h') m.position.set(a + len / 2, y, fixed)
  else m.position.set(fixed, y, a + len / 2)
  return m
}

function addWallRun(scene: THREE.Scene, run: WallRun, mat: THREE.Material, doorW: number, windowMat?: THREE.Material) {
  const { orient, fixed, from, to } = run
  const len = to - from
  if (doorW > 0 && len > doorW + 0.4) {
    const mid = (from + to) / 2
    scene.add(segMesh(mat, orient, fixed, from, mid - doorW / 2, WALL_H / 2, WALL_H))
    scene.add(segMesh(mat, orient, fixed, mid + doorW / 2, to, WALL_H / 2, WALL_H))
    // lintel
    scene.add(segMesh(mat, orient, fixed, mid - doorW / 2, mid + doorW / 2, DOOR_H + (WALL_H - DOOR_H) / 2, WALL_H - DOOR_H))
  } else {
    scene.add(segMesh(mat, orient, fixed, from, to, WALL_H / 2, WALL_H))
  }
  // Window: glass panel inset on exterior walls
  if (windowMat && len >= 1.8) {
    const mid = (from + to) / 2
    const ww = Math.min(len - 0.8, 2.2)
    const win = segMesh(windowMat, orient, fixed, mid - ww / 2, mid + ww / 2, 1.5, 1.2)
    scene.add(win)
  }
}

function addRailing(scene: THREE.Scene, run: WallRun, railMat: THREE.Material, glassMat: THREE.Material) {
  const { orient, fixed, from, to } = run
  // glass panel
  scene.add(segMesh(glassMat, orient, fixed, from, to, 0.55, 1.0))
  // top rail
  scene.add(segMesh(railMat, orient, fixed, from, to, 1.08, 0.08))
  // bottom rail
  scene.add(segMesh(railMat, orient, fixed, from, to, 0.06, 0.08))
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  flat: Flat
  isOffice?: boolean
}

export default function FlatInterior3D({ flat, isOffice = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [mode, setMode] = useState<'walk' | 'overview'>('overview')
  const goToRef = useRef<((roomId: string) => void) | null>(null)
  const setOverviewRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const W = mount.clientWidth, H = mount.clientHeight

    const layout = isOffice || /office/.test(flat.flat_type)
      ? getOfficeLayout(flat.flat_type)
      : getLayout(flat.flat_type)
    setRooms(layout)

    let cMinX = Infinity, cMinZ = Infinity, cMaxX = -Infinity, cMaxZ = -Infinity
    for (const r of layout) {
      cMinX = Math.min(cMinX, r.x); cMinZ = Math.min(cMinZ, r.z)
      cMaxX = Math.max(cMaxX, r.x + r.w); cMaxZ = Math.max(cMaxZ, r.z + r.d)
    }
    const apCx = (cMinX + cMaxX) / 2
    const apCz = (cMinZ + cMaxZ) / 2
    const apW = cMaxX - cMinX
    const apD = cMaxZ - cMinZ

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xdce4ec)
    scene.fog = new THREE.Fog(0xdce4ec, 40, 90)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 300)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2)
    sun.position.set(apCx + 15, 30, apCz - 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 100
    const sc = sun.shadow.camera as THREE.OrthographicCamera
    sc.left = -apW; sc.right = apW; sc.top = apD; sc.bottom = -apD
    sc.updateProjectionMatrix()
    sun.shadow.bias = -0.0004
    scene.add(sun)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8275, 0.9))

    // Base slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(apW + 2, 0.3, apD + 2),
      new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 0.95 })
    )
    slab.position.set(apCx, -0.15, apCz)
    slab.receiveShadow = true
    scene.add(slab)

    // Per-room floor
    for (const r of layout) {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(r.w - 0.02, 0.06, r.d - 0.02),
        new THREE.MeshStandardMaterial({ color: ROOM_TINT[r.kind], roughness: 0.7 })
      )
      floor.position.set(r.x + r.w / 2, 0.03, r.z + r.d / 2)
      floor.receiveShadow = true
      scene.add(floor)
    }

    buildWalls(scene, layout)
    for (const r of layout) furnishRoom(scene, r)

    // ── Camera control ──────────────────────────────────────────────────────
    const camPos = new THREE.Vector3()
    const camLook = new THREE.Vector3()
    const tgtPos = new THREE.Vector3()
    const tgtLook = new THREE.Vector3()

    // walk state
    const walk = { x: apCx, z: apCz, yaw: 0, pitch: -0.05 }
    // overview state
    const orbit = { theta: -Math.PI / 4, phi: 0.62, radius: Math.max(apW, apD) * 1.5 }
    let curMode: 'walk' | 'overview' = 'overview'

    function applyOverview() {
      const r = orbit.radius
      tgtPos.set(
        apCx + r * Math.sin(orbit.phi) * Math.cos(orbit.theta),
        r * Math.cos(orbit.phi),
        apCz + r * Math.sin(orbit.phi) * Math.sin(orbit.theta)
      )
      tgtLook.set(apCx, 1, apCz)
    }
    function applyWalk() {
      tgtPos.set(walk.x, 1.6, walk.z)
      const dx = Math.cos(walk.pitch) * Math.sin(walk.yaw)
      const dy = Math.sin(walk.pitch)
      const dz = Math.cos(walk.pitch) * Math.cos(walk.yaw)
      tgtLook.set(walk.x + dx, 1.6 + dy, walk.z + dz)
    }
    applyOverview()
    camPos.copy(tgtPos); camLook.copy(tgtLook)

    function goToRoom(roomId: string) {
      const r = layout.find((x) => x.id === roomId)
      if (!r) return
      curMode = 'walk'
      setMode('walk')
      setActiveRoom(roomId)
      const rcx = r.x + r.w / 2, rcz = r.z + r.d / 2
      let dirx = rcx - apCx, dirz = rcz - apCz
      const dl = Math.hypot(dirx, dirz) || 1
      dirx /= dl; dirz /= dl
      const back = Math.min(Math.min(r.w, r.d) * 0.32, 1.5)
      walk.x = rcx - dirx * back
      walk.z = rcz - dirz * back
      walk.yaw = Math.atan2(rcx - walk.x, rcz - walk.z)
      walk.pitch = -0.05
      applyWalk()
    }
    function goOverview() {
      curMode = 'overview'
      setMode('overview')
      setActiveRoom(null)
      applyOverview()
    }
    goToRef.current = goToRoom
    setOverviewRef.current = goOverview

    // Input
    let isDown = false, lastX = 0, lastY = 0, downX = 0, downY = 0
    const keys = new Set<string>()

    const onDown = (e: MouseEvent) => {
      isDown = true; lastX = downX = e.clientX; lastY = downY = e.clientY
      mount.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      if (!isDown) return
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      lastX = e.clientX; lastY = e.clientY
      if (curMode === 'overview') {
        orbit.theta -= dx * 0.006
        orbit.phi = Math.max(0.15, Math.min(1.35, orbit.phi - dy * 0.006))
        applyOverview()
      } else {
        walk.yaw -= dx * 0.005
        walk.pitch = Math.max(-0.7, Math.min(0.7, walk.pitch - dy * 0.005))
        applyWalk()
      }
    }
    const onUp = () => { isDown = false; mount.style.cursor = 'grab' }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (curMode === 'overview') {
        orbit.radius = Math.max(4, Math.min(60, orbit.radius + e.deltaY * 0.02))
        applyOverview()
      } else {
        const fx = Math.sin(walk.yaw), fz = Math.cos(walk.yaw)
        const step = -e.deltaY * 0.004
        walk.x = Math.max(cMinX + 0.4, Math.min(cMaxX - 0.4, walk.x + fx * step))
        walk.z = Math.max(cMinZ + 0.4, Math.min(cMaxZ - 0.4, walk.z + fz * step))
        applyWalk()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keys.add(k); e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())

    // touch
    let touchDownX = 0, touchDownY = 0, lastTouchDist = 0
    const onTouchStart = (e: TouchEvent) => {
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
        if (curMode === 'overview') {
          orbit.radius = Math.max(4, Math.min(60, orbit.radius + (lastTouchDist - d) * 0.05))
          applyOverview()
        }
        lastTouchDist = d
      } else if (isDown) {
        const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
        if (curMode === 'overview') {
          orbit.theta -= dx * 0.007
          orbit.phi = Math.max(0.15, Math.min(1.35, orbit.phi - dy * 0.007))
          applyOverview()
        } else {
          walk.yaw -= dx * 0.006
          walk.pitch = Math.max(-0.7, Math.min(0.7, walk.pitch - dy * 0.006))
          applyWalk()
        }
      }
    }
    const onTouchEnd = () => { isDown = false }

    mount.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    mount.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    mount.addEventListener('touchstart', onTouchStart, { passive: false })
    mount.addEventListener('touchmove', onTouchMove, { passive: false })
    mount.addEventListener('touchend', onTouchEnd)

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    let animId = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      // WASD walk
      if (curMode === 'walk' && keys.size > 0) {
        const fx = Math.sin(walk.yaw), fz = Math.cos(walk.yaw)
        const sx = Math.cos(walk.yaw), sz = -Math.sin(walk.yaw)
        const sp = 0.06
        let mx = 0, mz = 0
        if (keys.has('w') || keys.has('arrowup')) { mx += fx; mz += fz }
        if (keys.has('s') || keys.has('arrowdown')) { mx -= fx; mz -= fz }
        if (keys.has('d') || keys.has('arrowright')) { mx += sx; mz += sz }
        if (keys.has('a') || keys.has('arrowleft')) { mx -= sx; mz -= sz }
        walk.x = Math.max(cMinX + 0.4, Math.min(cMaxX - 0.4, walk.x + mx * sp))
        walk.z = Math.max(cMinZ + 0.4, Math.min(cMaxZ - 0.4, walk.z + mz * sp))
        applyWalk()
      }
      camPos.lerp(tgtPos, 0.12)
      camLook.lerp(tgtLook, 0.12)
      camera.position.copy(camPos)
      camera.lookAt(camLook)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      mount.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      mount.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      mount.removeEventListener('touchstart', onTouchStart)
      mount.removeEventListener('touchmove', onTouchMove)
      mount.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat.id, flat.flat_type, isOffice])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />

      {/* Room navigation */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ maxWidth: 180 }}>
        <button
          onClick={() => setOverviewRef.current?.()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            mode === 'overview'
              ? { background: '#0071e3', color: '#fff' }
              : { background: 'rgba(255,255,255,0.92)', color: '#1d1d1f', backdropFilter: 'blur(8px)' }
          }
        >
          <span style={{ fontSize: 13 }}>⌂</span> Dollhouse View
        </button>
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => goToRef.current?.(r.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left"
            style={
              activeRoom === r.id
                ? { background: '#1d1d1f', color: '#fff' }
                : { background: 'rgba(255,255,255,0.85)', color: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }
            }
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: '#' + ROOM_TINT[r.kind].toString(16).padStart(6, '0') }}
            />
            {r.name}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      >
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {mode === 'overview'
            ? 'Drag to orbit · Scroll to zoom · Pick a room to step inside'
            : 'Drag to look · W A S D / scroll to walk · Pick another room'}
        </span>
      </div>
    </div>
  )
}
