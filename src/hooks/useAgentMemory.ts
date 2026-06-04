import { useEffect, useState } from 'react'
import { MemoryRecord } from '../types'
import { getDatabase } from '../utils/indexedDB'

export const useAgentMemory = () => {
  const [memories, setMemories] = useState<Map<string, MemoryRecord>>(new Map())
  const [loading, setLoading] = useState(false)

  const db = getDatabase()

  /**
   * Save a memory record
   */
  const saveMemory = async (record: MemoryRecord): Promise<void> => {
    try {
      await db.saveMemory(record)
      setMemories((prev) => new Map(prev).set(record.id, record))
      console.log(`💾 Memory saved: ${record.id}`)
    } catch (error) {
      console.error('Failed to save memory:', error)
    }
  }

  /**
   * Query memories by type
   */
  const queryMemories = async (
    type: MemoryRecord['type'],
    limit?: number
  ): Promise<MemoryRecord[]> => {
    try {
      setLoading(true)
      const results = await db.queryMemories(type, limit)
      return results
    } catch (error) {
      console.error('Failed to query memories:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get user habits
   */
  const getUserHabits = async (): Promise<MemoryRecord[]> => {
    return queryMemories('user_habit')
  }

  /**
   * Get project definitions
   */
  const getProjects = async (): Promise<MemoryRecord[]> => {
    return queryMemories('project_definition')
  }

  /**
   * Get execution logs
   */
  const getExecutionLogs = async (): Promise<MemoryRecord[]> => {
    return queryMemories('execution_log')
  }

  return {
    memories,
    loading,
    saveMemory,
    queryMemories,
    getUserHabits,
    getProjects,
    getExecutionLogs
  }
}
