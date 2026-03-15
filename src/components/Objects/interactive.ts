import * as THREE from 'three'

export function createCoffeeMug(): THREE.Group {
  const mug = new THREE.Group()
  mug.position.set(-0.48, 0.35, 0.50)
  mug.userData = { interactive: true, id: 'coffee_mug' }

  const mugMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.040, 0.09, 10), mugMat)
  mug.add(body)

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.030, 0.008, 6, 8, Math.PI),
    mugMat,
  )
  handle.rotation.y = Math.PI / 2
  handle.position.set(0.045, 0, 0)
  mug.add(handle)

  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.008, 10),
    new THREE.MeshBasicMaterial({ color: 0x3a1a08 }),
  )
  coffee.position.y = 0.040
  mug.add(coffee)
  mug.userData.coffee = coffee

  // Steam particles (float upward, loop)
  const steam: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }),
    )
    p.position.set(
      (Math.random() - 0.5) * 0.02,
      0.055 + i * 0.022,
      (Math.random() - 0.5) * 0.02,
    )
    mug.add(p)
    steam.push(p)
  }
  mug.userData.steam = steam

  return mug
}

export function createPapers(): THREE.Group {
  const papers = new THREE.Group()
  papers.position.set(0.55, 0.31, 0.38)
  papers.rotation.y = 0.25
  papers.userData = { interactive: true, id: 'papers' }

  for (let i = 0; i < 3; i++) {
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.001, 0.17),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 }),
    )
    paper.position.y = i * 0.002
    paper.rotation.y = (i - 1) * 0.04
    papers.add(paper)
  }

  return papers
}

export function createDeskLamp(): THREE.Group {
  const lamp = new THREE.Group()
  lamp.position.set(0.75, 0.305, 0.18)
  lamp.userData = { interactive: true, id: 'desk_lamp' }

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.25, metalness: 0.5 })

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.015, 10), metalMat)
  lamp.add(base)

  // Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), metalMat)
  arm.position.y = 0.10
  lamp.add(arm)

  // Shade
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.05, 8, 1, true), metalMat)
  shade.position.y = 0.20
  shade.rotation.x = Math.PI
  lamp.add(shade)

  // Light (starts off)
  const light = new THREE.PointLight(0xffcc66, 0, 1.5)
  light.position.set(0.75, 0.305 + 0.18, 0.18)
  lamp.userData.light = light

  return lamp
}

export function createPenCup(): THREE.Group {
  const cup = new THREE.Group()
  cup.position.set(0.65, 0.34, 0.32)
  cup.userData = { interactive: true, id: 'pen_cup' }

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.028, 0.070, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 }),
  )
  cup.add(body)

  const penColors = [0x0040cc, 0xcc2020, 0x111111]
  for (let i = 0; i < 3; i++) {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.085, 4),
      new THREE.MeshStandardMaterial({ color: penColors[i] }),
    )
    pen.position.set((i - 1) * 0.010, 0.042, 0)
    pen.rotation.z = (i - 1) * 0.08
    cup.add(pen)
  }

  return cup
}

export function createPlant(): THREE.Group {
  const plant = new THREE.Group()
  plant.position.set(-0.75, 0.34, 0.18)
  plant.userData = { interactive: true, id: 'plant' }

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.035, 0.055, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8 }),
  )
  plant.add(pot)

  // Soil
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.006, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 }),
  )
  soil.position.y = 0.028
  plant.add(soil)

  // Leaves
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.020, 0.070, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d5a16, roughness: 0.7 }),
    )
    const angle = (i / 4) * Math.PI * 2
    leaf.position.set(Math.cos(angle) * 0.016, 0.06, Math.sin(angle) * 0.016)
    leaf.rotation.z = (Math.random() - 0.5) * 0.3
    plant.add(leaf)
    plant.userData[`leaf${i}`] = leaf
  }

  return plant
}

export function createStapler(): THREE.Group {
  const stapler = new THREE.Group()
  stapler.position.set(-0.15, 0.31, 0.52)
  stapler.userData = { interactive: true, id: 'stapler' }

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.018, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4, metalness: 0.15 }),
  )
  stapler.add(body)

  // Top (hinged part)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.008, 0.028),
    new THREE.MeshStandardMaterial({ color: 0xbb1a1a, roughness: 0.5 }),
  )
  top.position.y = 0.012
  stapler.add(top)
  stapler.userData.top = top

  return stapler
}

export function createPhone(): THREE.Group {
  const phone = new THREE.Group()
  phone.position.set(-0.62, 0.33, 0.35)
  phone.userData = { interactive: true, id: 'phone' }

  const phoneMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.028, 0.12), phoneMat)
  phone.add(base)

  // Handset cradle
  const handset = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.030), phoneMat)
  handset.position.set(0, 0.020, 0)
  phone.add(handset)
  phone.userData.handset = handset

  // Number pad dots
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const dot = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.003, 0.008),
        new THREE.MeshStandardMaterial({ color: 0x555555 }),
      )
      dot.position.set((c - 1) * 0.018, 0.016, 0.030 + r * 0.018)
      phone.add(dot)
    }
  }

  return phone
}

