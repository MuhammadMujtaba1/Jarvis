/**
 * AGENT MEMORY HOOK - Semantic Memory Access
 * Provides React hook interface for IndexedDB memory operations
 */

import { useCallback, useEffect, useState } from 'react';
import { dbStore } from '../utils/indexedDB';
import { StoredMemory, BusinessAgencyState } from '../types';

export function useAgentMemory() {
  const [memories, setMemories] = useState<StoredMemory[]>([]);
  const [systemState, setSystemState] = useState<BusinessAgencyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load system state on mount
   */
  useEffect(() => {
    const loadState = async () => {
      try {
        setIsLoading(true);
        const state = await dbStore.getSystemState();
        setSystemState(state || null);
      } catch (error) {
        console.error('Failed to load system state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  /**
   * Store a new memory
   */
  const addMemory = useCallback(
    async (memory: Omit<StoredMemory, 'id' | 'lastAccessedAt' | 'createdAt'>): Promise<StoredMemory> => {
      const newMemory: StoredMemory = {
        id: `mem-${Date.now()}`,
        ...memory,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      await dbStore.storeMemory(newMemory);
      setMemories((prev) => [...prev, newMemory]);
      return newMemory;
    },
    []
  );

  /**
   * Search memories
   */
  const searchMemories = useCallback(async (query: string): Promise<StoredMemory[]> => {
    const results = await dbStore.searchMemories(query);
    setMemories(results);
    return results;
  }, []);

  /**
   * Get recent memories
   */
  const getRecentMemories = useCallback(async (limit: number = 10): Promise<StoredMemory[]> => {
    const results = await dbStore.getRecentMemories(limit);
    setMemories(results);
    return results;
  }, []);

  /**
   * Update system state
   */
  const updateSystemState = useCallback(async (newState: BusinessAgencyState): Promise<void> => {
    await dbStore.updateSystemState(newState);
    setSystemState(newState);
  }, []);

  /**
   * Get memories by type
   */
  const getMemoriesByType = useCallback(
    async (type: 'HABIT' | 'PREFERENCE' | 'PROJECT' | 'EXECUTION_LOG' | 'CONVERSATION'): Promise<StoredMemory[]> => {
      const results = await dbStore.getMemoriesByType(type);
      setMemories(results);
      return results;
    },
    []
  );

  return {
    memories,
    systemState,
    isLoading,
    addMemory,
    searchMemories,
    getRecentMemories,
    updateSystemState,
    getMemoriesByType,
  };
}
