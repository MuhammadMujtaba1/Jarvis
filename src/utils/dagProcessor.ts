import { Task } from '../types'

interface DAGNode {
  id: string
  task: Task
  inProgress: boolean
  completed: boolean
  error?: string
}

interface DAGGraph {
  nodes: Map<string, DAGNode>
  edges: Map<string, string[]> // taskId -> [dependent taskIds]
  inDegree: Map<string, number> // taskId -> number of dependencies
}

class DAGProcessor {
  private graph: DAGGraph = {
    nodes: new Map(),
    edges: new Map(),
    inDegree: new Map()
  }

  /**
   * Build a DAG from task array
   */
  buildDAG(tasks: Task[]): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      inDegree: new Map()
    }

    // Create nodes
    tasks.forEach((task) => {
      this.graph.nodes.set(task.id, {
        id: task.id,
        task,
        inProgress: false,
        completed: false
      })
      this.graph.inDegree.set(task.id, task.dependencies.length)
      this.graph.edges.set(task.id, [])
    })

    // Create edges (reverse dependencies)
    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        const deps = this.graph.edges.get(depId) || []
        deps.push(task.id)
        this.graph.edges.set(depId, deps)
      })
    })
  }

  /**
   * Get tasks ready for execution (no pending dependencies)
   */
  getReadyTasks(): Task[] {
    const readyTasks: Task[] = []

    this.graph.inDegree.forEach((degree, taskId) => {
      const node = this.graph.nodes.get(taskId)
      if (degree === 0 && node && !node.completed && !node.inProgress) {
        readyTasks.push(node.task)
      }
    })

    return readyTasks
  }

  /**
   * Mark a task as in progress
   */
  markInProgress(taskId: string): void {
    const node = this.graph.nodes.get(taskId)
    if (node) {
      node.inProgress = true
    }
  }

  /**
   * Mark a task as completed
   */
  markCompleted(taskId: string, result?: any): void {
    const node = this.graph.nodes.get(taskId)
    if (node) {
      node.completed = true
      node.inProgress = false
      node.task.result = result
      node.task.status = 'completed'
      node.task.completedAt = Date.now()

      // Reduce in-degree for dependent tasks
      const dependents = this.graph.edges.get(taskId) || []
      dependents.forEach((depId) => {
        const currentDegree = this.graph.inDegree.get(depId) || 0
        this.graph.inDegree.set(depId, currentDegree - 1)
      })
    }
  }

  /**
   * Mark a task as failed
   */
  markFailed(taskId: string, error: string): void {
    const node = this.graph.nodes.get(taskId)
    if (node) {
      node.error = error
      node.inProgress = false
      node.task.error = error
      node.task.status = 'failed'
      node.task.completedAt = Date.now()
    }
  }

  /**
   * Check if DAG is complete
   */
  isComplete(): boolean {
    return Array.from(this.graph.nodes.values()).every(
      (node) => node.completed || node.error
    )
  }

  /**
   * Get execution status
   */
  getStatus(): {
    total: number
    completed: number
    inProgress: number
    pending: number
    failed: number
    progress: number
  } {
    const nodes = Array.from(this.graph.nodes.values())
    const completed = nodes.filter((n) => n.completed).length
    const inProgress = nodes.filter((n) => n.inProgress).length
    const failed = nodes.filter((n) => n.error).length
    const pending = nodes.length - completed - inProgress - failed

    return {
      total: nodes.length,
      completed,
      inProgress,
      pending,
      failed,
      progress: nodes.length > 0 ? (completed / nodes.length) * 100 : 0
    }
  }

  /**
   * Get all tasks in execution order
   */
  getExecutionOrder(): Task[] {
    const order: Task[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return
      if (visiting.has(taskId)) {
        console.warn(`⚠️ Circular dependency detected at ${taskId}`)
        return
      }

      visiting.add(taskId)
      const node = this.graph.nodes.get(taskId)
      if (node) {
        const task = node.task
        task.dependencies.forEach((depId) => visit(depId))
        order.push(task)
      }
      visiting.delete(taskId)
      visited.add(taskId)
    }

    this.graph.nodes.forEach((_, taskId) => visit(taskId))
    return order
  }
}

export default DAGProcessor
