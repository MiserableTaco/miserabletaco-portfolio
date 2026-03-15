import { useState, useRef, useEffect } from 'react'
import { sanitizeInput } from '@/utils/sanitize'

const LINKS = [
  { label: 'TRUST — AcadCert + VeriCert', url: 'https://acadcert.com' },
  { label: 'CULTURE — DefMarks', url: 'https://defmarks.com' },
  { label: 'UNDERTOW — ARES Game', url: 'https://play.aresundertow.com' },
]

const INFO_LINES = [
  'Solo indie dev. Singapore.',
  'Building invisible infrastructure.',
  '',
  'Tech: React, TypeScript, Three.js, Rust, Go',
  'Contact: gerard.qiu803@gmail.com',
  'GitHub: github.com/MiserableTaco',
]

export function MobileFallback() {
  const [lines, setLines] = useState<string[]>([
    'ARES VERIFICATION PROTOCOL v4.5',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'Mobile mode — limited experience.',
    'Visit on desktop for the full 3D office.',
    '',
    'TYPE a command or tap a link below.',
    '',
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const execute = () => {
    const clean = sanitizeInput(input)
    const cmd = clean.toLowerCase()
    setLines(prev => [...prev, `> ${clean}`])
    setInput('')

    if (cmd === 'help') {
      setLines(prev => [...prev, '', 'COMMANDS: help, about, contact, clear', ''])
    } else if (cmd === 'about') {
      setLines(prev => [...prev, '', ...INFO_LINES, ''])
    } else if (cmd === 'contact') {
      setLines(prev => [...prev, '', 'gerard.qiu803@gmail.com', 'github.com/MiserableTaco', ''])
    } else if (cmd === 'clear') {
      setLines([])
    } else if (cmd) {
      setLines(prev => [...prev, `Command not found: ${cmd}`, "Type 'help' for commands.", ''])
    }
  }

  return (
    <div className="mobile-root">
      <div className="mobile-header">
        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>miserabletaco.dev</div>
        <div style={{ opacity: 0.5, marginTop: 4, fontSize: '11px' }}>
          Desktop experience available on larger screens
        </div>
      </div>

      <div className="mobile-links">
        {LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-link"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="mobile-output">
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: '18px' }}>{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mobile-input-row">
        <span>&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') execute() }}
          className="mobile-input"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}
