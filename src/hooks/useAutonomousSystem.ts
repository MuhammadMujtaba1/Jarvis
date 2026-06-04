import { useEffect, useState } from 'react'
import { Orchestrator } from '../agents/Orchestrator'
import { BusinessMetrics } from '../agents/orchestratorMetrics'

interface SystemState {
  isInitialized: boolean
  isReady: boolean
  metrics: BusinessMetrics | null
  error: string | null
}

// Singleton orchestrator instance
let orchestratorInstance: Orchestrator | null = null

export const initializeOrchestrator = async (_apiKey: string): Promise<Orchestrator> => {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator()
  }
  return orchestratorInstance
}

export const getOrchestrator = (): Orchestrator => {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator()
  }
  return orchestratorInstance
}

export const initializeGroqClient = (_apiKey: string): void => {
  // GroqClient is a singleton, already initialized
}

export const initializeDatabase = async (): Promise<void> => {
  // Database is a singleton, already initialized
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
        const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY

        if (!apiKey) {
          throw new Error('VITE_GROQ_API_KEY not configured')
        }

        // Initialize core systems
        initializeGroqClient(apiKey)
        await initializeDatabase()
        await initializeOrchestrator(apiKey)

        // Start autonomous processes
        setSystemState((prev) => ({
          ...prev,
          isInitialized: true,
          isReady: true,
          metrics: null // Metrics will be updated periodically
        }))

        // Run periodic analysis
        const interval = setInterval(async () => {
          const currentOrchestrator = getOrchestrator()
          try {
            await currentOrchestrator.analyzeCustomerEmails()
            await currentOrchestrator.trackContentMetrics()
            await currentOrchestrator.trackAdPerformance()
            await currentOrchestrator.saveConversationHistory()
          } catch (e) {
            // Silently handle periodic errors
          }

          setSystemState((prev) => ({
            ...prev,
            metrics: prev.metrics
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
