import { useEffect, useState } from 'react'
import { initializeSystem } from './utils/systemInitializer'
import Dashboard from './components/Dashboard'
import { Agent, Goal } from './types'
import './App.css'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setup = async () => {
      try {
        console.log('🚀 Initializing JARVIS system...')
        const result = await initializeSystem()
        setAgents(result.agents)
        setSystemReady(true)
        setIsInitialized(true)
        console.log('✅ JARVIS system initialized')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('❌ Initialization failed:', errorMsg)
        setError(errorMsg)
        setIsInitialized(true)
      }
    }

    setup()
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-4">JARVIS</div>
          <div className="text-xl text-cyan-300 mb-8">Initializing autonomous agent matrix...</div>
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="text-4xl font-bold text-red-400 mb-4">ERROR</div>
          <p className="text-red-300 mb-8">{error}</p>
          <p className="text-cyan-300 text-sm">
            Please check your environment variables and ensure VITE_GROQ_API_KEY is set.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <Dashboard 
        systemReady={systemReady}
        agents={agents}
        activeGoal={activeGoal}
        onGoalCreate={setActiveGoal}
      />
    </div>
  )
}

export default App
