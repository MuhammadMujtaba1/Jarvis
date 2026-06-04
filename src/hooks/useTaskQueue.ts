/**
 * TASK QUEUE HOOK - Background Task Management
 * Manages Web Worker interactions and task execution progress
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExecutionTask, ExecutionDAG } from '../types';

interface TaskQueueState {
  activeTasks: Map<string, ExecutionTask>;
  workerReady: boolean;
  progress: number;
}

export function useTaskQueue() {
  const [state, setState] = useState<TaskQueueState>({
    activeTasks: new Map(),
    workerReady: false,
    progress: 0,
  });

  const workerRef = useRef<Worker | null>(null);
  const taskMapRef = useRef<Map<string, ExecutionTask>>(new Map());

  /**
   * Initialize Web Worker
   */
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../workers/taskWorker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (event) => {
        const { type, data, taskId, error } = event.data;

        switch (type) {
          case 'DAG_PROGRESS':
            setState((prev) => ({
              ...prev,
              progress: data.progress,
            }));
            console.log(`📊 DAG Progress: ${data.progress}% - Completed: ${data.completedTask}`);
            break;

          case 'DAG_COMPLETE':
            setState((prev) => ({
              ...prev,
              progress: 100,
            }));
            console.log('✅ DAG Execution Complete:', data.visualization);
            break;

          case 'METRICS_ANALYSIS_COMPLETE':
            console.log('📈 Metrics Analysis:', data.analysis);
            break;

          case 'VIDEO_ANALYTICS_COMPLETE':
            console.log('🎬 Video Analytics:', data);
            break;

          case 'AD_METRICS_COMPLETE':
            console.log('💰 Ad Metrics:', data);
            break;

          case 'GROQ_STREAM_CHUNK':
            console.log(`📝 Streaming chunk for task ${taskId}:`, data.chunk);
            break;

          case 'GROQ_STREAM_COMPLETE':
            console.log(`✅ Stream complete for task ${taskId}`);
            break;

          case 'WORKER_ERROR':
            console.error('❌ Worker Error:', error);
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker initialization error:', error);
      };

      setState((prev) => ({ ...prev, workerReady: true }));
    } catch (error) {
      console.error('Failed to initialize Web Worker:', error);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  /**
   * Execute a DAG in the background
   */
  const executeDAG = useCallback((dag: ExecutionDAG, startIndex: number = 0): void => {
    if (!workerRef.current) {
      console.error('Worker not ready');
      return;
    }

    setState((prev) => ({ ...prev, progress: 0 }));

    workerRef.current.postMessage({
      type: 'EXECUTE_DAG',
      payload: {
        dag,
        startIndex,
      },
    });
  }, []);

  /**
   * Analyze metrics in background
   */
  const analyzeMetrics = useCallback((metricsJson: string): void => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'ANALYZE_METRICS',
      payload: { metricsJson },
    });
  }, []);

  /**
   * Stream Groq response with progress
   */
  const streamGroqResponse = useCallback(
    (messages: Array<{ role: string; content: string }>, taskId: string): void => {
      if (!workerRef.current) return;

      workerRef.current.postMessage({
        type: 'STREAM_GROQ',
        payload: { messages, taskId },
      });
    },
    []
  );

  /**
   * Process video analytics
   */
  const processVideoAnalytics = useCallback(
    (videos: any[], targetViews: number): void => {
      if (!workerRef.current) return;

      workerRef.current.postMessage({
        type: 'PROCESS_VIDEO_ANALYTICS',
        payload: { videos, targetViews },
      });
    },
    []
  );

  /**
   * Process ad metrics
   */
  const processAdMetrics = useCallback(
    (campaigns: any[], totalBudget: number): void => {
      if (!workerRef.current) return;

      workerRef.current.postMessage({
        type: 'PROCESS_AD_METRICS',
        payload: { campaigns, totalBudget },
      });
    },
    []
  );

  /**
   * Add task to queue
   */
  const addTask = useCallback((task: ExecutionTask): void => {
    taskMapRef.current.set(task.id, task);
    setState((prev) => ({
      ...prev,
      activeTasks: new Map(taskMapRef.current),
    }));
  }, []);

  /**
   * Get task by ID
   */
  const getTask = useCallback((taskId: string): ExecutionTask | undefined => {
    return taskMapRef.current.get(taskId);
  }, []);

  /**
   * Get all active tasks
   */
  const getActiveTasks = useCallback((): ExecutionTask[] => {
    return Array.from(taskMapRef.current.values());
  }, []);

  /**
   * Clear completed tasks
   */
  const clearCompleted = useCallback((): void => {
    Array.from(taskMapRef.current.entries()).forEach(([id, task]) => {
      if (task.status === 'COMPLETED' || task.status === 'FAILED') {
        taskMapRef.current.delete(id);
      }
    });

    setState((prev) => ({
      ...prev,
      activeTasks: new Map(taskMapRef.current),
    }));
  }, []);

  return {
    ...state,
    executeDAG,
    analyzeMetrics,
    streamGroqResponse,
    processVideoAnalytics,
    processAdMetrics,
    addTask,
    getTask,
    getActiveTasks,
    clearCompleted,
  };
}
