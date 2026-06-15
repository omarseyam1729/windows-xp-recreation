const StartMenu = ({ onClose, openWindows, openWindow }) => {
  const leftColumnItems = [
    { id: 'internet', label: 'Internet Explorer', icon: '/Folders with Earth.ico', component: 'InternetExplorer' },
    { id: 'cmd', label: 'Command Prompt', icon: '/cmd.svg', component: 'CommandPrompt' },
    { id: 'notepad', label: 'Notepad', icon: '📝', component: 'Notepad' },
    { id: 'paint', label: 'Paint', icon: '🎨', component: 'Paint' },
  ]

  const rightColumnItems = [
    { id: 'documents', label: 'My Documents', icon: '/My Documents.ico', component: 'MyDocuments' },
    { id: 'recent', label: 'My Recent Documents', icon: '/My Documents.ico', hasArrow: true, component: 'MyRecentDocuments' },
    { id: 'pictures', label: 'My Pictures', icon: '/My Pictures.ico', component: 'MyPictures' },
    { id: 'music', label: 'My Music', icon: '/My Music.ico', component: 'MyMusic' },
    { id: 'computer', label: 'My Computer', icon: '/Computer Folder.ico', component: 'MyComputer' },
    { id: 'control', label: 'Control Panel', icon: '/Control Panel Folder.ico', component: 'ControlPanel' },
    { id: 'programs', label: 'Set Program Access and Defaults', icon: '/All Programs.ico', component: 'SetProgramAccess' },
    { id: 'printers', label: 'Printers and Faxes', icon: '/Printer Folder.ico', component: 'PrintersAndFaxes' },
    { id: 'help', label: 'Help and Support', icon: '/Folder Options.ico', component: 'HelpAndSupport' },
    { id: 'search', label: 'Search', icon: '/Windows Explorer.ico', component: 'Search' },
    { id: 'run', label: 'Run...', icon: '/Windows Explorer.ico', component: 'Run' },
  ]

  const handleMenuItemClick = (id, label, component) => {
    if (component) {
      openWindow(id, label, component)
      onClose()
    }
  }

  return (
    <div className="xp-start-menu-container">
      {/* Header Section */}
      <div className="xp-start-menu-header">
        <div className="xp-user-avatar">👤</div>
        <span className="xp-username">User</span>
      </div>

      {/* Body Section - Two Columns */}
      <div className="xp-start-menu-body">
        {/* Left Column - Programs */}
        <div className="xp-start-menu-left">
          {leftColumnItems.map(item => (
            <div
              key={item.id}
              className="xp-start-menu-item-left"
              onClick={() => handleMenuItemClick(item.id, item.label, item.component)}
            >
              <span className="xp-menu-icon-left">
                {item.icon && item.icon.startsWith('/') ? (
                  <img src={item.icon} alt={item.label} className="w-8 h-8 object-contain" />
                ) : (
                  item.icon
                )}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
          {/* All Programs Button */}
          <div className="xp-all-programs-btn">
            <span>All Programs</span>
            <span className="xp-arrow-icon">▶</span>
          </div>
        </div>

        {/* Right Column - System */}
        <div className="xp-start-menu-right">
          {rightColumnItems.map(item => (
            <div
              key={item.id}
              className="xp-start-menu-item-right"
              onClick={() => handleMenuItemClick(item.id, item.label, item.component)}
            >
              <span className="xp-menu-icon-right">
                {item.icon && item.icon.startsWith('/') ? (
                  <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                ) : (
                  item.icon
                )}
              </span>
              <span>{item.label}</span>
              {item.hasArrow && <span className="xp-arrow-icon">▶</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="xp-start-menu-footer">
        <button className="xp-footer-button" onClick={onClose}>
          <span className="xp-footer-icon">🔑</span>
          <span>Log Off</span>
        </button>
        <button className="xp-footer-button" onClick={onClose}>
          <span className="xp-footer-icon color-red">⏻</span>
          <span>Turn Off Computer</span>
        </button>
      </div>
    </div>
  )
}

export default StartMenu
