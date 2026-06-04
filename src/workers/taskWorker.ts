/**
 * WEB WORKER: Background Task Executor
 * Runs CPU-intensive tasks without blocking the UI thread
 * Handles DAG execution, metrics analysis, and streaming responses
 */

import { DAGProcessor } from './dagProcessor';
import { groqClient } from './groqClient';
import { ExecutionDAG, ExecutionTask } from '../types';

interface WorkerMessage {
  type: string;
  payload: any;
}

interface WorkerResponse {
  type: string;
  taskId?: string;
  data?: any;
  error?: string;
  progress?: number;
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'EXECUTE_DAG':
        await executeDAG(payload);
        break;

      case 'ANALYZE_METRICS':
        await analyzeMetrics(payload);
        break;

      case 'STREAM_GROQ':
        await streamGroqResponse(payload);
        break;

      case 'PROCESS_VIDEO_ANALYTICS':
        await processVideoAnalytics(payload);
        break;

      case 'PROCESS_AD_METRICS':
        await processAdMetrics(payload);
        break;

      default:
        sendError(`Unknown worker task type: ${type}`);
    }
  } catch (error) {
    sendError(String(error));
  }
};

/**
 * Execute a DAG in background
 */
async function executeDAG(payload: { dag: ExecutionDAG; startIndex?: number }): Promise<void> {
  const { dag, startIndex = 0 } = payload;
  const executableTasks = DAGProcessor.getExecutableTasks(dag);

  for (let i = startIndex; i < executableTasks.length; i++) {
    const task = executableTasks[i];
    const progress = Math.round(((i + 1) / executableTasks.length) * 100);

    // Simulate task execution (in production, would call actual agent APIs)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mark task as completed
    DAGProcessor.completeTask(dag, task.id);

    // Send progress update
    const response: WorkerResponse = {
      type: 'DAG_PROGRESS',
      data: {
        dagId: dag.id,
        completedTask: task.task,
        progress,
      },
    };

    self.postMessage(response);
  }

  // Send completion
  self.postMessage({
    type: 'DAG_COMPLETE',
    data: {
      dagId: dag.id,
      visualization: DAGProcessor.visualizeDAG(dag),
    },
  });
}

/**
 * Analyze business metrics in background
 */
async function analyzeMetrics(payload: any): Promise<void> {
  const { metricsJson } = payload;

  try {
    const analysis = await groqClient.analyzeMetrics(metricsJson);

    self.postMessage({
      type: 'METRICS_ANALYSIS_COMPLETE',
      data: {
        analysis,
      },
    });
  } catch (error) {
    sendError(`Metrics analysis failed: ${error}`);
  }
}

/**
 * Stream Groq response with progress updates
 */
async function streamGroqResponse(payload: any): Promise<void> {
  const { messages, taskId } = payload;

  try {
    await groqClient.stream(messages, 0.7, 2000, (chunk: string) => {
      self.postMessage({
        type: 'GROQ_STREAM_CHUNK',
        taskId,
        data: {
          chunk,
        },
      });
    });

    self.postMessage({
      type: 'GROQ_STREAM_COMPLETE',
      taskId,
    });
  } catch (error) {
    sendError(`Groq streaming failed: ${error}`);
  }
}

/**
 * Process video analytics in background
 */
async function processVideoAnalytics(payload: any): Promise<void> {
  const { videos, targetViews } = payload;

  // Simulate video analytics processing
  const analysis = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum: number, v: any) => sum + v.views, 0),
    targetViews,
    avgViewsPerVideo: Math.round(
      videos.reduce((sum: number, v: any) => sum + v.views, 0) / videos.length
    ),
    performanceStatus:
      videos.reduce((sum: number, v: any) => sum + v.views, 0) >= targetViews
        ? 'ON_TARGET'
        : 'BELOW_TARGET',
    topPerformer: videos.reduce((a: any, b: any) => (a.views > b.views ? a : b)),
  };

  self.postMessage({
    type: 'VIDEO_ANALYTICS_COMPLETE',
    data: analysis,
  });
}

/**
 * Process ad campaign metrics in background
 */
async function processAdMetrics(payload: any): Promise<void> {
  const { campaigns, totalBudget } = payload;

  // Simulate ad metrics processing
  const analysis = {
    totalCampaigns: campaigns.length,
    totalSpent: campaigns.reduce((sum: number, c: any) => sum + c.spent, 0),
    avgROAS: (campaigns.reduce((sum: number, c: any) => sum + c.roi, 0) / campaigns.length).toFixed(2),
    bestPerformer: campaigns.reduce((a: any, b: any) => (a.roi > b.roi ? a : b)),
    worstPerformer: campaigns.reduce((a: any, b: any) => (a.roi < b.roi ? a : b)),
    budgetUtilization: (
      (campaigns.reduce((sum: number, c: any) => sum + c.spent, 0) / totalBudget) *
      100
    ).toFixed(1),
  };

  self.postMessage({
    type: 'AD_METRICS_COMPLETE',
    data: analysis,
  });
}

/**
 * Send error message to main thread
 */
function sendError(error: string): void {
  self.postMessage({
    type: 'WORKER_ERROR',
    error,
  });
}

// Export for TypeScript
export {};
