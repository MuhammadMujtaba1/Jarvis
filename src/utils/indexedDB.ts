/**
 * INDEXED DB PERSISTENCE LAYER - Client-Side Semantic Memory
 * Stores all agent memories, business metrics, and execution history
 */

import { StoredMemory, BusinessAgencyState, ExecutionTask, ConversationContext } from '../types';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface JarvisDB extends DBSchema {
  memories: {
    key: string;
    value: StoredMemory;
  };
  systemState: {
    key: string;
    value: BusinessAgencyState;
  };
  executionHistory: {
    key: string;
    value: ExecutionTask;
  };
  conversations: {
    key: string;
    value: ConversationContext;
  };
}

export class IndexedDBStore {
  private dbPromise: Promise<IDBPDatabase<JarvisDB>>;

  constructor() {
    this.dbPromise = openDB<JarvisDB>('jarvis-agency', 1, {
      upgrade(db) {
        // Memories store - semantic memory with embeddings
        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('type', 'type');
          memoryStore.createIndex('createdAt', 'createdAt');
          memoryStore.createIndex('lastAccessedAt', 'lastAccessedAt');
          memoryStore.createIndex('relevance', 'relevance');
        }

        // System state - current business metrics and agent states
        if (!db.objectStoreNames.contains('systemState')) {
          db.createObjectStore('systemState', { keyPath: 'id' });
        }

        // Execution history - completed tasks and their results
        if (!db.objectStoreNames.contains('executionHistory')) {
          const historyStore = db.createObjectStore('executionHistory', { keyPath: 'id' });
          historyStore.createIndex('status', 'status');
          historyStore.createIndex('assignedAgent', 'assignedAgent');
          historyStore.createIndex('createdAt', 'createdAt');
        }

        // Conversations - voice interaction history and context
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'sessionId' });
          convStore.createIndex('startedAt', 'startedAt');
          convStore.createIndex('isActive', 'isActive');
        }
      },
    });
  }

  private async getDB(): Promise<IDBPDatabase<JarvisDB>> {
    return this.dbPromise;
  }

  // ============================================================================
  // MEMORY OPERATIONS
  // ============================================================================

  async storeMemory(memory: StoredMemory): Promise<void> {
    const db = await this.getDB();
    memory.lastAccessedAt = Date.now();
    await db.put('memories', memory);
  }

  async getMemory(id: string): Promise<StoredMemory | undefined> {
    const db = await this.getDB();
    const memory = await db.get('memories', id);
    if (memory) {
      memory.lastAccessedAt = Date.now();
      await db.put('memories', memory);
    }
    return memory;
  }

  async getMemoriesByType(type: string): Promise<StoredMemory[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('memories', 'type', type);
  }

  async searchMemories(query: string): Promise<StoredMemory[]> {
    const db = await this.getDB();
    const allMemories = await db.getAll('memories');
    return allMemories.filter(
      (m) =>
        m.content.toLowerCase().includes(query.toLowerCase()) ||
        m.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getRecentMemories(limit: number = 10): Promise<StoredMemory[]> {
    const db = await this.getDB();
    const allMemories = await db.getAll('memories');
    return allMemories
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, limit);
  }

  // ============================================================================
  // SYSTEM STATE OPERATIONS
  // ============================================================================

  async updateSystemState(state: BusinessAgencyState): Promise<void> {
    const db = await this.getDB();
    state.lastStateUpdate = Date.now();
    await db.put('systemState', state);
  }

  async getSystemState(): Promise<BusinessAgencyState | undefined> {
    const db = await this.getDB();
    return db.get('systemState', 'current');
  }

  async getAllSystemStates(): Promise<BusinessAgencyState[]> {
    const db = await this.getDB();
    return db.getAll('systemState');
  }

  // ============================================================================
  // EXECUTION HISTORY OPERATIONS
  // ============================================================================

  async addExecutionTask(task: ExecutionTask): Promise<void> {
    const db = await this.getDB();
    await db.put('executionHistory', task);
  }

  async updateExecutionTask(task: ExecutionTask): Promise<void> {
    const db = await this.getDB();
    await db.put('executionHistory', task);
  }

  async getExecutionTask(id: string): Promise<ExecutionTask | undefined> {
    const db = await this.getDB();
    return db.get('executionHistory', id);
  }

  async getTasksByAgent(agentId: string): Promise<ExecutionTask[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('executionHistory', 'assignedAgent', agentId);
  }

  async getTasksByStatus(status: string): Promise<ExecutionTask[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('executionHistory', 'status', status);
  }

  async getAllExecutionHistory(): Promise<ExecutionTask[]> {
    const db = await this.getDB();
    const all = await db.getAll('executionHistory');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  // ============================================================================
  // CONVERSATION OPERATIONS
  // ============================================================================

  async storeConversation(conversation: ConversationContext): Promise<void> {
    const db = await this.getDB();
    conversation.lastActivityAt = Date.now();
    await db.put('conversations', conversation);
  }

  async getConversation(sessionId: string): Promise<ConversationContext | undefined> {
    const db = await this.getDB();
    return db.get('conversations', sessionId);
  }

  async getActiveConversation(): Promise<ConversationContext | undefined> {
    const db = await this.getDB();
    const all = await db.getAllFromIndex('conversations', 'isActive', true);
    return all[0];
  }

  async getAllConversations(): Promise<ConversationContext[]> {
    const db = await this.getDB();
    const all = await db.getAll('conversations');
    return all.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await Promise.all([
      db.clear('memories'),
      db.clear('systemState'),
      db.clear('executionHistory'),
      db.clear('conversations'),
    ]);
  }

  async exportData(): Promise<{
    memories: StoredMemory[];
    systemState: BusinessAgencyState[];
    executionHistory: ExecutionTask[];
    conversations: ConversationContext[];
  }> {
    const db = await this.getDB();
    return {
      memories: await db.getAll('memories'),
      systemState: await db.getAll('systemState'),
      executionHistory: await db.getAll('executionHistory'),
      conversations: await db.getAll('conversations'),
    };
  }

  async importData(data: {
    memories?: StoredMemory[];
    systemState?: BusinessAgencyState[];
    executionHistory?: ExecutionTask[];
    conversations?: ConversationContext[];
  }): Promise<void> {
    const db = await this.getDB();

    if (data.memories) {
      for (const memory of data.memories) {
        await db.put('memories', memory);
      }
    }

    if (data.systemState) {
      for (const state of data.systemState) {
        await db.put('systemState', state);
      }
    }

    if (data.executionHistory) {
      for (const task of data.executionHistory) {
        await db.put('executionHistory', task);
      }
    }

    if (data.conversations) {
      for (const conv of data.conversations) {
        await db.put('conversations', conv);
      }
    }
  }
}

// Singleton instance
export const dbStore = new IndexedDBStore();
