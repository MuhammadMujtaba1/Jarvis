import { useEffect, useState } from 'react'
import { Task } from '../types'

interface UseTaskQueueOptions {
  maxConcurrent?: number
  autoStart?: boolean
}

export const useTaskQueue = (options: UseTaskQueueOptions = {}) => {
  const { maxConcurrent = 3, autoStart = true } = options

  const [tasks, setTasks] = useState<Map<string, Task>>(new Map())
  const [activeCount, setActiveCount] = useState(0)
  const [workerPool, setWorkerPool] = useState<Worker[]>([])

  // Initialize worker pool
  useEffect(() => {
    const workers: Worker[] = []

    for (let i = 0; i < maxConcurrent; i++) {
      try {
        const worker = new Worker(new URL('../workers/taskWorker.ts', import.meta.url), {
          type: 'module'
        })
        workers.push(worker)
      } catch (error) {
        console.warn(`Failed to create worker ${i}:`, error)
      }
    }

    setWorkerPool(workers)

    return () => {
      workers.forEach((worker) => worker.terminate())
    }
  }, [maxConcurrent])

  /**
   * Add a task to the queue
   */
  const enqueueTask = (task: Task): void => {
    setTasks((prev) => new Map(prev).set(task.id, task))
  }

  /**
   * Process queue
   */
  const processQueue = async (): Promise<void> => {
    const taskArray = Array.from(tasks.values())
    const pendingTasks = taskArray.filter((t) => t.status === 'pending')

    for (const task of pendingTasks) {
      if (activeCount >= maxConcurrent) break

      // Update task status
      setTasks((prev) => {
        const updated = new Map(prev)
        const t = updated.get(task.id)
        if (t) {
          t.status = 'in_progress'
          t.startedAt = Date.now()
        }
        return updated
      })

      setActiveCount((prev) => prev + 1)

      // Execute task
      executeTaskInWorker(task).finally(() => {
        setActiveCount((prev) => Math.max(0, prev - 1))
      })
    }
  }

  /**
   * Execute task in worker
   */
  const executeTaskInWorker = async (task: Task): Promise<void> => {
    if (workerPool.length === 0) {
      console.warn('No workers available')
      return
    }

    const worker = workerPool[Math.floor(Math.random() * workerPool.length)]

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.taskId === task.id) {
          worker.removeEventListener('message', handleMessage)
          worker.removeEventListener('error', handleError)

          if (event.data.success) {
            setTasks((prev) => {
              const updated = new Map(prev)
              const t = updated.get(task.id)
              if (t) {
                t.status = 'completed'
                t.result = event.data.result
                t.completedAt = Date.now()
              }
              return updated
            })
          }

          resolve()
        }
      }

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('message', handleMessage)
        worker.removeEventListener('error', handleError)

        setTasks((prev) => {
          const updated = new Map(prev)
          const t = updated.get(task.id)
          if (t) {
            t.status = 'failed'
            t.error = error.message
            t.completedAt = Date.now()
          }
          return updated
        })

        console.error(`Task ${task.id} failed:`, error)
        resolve()
      }

      worker.addEventListener('message', handleMessage)
      worker.addEventListener('error', handleError)
      worker.postMessage({
        id: task.id,
        type: 'execute',
        payload: task
      })
    })
  }

  // Auto-process queue
  useEffect(() => {
    if (autoStart) {
      const interval = setInterval(() => {
        processQueue()
      }, 100)

      return () => clearInterval(interval)
    }
  }, [autoStart, tasks, activeCount, maxConcurrent])

  return {
    tasks,
    activeCount,
    enqueueTask,
    processQueue
  }
}
