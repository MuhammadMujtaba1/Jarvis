/**
 * TIER 3: BUILDER AGENT (EVA CODER)
 * Clean, modular React/TypeScript code generation and component building
 */

import { messageQueue } from '../utils/messageQueue';
import { groqClient } from '../utils/groqClient';
import { dbStore } from '../utils/indexedDB';
import { ExecutionTask, BuilderOutput } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Builder {
  private agentId = 'builder-tier3';
  private generatedComponents: Map<string, BuilderOutput> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    messageQueue.subscribe(this.agentId, async (message) => {
      if (message.type === 'DESIGN_SPECIFICATION') {
        await this.generateComponent(message.payload as any);
      } else if (message.type === 'BACKEND_IMPLEMENTATION') {
        await this.generateBackendCode(message.payload as any);
      }
    });
  }

  /**
   * Generate React component from design specification
   */
  async generateComponent(payload: any): Promise<void> {
    console.log(`🏗️ Builder: Generating component: ${payload.componentType}`);

    const componentCode = await groqClient.chat([
      {
        role: 'system',
        content: `You are an expert React/TypeScript developer (EVA Coder). Generate clean, type-safe React components.
Use functional components with hooks. Include proper TypeScript types.
Provide complete, production-ready code.`,
      },
      {
        role: 'user',
        content: `Generate a React component for: ${payload.componentType}\n\nSpecification:\n${payload.specification}`,
      },
    ]);

    // Extract code from markdown if present
    const codeMatch = componentCode.match(/```(?:tsx|typescript)?\s*([\s\S]*?)\s*```/);
    const cleanCode = codeMatch ? codeMatch[1] : componentCode;

    // Store generated component
    const output: BuilderOutput = {
      code: cleanCode,
      language: 'typescript',
      component: payload.componentType,
      description: payload.specification,
      testCases: [],
    };

    this.generatedComponents.set(payload.taskId, output);

    // Create execution task
    const task: ExecutionTask = {
      id: uuidv4(),
      title: `Build: ${payload.componentType}`,
      description: `Generated React component code`,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
      result: cleanCode,
    };

    await dbStore.addExecutionTask(task);

    // Dispatch to Critic for review
    await messageQueue.sendMessage(
      this.agentId,
      'critic',
      'CODE_REVIEW',
      {
        taskId: task.id,
        code: cleanCode,
        language: 'typescript',
      },
      'HIGH'
    );

    console.log(`✅ Component generated: ${payload.componentType}`);
  }

  /**
   * Generate backend code from engineering specification
   */
  async generateBackendCode(payload: any): Promise<void> {
    console.log(`🔧 Builder: Generating backend for: ${payload.featureName}`);

    const backendCode = await groqClient.chat([
      {
        role: 'system',
        content: `You are a senior backend architect. Generate production-ready backend code.
Include API endpoints, database models, and implementation logic.
Use TypeScript/Node.js patterns.`,
      },
      {
        role: 'user',
        content: `Generate backend implementation for: ${payload.featureName}\n\nSpecification:\n${payload.specification}`,
      },
    ]);

    const task: ExecutionTask = {
      id: uuidv4(),
      title: `Backend: ${payload.featureName}`,
      description: `Backend implementation for feature cluster`,
      priority: 'HIGH',
      status: 'COMPLETED',
      assignedAgent: this.agentId,
      dependencies: [],
      createdAt: Date.now(),
      result: backendCode,
    };

    await dbStore.addExecutionTask(task);

    // Update state with implementation ready flag
    const state = await dbStore.getSystemState();
    if (state) {
      await dbStore.updateSystemState(state);
    }

    console.log(`✅ Backend implementation ready for review: ${payload.featureName}`);
    console.log(`📌 Task ID: ${task.id}`);
  }

  /**
   * Get generated components
   */
  getGeneratedComponents(): BuilderOutput[] {
    return Array.from(this.generatedComponents.values());
  }
}

export const builder = new Builder();
