// Web Worker for background task execution

interface WorkerTask {
  id: string
  type: 'execute' | 'compute' | 'fetch'
  payload: any
}

interface WorkerResult {
  taskId: string
  success: boolean
  result?: any
  error?: string
}

// Simulate task execution
const executeTask = async (task: WorkerTask): Promise<any> => {
  switch (task.type) {
    case 'compute':
      // Simulate computation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ computed: true, value: Math.random() * 100 })
        }, 1000)
      })

    case 'fetch':
      // Simulate API fetch
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ fetched: true, data: 'Mock data' })
        }, 500)
      })

    case 'execute':
      // Execute generic task
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ executed: true, status: 'success' })
        }, 800)
      })

    default:
      throw new Error(`Unknown task type: ${task.type}`)
  }
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent<WorkerTask>) => {
  const task = event.data

  try {
    const result = await executeTask(task)
    const response: WorkerResult = {
      taskId: task.id,
      success: true,
      result
    }
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResult = {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    self.postMessage(response)
  }
}

export {}
