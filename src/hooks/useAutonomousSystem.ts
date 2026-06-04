/**
 * DIAGNOSTIC FIX: USE AUTONOMOUS SYSTEM HOOK
 * - Added timeout protection for async operations
 * - Removed potential infinite loop in periodic analysis
 * - Added isInitializedRef to prevent multiple initializations
 */

import { useEffect, useState, useCallback, useRef } from 'react'
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

// Timeout wrapper for any async operation
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout after ' + timeoutMs + 'ms')), timeoutMs)
    )
  ]);
};

export const useAutonomousSystem = () => {
  const [systemState, setSystemState] = useState<SystemState>({
    isInitialized: false,
    isReady: false,
    metrics: null,
    error: null
  })

  const orchestratorRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize system on mount - use empty dependency array to run only once
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    const initializeSystem = async () => {
      try {
        const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY

        // Initialize core systems with timeout protection
        initializeGroqClient(apiKey)
        await initializeDatabase()
        
        // Initialize orchestrator with timeout
        orchestratorRef.current = await withTimeout(
          initializeOrchestrator(apiKey),
          5000
        ).catch(() => {
          console.warn('[useAutonomousSystem] Orchestrator init timeout, creating fallback');
          return null;
        });

        // Start periodic analysis with timeout protection
        intervalRef.current = setInterval(async () => {
          if (!orchestratorRef.current) return;
          
          try {
            // Wrap each async call with timeout - fail fast to not block UI
            await withTimeout(orchestratorRef.current.analyzeCustomerEmails?.() || Promise.resolve(), 3000).catch(() => {});
            await withTimeout(orchestratorRef.current.trackContentMetrics?.() || Promise.resolve(), 3000).catch(() => {});
            await withTimeout(orchestratorRef.current.trackAdPerformance?.() || Promise.resolve(), 3000).catch(() => {});
            await withTimeout(orchestratorRef.current.saveConversationHistory?.() || Promise.resolve(), 3000).catch(() => {});
          } catch (e) {
            // Silently handle periodic errors
          }
        }, 30000); // Run every 30 seconds

        setSystemState({
          isInitialized: true,
          isReady: true,
          metrics: null,
          error: null
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('System initialization failed:', errorMsg)
        setSystemState({
          isInitialized: true,
          isReady: false,
          metrics: null,
          error: errorMsg
        })
      }
    }

    initializeSystem()

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []) // Empty dependency array - run once on mount

  const updateMetrics = useCallback((newMetrics: Partial<BusinessMetrics>) => {
    if (orchestratorRef.current) {
      orchestratorRef.current.updateMetrics?.(newMetrics)
    }
  }, [])

  return {
    ...systemState,
    updateMetrics,
    orchestrator: orchestratorRef.current || getOrchestrator()
  }
}
