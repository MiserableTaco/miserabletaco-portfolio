import { useState, useRef, useEffect } from 'react'

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
    const cmd = input.trim().toLowerCase()
    setLines(prev => [...prev, `> ${input}`])
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
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: '#000',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>miserabletaco.dev</div>
        <div style={{ opacity: 0.5, marginTop: 4, fontSize: '11px' }}>
          Desktop experience available on larger screens
        </div>
      </div>

      {/* Links */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        flexShrink: 0,
      }}>
        {LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              color: '#66ccff',
              textDecoration: 'underline',
              marginBottom: 8,
              fontSize: '13px',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Terminal output */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px 16px',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: '18px' }}>{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #333',
        display: 'flex',
        gap: 8,
        flexShrink: 0,
      }}>
        <span>&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') execute() }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#00ff00',
            fontFamily: '"Courier New", monospace',
            fontSize: '13px',
            outline: 'none',
            caretColor: '#00ff00',
          }}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}
