interface DBSchema {
  goals: Goal
  tasks: Task
  conversationHistory: Message
  metrics: BusinessMetrics
}

interface Goal {
  id: string
  title: string
  description: string
  createdAt: number
  status: 'planning' | 'executing' | 'completed' | 'failed'
  taskDAG: Task[]
  userContext: {
    habits: Record<string, any>
    preferences: Record<string, any>
    history: string[]
  }
}

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  dependencies: string[]
  priority: 'high' | 'medium' | 'low'
  tier: 1 | 2 | 3 | 4
  assignedAgent: string
  createdAt: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface BusinessMetrics {
  weeklyDownloads: number
  weeklyRevenue: number
  videoViews: number
  adSpend: number
  roas: number
}

class IndexedDBWrapper {
  private dbName: string
  private db: IDBDatabase | null = null

  constructor(dbName: string) {
    this.dbName = dbName
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('📦 IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('conversationHistory')) {
          db.createObjectStore('conversationHistory', { autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('metrics')) {
          db.createObjectStore('metrics', { keyPath: 'timestamp' })
        }
      }
    })
  }

  /**
   * Save a goal
   */
  async saveGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['goals'], 'readwrite')
      const store = transaction.objectStore('goals')
      const request = store.put(goal)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get all goals
   */
  async getGoals(): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['goals'], 'readonly')
      const store = transaction.objectStore('goals')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * Get all tasks
   */
  async getTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly')
      const store = transaction.objectStore('tasks')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * Save conversation history
   */
  async saveConversationHistory(history: Message[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversationHistory'], 'readwrite')
      const store = transaction.objectStore('conversationHistory')
      const request = store.clear()

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        history.forEach((msg) => {
          store.add(msg)
        })
        resolve()
      }
    })
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversationHistory'], 'readonly')
      const store = transaction.objectStore('conversationHistory')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
}

let dbInstance: IndexedDBWrapper | null = null

export const initializeDatabase = async (dbName: string = 'JarvisDB'): Promise<IndexedDBWrapper> => {
  dbInstance = new IndexedDBWrapper(dbName)
  await dbInstance.initialize()
  return dbInstance
}

export const getDatabase = (): IndexedDBWrapper => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.')
  }
  return dbInstance
}

export type { Goal, Task, Message, BusinessMetrics }
