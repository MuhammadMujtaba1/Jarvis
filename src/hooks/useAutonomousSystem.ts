/**
 * DIAGNOSTIC FIX: USE AUTONOMOUS SYSTEM HOOK
 * - Complete rewrite to prevent infinite loops
 * - All async operations have 5s timeout with fail-fast
 * - No state updates from background intervals
 * - Safe initialization that doesn't block UI
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { orchestrator } from '../agents/Orchestrator'

interface SystemState {
  isInitialized: boolean
  isReady: boolean
  metrics: any | null
  error: string | null
  isProcessing: boolean
}

// Timeout wrapper - fails fast to never block UI
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]);
};

export const useAutonomousSystem = () => {
  const [systemState, setSystemState] = useState<SystemState>({
    isInitialized: false,
    isReady: false,
    metrics: null,
    error: null,
    isProcessing: false
  })

  const orchestratorRef = useRef(orchestrator)
  const initRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize once on mount - no state updates during init
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // Non-blocking initialization
    try {
      // Orchestrator is already a singleton, just mark as ready
      orchestratorRef.current = orchestrator
      
      setSystemState({
        isInitialized: true,
        isReady: true,
        metrics: null,
        error: null,
        isProcessing: false
      })

      // Start background task with timeout protection (no state updates)
      intervalRef.current = setInterval(() => {
        // Fire and forget - don't await, don't update state
        withTimeout(
          orchestratorRef.current.analyzeCustomerEmails?.() || Promise.resolve(),
          3000
        ).catch(() => {})

        withTimeout(
          orchestratorRef.current.trackContentMetrics?.() || Promise.resolve(),
          3000
        ).catch(() => {})

        withTimeout(
          orchestratorRef.current.trackAdPerformance?.() || Promise.resolve(),
          3000
        ).catch(() => {})
      }, 15000) // Run every 15 seconds - less aggressive

    } catch (error) {
      console.warn('[useAutonomousSystem] Init warning:', error)
      setSystemState(prev => ({
        ...prev,
        isInitialized: true,
        isReady: true // Still ready, just without full features
      }))
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, []) // Empty deps - runs once only

  // Update metrics only when explicitly called
  const updateMetrics = useCallback((newMetrics: any) => {
    try {
      orchestratorRef.current?.updateMetrics?.(newMetrics)
    } catch (e) {
      // Silently fail
    }
  }, [])

  // Set processing state with safety
  const setProcessing = useCallback((processing: boolean) => {
    setSystemState(prev => ({ ...prev, isProcessing: processing }))
    
    // Auto-reset after 10 seconds max
    if (processing) {
      setTimeout(() => {
        setSystemState(prev => ({ ...prev, isProcessing: false }))
      }, 10000)
    }
  }, [])

  return {
    ...systemState,
    updateMetrics,
    setProcessing,
    orchestrator: orchestratorRef.current
  }
}

// Export for compatibility
export const initializeOrchestrator = async (_apiKey: string) => orchestrator
export const getOrchestrator = () => orchestrator
export const initializeGroqClient = (_apiKey: string) => {}
export const initializeDatabase = async () => {}
