import { MemoryRecord } from '../types'

class IndexedDBManager {
  private dbName: string
  private db: IDBDatabase | null = null
  private version = 1

  constructor(dbName: string = 'JarvisDB') {
    this.dbName = dbName
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        const stores = ['goals', 'tasks', 'memory', 'executions', 'conversationHistory']
        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' })
            console.log(`📦 Created object store: ${storeName}`)
          }
        })
      }
    })
  }

  /**
   * Save a memory record
   */
  async saveMemory(record: MemoryRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['memory'], 'readwrite')
      const store = transaction.objectStore('memory')
      const request = store.put(record)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get a memory record by ID
   */
  async getMemory(id: string): Promise<MemoryRecord | undefined> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['memory'], 'readonly')
      const store = transaction.objectStore('memory')
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Query memories by type
   */
  async queryMemories(
    type: MemoryRecord['type'],
    limit: number = 50
  ): Promise<MemoryRecord[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['memory'], 'readonly')
      const store = transaction.objectStore('memory')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result
          .filter((record: MemoryRecord) => record.type === type)
          .sort(
            (a: MemoryRecord, b: MemoryRecord) =>
              (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0)
          )
          .slice(0, limit)
        resolve(results)
      }
    })
  }

  /**
   * Save a goal
   */
  async saveGoal(goal: any): Promise<void> {
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
  async getGoals(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['goals'], 'readonly')
      const store = transaction.objectStore('goals')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Save a task
   */
  async saveTask(task: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readwrite')
      const store = transaction.objectStore('tasks')
      const request = store.put(task)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get all tasks
   */
  async getTasks(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly')
      const store = transaction.objectStore('tasks')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Save conversation history
   */
  async saveConversationHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const record = {
      id: 'current-conversation',
      history,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversationHistory'], 'readwrite')
      const store = transaction.objectStore('conversationHistory')
      const request = store.put(record)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<Array<{ role: 'user' | 'assistant'; content: string }> | null> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversationHistory'], 'readonly')
      const store = transaction.objectStore('conversationHistory')
      const request = store.get('current-conversation')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result?.history || null)
      }
    })
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const stores = ['goals', 'tasks', 'memory', 'executions', 'conversationHistory']
      const transaction = this.db!.transaction(stores, 'readwrite')

      stores.forEach((storeName) => {
        transaction.objectStore(storeName).clear()
      })

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    })
  }
}

// Singleton instance
let dbInstance: IndexedDBManager | null = null

export const initializeDatabase = async (dbName?: string): Promise<IndexedDBManager> => {
  dbInstance = new IndexedDBManager(dbName)
  await dbInstance.initialize()
  return dbInstance
}

export const getDatabase = (): IndexedDBManager => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.')
  }
  return dbInstance
}

export default IndexedDBManager
