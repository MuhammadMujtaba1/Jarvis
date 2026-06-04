/**
 * TIER 3: RESEARCHER AGENT
 * Data fetching, API coordination, documentation scanning
 */

import { messageQueue } from '../utils/messageQueue';
import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { ExecutionTask, ResearcherOutput } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Researcher {
  private agentId = 'researcher-tier3';
  private researchResults: Map<string, ResearcherOutput> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'RESEARCH_REQUEST') {
        await this.conductResearch(message.payload as any);
      }
    });
  }

  /**
   * Conduct research on technical specifications
   */
  async conductResearch(payload: any): Promise<void> {
    console.log(`🔍 Researcher: Conducting research...`);

    const research = await groqClient.chat([
      {
        role: 'system',
        content: `You are a technical researcher. Find relevant documentation, best practices, and implementation patterns.
Provide summaries of key findings and recommendations.`,
      },
      {
        role: 'user',
        content: `Research and summarize implementation approaches for:\n${payload.specification}`,
      },
    ]);

    const output: ResearcherOutput = {
      summary: research,
      sources: [],
      keyFindings: [],
      recommendations: [],
    };

    this.researchResults.set(payload.taskId, output);

    // Create execution task
    const task: ExecutionTask = {
      id: uuidv4(),
      title: 'Research',
      description: 'Technical research and best practices',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
      result: research,
    };

    await dbStore.addExecutionTask(task);

    // Dispatch findings to Builder
    await messageQueue.sendMessage(
      this.agentId,
      'builder',
      'RESEARCH_FINDINGS',
      {
        taskId: payload.taskId,
        findings: research,
      },
      'NORMAL'
    );

    console.log(`✅ Research completed and shared with Builder`);
  }

  /**
   * Get research results
   */
  getResearchResults(): ResearcherOutput[] {
    return Array.from(this.researchResults.values());
  }
}

export const researcher = new Researcher();
