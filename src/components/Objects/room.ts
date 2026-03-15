import * as THREE from 'three'

export function createRoom(): THREE.Object3D[] {
  const mat = (color: number, rough = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough })

  // Back wall — warm mid grey
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.5), mat(0x5e5e66))
  wall.position.set(0, 1.4, -0.38)

  // Floor — warm mid-tone
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), mat(0x48474e, 0.92))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0

  // Desk surface — mid grey
  const deskMat = mat(0x63636c, 0.75)
  const surface = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.85), deskMat)
  surface.position.set(0, 0.285, 0.15)

  // Desk side panels
  const sideMat = mat(0x585860, 0.80)
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.81), sideMat)
  leftSide.position.set(-1.08, 0.14, 0.15)
  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.81), sideMat)
  rightSide.position.set(1.08, 0.14, 0.15)

  // Desk back panel
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.28, 0.04), sideMat)
  backPanel.position.set(0, 0.14, -0.24)

  return [wall, floor, surface, leftSide, rightSide, backPanel]
}

// ── Shelf ───────────────────────────────────────────────────────────

export function createShelf() {
  const group = new THREE.Group()
  group.position.set(0.4, 1.88, -0.36)

  const plankMat = new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: 0.8 })
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.18), plankMat)
  group.add(plank)

  // Brackets
  for (const x of [-0.5, 0.5]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.16),
      plankMat,
    )
    bracket.position.set(x, -0.04, 0)
    group.add(bracket)
  }

  // Books
  const bookColors = [0x8b4513, 0x2f4f4f, 0x6b1010, 0x3b2080, 0x1a5030]
  for (let i = 0; i < 5; i++) {
    const h = 0.12 + Math.random() * 0.06
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, h, 0.10),
      new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.9 }),
    )
    book.position.set(-0.35 + i * 0.07, h / 2 + 0.015, 0)
    group.add(book)
  }

  return { group }
}

// ── Clock ───────────────────────────────────────────────────────────

export function createClock() {
  const group = new THREE.Group()
  group.position.set(-1.05, 1.88, -0.36)

  // Face
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.10, 24),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }),
  )
  face.position.z = 0.001
  group.add(face)

  // Rim
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.095, 0.105, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.4 }),
  )
  rim.position.z = 0.002
  group.add(rim)

  // Hour hand — geometry shifted so bottom is at origin, mesh at clock center
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.055, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  hourHand.position.set(0, 0, 0.003)
  hourHand.geometry.translate(0, 0.0275, 0)
  group.add(hourHand)

  // Minute hand
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.075, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  minuteHand.position.set(0, 0, 0.004)
  minuteHand.geometry.translate(0, 0.0375, 0)
  group.add(minuteHand)

  // Second hand — thin, red
  const secondHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.080, 0.002),
    new THREE.MeshBasicMaterial({ color: 0xcc2222 }),
  )
  secondHand.position.set(0, 0, 0.005)
  secondHand.geometry.translate(0, 0.040, 0)
  group.add(secondHand)

  // Center dot
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.006, 8),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  dot.position.z = 0.006
  group.add(dot)

  return { group, hourHand, minuteHand, secondHand }
}
