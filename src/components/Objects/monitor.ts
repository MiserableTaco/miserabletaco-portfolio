import * as THREE from 'three'
import { MONITOR } from '@/utils/constants'

/** Build a chunky low-poly CRT monitor with multi-material faces for 3D readability. */
export function createMonitor() {
  const group = new THREE.Group()
  group.position.set(MONITOR.position.x, MONITOR.position.y, MONITOR.position.z)
  group.rotation.x = MONITOR.tilt

  const W = MONITOR.bezel.width
  const H = MONITOR.bezel.height
  const D = MONITOR.bezel.depth

  // Apple-style brushed aluminum — true silver with metalness 1.0
  // color: 0xE3E4E6 (measured Apple aluminum reflectance), roughness ~0.35
  // Multi-material: [+x right, -x left, +y top, -y bottom, +z front, -z back]
  const alum = (c: number, r: number) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 1.0 })
  const bezelMats = [
    alum(0xDCDDE0, 0.35),  // right
    alum(0xD8D9DC, 0.35),  // left
    alum(0xEAEBED, 0.28),  // top — catches ceiling light
    alum(0xC8C9CC, 0.42),  // bottom — in shadow
    alum(0xE3E4E6, 0.32),  // front — primary visible face
    alum(0xD4D5D8, 0.38),  // back
  ]

  // Main bezel
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bezelMats)
  group.add(bezel)

  // CRT body — rear housing, slightly darker aluminum
  const crtDepth = 0.30
  const crtMats = [
    alum(0xD4D5D8, 0.38),
    alum(0xD0D1D4, 0.38),
    alum(0xE0E1E4, 0.30),  // top — visible from camera
    alum(0xC0C1C4, 0.44),
    alum(0xD8D9DC, 0.35),
    alum(0xD0D1D4, 0.38),
  ]
  const crtBody = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.92, H * 0.85, crtDepth),
    crtMats,
  )
  crtBody.position.z = -(D / 2 + crtDepth / 2)
  group.add(crtBody)

  // Rear taper
  const rearDepth = 0.08
  const rearBody = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.55, H * 0.50, rearDepth),
    crtMats,
  )
  rearBody.position.z = -(D / 2 + crtDepth + rearDepth / 2)
  group.add(rearBody)

  // Vents on CRT body top — dark slots cut into aluminum
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
  const crtTopY = H * 0.85 / 2
  for (let i = 0; i < 9; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.005, 0.01), ventMat)
    slot.position.set(-0.22 + i * 0.055, crtTopY, -(D / 2 + crtDepth * 0.4))
    group.add(slot)
  }

  // Screen — flush with bezel front face
  const frontZ = D / 2 + 0.001
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MONITOR.screen.width, MONITOR.screen.height),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  )
  screenMesh.position.z = frontZ
  group.add(screenMesh)

  // --- Front panel details (below screen, in bezel bottom strip) ---
  // The bottom bezel strip is 0.10 units tall, centered at y = -(H/2 - 0.05)
  const panelY = -(H / 2 - 0.05)

  // Brand plate — polished inset strip
  const brandPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.03, 0.006),
    new THREE.MeshStandardMaterial({ color: 0xF0F0F2, roughness: 0.10, metalness: 1.0 }),
  )
  brandPlate.position.set(-0.10, panelY, frontZ + 0.003)
  group.add(brandPlate)

  // Speaker grille — dark slits clearly visible against bright silver
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  for (let i = 0; i < 5; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.005, 0.005), grilleMat)
    slit.position.set(-0.55, panelY + (i - 2) * 0.012, frontZ + 0.004)
    group.add(slit)
  }

  // Adjustment knobs — darker aluminum cylinders
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xB0B0B4, roughness: 0.20, metalness: 1.0 })
  for (let i = 0; i < 3; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), knobMat)
    knob.rotation.x = Math.PI / 2
    knob.position.set(0.30 + i * 0.07, panelY, frontZ + 0.006)
    group.add(knob)
  }

  // Power LED — bright green indicator
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x00cc44,
    emissive: 0x00cc44,
    emissiveIntensity: 0.6,
  })
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), ledMaterial)
  led.position.set(0.56, panelY, frontZ + 0.008)
  group.add(led)

  // Power button — dark contrasting button, protrudes past bezel for raycasting
  const btn = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.2 }),
  )
  btn.position.set(0.66, panelY, frontZ + 0.015)
  btn.userData = { id: 'power_button', interactive: true }
  group.add(btn)

  // Stand — matching Apple silver aluminum
  const standMats = [
    alum(0xD8D9DC, 0.35),
    alum(0xD4D5D8, 0.35),
    alum(0xE6E7EA, 0.28),
    alum(0xC4C5C8, 0.42),
    alum(0xDCDDE0, 0.32),
    alum(0xD4D5D8, 0.38),
  ]
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.20), standMats)
  neck.position.set(0, -0.70, -0.02)
  group.add(neck)

  // Base — wide, sits on desk
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.025, 0.34), standMats)
  base.position.set(0, -0.80, 0.02)
  group.add(base)

  return { group, ledMaterial, screenMesh }
}
