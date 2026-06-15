import { useState, useEffect } from 'react'

// Tracks whether we're on a small (phone-sized) screen. Used to switch the XP
// desktop into a touch-friendly mode: fullscreen windows, tap-to-open, etc.
export default function useIsMobile(query = '(max-width: 767px)') {
  const getMatch = () =>
    typeof window !== 'undefined' && window.matchMedia(query).matches

  const [isMobile, setIsMobile] = useState(getMatch)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
