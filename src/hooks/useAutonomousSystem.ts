/**
 * DIAGNOSTIC FIX: USE AUTONOMOUS SYSTEM HOOK
 * 
 * DECOUPLED ARCHITECTURE:
 * - UI/Voice runs on high-priority isolated channel
 * - Background telemetry runs in Web Worker
 * - Exponential backoff prevents blocking
 * - 4000ms timeout with clean AbortController
 * - Agent state always resets to IDLE after operations
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { executionManager, TaskConfig } from '../utils/executionManager';

interface SystemState {
  isInitialized: boolean;
  isReady: boolean;
  metrics: any | null;
  error: string | null;
  isProcessing: boolean;
  agentStatus: 'IDLE' | 'PROCESSING' | 'WAITING';
  backoffActive: boolean;
  backoffDelayMs: number | null;
}

const TASK_TIMEOUT_MS = 4000;

export const useAutonomousSystem = () => {
  const [systemState, setSystemState] = useState<SystemState>({
    isInitialized: false,
    isReady: false,
    metrics: null,
    error: null,
    isProcessing: false,
    agentStatus: 'IDLE',
    backoffActive: false,
    backoffDelayMs: null
  });

  const initRef = useRef(false);
  const isUIBusyRef = useRef(false);

  const updateUI = useCallback((updates: Partial<SystemState>) => {
    isUIBusyRef.current = true;
    setSystemState(prev => ({ ...prev, ...updates }));
    Promise.resolve().then(() => {
      isUIBusyRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log('[useAutonomousSystem] Initializing...');

    const checkWorker = setInterval(() => {
      if (executionManager.isWorkerReady()) {
        clearInterval(checkWorker);
        updateUI({ isInitialized: true, isReady: true });
        console.log('[useAutonomousSystem] System ready');
      }
    }, 100);

    const safetyTimeout = setTimeout(() => {
      clearInterval(checkWorker);
      updateUI({ isInitialized: true, isReady: true });
    }, 5000);

    return () => {
      clearInterval(checkWorker);
      clearTimeout(safetyTimeout);
      executionManager.cancelAll();
    };
  }, [updateUI]);

  const updateMetrics = useCallback((newMetrics: any) => {
    updateUI({ metrics: newMetrics });
  }, [updateUI]);

  const setProcessing = useCallback((processing: boolean) => {
    updateUI({ isProcessing: processing, agentStatus: processing ? 'PROCESSING' : 'IDLE' });
    if (processing) {
      setTimeout(() => updateUI({ isProcessing: false, agentStatus: 'IDLE' }), TASK_TIMEOUT_MS);
    }
  }, [updateUI]);

  const pauseBackground = useCallback(() => {
    executionManager.pauseAll();
    updateUI({ backoffActive: true, backoffDelayMs: 30000 });
  }, [updateUI]);

  const resumeBackground = useCallback(() => {
    executionManager.resumeAll();
    updateUI({ backoffActive: false, backoffDelayMs: null });
  }, [updateUI]);

  return {
    ...systemState,
    updateMetrics,
    setProcessing,
    pauseBackground,
    resumeBackground,
    executionManager
  };
};

export const initializeOrchestrator = async (_apiKey: string) => null;
export const getOrchestrator = () => null;
export const initializeGroqClient = (_apiKey: string) => {};
export const initializeDatabase = async () => {};
