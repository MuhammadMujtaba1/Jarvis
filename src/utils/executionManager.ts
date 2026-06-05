/**
 * EXECUTION MANAGER - Main Thread Coordinator
 * Provides API for background task management with UI isolation
 * 
 * Features:
 * - High-priority channel for UI updates
 * - Separate from background telemetry
 * - AbortController boundaries for async operations
 * - Exponential backoff coordination
 */

export interface TaskConfig {
  taskId: string;
  taskType: 'ANALYZE_EMAILS' | 'TRACK_CONTENT' | 'TRACK_ADS';
  priority: 'HIGH' | 'LOW';
}

export interface TaskResult {
  taskId: string;
  taskType: string;
  result?: any;
  error?: string;
  status: 'IDLE' | 'PROCESSING' | 'ERROR';
  durationMs?: number;
  backoffDelayMs?: number;
  message?: string;
}

type TaskCallback = (result: TaskResult) => void;

class ExecutionManager {
  private worker: Worker | null = null;
  private isReady = false;
  private callbacks: Set<TaskCallback> = new Set();
  private uiCallbacks: Set<TaskCallback> = new Set();
  private pendingTasks = new Map<string, AbortController>();
  
  // 4000ms timeout for all tasks
  private readonly TASK_TIMEOUT_MS = 4000;

  constructor() {
    this.initWorker();
  }

  /**
   * Initialize the background worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/backgroundTaskWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('[ExecutionManager] Worker error:', error);
        this.notifyCallbacks({
          taskId: 'SYSTEM',
          taskType: 'WORKER_ERROR',
          error: error.message,
          status: 'ERROR'
        });
      };
    } catch (error) {
      console.error('[ExecutionManager] Failed to init worker:', error);
    }
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(data: any): void {
    // Worker ready signal
    if (data.type === 'WORKER_READY') {
      this.isReady = true;
      console.log('[ExecutionManager] Worker ready');
      return;
    }

    // Map worker messages to TaskResult
    const result: TaskResult = {
      taskId: data.data?.taskId || 'UNKNOWN',
      taskType: data.data?.taskType || data.type,
      status: 'IDLE',
    };

    switch (data.type) {
      case 'TASK_COMPLETE':
        result.result = data.data.result;
        result.durationMs = data.data.durationMs;
        result.status = 'IDLE';
        break;

      case 'TASK_ERROR':
        result.error = data.data.error;
        result.durationMs = data.data.durationMs;
        result.backoffDelayMs = data.data.backoffDelayMs;
        result.status = 'IDLE';
        result.message = data.data.nextRetryIn 
          ? `⚠️ Retrying in ${data.data.nextRetryIn / 1000}s` 
          : undefined;
        break;

      case 'TASK_STARTING':
        result.status = 'PROCESSING';
        break;

      case 'BACKOFF_ACTIVE':
        result.message = data.data.message;
        result.backoffDelayMs = data.data.delayMs;
        break;

      case 'BACKOFF_RESET':
        result.message = data.data.message;
        break;

      case 'TASK_SKIPPED':
        result.message = data.data.reason;
        result.backoffDelayMs = data.data.nextRetryMs;
        break;

      default:
        break;
    }

    this.notifyCallbacks(result);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(result: TaskResult): void {
    // Notify UI callbacks first (high priority)
    this.uiCallbacks.forEach(cb => {
      try {
        cb(result);
      } catch (e) {
        console.error('[ExecutionManager] UI callback error:', e);
      }
    });

    // Then notify general callbacks
    this.callbacks.forEach(cb => {
      try {
        cb(result);
      } catch (e) {
        console.error('[ExecutionManager] Callback error:', e);
      }
    });
  }

  /**
   * Register a callback for task updates (general)
   */
  onTaskUpdate(callback: TaskCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Register a high-priority UI callback (never blocked by background tasks)
   */
  onUIUpdate(callback: TaskCallback): () => void {
    this.uiCallbacks.add(callback);
    return () => this.uiCallbacks.delete(callback);
  }

  /**
   * Execute a background task with AbortController timeout
   */
  async executeTask(config: TaskConfig): Promise<TaskResult> {
    return new Promise((resolve) => {
      if (!this.worker || !this.isReady) {
        resolve({
          taskId: config.taskId,
          taskType: config.taskType,
          error: 'Worker not ready',
          status: 'ERROR'
        });
        return;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      this.pendingTasks.set(config.taskId, controller);

      // Set timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.pendingTasks.delete(config.taskId);
        
        resolve({
          taskId: config.taskId,
          taskType: config.taskType,
          error: 'TIMEOUT',
          status: 'IDLE',
          durationMs: this.TASK_TIMEOUT_MS,
          message: '⚠️ Task timed out - agent state reset to IDLE'
        });

        // Stop the worker task
        this.worker?.postMessage({ type: 'STOP_TASK', config: { taskId: config.taskId } });
      }, this.TASK_TIMEOUT_MS);

      // Listen for completion
      const unsubscribe = this.onTaskUpdate((result) => {
        if (result.taskId === config.taskId) {
          clearTimeout(timeoutId);
          this.pendingTasks.delete(config.taskId);
          unsubscribe();
          resolve({
            ...result,
            durationMs: result.durationMs || this.TASK_TIMEOUT_MS
          });
        }
      });

      // Start the task in worker
      this.worker.postMessage({ type: 'START_TASK', config });
    });
  }

  /**
   * Execute multiple tasks in parallel (background)
   */
  async executeBatch(tasks: TaskConfig[]): Promise<TaskResult[]> {
    return Promise.all(tasks.map(task => this.executeTask(task)));
  }

  /**
   * Pause all background tasks (enter backoff)
   */
  pauseAll(): void {
    if (this.worker) {
      // Cancel pending tasks
      this.pendingTasks.forEach((controller) => controller.abort());
      this.pendingTasks.clear();
      
      this.worker.postMessage({ type: 'PAUSE_ALL' });
    }
  }

  /**
   * Resume all background tasks
   */
  resumeAll(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'RESUME_ALL' });
    }
  }

  /**
   * Reset backoff state
   */
  resetBackoff(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'RESET_BACKOFF' });
    }
  }

  /**
   * Cancel a specific task
   */
  cancelTask(taskId: string): void {
    const controller = this.pendingTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.pendingTasks.delete(taskId);
    }
    
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_TASK', config: { taskId } });
    }
  }

  /**
   * Cancel all pending tasks
   */
  cancelAll(): void {
    this.pendingTasks.forEach((controller) => controller.abort());
    this.pendingTasks.clear();
  }

  /**
   * Check if worker is ready
   */
  isWorkerReady(): boolean {
    return this.isReady;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.cancelAll();
    this.callbacks.clear();
    this.uiCallbacks.clear();
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
}

// Singleton instance
export const executionManager = new ExecutionManager();
