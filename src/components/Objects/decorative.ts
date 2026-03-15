import * as THREE from 'three'

export function createNamePlacard(): THREE.Mesh {
  const placard = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.025, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 0.7 }),
  )
  placard.position.set(-0.05, 0.31, 0.54)
  return placard
}

export function createComputerMouse(): THREE.Group {
  const group = new THREE.Group()
  group.position.set(0.25, 0.31, 0.44)

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.012, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 }),
  )
  group.add(body)

  // Scroll wheel
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.008, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555 }),
  )
  wheel.rotation.z = Math.PI / 2
  wheel.position.set(0, 0.008, -0.008)
  group.add(wheel)

  return group
}

export function createMousePad(): THREE.Mesh {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.002, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 }),
  )
  pad.position.set(0.25, 0.305, 0.44)
  return pad
}

export function createStickyNote(): THREE.Mesh {
  // Render visit-based text onto the sticky note
  const cvs = document.createElement('canvas')
  cvs.width = 128
  cvs.height = 128
  const c = cvs.getContext('2d')!
  c.fillStyle = '#c8c830'
  c.fillRect(0, 0, 128, 128)

  // Get visit text
  let text = 'Welcome.'
  try {
    const stored = localStorage.getItem('portfolio_visits')
    const count = stored ? parseInt(stored, 10) : 1
    if (!isNaN(count) && count > 0) {
      if (count === 1) text = 'Welcome.'
      else if (count <= 3) text = 'Welcome back.'
      else if (count <= 5) text = 'You keep\ncoming back.'
      else if (count <= 10) text = 'Still here?\nTry: help'
      else if (count <= 20) text = 'v' + count + '\nPersistent.'
      else text = 'v' + count + '\n▓▓▓▓▓▓▓'
    }
  } catch { /* ignore */ }

  c.fillStyle = '#222222'
  c.font = '13px Courier New'
  c.textAlign = 'center'
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    c.fillText(line, 64, 40 + i * 18)
  })

  const tex = new THREE.CanvasTexture(cvs)
  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.06),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  )
  note.position.set(1.08, 1.45, -0.36)
  note.userData = {
    interactive: true,
    id: 'sticky_note',
    type: 'postit',
    originalX: 1.08,
    originalY: 1.45,
    originalZ: -0.36,
  }
  return note
}

export function createCalendar(): THREE.Group {
  const group = new THREE.Group()
  group.position.set(-1.08, 1.42, -0.36)

  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(0.10, 0.13),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, side: THREE.DoubleSide }),
  )
  group.add(page)

  // Red header strip
  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(0.10, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.8, side: THREE.DoubleSide }),
  )
  header.position.set(0, 0.052, 0.001)
  group.add(header)

  return group
}

export function createCorkBoard(): { board: THREE.Group; notes: THREE.Mesh[] } {
  const board = new THREE.Group()
  board.position.set(-1.05, 1.65, -0.36)

  // Board
  const cork = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.16, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xb8956a, roughness: 0.95 }),
  )
  board.add(cork)

  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 })
  for (const [px, py, w, h] of [
    [0, 0.085, 0.24, 0.01],   // top
    [0, -0.085, 0.24, 0.01],  // bottom
    [-0.115, 0, 0.01, 0.18],  // left
    [0.115, 0, 0.01, 0.18],   // right
  ] as [number, number, number, number][]) {
    const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), frameMat)
    piece.position.set(px, py, 0)
    board.add(piece)
  }

  // Sticky notes (replace pins)
  const noteColors = ['#c8c830', '#ff9999', '#99ccff', '#99ff99', '#ffcc66']
  const noteTexts: [string, string][] = [
    ['TODO:', 'ship it'],
    ['BUG:', '???'],
    ['github.com/', 'MiserableTaco'],
    ['IDEA:', 'more coffee'],
    [':)', ''],
  ]
  const notePositions = [
    { x: -0.06, y: 0.04, rot: -0.08 },
    { x: 0.02, y: 0.05, rot: 0.12 },
    { x: -0.02, y: -0.02, rot: -0.05 },
    { x: 0.06, y: 0.00, rot: 0.08 },
    { x: 0.05, y: -0.05, rot: -0.15 },
  ]

  const notes: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const noteCanvas = document.createElement('canvas')
    noteCanvas.width = 128
    noteCanvas.height = 128
    const nctx = noteCanvas.getContext('2d')!
    nctx.fillStyle = noteColors[i]
    nctx.fillRect(0, 0, 128, 128)
    nctx.fillStyle = '#222222'
    nctx.font = 'bold 16px Courier New'
    nctx.fillText(noteTexts[i][0], 8, 30)
    nctx.font = '14px Courier New'
    nctx.fillText(noteTexts[i][1], 8, 52)

    const noteTex = new THREE.CanvasTexture(noteCanvas)
    const note = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 0.05),
      new THREE.MeshBasicMaterial({ map: noteTex, side: THREE.DoubleSide }),
    )
    note.position.set(notePositions[i].x, notePositions[i].y, 0.008)
    note.rotation.z = notePositions[i].rot
    note.userData = {
      interactive: true,
      id: `postit_${i}`,
      type: 'postit',
      originalX: board.position.x + notePositions[i].x,
      originalY: board.position.y + notePositions[i].y,
      originalZ: board.position.z + 0.008,
      url: i === 2 ? 'https://github.com/MiserableTaco' : undefined,
    }
    board.add(note)
    notes.push(note)
  }

  return { board, notes }
}

export function createTapeDispenser(): THREE.Group {
  const tape = new THREE.Group()
  tape.position.set(0.15, 0.31, 0.52)

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 }),
  )
  tape.add(body)

  // Tape roll
  const roll = new THREE.Mesh(
    new THREE.TorusGeometry(0.012, 0.005, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xccbb88, roughness: 0.4, transparent: true, opacity: 0.7 }),
  )
  roll.position.set(-0.015, 0.015, 0)
  roll.rotation.y = Math.PI / 2
  tape.add(roll)

  // Cutting edge
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.002, 0.015, 0.028),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.2 }),
  )
  edge.position.set(0.032, 0.008, 0)
  tape.add(edge)

  return tape
}
