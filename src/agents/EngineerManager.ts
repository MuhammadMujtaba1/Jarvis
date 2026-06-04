/**
 * TIER 2: ENGINEERING MANAGER AGENT
 * Engineering Manager - Technical workflow translation and dependency management
 */

import { messageQueue } from '../utils/messageQueue';
import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { ExecutionTask } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class EngineerManager {
  private agentId = 'engineer-manager-tier2';
  private assignedTasks: Map<string, ExecutionTask> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        await this.handleTaskAssignment(message.payload as any);
      } else if (message.type === 'AD_OPTIMIZATION') {
        await this.handleAdOptimization(message.payload as any);
      }
    });
  }

  /**
   * Handle engineering task assignments
   */
  async handleTaskAssignment(payload: any): Promise<void> {
    const task = payload.task;
    console.log(`⚙️ Engineer Manager: Assigned task: ${task.task}`);

    // Create technical specification
    const techSpec = await groqClient.chat([
      {
        role: 'system',
        content: `You are a technical engineering manager. Create a concise technical implementation plan.`,
      },
      {
        role: 'user',
        content: `Create technical specification for: ${task.task}\nGoal: ${payload.goal}`,
      },
    ]);

    // Create execution task
    const executionTask: ExecutionTask = {
      id: uuidv4(),
      title: task.task,
      description: techSpec,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
    };

    this.assignedTasks.set(executionTask.id, executionTask);
    await dbStore.addExecutionTask(executionTask);

    // Dispatch to Researcher
    await messageQueue.sendMessage(
      this.agentId,
      'researcher',
      'RESEARCH_REQUEST',
      {
        taskId: executionTask.id,
        specification: techSpec,
      },
      'NORMAL'
    );
  }

  /**
   * Handle ad campaign optimization
   */
  async handleAdOptimization(payload: any): Promise<void> {
    console.log('💰 Engineer Manager: Optimizing ad campaigns...');
    console.log(`  Reallocating budget from ${payload.bottomPerformer.name} to ${payload.topPerformer.name}`);

    // Create optimization task
    const optimizationTask: ExecutionTask = {
      id: uuidv4(),
      title: 'Ad Campaign Budget Reallocation',
      description: `Reallocate ${payload.reallocationPercentage}% budget from ${payload.bottomPerformer.name} to ${payload.topPerformer.name}`,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
    };

    await dbStore.addExecutionTask(optimizationTask);

    console.log(`✅ Ad optimization task created: ${optimizationTask.id}`);
  }

  /**
   * Get assigned tasks
   */
  getAssignedTasks(): ExecutionTask[] {
    return Array.from(this.assignedTasks.values());
  }
}

export const engineerManager = new EngineerManager();
