import { useState, useEffect, useRef } from 'react'
import DesktopIcon from './DesktopIcon'
import Window from './Window'
import ContextMenu from './ContextMenu'
import About from '../pages/About'
import Projects from '../pages/Projects'
import Contact from '../pages/Contact'
import Notepad from '../pages/Notepad'
import Paint from '../pages/Paint'
import MyDocuments from '../pages/MyDocuments'
import MyRecentDocuments from '../pages/MyRecentDocuments'
import MyPictures from '../pages/MyPictures'
import MyMusic from '../pages/MyMusic'
import MyComputer from '../pages/MyComputer'
import ControlPanel from '../pages/ControlPanel'
import SetProgramAccess from '../pages/SetProgramAccess'
import PrintersAndFaxes from '../pages/PrintersAndFaxes'
import HelpAndSupport from '../pages/HelpAndSupport'
import Search from '../pages/Search'
import Run from '../pages/Run'
import InternetExplorer from '../pages/InternetExplorer'
import Resume from '../pages/Resume'
import Challenge from '../pages/Challenge'
import FolderWindow from './FolderWindow'
import RecycleBinWindow from './RecycleBinWindow'
import {
  loadNodes,
  createFile,
  createFolder,
  updatePosition,
  renameNode,
  deleteNode,
  trashNode,
  restoreNode,
  emptyTrash,
  moveNode
} from '../utils/filesystem'

// Order of the left-hand desktop icons, top to bottom.
const DESKTOP_ICON_ORDER = ['about', 'projects', 'contact', 'resume', 'notepad', 'paint', 'challenge']

// Lay the left-column icons out so they wrap into extra columns instead of
// sliding under the taskbar on shorter viewports, and pin the recycle bin to the
// top-right corner. Recomputed on mount and on every window resize.
const computeDefaultIconPositions = (vw, vh) => {
  const TOP = 16
  const LEFT = 16
  const COLUMN_WIDTH = 88
  const ROW_HEIGHT = 92
  const TASKBAR_HEIGHT = 40

  const usableHeight = vh - TASKBAR_HEIGHT - TOP - 8
  const perColumn = Math.max(1, Math.floor(usableHeight / ROW_HEIGHT))

  const positions = {}
  DESKTOP_ICON_ORDER.forEach((id, i) => {
    const col = Math.floor(i / perColumn)
    const row = i % perColumn
    positions[id] = { x: LEFT + col * COLUMN_WIDTH, y: TOP + row * ROW_HEIGHT }
  })

  positions.recyclebin = {
    x: Math.max(LEFT, vw - 80),
    y: TOP
  }

  return positions
}

const getViewport = () => ({
  vw: typeof window !== 'undefined' ? window.innerWidth : 1280,
  vh: typeof window !== 'undefined' ? window.innerHeight : 720
})