export function createKeyboard(): THREE.Group {
  const kb = new THREE.Group()
  kb.position.set(0, 0.31, 0.40)
  kb.userData = { interactive: true, id: 'keyboard' }

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.012, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  )
  kb.add(base)

  // Keys (simplified grid) — each with its own material for per-key lighting
  const keys: THREE.Mesh[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      const km = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, emissive: 0x000000 })
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.012), km)
      key.position.set(-0.155 + c * 0.028, 0.009, -0.04 + r * 0.028)
      kb.add(key)
      keys.push(key)
    }
  }
  kb.userData.keys = keys

  return kb
}

export function createWaterBottle(): THREE.Group {
  const bottle = new THREE.Group()
  bottle.position.set(-0.32, 0.35, 0.35)
  bottle.userData = { interactive: true, id: 'water_bottle' }

  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.10, 8),
    new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.3, metalness: 0.2 }),
  )
  bottle.add(body)

  // Cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.015, 8),
    new THREE.MeshStandardMaterial({ color: 0x3366aa, roughness: 0.4 }),
  )
  cap.position.y = 0.055
  bottle.add(cap)

  // Water level (visible through translucent body)
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.019, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x66aadd, roughness: 0.2, transparent: true, opacity: 0.5 }),
  )
  water.position.y = -0.01
  bottle.add(water)
  bottle.userData.water = water

  return bottle
}

export function createFramedPhoto(): THREE.Group {
  const frame = new THREE.Group()
  frame.position.set(1.05, 1.30, -0.36)
  frame.userData = { interactive: true, id: 'framed_photo' }

  // Frame border
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.10, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7 }),
  )
  frame.add(border)

  // Photo (lighter rectangle inside)
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.9 }),
  )
  photo.position.z = 0.006
  frame.add(photo)

  return frame
}

export function createDeskFan(): { fan: THREE.Group; bladesGroup: THREE.Group } {
  const fan = new THREE.Group()
  fan.position.set(-0.85, 0.31, 0.40)
  fan.userData = { interactive: true, id: 'desk_fan' }

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.4 })
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.5 })

  // Base — flat cylinder sitting on desk
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.045, 0.012, 12),
    metalMat,
  )
  base.position.y = 0.006
  base.castShadow = true
  base.receiveShadow = true
  fan.add(base)

  // Neck — short post from base to head
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.010, 0.04, 8),
    metalMat,
  )
  neck.position.y = 0.032
  neck.castShadow = true
  fan.add(neck)

  // Head assembly — motor + cage + blades, facing toward camera (+Z)
  const head = new THREE.Group()
  head.position.y = 0.058

  // Motor housing — behind the cage
  const motor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.020, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 }),
  )
  motor.rotation.x = Math.PI / 2
  motor.position.z = -0.010
  motor.castShadow = true
  head.add(motor)

  // Cage ring — faces camera
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.040, 0.002, 6, 24),
    cageMat,
  )
  ring.position.z = 0.005
  head.add(ring)

  // Cage spokes — radial lines from center to ring, in the XY plane
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.001, 0.080, 0.001),
      cageMat,
    )
    spoke.rotation.z = angle
    spoke.position.z = 0.005
    head.add(spoke)
  }

  // Blades — 3 flat paddles that spin in XY plane
  const bladesGroup = new THREE.Group()
  bladesGroup.position.z = 0.003
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.030, 0.006, 0.001),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, side: THREE.DoubleSide }),
    )
    blade.rotation.z = (Math.PI * 2 / 3) * i
    blade.position.set(
      Math.cos((Math.PI * 2 / 3) * i) * 0.015,
      Math.sin((Math.PI * 2 / 3) * i) * 0.015,
      0,
    )
    bladesGroup.add(blade)
  }
  head.add(bladesGroup)
  fan.add(head)

  fan.castShadow = true
  fan.receiveShadow = true

  return { fan, bladesGroup }
}

export function createFidgetSpinner() {
  const spinner = new THREE.Group()
  spinner.position.set(0.40, 0.315, 0.52)
  spinner.userData = { interactive: true, id: 'fidget_spinner' }

  // Everything lies flat on desk (XZ plane), spins around Y axis
  const armGroup = new THREE.Group()

  // Center bearing — flat disc on desk
  const bearing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 0.005, 16),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.8 }),
  )
  bearing.position.y = 0.0025
  bearing.castShadow = true
  armGroup.add(bearing)

  // 3 arms radiating outward in XZ plane
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i
    const dx = Math.sin(angle)
    const dz = Math.cos(angle)

    // Arm bar — flat box connecting center to pod
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.004, 0.024),
      new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.3, metalness: 0.4 }),
    )
    arm.position.set(dx * 0.020, 0.002, dz * 0.020)
    arm.rotation.y = -angle
    arm.castShadow = true
    armGroup.add(arm)

    // Weight pod at end — squat cylinder lying flat
    const pod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.005, 10),
      new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.25, metalness: 0.5 }),
    )
    pod.position.set(dx * 0.035, 0.0025, dz * 0.035)
    pod.castShadow = true
    armGroup.add(pod)
  }

  spinner.add(armGroup)
  spinner.castShadow = true
  spinner.receiveShadow = true

  return { spinner, armGroup }
}
