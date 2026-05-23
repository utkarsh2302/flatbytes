'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Flat } from '@/lib/types'
import {
  analyzeLivingExperience,
  type VastuRating,
  type VastuRoom,
} from '@/lib/living-experience'
import { Sun, Sparkles, Thermometer, Play, Pause } from 'lucide-react'

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

// ── Living Experience helpers ─────────────────────────────────────────────────

type LiveMode = 'sunlight' | 'vastu' | 'heat'

const VASTU_HEX: Record<VastuRating, number> = {
  excellent: 0x1cc77f,
  good: 0x3b82f6,
  moderate: 0xf59e0b,
  unfavorable: 0xef4444,
}

const VASTU_CSS: Record<VastuRating, string> = {
  excellent: '#1cc77f',
  good: '#3b82f6',
  moderate: '#f59e0b',
  unfavorable: '#ef4444',
}

const HEAT_HEX = {
  cool: 0x60a5fa,
  warm: 0xfbbf24,
  hot: 0xef4444,
} as const

function vastuForRoomKind(kind: RoomKind, vastuRooms: VastuRoom[]): VastuRating {
  const nameMap: Partial<Record<RoomKind, string>> = {
    living: 'Living Room',
    master: 'Master Bedroom',
    bedroom: "Children's Room",
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    balcony: 'Balcony',
  }
  const name = nameMap[kind]
  if (!name) return 'good'
  return vastuRooms.find((r) => r.name === name)?.rating ?? 'good'
}

function vastuRoomFor(kind: RoomKind, vastuRooms: VastuRoom[]): VastuRoom | undefined {
  const nameMap: Partial<Record<RoomKind, string>> = {
    living: 'Living Room',
    master: 'Master Bedroom',
    bedroom: "Children's Room",
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    balcony: 'Balcony',
  }
  const name = nameMap[kind]
  return name ? vastuRooms.find((r) => r.name === name) : undefined
}

function heatForRoom(kind: RoomKind, facingLabel: string): 'cool' | 'warm' | 'hot' {
  const f = facingLabel.toLowerCase()
  if (kind === 'master' || kind === 'bedroom' || kind === 'bathroom') return 'cool'
  if (kind === 'balcony' || kind === 'living' || kind === 'kitchen') {
    if (f.includes('west') || f.includes('south-west')) return 'hot'
    if (f.includes('south')) return 'warm'
    return 'cool'
  }
  return 'warm'
}

// Sun world position based on time + flat facing
function sunPositionForTime(time: number, facingAngle: number, apCx: number, apCz: number) {
  if (time < 5.5 || time > 18.5) return null
  const sunCompass = 90 + ((time - 6) / 12) * 180 // 6am=E(90), 12pm=S(180), 6pm=W(270)
  const relAngle = sunCompass - facingAngle      // 0 = front of balcony, 90 = right
  const altDeg = Math.sin(((time - 6) / 12) * Math.PI) * 75
  const altRad = (altDeg * Math.PI) / 180
  const dist = 55
  const radH = (relAngle * Math.PI) / 180
  const horiz = dist * Math.cos(altRad)
  // In scene: -Z = front of flat (toward balcony)
  return {
    x: apCx + horiz * Math.sin(radH),
    y: dist * Math.sin(altRad) + 3,
    z: apCz - horiz * Math.cos(radH),
  }
}

function sunSettingsForTime(time: number) {
  if (time < 5.5 || time > 19) return { color: 0x6a8eaa, intensity: 0.0 }
  if (time < 6.5)  return { color: 0xff9170, intensity: 1.1 }
  if (time < 10)   return { color: 0xfff0c4, intensity: 2.1 }
  if (time < 15)   return { color: 0xfff8e0, intensity: 2.6 }
  if (time < 17)   return { color: 0xffd590, intensity: 2.1 }
  if (time < 18.5) return { color: 0xff8050, intensity: 1.5 }
  return { color: 0x6a8eaa, intensity: 0.2 }
}

