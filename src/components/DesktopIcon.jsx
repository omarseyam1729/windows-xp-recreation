import { useState, useRef, useEffect } from 'react'
import ContextMenu from './ContextMenu'

const DesktopIcon = ({ id, icon, label, onClick, position, onPositionChange, onRename, onDelete, customContextMenu, containerRef = null, onDragEnd = null, isFolder = false, variant = 'desktop' }) => {
  const [isDragging, setIsDragging] = useState(false)
  // True only once the pointer has actually moved during a press — a plain
  // click never sets this, so double-click-to-open keeps working.
  const [isMoving, setIsMoving] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState(null)
  const iconRef = useRef(null)
  const hasMovedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })
  const pointerTypeRef = useRef('mouse')
  const longPressRef = useRef(null)
  const longPressFiredRef = useRef(false)

  const MOVE_THRESHOLD = 6

  useEffect(() => {
    if (isDragging) {
      const handlePointerMove = (e) => {
        if (!iconRef.current) return

        // Ignore sub-threshold jitter so a tap/click is never treated as a drag.
        if (!hasMovedRef.current) {
          if (
            Math.abs(e.clientX - startRef.current.x) < MOVE_THRESHOLD &&
            Math.abs(e.clientY - startRef.current.y) < MOVE_THRESHOLD
          ) {
            return
          }
          hasMovedRef.current = true
          setIsMoving(true)
          if (longPressRef.current) clearTimeout(longPressRef.current)
        }

        const rect = iconRef.current.getBoundingClientRect()

        // Position is relative to the icon's container. On the desktop there is
        // no containerRef, so coordinates are viewport-relative and the taskbar
        // is reserved at the bottom. Inside a folder window the container is the
        // folder canvas, so we offset by its top-left and clamp to its box.
        let originX = 0
        let originY = 0
        let boundsW = window.innerWidth
        let boundsH = window.innerHeight - 40 // reserve taskbar
        if (containerRef?.current) {
          const cRect = containerRef.current.getBoundingClientRect()
          originX = cRect.left
          originY = cRect.top
          boundsW = containerRef.current.clientWidth
          boundsH = containerRef.current.clientHeight
        }

        const newX = e.clientX - dragOffset.x - originX
        const newY = e.clientY - dragOffset.y - originY
        const constrainedX = Math.max(0, Math.min(newX, boundsW - rect.width))
        const constrainedY = Math.max(0, Math.min(newY, boundsH - rect.height))

        onPositionChange(constrainedX, constrainedY)
      }

      const handlePointerUp = (e) => {
        if (longPressRef.current) clearTimeout(longPressRef.current)
        setIsDragging(false)
        setIsMoving(false)
        if (longPressFiredRef.current) return // a context menu already opened
        if (hasMovedRef.current) {
          if (onDragEnd) onDragEnd(id, e.clientX, e.clientY)
        } else if (pointerTypeRef.current === 'touch') {
          // On touch a single tap opens (double-click is awkward on phones).
          onClick()
        }
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)

      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
      }
    }
  }, [isDragging, dragOffset, onPositionChange, containerRef, onDragEnd, id, onClick])

  const handlePointerDown = (e) => {
    // Right mouse button falls through to the native contextmenu handler.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!iconRef.current) return

    const rect = iconRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    startRef.current = { x: e.clientX, y: e.clientY }
    pointerTypeRef.current = e.pointerType
    hasMovedRef.current = false
    longPressFiredRef.current = false
    setIsDragging(true)

    // Touch long-press opens the context menu (the touch equivalent of right-click).
    if (e.pointerType === 'touch') {
      const { x, y } = startRef.current
      longPressRef.current = setTimeout(() => {
        longPressFiredRef.current = true
        setIsDragging(false)
        setIsMoving(false)
        setContextMenu({ x, y })
      }, 500)
    }
  }

  const handleDoubleClick = (e) => {
    e.preventDefault()
    onClick()
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    })
  }

  const contextMenuItems = customContextMenu || [
    { label: 'Open', icon: '▶', onClick: onClick },
    'separator',
    { label: 'Rename', icon: '✏️', onClick: () => onRename && onRename(id, label) },
    { label: 'Delete', icon: '🗑️', onClick: () => onDelete && onDelete(id) },
    'separator',
    { label: 'Properties', icon: '⚙️', onClick: () => alert(`Properties for ${label}`) }
  ]

  return (
    <div
      ref={iconRef}
      data-folder-id={isFolder ? id : undefined}
      className="absolute flex flex-col items-center w-16 cursor-pointer group select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Only while actively moving do we ignore pointer hits, so
        // elementFromPoint can detect a folder under the cursor for
        // drop-to-move. A plain click keeps pointer events so dblclick fires.
        pointerEvents: isMoving ? 'none' : undefined,
        // Let us own touch gestures (drag) instead of the browser scrolling,
        // and suppress the long-press text-selection callout on mobile.
        touchAction: 'none',
        WebkitTouchCallout: 'none'
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={`w-16 h-16 flex items-center justify-center mb-1 rounded transition-colors p-1 ${
        isDragging ? 'bg-blue-600/30' : 'hover:bg-white/20'
      }`}>
        {icon && icon.startsWith('/') ? (
          <img 
            src={icon} 
            alt={label}
            className="w-12 h-12 object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-4xl">{icon}</span>
        )}
      </div>
      <div className={`text-xs text-center px-1 py-0.5 rounded transition-colors ${
        variant === 'window' ? 'text-black' : 'text-white'
      } ${
        isDragging ? 'bg-blue-600/70 text-white' : 'group-hover:bg-blue-600/50 group-hover:text-white'
      }`}>
        {label}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default DesktopIcon

