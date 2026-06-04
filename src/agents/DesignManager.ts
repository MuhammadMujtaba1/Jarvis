/**
 * TIER 2: DESIGN MANAGER AGENT
 * Product & Design Manager - Creates UI/UX blueprints and design specifications
 */

import { messageQueue } from '../utils/messageQueue';
import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { ExecutionTask, ManagerDecision } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DesignManager {
  private agentId = 'design-manager-tier2';
  private assignedTasks: Map<string, ExecutionTask> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        await this.handleTaskAssignment(message.payload as any);
      }
    });
  }

  /**
   * Receive task from Orchestrator and create design specifications
   */
  async handleTaskAssignment(payload: any): Promise<void> {
    const task = payload.task;
    console.log(`🎨 Design Manager: Assigned task: ${task.task}`);

    // Create design specification
    const designSpec = await groqClient.chat([
      {
        role: 'system',
        content: `You are a product & design manager. Create concise UI/UX specifications for the requested component.`,
      },
      {
        role: 'user',
        content: `Create design specification for: ${task.task}\nGoal: ${payload.goal}`,
      },
    ]);

    // Create execution task
    const executionTask: ExecutionTask = {
      id: uuidv4(),
      title: task.task,
      description: designSpec,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
    };

    this.assignedTasks.set(executionTask.id, executionTask);
    await dbStore.addExecutionTask(executionTask);

    // Dispatch to Builder for implementation
    await messageQueue.sendMessage(
      this.agentId,
      'builder',
      'DESIGN_SPECIFICATION',
      {
        taskId: executionTask.id,
        specification: designSpec,
        componentType: task.task,
      },
      'HIGH'
    );

    console.log(`✅ Design specification created and sent to Builder`);
  }

  /**
   * Get assigned tasks
   */
  getAssignedTasks(): ExecutionTask[] {
    return Array.from(this.assignedTasks.values());
  }
}

export const designManager = new DesignManager();