const Desktop = ({ openWindow, openWindows, closeWindow, minimizeWindow, maximizeWindow }) => {
  const [windowPositions, setWindowPositions] = useState({})
  const [desktopContextMenu, setDesktopContextMenu] = useState(null)
  const [iconPositions, setIconPositions] = useState(() => {
    const { vw, vh } = getViewport()
    return computeDefaultIconPositions(vw, vh)
  })
  // Icons the user has manually dragged — these are exempt from layout reflow.
  const movedIcons = useRef(new Set())
  // User-created filesystem nodes (files + folders), persisted in localStorage.
  const [nodes, setNodes] = useState(loadNodes)

  // Keep the default icon layout responsive to the viewport size.
  useEffect(() => {
    const applyResponsiveLayout = () => {
      const { vw, vh } = getViewport()
      const defaults = computeDefaultIconPositions(vw, vh)
      setIconPositions(prev => {
        const next = { ...prev }
        Object.keys(defaults).forEach(id => {
          if (!movedIcons.current.has(id)) {
            next[id] = defaults[id]
          }
        })
        return next
      })
    }

    applyResponsiveLayout()
    window.addEventListener('resize', applyResponsiveLayout)
    return () => window.removeEventListener('resize', applyResponsiveLayout)
  }, [])

  // Initialize positions for new windows
  useEffect(() => {
    openWindows.forEach(window => {
      if (!windowPositions[window.id]) {
        const windowCount = Object.keys(windowPositions).length
        setWindowPositions(prev => ({
          ...prev,
          [window.id]: { 
            x: 100 + windowCount * 30, 
            y: 100 + windowCount * 30 
          }
        }))
      }
    })
  }, [openWindows])

  const handleIconClick = (id, title, component) => {
    openWindow(id, title, component)
  }

  const updateWindowPosition = (id, x, y) => {
    setWindowPositions({
      ...windowPositions,
      [id]: { x, y }
    })
  }

  const updateIconPosition = (id, x, y) => {
    movedIcons.current.add(id)
    setIconPositions(prev => ({
      ...prev,
      [id]: { x, y }
    }))
  }

  // --- Filesystem (files + folders) ------------------------------------------
  const handleNewFile = (parentId = null, position = null) => {
    setNodes(createFile(parentId, position))
  }

  const handleNewFolder = (parentId = null, position = null) => {
    setNodes(createFolder(parentId, position))
  }

  const openFile = (node) => {
    openWindow(`doc-${node.id}`, node.name, 'Notepad', { fileId: node.id })
  }

  const openFolder = (node) => {
    openWindow(`folder-${node.id}`, node.name, 'Folder', { folderId: node.id })
  }

  const openNode = (node) => {
    if (node.type === 'folder') {
      openFolder(node)
    } else {
      openFile(node)
    }
  }

  const handleNodePositionChange = (id, x, y) => {
    setNodes(updatePosition(id, x, y))
  }

  const handleNodeRename = (id, currentName) => {
    const newName = prompt('Enter new name:', currentName)
    if (newName && newName.trim()) {
      setNodes(renameNode(id, newName.trim()))
    }
  }

  // Deleting moves the item to the Recycle Bin (recoverable).
  const handleNodeDelete = (id) => {
    setNodes(trashNode(id))
    // Close any window showing this node (or, for folders, its contents).
    closeWindow(`doc-${id}`)
    closeWindow(`folder-${id}`)
  }

  const handleRestoreNode = (id) => {
    setNodes(restoreNode(id))
  }

  const handlePermanentlyDelete = (id) => {
    if (confirm('Permanently delete this item? This cannot be undone.')) {
      setNodes(deleteNode(id))
    }
  }

  const handleEmptyRecycleBin = () => {
    if (confirm('Permanently delete all items in the Recycle Bin? This cannot be undone.')) {
      setNodes(emptyTrash())
    }
  }

  const handleRecycleBinOpen = () => {
    openWindow('recyclebin', 'Recycle Bin', 'RecycleBin')
  }

  // Where a desktop right-click "New" item should be created — under the cursor,
  // offset so the icon centers there, clamped above the taskbar.
  const desktopNewItemPosition = () => {
    if (!desktopContextMenu) return null
    const maxY = window.innerHeight - 40 - 90
    return {
      x: Math.max(8, desktopContextMenu.x - 24),
      y: Math.max(8, Math.min(desktopContextMenu.y - 16, maxY))
    }
  }

  // On drop, if the icon was released over a folder icon, move it inside.
  const handleNodeDropToMove = (id, clientX, clientY) => {
    const target = document.elementFromPoint(clientX, clientY)
    const folderEl = target?.closest?.('[data-folder-id]')
    const targetFolderId = folderEl?.getAttribute('data-folder-id')
    if (targetFolderId && targetFolderId !== id) {
      setNodes(moveNode(id, targetFolderId))
    }
  }

  const handleDesktopContextMenu = (e) => {
    // Only show context menu if clicking on desktop background, not on icons
    if (e.target === e.currentTarget || e.target.closest('.desktop-background')) {
      e.preventDefault()
      setDesktopContextMenu({
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  const handleIconRename = (id, currentLabel) => {
    const newLabel = prompt('Enter new name:', currentLabel)
    if (newLabel && newLabel.trim()) {
      // In a real app, you'd update the icon label here
      console.log(`Renaming ${id} to ${newLabel}`)
    }
  }

  const handleIconDelete = (id) => {
    if (confirm('Are you sure you want to delete this icon?')) {
      // In a real app, you'd remove the icon here
      console.log(`Deleting icon ${id}`)
    }
  }

  const desktopContextMenuItems = [
    { 
      label: 'Arrange Icons By', 
      icon: '',
      hasSubmenu: true,
      submenu: [
        { label: 'Name', onClick: () => {} },
        { label: 'Size', onClick: () => {} },
        { label: 'Type', onClick: () => {} },
        { label: 'Modified', onClick: () => {} },
        'separator',
        { label: 'Show in Groups', onClick: () => {} },
        { label: 'Auto Arrange', onClick: () => {} },
        { label: 'Align to Grid', onClick: () => {} }
      ]
    },
    { label: 'Refresh', icon: '', onClick: () => {} },
    'separator',
    { label: 'Paste', icon: '', disabled: true },
    { label: 'Paste Shortcut', icon: '', disabled: true },
    { label: 'Undo', icon: '', disabled: true },
    'separator',
    { 
      label: 'New', 
      icon: '',
      hasSubmenu: true,
      submenu: [
        { label: 'Folder', icon: '/New Folder.ico', onClick: () => handleNewFolder(null, desktopNewItemPosition()) },
        { label: 'Shortcut', icon: '/Windows Explorer.ico', onClick: () => {} },
        { label: 'Text Document', icon: '/My Documents.ico', onClick: () => handleNewFile(null, desktopNewItemPosition()) },
        { label: 'Bitmap Image', icon: '/My Pictures.ico', onClick: () => {} },
        { label: 'Wave Sound', icon: '/Music Disk.ico', onClick: () => {} }
      ]
    },
    'separator',
    { label: 'Properties', icon: '', onClick: () => alert('Desktop Properties') }
  ]

  const renderWindowContent = (component, props) => {
    switch(component) {
      case 'About':
        return <About />
      case 'Projects':
        return <Projects />
      case 'Contact':
        return <Contact />
      case 'Notepad':
        return <Notepad fileId={props?.fileId} />
      case 'Folder':
        return (
          <FolderWindow
            folderId={props?.folderId}
            nodes={nodes}
            onOpenNode={openNode}
            onCreateFile={handleNewFile}
            onCreateFolder={handleNewFolder}
            onPositionChange={handleNodePositionChange}
            onRename={handleNodeRename}
            onDelete={handleNodeDelete}
            onDropMove={handleNodeDropToMove}
          />
        )
      case 'RecycleBin':
        return (
          <RecycleBinWindow
            items={nodes.filter(n => n.trashed)}
            onRestore={handleRestoreNode}
            onDelete={handlePermanentlyDelete}
            onEmpty={handleEmptyRecycleBin}
          />
        )
      case 'Paint':
        return <Paint />
      case 'MyDocuments':
        return <MyDocuments />
      case 'MyRecentDocuments':
        return <MyRecentDocuments />
      case 'MyPictures':
        return <MyPictures />
      case 'MyMusic':
        return <MyMusic />
      case 'MyComputer':
        return <MyComputer />
      case 'ControlPanel':
        return <ControlPanel />
      case 'SetProgramAccess':
        return <SetProgramAccess />
      case 'PrintersAndFaxes':
        return <PrintersAndFaxes />
      case 'HelpAndSupport':
        return <HelpAndSupport />
      case 'Search':
        return <Search />
      case 'Run':
        return <Run />
      case 'InternetExplorer':
        return <InternetExplorer />
      case 'Resume':
        return <Resume />
      case 'Challenge':
        return <Challenge />
      default:
        return null
    }
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden desktop-background xp-desktop-background" 
      onContextMenu={handleDesktopContextMenu}
    >
      {/* Desktop Icons */}
      <DesktopIcon 
        id="about"
        icon="/My Documents.ico"
        label="About Me"
        position={iconPositions['about'] || { x: 16, y: 16 }}
        onPositionChange={(x, y) => updateIconPosition('about', x, y)}
        onClick={() => handleIconClick('about', 'About Me', 'About')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="projects"
        icon="/Open Folder.ico"
        label="Projects"
        position={iconPositions['projects'] || { x: 16, y: 120 }}
        onPositionChange={(x, y) => updateIconPosition('projects', x, y)}
        onClick={() => handleIconClick('projects', 'Projects', 'Projects')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="contact"
        icon="/My Documents.ico"
        label="Contact"
        position={iconPositions['contact'] || { x: 16, y: 224 }}
        onPositionChange={(x, y) => updateIconPosition('contact', x, y)}
        onClick={() => handleIconClick('contact', 'Contact', 'Contact')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="resume"
        icon="/My Documents.ico"
        label="Resume"
        position={iconPositions['resume'] || { x: 16, y: 328 }}
        onPositionChange={(x, y) => updateIconPosition('resume', x, y)}
        onClick={() => handleIconClick('resume', 'Resume', 'Resume')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="notepad"
        icon="📝"
        label="Notepad"
        position={iconPositions['notepad'] || { x: 16, y: 432 }}
        onPositionChange={(x, y) => updateIconPosition('notepad', x, y)}
        onClick={() => handleIconClick('notepad', 'Notepad', 'Notepad')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="paint"
        icon="🎨"
        label="Paint"
        position={iconPositions['paint'] || { x: 16, y: 536 }}
        onPositionChange={(x, y) => updateIconPosition('paint', x, y)}
        onClick={() => handleIconClick('paint', 'Paint', 'Paint')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="challenge"
        icon="/Computer Folder.ico"
        label="Challenge"
        position={iconPositions['challenge'] || { x: 16, y: 640 }}
        onPositionChange={(x, y) => updateIconPosition('challenge', x, y)}
        onClick={() => handleIconClick('challenge', 'Challenge', 'Challenge')}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
      />
      <DesktopIcon 
        id="recyclebin"
        icon="🗑️"
        label="Recycle Bin"
        position={iconPositions['recyclebin'] || { x: 1200, y: 600 }}
        onPositionChange={(x, y) => updateIconPosition('recyclebin', x, y)}
        onClick={handleRecycleBinOpen}
        onRename={handleIconRename}
        onDelete={handleIconDelete}
        customContextMenu={[
          { label: 'Open', icon: '▶', onClick: handleRecycleBinOpen },
          { label: 'Empty Recycle Bin', icon: '🗑️', onClick: handleEmptyRecycleBin },
          'separator',
          { label: 'Properties', icon: '⚙️', onClick: () => alert('Recycle Bin Properties') }
        ]}
      />

      {/* User-created files and folders that live on the desktop */}
      {nodes.filter(n => n.parentId === null && !n.trashed).map(node => (
        <DesktopIcon
          key={node.id}
          id={node.id}
          icon={node.type === 'folder' ? '/New Folder.ico' : '📄'}
          label={node.name}
          position={node.position || { x: 130, y: 20 }}
          isFolder={node.type === 'folder'}
          onPositionChange={(x, y) => handleNodePositionChange(node.id, x, y)}
          onClick={() => openNode(node)}
          onRename={handleNodeRename}
          onDelete={handleNodeDelete}
          onDragEnd={handleNodeDropToMove}
        />
      ))}

      {/* Windows */}
      {openWindows.map(window => (
        !window.minimized && (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            position={windowPositions[window.id] || { x: 100, y: 100 }}
            onClose={() => {
              const { [window.id]: removed, ...rest } = windowPositions
              setWindowPositions(rest)
              closeWindow(window.id)
            }}
            onMinimize={() => {
              minimizeWindow(window.id)
            }}
            onMaximize={() => {
              maximizeWindow(window.id)
            }}
            isMaximized={window.maximized}
            onPositionChange={updateWindowPosition}
            width={window.component === 'Paint' ? '900px' : window.component === 'Resume' ? '800px' : (window.component === 'Folder' || window.component === 'RecycleBin') ? '520px' : undefined}
            height={window.component === 'Paint' ? '700px' : window.component === 'Resume' ? '600px' : (window.component === 'Folder' || window.component === 'RecycleBin') ? '380px' : undefined}
          >
            {renderWindowContent(window.component, window.props)}
          </Window>
        )
      ))}

      {/* Desktop Context Menu */}
      {desktopContextMenu && (
        <ContextMenu
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
          items={desktopContextMenuItems}
          onClose={() => setDesktopContextMenu(null)}
        />
      )}
    </div>
  )
}

export default Desktop

