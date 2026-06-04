import { useEffect, useState } from 'react'
import { initializeOrchestrator, getOrchestrator } from '../agents/Orchestrator'
import { initializeGroqClient } from '../utils/groqClient'
import { initializeDatabase } from '../utils/indexedDB'
import { BusinessMetrics } from '../agents/orchestratorMetrics'

interface SystemState {
  isInitialized: boolean
  isReady: boolean
  metrics: BusinessMetrics | null
  error: string | null
}

export const useAutonomousSystem = () => {
  const [systemState, setSystemState] = useState<SystemState>({
    isInitialized: false,
    isReady: false,
    metrics: null,
    error: null
  })

  // Initialize system on mount
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY

        if (!apiKey) {
          throw new Error('VITE_GROQ_API_KEY not configured')
        }

        // Initialize core systems
        initializeGroqClient(apiKey)
        await initializeDatabase()
        const orchestrator = await initializeOrchestrator(apiKey)

        // Start autonomous processes
        setSystemState((prev) => ({
          ...prev,
          isInitialized: true,
          isReady: true,
          metrics: orchestrator.getMetrics()
        }))

        // Run periodic analysis
        const interval = setInterval(async () => {
          const currentOrchestrator = getOrchestrator()
          await currentOrchestrator.analyzeCustomerEmails()
          await currentOrchestrator.trackContentMetrics()
          await currentOrchestrator.trackAdPerformance()
          await currentOrchestrator.saveConversationHistory()

          setSystemState((prev) => ({
            ...prev,
            metrics: currentOrchestrator.getMetrics()
          }))
        }, 30000) // Run every 30 seconds

        return () => clearInterval(interval)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('System initialization failed:', errorMsg)
        setSystemState((prev) => ({
          ...prev,
          isInitialized: true,
          error: errorMsg
        }))
      }
    }

    initializeSystem()
  }, [])

  const updateMetrics = (newMetrics: Partial<BusinessMetrics>) => {
    const orchestrator = getOrchestrator()
    orchestrator.updateMetrics(newMetrics)
    setSystemState((prev) => ({
      ...prev,
      metrics: orchestrator.getMetrics()
    }))
  }

  return {
    ...systemState,
    updateMetrics,
    orchestrator: getOrchestrator()
  }
}
