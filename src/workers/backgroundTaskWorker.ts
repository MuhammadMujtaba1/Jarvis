/**
 * BACKGROUND TASK WORKER - Off-Main-Thread Execution
 * Handles ANALYZE_EMAILS, TRACK_CONTENT, TRACK_ADS off the main thread
 * 
 * Features:
 * - Exponential backoff on failures
 * - AbortController for clean timeout handling
 * - Never blocks the main thread
 */

/// <reference lib="webworker" />

interface BackgroundTaskConfig {
  taskId: string;
  taskType: 'ANALYZE_EMAILS' | 'TRACK_CONTENT' | 'TRACK_ADS';
  priority: 'HIGH' | 'LOW';
  maxRetries: number;
}

interface BackoffState {
  consecutiveFailures: number;
  currentDelayMs: number;
  isPaused: boolean;
}

interface WorkerCommand {
  type: 'START_TASK' | 'STOP_TASK' | 'PAUSE_ALL' | 'RESUME_ALL' | 'RESET_BACKOFF';
  config?: BackgroundTaskConfig;
}

// Exponential backoff configuration
const BACKOFF_CONFIG = {
  initialDelayMs: 5000,
  maxDelayMs: 30000,
  multiplier: 2,
};

// 4000ms hard timeout for all operations
const TASK_TIMEOUT_MS = 4000;

// Global backoff state
let backoffState: BackoffState = {
  consecutiveFailures: 0,
  currentDelayMs: BACKOFF_CONFIG.initialDelayMs,
  isPaused: false,
};

// Track active tasks with AbortControllers
const activeTasks = new Map<string, AbortController>();

/**
 * Calculate next backoff delay with exponential increase
 */
function calculateBackoff(): number {
  const newDelay = Math.min(
    backoffState.currentDelayMs * BACKOFF_CONFIG.multiplier,
    BACKOFF_CONFIG.maxDelayMs
  );
  return newDelay;
}

/**
 * Reset backoff state after successful operation
 */
function resetBackoff(): void {
  backoffState = {
    consecutiveFailures: 0,
    currentDelayMs: BACKOFF_CONFIG.initialDelayMs,
    isPaused: false,
  };
  postToMain({ type: 'BACKOFF_RESET', data: { message: 'Backoff reset - normal operation resumed' } });
}

/**
 * Increment backoff after failure
 */
function incrementBackoff(): void {
  backoffState.consecutiveFailures++;
  if (backoffState.consecutiveFailures >= 3) {
    backoffState.currentDelayMs = calculateBackoff();
    backoffState.isPaused = true;
    
    postToMain({ 
      type: 'BACKOFF_ACTIVE', 
      data: { 
        delayMs: backoffState.currentDelayMs,
        consecutiveFailures: backoffState.consecutiveFailures,
        message: `⚠️ Cooling down for ${backoffState.currentDelayMs / 1000}s due to repeated failures`
      } 
    });
  }
}

/**
 * Create timeout wrapper with AbortController
 */
function withAbortTimeout<T>(
  promise: Promise<T>, 
  taskId: string,
  timeoutMs: number = TASK_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  activeTasks.set(taskId, controller);

  const timeoutId = setTimeout(() => {
    controller.abort();
    activeTasks.delete(taskId);
  }, timeoutMs);

  return promise
    .then(result => {
      clearTimeout(timeoutId);
      activeTasks.delete(taskId);
      return result;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      activeTasks.delete(taskId);
      throw error;
    });
}

/**
 * Post message to main thread
 */
function postToMain(data: any): void {
  self.postMessage(data);
}

/**
 * Simulate email analysis (replace with actual API call)
 */
async function analyzeEmails(taskId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    processedCount: Math.floor(Math.random() * 20) + 5,
    urgentCount: Math.floor(Math.random() * 3),
    avgResponseTime: '2.5 hours',
    status: 'COMPLETE'
  };
}

/**
 * Simulate content metrics tracking
 */
