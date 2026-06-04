/**
 * INDEXED DB PERSISTENCE LAYER - Client-Side Semantic Memory
 * Stores all agent memories, business metrics, and execution history
 */

// Simple DB store implementation without complex schema typing
export class IndexedDBStore {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('jarvis-agency', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('type', 'type', { unique: false });
          memoryStore.createIndex('createdAt', 'createdAt', { unique: false });
          memoryStore.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          memoryStore.createIndex('relevance', 'relevance', { unique: false });
        }

        if (!db.objectStoreNames.contains('systemState')) {
          db.createObjectStore('systemState', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('executionHistory')) {
          const historyStore = db.createObjectStore('executionHistory', { keyPath: 'id' });
          historyStore.createIndex('status', 'status', { unique: false });
          historyStore.createIndex('assignedAgent', 'assignedAgent', { unique: false });
          historyStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'sessionId' });
          convStore.createIndex('startedAt', 'startedAt', { unique: false });
          convStore.createIndex('isActive', 'isActive', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // ============================================================================
  // MEMORY OPERATIONS
  // ============================================================================

  async storeMemory(memory: any): Promise<void> {
    const db = await this.getDB();
    memory.lastAccessedAt = Date.now();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', 'readwrite');
      tx.objectStore('memories').put(memory);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMemory(id: string): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', 'readonly');
      const request = tx.objectStore('memories').get(id);
      request.onsuccess = () => {
        const memory = request.result;
        if (memory) {
          memory.lastAccessedAt = Date.now();
          const updateTx = db.transaction('memories', 'readwrite');
          updateTx.objectStore('memories').put(memory);
        }
        resolve(memory);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMemoriesByType(type: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', 'readonly');
      const index = tx.objectStore('memories').index('type');
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchMemories(query: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', 'readonly');
      const request = tx.objectStore('memories').getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        resolve(all.filter(
          (m: any) =>
            m.content?.toLowerCase().includes(query.toLowerCase()) ||
            m.type?.toLowerCase().includes(query.toLowerCase())
        ));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentMemories(limit: number = 10): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', 'readonly');
      const request = tx.objectStore('memories').getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        resolve(
          all
            .sort((a: any, b: any) => b.lastAccessedAt - a.lastAccessedAt)
            .slice(0, limit)
        );
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // SYSTEM STATE OPERATIONS
  // ============================================================================

  async updateSystemState(state: any): Promise<void> {
    const db = await this.getDB();
    state.lastStateUpdate = Date.now();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('systemState', 'readwrite');
      tx.objectStore('systemState').put(state);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSystemState(): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('systemState', 'readonly');
      const request = tx.objectStore('systemState').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSystemStates(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('systemState', 'readonly');
      const request = tx.objectStore('systemState').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // EXECUTION HISTORY OPERATIONS
  // ============================================================================

  async addExecutionTask(task: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('executionHistory', 'readwrite');
      tx.objectStore('executionHistory').put(task);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateExecutionTask(task: any): Promise<void> {
    return this.addExecutionTask(task);
  }

  async getExecutionTask(id: string): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('executionHistory', 'readonly');
      const request = tx.objectStore('executionHistory').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTasksByAgent(agentId: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('executionHistory', 'readonly');
      const index = tx.objectStore('executionHistory').index('assignedAgent');
      const request = index.getAll(agentId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getTasksByStatus(status: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('executionHistory', 'readonly');
      const index = tx.objectStore('executionHistory').index('status');
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllExecutionHistory(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('executionHistory', 'readonly');
      const request = tx.objectStore('executionHistory').getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        resolve(all.sort((a: any, b: any) => b.createdAt - a.createdAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // CONVERSATION OPERATIONS
  // ============================================================================

  async storeConversation(conversation: any): Promise<void> {
    const db = await this.getDB();
    conversation.lastActivityAt = Date.now();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').put(conversation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getConversation(sessionId: string): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const request = tx.objectStore('conversations').get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveConversation(): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const index = tx.objectStore('conversations').index('isActive');
      const request = index.getAll(IDBKeyRange.only(1));
      request.onsuccess = () => resolve(request.result?.[0]);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllConversations(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const request = tx.objectStore('conversations').getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        resolve(all.sort((a: any, b: any) => b.lastActivityAt - a.lastActivityAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const stores = ['memories', 'systemState', 'executionHistory', 'conversations'];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      stores.forEach(storeName => tx.objectStore(storeName).clear());
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async exportData(): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const stores = ['memories', 'systemState', 'executionHistory', 'conversations'];
      const result: any = {};
      const tx = db.transaction(stores, 'readonly');
      let completed = 0;
      
      stores.forEach(storeName => {
        const request = tx.objectStore(storeName).getAll();
        request.onsuccess = () => {
          result[storeName] = request.result || [];
          completed++;
          if (completed === stores.length) resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async importData(data: any): Promise<void> {
    const db = await this.getDB();
    const stores = ['memories', 'systemState', 'executionHistory', 'conversations'];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      let completed = 0;
      
      stores.forEach(storeName => {
        const items = data[storeName] || [];
        const store = tx.objectStore(storeName);
        items.forEach((item: any) => store.put(item));
        tx.oncomplete = () => {
          completed++;
          if (completed === stores.length) resolve();
        };
      });
      
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Singleton instance
export const dbStore = new IndexedDBStore();
