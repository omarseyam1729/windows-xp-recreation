import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Desktop from './components/Desktop'
import Taskbar from './components/Taskbar'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [openWindows, setOpenWindows] = useState([])
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  // Show the Windows XP welcome screen on every page load, then boot to the
  // desktop after 2 seconds (with a short fade-out for polish).
  const [booting, setBooting] = useState(true)
  const [welcomeFading, setWelcomeFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setWelcomeFading(true), 1600)
    const bootTimer = setTimeout(() => setBooting(false), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(bootTimer)
    }
  }, [])

  const openWindow = (id, title, component, props = null) => {
    if (!openWindows.find(w => w.id === id)) {
      // Challenge always opens maximized
      const shouldMaximize = component === 'Challenge'
      setOpenWindows([...openWindows, { id, title, component, props, minimized: false, maximized: shouldMaximize }])
    }
  }

  const closeWindow = (id) => {
    setOpenWindows(openWindows.filter(w => w.id !== id))
  }

  const minimizeWindow = (id) => {
    setOpenWindows(openWindows.map(w => 
      w.id === id ? { ...w, minimized: !w.minimized } : w
    ))
  }

  const maximizeWindow = (id) => {
    setOpenWindows(openWindows.map(w => {
      if (w.id === id) {
        // Challenge should always stay maximized
        if (w.component === 'Challenge') {
          return { ...w, maximized: true }
        }
        return { ...w, maximized: !w.maximized }
      }
      return w
    }))
  }

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen)
  }

  return (
    <Router>
      <div className="w-screen h-screen relative overflow-hidden bg-xp-blue-500">
        {booting && <WelcomeScreen fading={welcomeFading} />}
        <Desktop
          openWindow={openWindow}
          openWindows={openWindows}
          closeWindow={closeWindow}
          minimizeWindow={minimizeWindow}
          maximizeWindow={maximizeWindow}
        />
        <Taskbar 
          startMenuOpen={startMenuOpen}
          toggleStartMenu={toggleStartMenu}
          openWindows={openWindows}
          minimizeWindow={minimizeWindow}
          maximizeWindow={maximizeWindow}
          openWindow={openWindow}
          closeWindow={closeWindow}
        />
      </div>
    </Router>
  )
}

export default App

