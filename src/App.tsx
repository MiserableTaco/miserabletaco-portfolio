import { useEffect, useRef } from 'react'
import { Scene } from '@/components/Scene'
import '@/styles/index.css'

export default function App() {
  const cursorRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <Scene />
      <div id="cursor" ref={cursorRef}>
        &#x2588;
      </div>
    </>
  )
}
