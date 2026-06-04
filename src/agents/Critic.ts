/**
 * TIER 4: CRITIC AGENT
 * Quality assurance, code validation, recursive error routing
 */

import { messageQueue } from '../utils/messageQueue';
import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { ExecutionTask, CriticReview } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Critic {
  private agentId = 'critic-tier4';
  private reviews: Map<string, CriticReview> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'CODE_REVIEW') {
        await this.reviewCode(message.payload as any);
      }
    });
  }

  /**
   * Review code for quality and correctness
   */
  async reviewCode(payload: any): Promise<void> {
    console.log(`🔎 Critic: Reviewing code...`);

    const review = await groqClient.chat([
      {
        role: 'system',
        content: `You are a senior code reviewer. Analyze code for:
- TypeScript best practices
- Performance optimization
- Security concerns
- Testing coverage
Provide specific feedback and suggested fixes.`,
      },
      {
        role: 'user',
        content: `Review this ${payload.language} code:\n\n${payload.code}`,
      },
    ]);

    // Determine if approved
    const approved =
      !review.toLowerCase().includes('critical') &&
      !review.toLowerCase().includes('error') &&
      !review.toLowerCase().includes('security');

    const criticReview: CriticReview = {
      taskId: payload.taskId,
      approved,
      feedback: review,
      timestamp: Date.now(),
    };

    this.reviews.set(payload.taskId, criticReview);

    // Create execution task
    const task: ExecutionTask = {
      id: uuidv4(),
      title: 'Code Review',
      description: 'Quality assurance and validation',
      priority: 'HIGH',
      status: approved ? 'COMPLETED' : 'IN_PROGRESS',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
      result: review,
    };

    await dbStore.addExecutionTask(task);

    if (approved) {
      console.log(`✅ Code approved by Critic`);
      // Notify upstream that code is ready
      await messageQueue.sendMessage(
        this.agentId,
        'orchestrator-tier1',
        'TASK_COMPLETED',
        {
          taskId: payload.taskId,
          approved: true,
          feedback: review,
        },
        'HIGH'
      );
    } else {
      console.log(`⚠️ Code review flagged issues - routing back to Builder`);
      // Route back to Builder for fixes
      await messageQueue.sendMessage(
        this.agentId,
        'builder',
        'REVISION_REQUIRED',
        {
          taskId: payload.taskId,
          feedback: review,
        },
        'HIGH'
      );
    }
  }

  /**
   * Get all reviews
   */
  getReviews(): CriticReview[] {
    return Array.from(this.reviews.values());
  }
}

export const critic = new Critic();
