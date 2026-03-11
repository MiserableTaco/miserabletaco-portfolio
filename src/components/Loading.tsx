import { useState, useEffect, useCallback } from 'react'

interface LoadingProps {
  onComplete: () => void
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function Loading({ onComplete }: LoadingProps) {
  const [stage, setStage] = useState<'dark' | 'typing' | 'hold' | 'fadeout'>('dark')
  const [typed, setTyped] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  const complete = useCallback(onComplete, [onComplete])

  const domain = 'miserabletaco.dev'

  useEffect(() => {
    let cancelled = false

    const sequence = async () => {
      // Dark pause
      await sleep(400)
      if (cancelled) return
      setStage('typing')

      // Type out the domain letter by letter
      for (let i = 0; i <= domain.length; i++) {
        if (cancelled) return
        setTyped(domain.slice(0, i))
        await sleep(40 + Math.random() * 30)
      }

      // Hold for a moment
      await sleep(400)
      if (cancelled) return
      setStage('hold')

      await sleep(600)
      if (cancelled) return
      setShowCursor(false)
      setStage('fadeout')

      await sleep(500)
      if (cancelled) return
      complete()
    }

    sequence()
    return () => { cancelled = true }
  }, [complete])

  const fadeOpacity = stage === 'fadeout' ? 0 : 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeOpacity,
      transition: stage === 'fadeout' ? 'opacity 0.7s ease-out' : 'none',
      pointerEvents: stage === 'fadeout' ? 'none' : 'auto',
    }}>
      <div style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '28px',
        letterSpacing: '3px',
        color: '#e0e0e0',
        position: 'relative',
      }}>
        {typed}
        {showCursor && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '28px',
            background: '#00ff00',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: 'loadBlink 0.6s step-end infinite',
          }} />
        )}
      </div>

      {stage === 'hold' && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          fontFamily: '"Courier New", monospace',
          fontSize: '12px',
          color: '#555',
          letterSpacing: '2px',
          animation: 'loadFadeIn 0.4s ease-out',
        }}>
          CLICK ANYWHERE FOR SOUND
        </div>
      )}

      <style>{`
        @keyframes loadBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes loadFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