async function trackContent(taskId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    videosProcessed: Math.floor(Math.random() * 10) + 1,
    newViews: Math.floor(Math.random() * 5000),
    engagementRate: (Math.random() * 5 + 2).toFixed(1) + '%',
    topContent: 'Trending Video #' + Math.floor(Math.random() * 100)
  };
}

/**
 * Simulate ad performance tracking
 */
async function trackAds(taskId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    campaignsTracked: Math.floor(Math.random() * 5) + 1,
    totalSpend: '$' + (Math.random() * 1000 + 100).toFixed(2),
    avgROAS: (Math.random() * 3 + 1.5).toFixed(2) + 'x',
    bestCampaign: 'Campaign #' + Math.floor(Math.random() * 10)
  };
}

/**
 * Execute a background task with full isolation
 */
async function executeTask(config: BackgroundTaskConfig): Promise<void> {
  const { taskId, taskType, priority } = config;
  const startTime = Date.now();

  if (backoffState.isPaused) {
    postToMain({
      type: 'TASK_SKIPPED',
      data: { taskId, reason: 'Backoff pause active', nextRetryMs: backoffState.currentDelayMs }
    });
    return;
  }

  try {
    postToMain({ type: 'TASK_STARTING', data: { taskId, taskType, priority } });

    let result: any;
    const timeoutPromise = withAbortTimeout(
      (async () => {
        switch (taskType) {
          case 'ANALYZE_EMAILS':
            return await analyzeEmails(taskId);
          case 'TRACK_CONTENT':
            return await trackContent(taskId);
          case 'TRACK_ADS':
            return await trackAds(taskId);
          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }
      })(),
      taskId,
      TASK_TIMEOUT_MS
    );

    result = await timeoutPromise;
    const duration = Date.now() - startTime;
    
    resetBackoff();

    postToMain({
      type: 'TASK_COMPLETE',
      data: {
        taskId,
        taskType,
        result,
        durationMs: duration,
        status: 'IDLE'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('abort') || duration >= TASK_TIMEOUT_MS;
    
    incrementBackoff();

    postToMain({
      type: 'TASK_ERROR',
      data: {
        taskId,
        taskType,
        error: isTimeout ? 'TIMEOUT' : errorMessage,
        durationMs: duration,
        status: 'IDLE',
        backoffDelayMs: backoffState.currentDelayMs,
        nextRetryIn: backoffState.isPaused ? backoffState.currentDelayMs : null
      }
    });
  }
}

/**
 * Stop a specific task
 */
function stopTask(taskId: string): void {
  const controller = activeTasks.get(taskId);
  if (controller) {
    controller.abort();
    activeTasks.delete(taskId);
    postToMain({ type: 'TASK_STOPPED', data: { taskId } });
  }
}

/**
 * Stop all active tasks
 */
function stopAllTasks(): void {
  activeTasks.forEach((controller, taskId) => {
    controller.abort();
    postToMain({ type: 'TASK_STOPPED', data: { taskId } });
  });
  activeTasks.clear();
  postToMain({ type: 'ALL_TASKS_STOPPED' });
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const { type, config } = event.data;

  switch (type) {
    case 'START_TASK':
      if (config) {
        await executeTask(config);
      }
      break;

    case 'STOP_TASK':
      if (config?.taskId) {
        stopTask(config.taskId);
      }
      break;

    case 'PAUSE_ALL':
      backoffState.isPaused = true;
      stopAllTasks();
      postToMain({ type: 'ALL_TASKS_PAUSED', data: { backoffDelayMs: backoffState.currentDelayMs } });
      break;

    case 'RESUME_ALL':
      backoffState.isPaused = false;
      postToMain({ type: 'ALL_TASKS_RESUMED' });
      break;

    case 'RESET_BACKOFF':
      resetBackoff();
      break;

    default:
      postToMain({ type: 'ERROR', data: { message: `Unknown command: ${type}` } });
  }
};

postToMain({ type: 'WORKER_READY' });

export {};
