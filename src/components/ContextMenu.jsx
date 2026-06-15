import { useEffect, useRef, useState } from 'react'

const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null)
  const [openSubmenu, setOpenSubmenu] = useState(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${adjustedX}px`
        menuRef.current.style.top = `${adjustedY}px`
      }
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed xp-window-shadow z-[9999] min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: '#FFFFFF',
        border: '1px solid #808080'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item === 'separator') {
          return (
            <div key={index} className="border-t border-xp-gray-400 my-1" />
          )
        }

        if (item.disabled) {
          return (
            <div
              key={index}
              className="px-3 py-1 text-xs text-gray-500 cursor-not-allowed flex items-center gap-2"
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          )
        }

        const hasSubmenu = item.hasSubmenu && item.submenu && item.submenu.length > 0

        return (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => hasSubmenu && setOpenSubmenu(index)}
            onMouseLeave={() => hasSubmenu && setOpenSubmenu(null)}
          >
            <div
              className="px-3 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center gap-2"
              onClick={() => {
                if (!hasSubmenu && item.onClick) {
                  item.onClick()
                  onClose()
                }
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xp-gray-500">{item.shortcut}</span>
              )}
              {hasSubmenu && (
                <span className="ml-auto">▶</span>
              )}
            </div>
            {hasSubmenu && openSubmenu === index && (
              <div
                className="absolute left-full top-0 ml-1 xp-window-shadow z-[10000] min-w-[180px]"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #808080',
                  boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={() => setOpenSubmenu(index)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                {item.submenu.map((subItem, subIndex) => {
                  if (subItem === 'separator') {
                    return (
                      <div key={subIndex} className="border-t border-xp-gray-400 my-1" />
                    )
                  }
                  return (
                    <div
                      key={subIndex}
                      className="px-3 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center gap-2"
                      onClick={() => {
                        if (subItem.onClick) {
                          subItem.onClick()
                        }
                        onClose()
                      }}
                    >
                      {subItem.icon && subItem.icon.startsWith('/') ? (
                        <img src={subItem.icon} alt={subItem.label} className="w-4 h-4 object-contain" />
                      ) : subItem.icon ? (
                        <span>{subItem.icon}</span>
                      ) : null}
                      <span>{subItem.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ContextMenu

