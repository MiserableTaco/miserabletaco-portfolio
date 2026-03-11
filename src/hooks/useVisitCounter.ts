import { useState, useEffect } from 'react'

export function useVisitCounter(): number {
  const [visitCount, setVisitCount] = useState(1)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('portfolio_visits')
      const count = stored ? parseInt(stored, 10) : 0

      if (isNaN(count) || count < 0 || count > 999999) {
        localStorage.setItem('portfolio_visits', '1')
        setVisitCount(1)
      } else {
        const next = count + 1
        localStorage.setItem('portfolio_visits', String(next))
        setVisitCount(next)
      }
    } catch {
      setVisitCount(1)
    }
  }, [])

  return visitCount
}

export function getStickyNoteText(visitCount: number): string {
  if (visitCount === 1) return 'Welcome.'
  if (visitCount <= 3) return 'Welcome back.'
  if (visitCount <= 5) return 'You keep coming back.'
  if (visitCount <= 10) return 'Still here?\nThe terminal knows more\nthan it shows.'
  if (visitCount <= 20) return 'v' + visitCount + '\nPersistent.\nI respect that.'
  return 'v' + visitCount + '\n▓▓▓▓▓▓▓▓▓▓\nCa█ ▓ou s█ill\n██ad th█s?'
}
