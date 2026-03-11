import { useEffect, useRef, useState } from 'react'
import { Scene } from '@/components/Scene'
import { Desktop } from '@/components/Desktop'
import { Loading } from '@/components/Loading'
import { MobileFallback } from '@/components/MobileFallback'
import { useRaycaster } from '@/hooks/useRaycaster'
import { useVisitCounter } from '@/hooks/useVisitCounter'
import { useDesktopStore } from '@/store/desktopStore'
import { useTerminalStore } from '@/store/terminalStore'
import { useObjectStore } from '@/store/objectStore'
import { useAudioStore, playSound, initAudio } from '@/hooks/useAudio'
import '@/styles/index.css'
import '@/styles/effects.css'

const isMobile =
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768)

export default function App() {
  const [loading, setLoading] = useState(true)
  const [soundHint, setSoundHint] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)
  const muted = useAudioStore((s) => s.muted)
  const initialized = useAudioStore((s) => s.initialized)
  const toggleMute = useAudioStore((s) => s.toggleMute)
  const visitCount = useVisitCounter()

  // Update backup filename with visit count
  useEffect(() => {
    if (visitCount > 0) {
      useDesktopStore.getState().setVisitCount(visitCount)
    }
  }, [visitCount])

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const onMouseMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`
      cursor.style.top = `${e.clientY}px`
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Show sound hint after loading completes, auto-dismiss after 4s
  useEffect(() => {
    if (loading) return
    const showTimer = setTimeout(() => setSoundHint(true), 800)
    const hideTimer = setTimeout(() => setSoundHint(false), 5000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [loading])

  // Hide sound hint when audio initializes
  useEffect(() => {
    if (initialized) setSoundHint(false)
  }, [initialized])

  // Auto-open terminal after loading
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      useDesktopStore.getState().openWindow('terminal', 'Terminal.exe')
    }, 500)
    return () => clearTimeout(timer)
  }, [loading])

  // Global keyboard handler — routes to terminal when it's focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dStore = useDesktopStore.getState()
      const tStore = useTerminalStore.getState()

      const topWindow = dStore.windows
        .filter((w) => !w.minimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0]

      if (!topWindow || topWindow.app !== 'terminal') return

      // Light up keyboard keys on any keypress
      useObjectStore.getState().interact('keyboard', { keyTime: Date.now() })

      if (e.key === 'Enter') {
        e.preventDefault()
        initAudio()
        playSound('keyboard')
        tStore.executeCommand(tStore.currentInput)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        tStore.navigateHistory('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        tStore.navigateHistory('down')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        playSound('keyboard')
        tStore.setInput(tStore.currentInput.slice(0, -1))
      } else if (e.key === 'Tab') {
        e.preventDefault()
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        playSound('keyboard')
        tStore.setInput(tStore.currentInput + e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useRaycaster()

  if (isMobile) return <MobileFallback />

  return (
    <>
      {loading && <Loading onComplete={() => setLoading(false)} />}
      <Scene />
      <Desktop />
      <div id="cursor" ref={cursorRef}>
        &#x2588;
      </div>

      {/* Sound hint — fades in after load, disappears on first click or after 4s */}
      {soundHint && !initialized && (
        <div id="sound-hint">
          CLICK FOR SOUND
        </div>
      )}

      <button
        id="mute-btn"
        onClick={() => {
          const store = useAudioStore.getState()
          if (!store.initialized) {
            initAudio()
            return
          }
          toggleMute()
        }}
      >
        {muted ? 'MUTED' : 'SOUND'}
      </button>
    </>
  )
}
