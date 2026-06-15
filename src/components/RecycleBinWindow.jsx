import { useState } from 'react'
import ContextMenu from './ContextMenu'

// Lists items currently in the Recycle Bin (trashed nodes). Unlike folders,
// items here are auto-arranged and not draggable — you can only Restore them or
// delete them for good.
const RecycleBinWindow = ({ items, onRestore, onDelete, onEmpty }) => {
  const [contextMenu, setContextMenu] = useState(null)

  const openItemMenu = (e, node) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Restore', icon: '↩', onClick: () => onRestore(node.id) },
        'separator',
        { label: 'Delete Permanently', icon: '🗑️', onClick: () => onDelete(node.id) }
      ]
    })
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '340px' }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-2 shrink-0"
        style={{
          height: '28px',
          background: 'linear-gradient(to bottom, #ECE9D8 0%, #D6D2C2 100%)',
          borderBottom: '1px solid #919B9C',
          fontSize: '11px',
          color: '#333'
        }}
      >
        <button
          className="px-2 py-0.5 disabled:opacity-40"
          style={{ border: '1px solid #919B9C', background: '#F4F2EA', borderRadius: '2px' }}
          onClick={onEmpty}
          disabled={items.length === 0}
        >
          Empty Recycle Bin
        </button>
        <span style={{ color: '#555' }}>
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Contents */}
      <div
        className="flex-1 overflow-auto p-3"
        style={{ background: '#FFFFFF' }}
        onClick={() => setContextMenu(null)}
      >
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 select-none">
            The Recycle Bin is empty.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 content-start">
            {items.map((node) => (
              <div
                key={node.id}
                className="flex flex-col items-center w-20 p-1 rounded cursor-default select-none hover:bg-blue-100"
                onContextMenu={(e) => openItemMenu(e, node)}
                onDoubleClick={() => onRestore(node.id)}
                title="Right-click to restore or delete"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-1">
                  {node.type === 'folder' ? (
                    <img src="/New Folder.ico" alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-3xl">📄</span>
                  )}
                </div>
                <div className="text-xs text-center text-black break-words leading-tight w-full">
                  {node.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
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
        {items.length} object{items.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}

export default RecycleBinWindow
