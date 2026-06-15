import { useRef, useState } from 'react'
import DesktopIcon from './DesktopIcon'
import ContextMenu from './ContextMenu'

// A free-drag canvas scoped to a single folder — conceptually a mini desktop.
// All filesystem state lives in Desktop; this component just renders this
// folder's children and forwards interactions back up through handlers.
const FolderWindow = ({
  folderId,
  nodes,
  onOpenNode,
  onCreateFile,
  onCreateFolder,
  onPositionChange,
  onRename,
  onDelete,
  onDropMove
}) => {
  const canvasRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)

  const folder = nodes.find((n) => n.id === folderId)
  const children = nodes.filter((n) => n.parentId === folderId && !n.trashed)

  const handleContextMenu = (e) => {
    // Icons stop propagation for their own menu, so this only fires on the
    // empty canvas.
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // Create the new item where the user right-clicked (canvas-local coords).
  const createAt = (create) => () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const position =
      rect && contextMenu
        ? {
            x: Math.max(4, contextMenu.x - rect.left - 24),
            y: Math.max(4, contextMenu.y - rect.top - 16)
          }
        : null
    create(folderId, position)
  }

  const menuItems = [
    {
      label: 'New',
      hasSubmenu: true,
      submenu: [
        { label: 'Folder', icon: '/New Folder.ico', onClick: createAt(onCreateFolder) },
        { label: 'Text Document', icon: '/My Documents.ico', onClick: createAt(onCreateFile) }
      ]
    },
    'separator',
    { label: 'Refresh', onClick: () => {} }
  ]

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '340px' }}>
      {/* Address bar */}
      <div
        className="flex items-center gap-2 px-2 shrink-0"
        style={{
          height: '26px',
          background: 'linear-gradient(to bottom, #ECE9D8 0%, #D6D2C2 100%)',
          borderBottom: '1px solid #919B9C',
          fontSize: '11px',
          color: '#333'
        }}
      >
        <span style={{ color: '#555' }}>Address</span>
        <div
          className="flex items-center gap-1 bg-white px-1 flex-1 min-w-0"
          style={{ border: '1px solid #7F9DB9', height: '18px' }}
        >
          <img src="/New Folder.ico" alt="" className="w-4 h-4 shrink-0" />
          <span className="truncate">{folder?.name || 'Folder'}</span>
        </div>
      </div>

      {/* Free-drag canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden"
        style={{ background: '#FFFFFF' }}
        onContextMenu={handleContextMenu}
      >
        {children.map((node) => (
          <DesktopIcon
            key={node.id}
            id={node.id}
            icon={node.type === 'folder' ? '/New Folder.ico' : '📄'}
            label={node.name}
            position={node.position || { x: 24, y: 20 }}
            variant="window"
            isFolder={node.type === 'folder'}
            containerRef={canvasRef}
            onPositionChange={(x, y) => onPositionChange(node.id, x, y)}
            onClick={() => onOpenNode(node)}
            onRename={onRename}
            onDelete={onDelete}
            onDragEnd={onDropMove}
          />
        ))}

        {children.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 select-none pointer-events-none">
            This folder is empty.
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={menuItems}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center px-2 text-xs shrink-0"
        style={{
          height: '22px',
          background: '#ECE9D8',
          borderTop: '1px solid #919B9C',
          color: '#333'
        }}
      >
        {children.length} object{children.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}

export default FolderWindow
