import { useState, useEffect } from 'react'
import EnhancedDashboard from './components/EnhancedDashboard'
import './App.css'

function App() {
  const [systemReady, setSystemReady] = useState(false)

  useEffect(() => {
    // Simulate system boot sequence
    const bootTimer = setTimeout(() => {
      setSystemReady(true)
      console.log('🟢 JARVIS SYSTEM ONLINE')
    }, 2000)

    return () => clearTimeout(bootTimer)
  }, [])

  if (!systemReady) {
    return (
      <div className="boot-sequence">
        <div className="boot-text">
          <h1 className="text-glow">⚡ JARVIS INITIALIZATION</h1>
          <p>Loading autonomous business operations system...</p>
          <div className="boot-bar">
            <div className="boot-fill"></div>
          </div>
          <p className="boot-detail">Initializing Groq API • Loading IndexedDB • Starting Web Workers • Connecting Voice Interface...</p>
        </div>
      </div>
    )
  }

  return <EnhancedDashboard systemReady={systemReady} />
}

export default App
