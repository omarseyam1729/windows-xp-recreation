import { useRef } from 'react'

// Long-press (touch) → acts as a right-click. Mouse is ignored (it has a real
// contextmenu event). `filter` is evaluated synchronously on pointerdown so a
// caller can, e.g., only fire on the background and not on child icons.
export default function useLongPress(callback, { delay = 500, moveTolerance = 10, filter } = {}) {
  const timer = useRef(null)
  const start = useRef({ x: 0, y: 0 })

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return
    if (filter && !filter(e)) return
    const x = e.clientX
    const y = e.clientY
    start.current = { x, y }
    timer.current = setTimeout(() => {
      timer.current = null
      callback(x, y)
    }, delay)
  }

  const onPointerMove = (e) => {
    if (!timer.current) return
    if (
      Math.abs(e.clientX - start.current.x) > moveTolerance ||
      Math.abs(e.clientY - start.current.y) > moveTolerance
    ) {
      clear()
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear
  }
}
