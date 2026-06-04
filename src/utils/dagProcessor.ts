interface TaskNode {
  id: string
  title: string
  dependencies: string[]
  status: 'pending' | 'executing' | 'completed' | 'failed'
  [key: string]: any
}

class DAGProcessor {
  private nodes: Map<string, TaskNode> = new Map()
  private edges: Map<string, Set<string>> = new Map()

  /**
   * Build a DAG from task list
   */
  buildDAG(tasks: TaskNode[]): void {
    // Clear previous DAG
    this.nodes.clear()
    this.edges.clear()

    // Add nodes
    tasks.forEach((task) => {
      this.nodes.set(task.id, { ...task })
      this.edges.set(task.id, new Set(task.dependencies))
    })

    console.log(`📊 DAG built with ${this.nodes.size} nodes`)
  }

  /**
   * Get executable tasks (no pending dependencies)
   */
  getExecutableTasks(): TaskNode[] {
    const executable: TaskNode[] = []

    this.nodes.forEach((node, nodeId) => {
      if (node.status !== 'pending') return

      const dependencies = this.edges.get(nodeId) || new Set()
      let allDepsCompleted = true

      for (const depId of dependencies) {
        const depNode = this.nodes.get(depId)
        if (!depNode || depNode.status !== 'completed') {
          allDepsCompleted = false
          break
        }
      }

      if (allDepsCompleted) {
        executable.push(node)
      }
    })

    return executable
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string): void {
    const task = this.nodes.get(taskId)
    if (task) {
      task.status = 'completed'
      console.log(`✅ Task completed: ${task.title}`)
    }
  }

  /**
   * Get DAG status
   */
  getStatus(): {
    total: number
    completed: number
    executing: number
    pending: number
    failed: number
  } {
    let completed = 0
    let executing = 0
    let pending = 0
    let failed = 0

    this.nodes.forEach((node) => {
      switch (node.status) {
        case 'completed':
          completed++
          break
        case 'executing':
          executing++
          break
        case 'pending':
          pending++
          break
        case 'failed':
          failed++
          break
      }
    })

    return {
      total: this.nodes.size,
      completed,
      executing,
      pending,
      failed
    }
  }
}

export default DAGProcessor