function ambientForTime(time: number) {
  if (time < 5 || time > 19.5)   return { ambient: 0.55, hemi: 0.3 } // night
  if (time < 6.5 || time > 18)   return { ambient: 0.9,  hemi: 0.55 } // twilight
  return { ambient: 1.5, hemi: 0.9 } // day
}

function skyHexForTime(time: number): number {
  if (time < 5)    return 0x0a1428
  if (time < 6)    return 0x4c3470
  if (time < 7)    return 0xf5a472
  if (time < 10)   return 0xb8d8ec
  if (time < 15)   return 0x7dc6eb
  if (time < 17)   return 0xc5d6e0
  if (time < 18.5) return 0xeb8a45
  if (time < 20)   return 0x6a3a5a
  return 0x0a1428
}

function timeLabel(t: number): string {
  const hr = Math.floor(t)
  const mn = Math.floor((t - hr) * 60)
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
  const ampm = hr < 12 ? 'AM' : 'PM'
  return `${hr12}:${String(mn).padStart(2, '0')} ${ampm}`
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  flat: Flat
  isOffice?: boolean
}

export default function FlatInterior3D({ flat, isOffice = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [camMode, setCamMode] = useState<'walk' | 'overview'>('overview')
  const [time, setTime] = useState(10) // 10 AM by default — warm morning light
  const [liveMode, setLiveMode] = useState<LiveMode>('sunlight')
  const [playing, setPlaying] = useState(false)

  const layout = useMemo(
    () => (isOffice || /office/.test(flat.flat_type) ? getOfficeLayout(flat.flat_type) : getLayout(flat.flat_type)),
    [flat.flat_type, isOffice],
  )
  const data = useMemo(
    () => analyzeLivingExperience(flat.facing ?? null, flat.floor, flat.flat_type, flat.carpet_area_sqft ?? 0),
    [flat.facing, flat.floor, flat.flat_type, flat.carpet_area_sqft],
  )

  // Live-update refs (set inside scene useEffect, read by time/mode useEffect)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null)
  const sunMeshRef = useRef<THREE.Mesh | null>(null)
  const sunGlowRef = useRef<THREE.Mesh | null>(null)
  const ambientRef = useRef<THREE.AmbientLight | null>(null)
  const hemiRef = useRef<THREE.HemisphereLight | null>(null)
  const fogRef = useRef<THREE.Fog | null>(null)
  const roomFloorsRef = useRef<Map<string, THREE.Mesh>>(new Map())

  const goToRef = useRef<((roomId: string) => void) | null>(null)
  const setOverviewRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const W = mount.clientWidth, H = mount.clientHeight

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
    const sceneFog = new THREE.Fog(0xdce4ec, 40, 110)
    scene.fog = sceneFog
    sceneRef.current = scene
    fogRef.current = sceneFog

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

    // Lighting (initial values; live time effect updates them)
    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambient)
    ambientRef.current = ambient

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2)
    sun.position.set(apCx + 15, 30, apCz - 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 140
    const sc = sun.shadow.camera as THREE.OrthographicCamera
    sc.left = -apW; sc.right = apW; sc.top = apD; sc.bottom = -apD
    sc.updateProjectionMatrix()
    sun.shadow.bias = -0.0004
    scene.add(sun)
    sunLightRef.current = sun

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8275, 0.9)
    scene.add(hemi)
    hemiRef.current = hemi

    // Visible sun sphere + outer glow — moves with the directional light
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff4a0 }),
    )
    scene.add(sunMesh)
    sunMeshRef.current = sunMesh

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff4a0, transparent: true, opacity: 0.18 }),
    )
    scene.add(sunGlow)
    sunGlowRef.current = sunGlow

    // Base slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(apW + 2, 0.3, apD + 2),
      new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 0.95 })
    )
    slab.position.set(apCx, -0.15, apCz)
    slab.receiveShadow = true
    scene.add(slab)

    // Per-room floor — keep refs so we can tint per liveMode
    roomFloorsRef.current.clear()
    for (const r of layout) {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(r.w - 0.02, 0.06, r.d - 0.02),
        new THREE.MeshStandardMaterial({ color: ROOM_TINT[r.kind], roughness: 0.7 })
      )
      floor.position.set(r.x + r.w / 2, 0.03, r.z + r.d / 2)
      floor.receiveShadow = true
      scene.add(floor)
      roomFloorsRef.current.set(r.id, floor)
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
      setCamMode('walk')
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
      setCamMode('overview')
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
      sceneRef.current = null
      sunLightRef.current = null
      sunMeshRef.current = null
      sunGlowRef.current = null
      ambientRef.current = null
      hemiRef.current = null
      fogRef.current = null
      roomFloorsRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat.id, flat.flat_type, isOffice, layout])

  // ── Live time-of-day + mode updates ───────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    const sun = sunLightRef.current
    const sunMesh = sunMeshRef.current
    const sunGlow = sunGlowRef.current
    const ambient = ambientRef.current
    const hemi = hemiRef.current
    if (!scene || !sun || !sunMesh || !sunGlow || !ambient || !hemi) return

    // Layout center
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
    for (const r of layout) {
      minX = Math.min(minX, r.x); minZ = Math.min(minZ, r.z)
      maxX = Math.max(maxX, r.x + r.w); maxZ = Math.max(maxZ, r.z + r.d)
    }
    const apCx = (minX + maxX) / 2, apCz = (minZ + maxZ) / 2

    // Position the sun
    const pos = sunPositionForTime(time, data.facingAngle, apCx, apCz)
    if (pos) {
      sun.position.set(pos.x, pos.y, pos.z)
      sunMesh.position.set(pos.x, pos.y, pos.z)
      sunGlow.position.set(pos.x, pos.y, pos.z)
      sunMesh.visible = true
      sunGlow.visible = true
    } else {
      sunMesh.visible = false
      sunGlow.visible = false
    }

    // Light color + intensity
    const settings = sunSettingsForTime(time)
    sun.color.setHex(settings.color)
    sun.intensity = settings.intensity
    ;(sunMesh.material as THREE.MeshBasicMaterial).color.setHex(settings.color)
    ;(sunGlow.material as THREE.MeshBasicMaterial).color.setHex(settings.color)

    const amb = ambientForTime(time)
    ambient.intensity = amb.ambient
    hemi.intensity = amb.hemi

    // Sky + fog
    const skyHex = skyHexForTime(time)
    ;(scene.background as THREE.Color).setHex(skyHex)
    if (fogRef.current) fogRef.current.color.setHex(skyHex)

    // Mode-driven floor tint
    for (const r of layout) {
      const floor = roomFloorsRef.current.get(r.id)
      if (!floor) continue
      const mat = floor.material as THREE.MeshStandardMaterial
      if (liveMode === 'vastu') {
        mat.color.setHex(VASTU_HEX[vastuForRoomKind(r.kind, data.vastuRooms)])
      } else if (liveMode === 'heat') {
        mat.color.setHex(HEAT_HEX[heatForRoom(r.kind, data.facingLabel)])
      } else {
        mat.color.setHex(ROOM_TINT[r.kind])
      }
    }
  }, [time, liveMode, layout, data])

  // Auto-play full day cycle
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setTime((t) => (t + 0.18) % 24), 80)
    return () => clearInterval(id)
  }, [playing])

  const activeRoomData = activeRoom ? layout.find((r) => r.id === activeRoom) : null
  const activeVastu = activeRoomData ? vastuRoomFor(activeRoomData.kind, data.vastuRooms) : undefined
  const isNight = time < 5.5 || time > 19

  const MODE_PILLS: { id: LiveMode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'sunlight', label: 'Sunlight', icon: <Sun className="w-3 h-3" />,        color: '#f59e0b' },
    { id: 'vastu',    label: 'Vastu',    icon: <Sparkles className="w-3 h-3" />,   color: '#a855f7' },
    { id: 'heat',     label: 'Heat',     icon: <Thermometer className="w-3 h-3" />, color: '#ef4444' },
  ]

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />

      {/* Room navigation — top-left */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ maxWidth: 180 }}>
        <button
          onClick={() => setOverviewRef.current?.()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            camMode === 'overview'
              ? { background: '#0071e3', color: '#fff' }
              : { background: 'rgba(255,255,255,0.92)', color: '#1d1d1f', backdropFilter: 'blur(8px)' }
          }
        >
          <span style={{ fontSize: 13 }}>⌂</span> Dollhouse View
        </button>
        {layout.map((r) => {
          const isActive = activeRoom === r.id
          const rating = liveMode === 'vastu' ? vastuForRoomKind(r.kind, data.vastuRooms) : null
          return (
            <button
              key={r.id}
              onClick={() => goToRef.current?.(r.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left"
              style={
                isActive
                  ? { background: '#1d1d1f', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.85)', color: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: rating ? VASTU_CSS[rating] : '#' + ROOM_TINT[r.kind].toString(16).padStart(6, '0') }}
              />
              {r.name}
            </button>
          )
        })}
      </div>

      {/* Time + facing card — top-right */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2" style={{ maxWidth: 240 }}>
        <div
          className="rounded-2xl px-3.5 py-2.5"
          style={{ background: 'rgba(13,17,23,0.78)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center gap-2.5">
            {/* Compass */}
            <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx={18} cy={18} r={16} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <g transform={`rotate(${-data.facingAngle} 18 18)`}>
                <polygon points="18,5 16,18 20,18" fill="#ef4444" />
                <polygon points="18,31 16,18 20,18" fill="rgba(255,255,255,0.4)" />
              </g>
              <text x={18} y={4.5} fontSize={5} fontWeight="700" fill="rgba(255,255,255,0.7)" textAnchor="middle">N</text>
            </svg>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {data.facingLabel} · Floor {flat.floor}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {timeLabel(time)} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{isNight ? 'NIGHT' : time < 12 ? 'MORNING' : time < 17 ? 'AFTERNOON' : 'EVENING'}</span>
              </div>
            </div>
          </div>

          {/* Time scrubber */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? 'Pause' : 'Play day'}
              style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: playing ? '#0071e3' : 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {playing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" style={{ marginLeft: 1 }} />}
            </button>
            <input
              type="range" min={0} max={23.9} step={0.1} value={time}
              onChange={(e) => { setTime(Number(e.target.value)); setPlaying(false) }}
              style={{ flex: 1, accentColor: isNight ? '#94a3b8' : '#fbbf24', height: 3 }}
            />
          </div>
        </div>

        {/* Mode pills */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(13,17,23,0.78)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {MODE_PILLS.map((m) => (
            <button
              key={m.id} onClick={() => setLiveMode(m.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: liveMode === m.id ? m.color : 'transparent',
                color: liveMode === m.id ? '#fff' : 'rgba(255,255,255,0.55)',
                border: 'none', cursor: 'pointer',
                boxShadow: liveMode === m.id ? `0 0 14px ${m.color}66` : 'none',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active room callout — short, no paragraphs */}
      {activeRoomData && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-2xl px-4 py-2.5"
          style={{
            bottom: 56, background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: 12, maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{activeRoomData.name}</div>
          {activeVastu && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.04em',
              background: VASTU_CSS[activeVastu.rating] + '33', color: VASTU_CSS[activeVastu.rating],
            }}>
              {activeVastu.rating === 'unfavorable' ? 'Needs Attention' : activeVastu.rating} · {activeVastu.direction}
            </span>
          )}
          {liveMode === 'sunlight' && !isNight && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'rgba(245,158,11,0.18)', color: '#fbbf24' }}>
              ☀ {time < 11 ? 'Morning light' : time < 16 ? 'Midday light' : 'Evening light'}
            </span>
          )}
          {liveMode === 'heat' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, textTransform: 'uppercase',
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            }}>
              {heatForRoom(activeRoomData.kind, data.facingLabel)} zone
            </span>
          )}
        </div>
      )}

      {/* Hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full pointer-events-none whitespace-nowrap"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
          {camMode === 'overview'
            ? 'Drag to orbit · scroll to zoom · pick a room to step inside · scrub time to watch the sun move'
            : 'Drag to look · WASD / scroll to walk · scrub time to see how light fills this room'}
        </span>
      </div>
    </div>
  )
}
