import { Agent, JarvisConfig } from '../types'

// DIAGNOSTIC FIX: Safe import.meta access
const env = (import.meta as any).env || {};

interface ExtendedJarvisConfig extends JarvisConfig {
  maxConcurrentTasks: number;
  dbName: string;
  enableOfflineMode: boolean;
}

const defaultConfig: ExtendedJarvisConfig = {
  groqApiKey: env.VITE_GROQ_API_KEY || '',
  groqModel: env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
  voiceEnabled: env.VITE_VOICE_ENABLED !== 'false',
  voiceLanguage: env.VITE_VOICE_LANG || 'en-US',
  maxConcurrentTasks: 5,
  dbName: 'JarvisDB',
  enableOfflineMode: true
}

const agentDefinitions: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    tier: 1,
    role: 'Director - Goal parsing and DAG creation',
    status: 'idle',
    memory: {
      type: 'global',
      capacity: 1000,
      currentUsage: 0
    },
    capabilities: ['goal_parsing', 'dag_creation', 'task_distribution']
  },
  {
    id: 'design-manager',
    name: 'Design Manager',
    tier: 2,
    role: 'Product & Design - Layout blueprints',
    status: 'idle',
    memory: {
      type: 'contextual',
      capacity: 500,
      currentUsage: 0
    },
    capabilities: ['ui_design', 'asset_mapping', 'style_templates']
  },
  {
    id: 'engineer-manager',
    name: 'Engineer Manager',
    tier: 2,
    role: 'Engineering - Workflow translation',
    status: 'idle',
    memory: {
      type: 'contextual',
      capacity: 500,
      currentUsage: 0
    },
    capabilities: ['workflow_translation', 'dependency_tracking', 'architecture']
  },
  {
    id: 'builder',
    name: 'Builder',
    tier: 3,
    role: 'Code Generator - React/TypeScript implementation',
    status: 'idle',
    memory: {
      type: 'episodic',
      capacity: 300,
      currentUsage: 0
    },
    capabilities: ['code_generation', 'component_creation', 'refactoring']
  },
  {
    id: 'researcher',
    name: 'Researcher',
    tier: 3,
    role: 'Data Fetcher - API and documentation scanning',
    status: 'idle',
    memory: {
      type: 'semantic',
      capacity: 400,
      currentUsage: 0
    },
    capabilities: ['data_fetching', 'api_coordination', 'documentation_scanning']
  },
  {
    id: 'critic',
    name: 'Critic',
    tier: 4,
    role: 'QA Tester - Code validation and testing',
    status: 'idle',
    memory: {
      type: 'semantic',
      capacity: 400,
      currentUsage: 0
    },
    capabilities: ['code_validation', 'error_detection', 'testing']
  }
]

export const initializeSystem = async () => {
  console.log('🔧 Initializing JARVIS system...')

  // Validate configuration
  if (!defaultConfig.groqApiKey) {
    throw new Error('VITE_GROQ_API_KEY environment variable is not set')
  }

  // Initialize IndexedDB
  try {
    const dbRequest = indexedDB.open(defaultConfig.dbName, 1)
    
    dbRequest.onerror = () => {
      throw new Error('Failed to initialize IndexedDB')
    }

    dbRequest.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create object stores
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('memory')) {
        db.createObjectStore('memory', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('executions')) {
        db.createObjectStore('executions', { keyPath: 'id' })
      }
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB initialization warning:', error)
  }

  // Initialize Web Worker if available
  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('../workers/taskWorker.ts', import.meta.url), { type: 'module' })
      console.log('✅ Web Worker initialized')
      worker.terminate()
    } catch (error) {
      console.warn('⚠️ Web Worker initialization warning:', error)
    }
  }

  console.log('✅ System initialization complete')
  console.log(`📊 Agents loaded: ${agentDefinitions.length}`)

  return {
    config: defaultConfig,
    agents: agentDefinitions
  }
}
