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
      await sleep(400)
      if (cancelled) return
      setStage('typing')

      for (let i = 0; i <= domain.length; i++) {
        if (cancelled) return
        setTyped(domain.slice(0, i))
        await sleep(40 + Math.random() * 30)
      }

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

  return (
    <div
      className="loading-overlay"
      style={{
        opacity: stage === 'fadeout' ? 0 : 1,
        transition: stage === 'fadeout' ? 'opacity 0.7s ease-out' : 'none',
        pointerEvents: stage === 'fadeout' ? 'none' : 'auto',
      }}
    >
      <div className="loading-text">
        {typed}
        {showCursor && <span className="loading-cursor" />}
      </div>

      {stage === 'hold' && (
        <div className="loading-sound-hint">
          CLICK ANYWHERE FOR SOUND
        </div>
      )}
    </div>
  )
}
