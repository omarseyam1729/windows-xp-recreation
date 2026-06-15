import { useState, useRef, useEffect } from 'react'

const Window = ({ id, title, children, position, onClose, onMinimize, onMaximize, isMaximized, onPositionChange, width, height }) => {
  const windowWidth = width || '600px'
  const windowHeight = height || '400px'
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef(null)

  useEffect(() => {
    if (isDragging && !isMaximized) {
      const handleMouseMove = (e) => {
        if (!windowRef.current || isMaximized) return
        
        const rect = windowRef.current.getBoundingClientRect()
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        
        // Constrain to viewport
        const maxX = window.innerWidth - rect.width
        const maxY = window.innerHeight - 40 - rect.height // Account for taskbar
        
        const constrainedX = Math.max(0, Math.min(newX, maxX))
        const constrainedY = Math.max(0, Math.min(newY, maxY))
        
        onPositionChange(id, constrainedX, constrainedY)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, id, onPositionChange, isMaximized])

  const handleMouseDown = (e) => {
    // Don't start dragging if clicking on buttons or if maximized
    if (e.target.closest('button') || isMaximized) {
      return
    }
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleWindowClick = () => {
    // Bring window to front when clicked
    if (windowRef.current) {
      windowRef.current.style.zIndex = Date.now()
    }
  }

  return (
    <div
      ref={windowRef}
      className="absolute bg-xp-gray-200 xp-window-shadow"
      style={isMaximized ? {
        left: 0,
        top: 0,
        width: '100%',
        height: 'calc(100vh - 40px)', // Subtract taskbar height using viewport height
        zIndex: 1000,
        borderRadius: 0
      } : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: windowWidth,
        minHeight: windowHeight,
        zIndex: 1000,
        borderRadius: '3px'
      }}
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between px-1 cursor-move select-none"
        style={{
          height: '22px',
          background: 'linear-gradient(to right, #2A71D0 0%, #3C8CF4 100%)',
          borderRadius: isMaximized ? '0' : '3px 3px 0 0',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1 text-white text-xs font-bold px-1">
          <span>{title}</span>
        </div>
        <div className="flex gap-0.5 items-center">
          <button
            className="xp-window-button xp-window-button-minimize"
            onClick={onMinimize}
            title="Minimize"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '65%',
              height: '2px',
              backgroundColor: '#ffffff',
              marginTop: '-1px',
              borderRadius: '1px'
            }} />
          </button>
          <button
            className="xp-window-button xp-window-button-maximize"
            onClick={(e) => {
              e.stopPropagation()
              if (id !== 'resume' && id !== 'projects') {
                onMaximize()
              }
            }}
            title={(id === 'resume' || id === 'projects' || id === 'challenge') ? "Maximized" : (isMaximized ? "Restore" : "Maximize")}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={id === 'resume' || id === 'projects' || id === 'challenge'}
            style={(id === 'resume' || id === 'projects' || id === 'challenge') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {isMaximized ? (
              <div style={{ position: 'relative', width: '10px', height: '10px' }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '0',
                  width: '8px',
                  height: '8px',
                  border: '2px solid #ffffff',
                  borderRadius: '1px'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '2px',
                  width: '8px',
                  height: '8px',
                  border: '2px solid #ffffff',
                  borderRadius: '1px',
                  backgroundColor: 'transparent'
                }} />
              </div>
            ) : (
              <div style={{
                width: '10px',
                height: '10px',
                border: '2px solid #ffffff',
                borderRadius: '1px',
                backgroundColor: 'transparent'
              }} />
            )}
          </button>
          <button
            className="xp-window-button xp-window-button-close"
            onClick={onClose}
            title="Close"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ filter: 'drop-shadow(0 0 0.5px rgba(255,255,255,0.8))' }}>
              <line x1="1" y1="1" x2="9" y2="9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div 
        className="bg-white xp-border-inset overflow-auto" 
        style={{ 
          height: isMaximized ? 'calc(100% - 22px)' : 'calc(100% - 22px)',
          minHeight: isMaximized ? 'calc(100% - 22px)' : '370px'
        }}
      >
        <div className={`${id === 'resume' ? 'h-full p-0' : (id === 'control' || id === 'computer' || id === 'paint' || id === 'recyclebin' || id.startsWith('folder-')) ? 'h-full p-0' : 'p-4'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Window

