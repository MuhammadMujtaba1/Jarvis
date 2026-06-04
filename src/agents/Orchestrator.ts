/**
 * TIER 1: ORCHESTRATOR AGENT (THE DIRECTOR)
 * Conversational partner, goal parsing, execution graph creation
 * Manages all downstream agents and orchestrates the business agency
 */

import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { messageQueue } from '../utils/messageQueue';
import { DAGProcessor } from '../utils/dagProcessor';
import {
  ExecutionDAG,
  OrchestratorRequest,
  BusinessAgencyState,
  ShortFormVideoMetrics,
  AdCampaignMetrics,
  AdCreative,
  CustomerEmailMetrics,
  FeatureCluster,
} from '../types';

// ============================================================================
// EXPORTS FOR useAutonomousSystem HOOK (DIAGNOSTIC FIX)
// ============================================================================

export const initializeOrchestrator = async (_apiKey: string): Promise<Orchestrator> => {
  return orchestrator;
};

export const getOrchestrator = (): Orchestrator => {
  return orchestrator;
};

export const initializeGroqClient = (_apiKey: string): void => {
  // Groq client is already a singleton
};

export const initializeDatabase = async (): Promise<void> => {
  // Database is already initialized
};

export class Orchestrator {
  private agentId = 'orchestrator-tier1';
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.initializeListeners();
  }

  /**
   * Subscribe to incoming messages
   */
  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'USER_REQUEST') {
        await this.handleUserRequest(message.payload as OrchestratorRequest);
      } else if (message.type === 'BUSINESS_METRICS_UPDATE') {
        await this.analyzeMetricsAndRecommend(message.payload as Partial<BusinessAgencyState>);
      }
    });
  }

  /**
   * CORE: Process user goals and create execution DAGs
   */
  async handleUserRequest(request: OrchestratorRequest): Promise<void> {
    console.log('🎯 Orchestrator: Parsing goal:', request.goal);

    // Create DAG from goal
    const dag = DAGProcessor.parseGoalIntoDAG(request.goal);
    DAGProcessor.assignAgentsToDAG(dag);

    // Store in DB
    const currentState = await dbStore.getSystemState();
    if (currentState) {
      currentState.executionDAGs.push(dag);
      await dbStore.updateSystemState(currentState);
    }

    // Get first batch of executable tasks
    const executableTasks = DAGProcessor.getExecutableTasks(dag);

    // Dispatch to appropriate managers
    for (const task of executableTasks) {
      await this.dispatchTaskToManager(task, dag, request.priority || 'MEDIUM');
    }

    console.log('✅ DAG created with', dag.nodes.length, 'tasks');
    console.log(DAGProcessor.visualizeDAG(dag));
  }

  /**
   * Dispatch tasks to specialized managers
   */
  private async dispatchTaskToManager(
    task: any,
    dag: ExecutionDAG,
    priority: string
  ): Promise<void> {
    const manager = task.agentAssigned.includes('design') ? 'design-manager' : 'engineer-manager';

    await messageQueue.sendMessage(
      this.agentId,
      manager,
      'TASK_ASSIGNMENT',
      {
        task,
        dagId: dag.id,
        goal: dag.goal,
      },
      priority as 'HIGH' | 'NORMAL' | 'LOW'
    );
  }

  /**
   * BUSINESS AUTOMATION: Monitor and analyze business metrics
   */
  async analyzeMetricsAndRecommend(state: Partial<BusinessAgencyState>): Promise<void> {
    console.log('📊 Orchestrator: Analyzing business metrics...');

    // 1. SHORT-FORM VIDEO AUTOMATION LOOP
    if (state.videoMetrics) {
      await this.analyzeVideoMetrics(state.videoMetrics);
    }

    // 2. PAID AD OPTIMIZATION MATRIX
    if (state.adMetrics) {
      await this.analyzeAdMetrics(state.adMetrics);
    }

    // 3. CUSTOMER EMAIL AUTO-RESOLUTION ENGINE
    if (state.emailMetrics) {
      await this.processCustomerEmails(state.emailMetrics);
    }
  }

  /**
   * Analyze video performance and auto-generate content
   */
  private async analyzeVideoMetrics(metrics: ShortFormVideoMetrics): Promise<void> {
    console.log('🎬 Video Metrics Analysis:');
    console.log(`  Created Daily: ${metrics.videosCreatedDaily}`);
    console.log(`  Weekly Views: ${metrics.totalWeeklyViews} / ${metrics.targetViews}`);
    console.log(`  Growth Trend: ${metrics.growthTrend.join(', ')}`);

    // If below target, dispatch content generation
    if (metrics.totalWeeklyViews < metrics.targetViews * 0.8) {
      const contentGoal = `Generate 3 short-form video scripts for social media content to drive engagement`;
      await messageQueue.sendMessage(
        this.agentId,
        'content-worker',
        'CONTENT_GENERATION',
        {
          goal: contentGoal,
          topic: 'business growth and automation',
          count: 3,
        },
        'HIGH'
      );

      console.log('📤 Dispatched: Content generation for underperforming videos');
    }
  }

  /**
   * Monitor ad spend and ROAS, optimize budgets
   */
  private async analyzeAdMetrics(metrics: AdCampaignMetrics): Promise<void> {
    console.log('💰 Ad Campaign Analysis:');
    console.log(`  Total Spent: $${metrics.totalSpent}`);
    console.log(`  ROAS: ${metrics.roas}x`);

    // Identify top and bottom performers
    const topCreative = metrics.activeCreatives.reduce((a, b) =>
      a.roi > b.roi ? a : b
    );
    const bottomCreative = metrics.activeCreatives.reduce((a, b) =>
      a.roi < b.roi ? a : b
    );

    console.log(`  🏆 Top Performer: ${topCreative.name} (ROI: ${topCreative.roi})`);
    console.log(`  ⚠️ Underperformer: ${bottomCreative.name} (ROI: ${bottomCreative.roi})`);

    // Auto-optimize: reallocate budget from worst to best performers
    await messageQueue.sendMessage(
      this.agentId,
      'engineer-manager',
      'AD_OPTIMIZATION',
      {
        topPerformer: topCreative,
        bottomPerformer: bottomCreative,
        reallocationPercentage: 20, // Move 20% budget from bottom to top
      },
      'NORMAL'
    );
  }

  /**
   * CUSTOMER RELATIONS MANAGEMENT: Auto-resolve common queries
   */
  private async processCustomerEmails(metrics: CustomerEmailMetrics): Promise<void> {
    console.log('📧 Customer Email Analysis:');
    console.log(`  Total Weekly: ${metrics.totalWeekly}`);
    console.log(`  Auto-Resolved: ${metrics.resolvedAutomatically}`);
    console.log(`  Requires Human: ${metrics.requiresHuman}`);

    // Detect feature clusters and dispatch to engineering
    if (metrics.commonFeatureRequests.length > 0) {
      const topRequest = metrics.commonFeatureRequests[0];
      if (topRequest.requestCount >= 3) {
        console.log(
          `🔧 Feature Cluster Detected: "${topRequest.feature}" (${topRequest.requestCount} requests)`
        );

        // Dispatch backend engineering task
        await this.dispatchBackendEngineeringTask(topRequest);
      }
    }
  }

  /**
   * TIER 3 WORKER ACTIVATION: Generate backend spec from feature cluster
   */
  private async dispatchBackendEngineeringTask(cluster: FeatureCluster): Promise<void> {
    console.log('⚙️ Dispatching backend engineering task...');

    // Generate technical specification using Groq
    const spec = await groqClient.generateBackendSpec(cluster.feature);

    // Create execution task
    const engineeringDAG = DAGProcessor.parseGoalIntoDAG(
      `Implement backend for: ${cluster.feature}`
    );
    DAGProcessor.assignAgentsToDAG(engineeringDAG);

    // Dispatch to builder agent
    await messageQueue.sendMessage(
      this.agentId,
      'builder',
      'BACKEND_IMPLEMENTATION',
      {
        featureName: cluster.feature,
        specification: spec,
        affectedUsers: cluster.userIds.length,
        priority: cluster.priority,
        dagId: engineeringDAG.id,
      },
      'HIGH'
    );

    console.log(
      `✅ Backend engineering task dispatched for: ${cluster.feature} (affects ${cluster.userIds.length} users)`
    );
  }

  /**
   * Natural language conversation with voice context
   */
  async conversationResponse(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const systemPrompt = `You are JARVIS, an autonomous AI business partner running natively in the browser. 
You manage multi-tier agent orchestration, business metrics, and automated task execution.
You have access to real-time metrics about video content, ad campaigns, and customer relations.
Respond professionally but conversationally. Be concise and action-oriented.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory,
    ] as Array<{ role: string; content: string }>;

    const response = await groqClient.chat(messages as any);

    this.conversationHistory.push({
      role: 'assistant',
      content: response,
    });

    // Keep last 10 exchanges in memory
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    return response;
  }

  /**
   * Get current system state summary
   */
  async getSystemSummary(): Promise<string> {
    const state = await dbStore.getSystemState();
    if (!state) return 'No system state available';

    const metrics = state.systemMetrics;
    const videoMetrics = state.videoMetrics;
    const adMetrics = state.adMetrics;
    const emailMetrics = state.emailMetrics;

    return `
🎯 JARVIS SYSTEM STATUS

📊 BUSINESS METRICS:
  Videos: ${videoMetrics.videosCreatedWeekly} created this week (${videoMetrics.totalWeeklyViews} views)
  Ads: $${adMetrics.totalSpent} spent, ${adMetrics.roas}x ROAS
  Emails: ${emailMetrics.totalWeekly} weekly, ${emailMetrics.resolvedAutomatically} auto-resolved

⚙️ SYSTEM:
  CPU: ${metrics.cpuUsage}% | RAM: ${metrics.ramUsage}GB / ${metrics.ramTotal}GB | Power: ${metrics.powerLevel}%
  Storage: ${metrics.storageUsed} used, ${metrics.storageFree} free
  Network: ↓${metrics.networkDownload}kbps ↑${metrics.networkUpload}kbps
    `;
  }
}

export const orchestrator = new Orchestrator();
