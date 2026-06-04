/**
 * DAG PROCESSOR - Directed Acyclic Graph Execution Engine
 * Breaks down complex goals into dependency graphs and orchestrates execution
 */

import { ExecutionDAG, DAGNode } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DAGProcessor {
  /**
   * Parse a goal string into a structured DAG using agent decomposition
   */
  static parseGoalIntoDAG(goal: string): ExecutionDAG {
    const dagId = uuidv4();
    const nodes = this.decomposeGoal(goal);

    return {
      id: dagId,
      goal,
      nodes,
      createdAt: Date.now(),
      status: 'PENDING',
    };
  }

  /**
   * Decompose a goal into task nodes with dependencies
   */
  private static decomposeGoal(goal: string): DAGNode[] {
    // Example decomposition - in production, this would use Groq
    const nodes: DAGNode[] = [];

    // Default decomposition pattern
    const taskPatterns = [
      {
        pattern: /build.*app/i,
        tasks: [
          { title: 'Design UI mockup', deps: [] },
          { title: 'Implement components', deps: ['design_ui'] },
          { title: 'Add functionality', deps: ['implement'] },
          { title: 'Test thoroughly', deps: ['functionality'] },
          { title: 'Deploy to production', deps: ['test'] },
        ],
      },
      {
        pattern: /create.*video/i,
        tasks: [
          { title: 'Write script', deps: [] },
          { title: 'Record content', deps: ['script'] },
          { title: 'Edit and effects', deps: ['record'] },
          { title: 'Generate thumbnail', deps: ['edit'] },
          { title: 'Schedule posting', deps: ['thumbnail'] },
        ],
      },
      {
        pattern: /optimize.*ads?/i,
        tasks: [
          { title: 'Analyze current performance', deps: [] },
          { title: 'Identify top performers', deps: ['analyze'] },
          { title: 'Test variations', deps: ['identify'] },
          { title: 'Adjust bidding', deps: ['test'] },
          { title: 'Monitor results', deps: ['adjust'] },
        ],
      },
    ];

    // Find matching pattern
    let selectedTasks = null;
    for (const { pattern, tasks } of taskPatterns) {
      if (pattern.test(goal)) {
        selectedTasks = tasks;
        break;
      }
    }

    // Use default if no pattern matches
    if (!selectedTasks) {
      selectedTasks = [
        { title: 'Analyze requirement', deps: [] },
        { title: 'Create plan', deps: ['analyze_requirement'] },
        { title: 'Execute tasks', deps: ['create_plan'] },
        { title: 'Review results', deps: ['execute_tasks'] },
      ];
    }

    // Create DAG nodes
    selectedTasks.forEach((task, index) => {
      const nodeId = uuidv4();
      nodes.push({
        id: nodeId,
        task: task.title,
        deps: task.deps,
        agentAssigned: '',
        status: 'PENDING',
      });
    });

    return nodes;
  }

  /**
   * Assign agents to DAG nodes based on tier specialization
   */
  static assignAgentsToDAG(dag: ExecutionDAG): void {
    // Agent assignment strategy:
    // Tier 1: Director (Orchestrator) - already assigned
    // Tier 2: Managers (Design/Engineering)
    // Tier 3: Workers (Builder/Researcher)
    // Tier 4: Critics (Validation)

    dag.nodes.forEach((node) => {
      if (node.task.includes('design') || node.task.includes('ui') || node.task.includes('mockup')) {
        node.agentAssigned = 'design-manager';
      } else if (
        node.task.includes('implement') ||
        node.task.includes('code') ||
        node.task.includes('component')
      ) {
        node.agentAssigned = 'builder';
      } else if (node.task.includes('test') || node.task.includes('review')) {
        node.agentAssigned = 'critic';
      } else if (node.task.includes('analyze') || node.task.includes('research')) {
        node.agentAssigned = 'researcher';
      } else if (
        node.task.includes('record') ||
        node.task.includes('script') ||
        node.task.includes('content')
      ) {
        node.agentAssigned = 'content-worker';
      } else {
        node.agentAssigned = 'engineer-manager';
      }
    });
  }

  /**
   * Get executable tasks (no pending dependencies)
   */
  static getExecutableTasks(dag: ExecutionDAG): DAGNode[] {
    return dag.nodes.filter((node) => {
      if (node.status !== 'PENDING') return false;

      // Check if all dependencies are completed
      return node.deps.every((depId) => {
        const depNode = dag.nodes.find((n) => n.id === depId);
        return depNode?.status === 'COMPLETED';
      });
    });
  }

  /**
   * Mark a task as completed and return next executable tasks
   */
  static completeTask(dag: ExecutionDAG, taskId: string, result?: string): DAGNode[] {
    const node = dag.nodes.find((n) => n.id === taskId);
    if (!node) return [];

    node.status = 'COMPLETED';

    // Return newly executable tasks
    return this.getExecutableTasks(dag);
  }

  /**
   * Check if DAG is complete
   */
  static isDAGComplete(dag: ExecutionDAG): boolean {
    return dag.nodes.every((node) => node.status === 'COMPLETED' || node.status === 'FAILED');
  }

  /**
   * Get DAG completion percentage
   */
  static getDAGProgress(dag: ExecutionDAG): number {
    const total = dag.nodes.length;
    const completed = dag.nodes.filter((n) => n.status === 'COMPLETED').length;
    return Math.round((completed / total) * 100);
  }

  /**
   * Visualize DAG structure as adjacency list
   */
  static visualizeDAG(dag: ExecutionDAG): string {
    let visualization = `📊 DAG: ${dag.goal}\n`;
    visualization += `Status: ${dag.status} (${this.getDAGProgress(dag)}% complete)\n\n`;

    dag.nodes.forEach((node) => {
      const statusIcon =
        node.status === 'COMPLETED'
          ? '✅'
          : node.status === 'IN_PROGRESS'
            ? '⚙️'
            : node.status === 'FAILED'
              ? '❌'
              : '⏳';

      visualization += `${statusIcon} ${node.task} (${node.agentAssigned})\n`;

      if (node.deps.length > 0) {
        const depNames = node.deps
          .map((depId) => dag.nodes.find((n) => n.id === depId)?.task || 'unknown')
          .join(', ');
        visualization += `   ↳ Depends on: ${depNames}\n`;
      }
    });

    return visualization;
  }

  /**
   * Export DAG to JSON for persistence
   */
  static exportDAG(dag: ExecutionDAG): string {
    return JSON.stringify(dag, null, 2);
  }

  /**
   * Import DAG from JSON
   */
  static importDAG(json: string): ExecutionDAG {
    return JSON.parse(json) as ExecutionDAG;
  }
}
