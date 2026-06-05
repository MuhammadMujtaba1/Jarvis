/**
 * USE AGENT STORE - 4-Tier Agent State Machine
 * Zustand-like lightweight store for agent lifecycle management
 */

import { useState, useCallback, useEffect } from 'react';
import { AgentStatus, AgentTier, AgentState, AgentConfig } from '../types';

// ============================================================================
// AGENT CONFIGURATIONS - 4-Tier Hierarchy
// ============================================================================

export const AGENT_CONFIGS: AgentConfig[] = [
  // TIER 1: The Director
  {
    id: 'orchestrator',
    name: 'ORCHESTRATOR',
    tier: 1,
    role: 'Director / Chief Executive',
    description: 'Manages global memory, DAGs, goal parsing, and downstream orchestration',
    memoryType: 'global',
  },
  // TIER 2: The Managers
  {
    id: 'design_manager',
    name: 'DESIGN MANAGER',
    tier: 2,
    role: 'Product & Design Manager',
    description: 'Contextual short-term design memory and visual specifications',
    memoryType: 'contextual',
  },
  {
    id: 'engineering_manager',
    name: 'ENGINEERING MGR',
    tier: 2,
    role: 'Engineering Manager',
    description: 'System architecture and dependency tracking',
    memoryType: 'contextual',
  },
  // TIER 3: The Workers
  {
    id: 'builder',
    name: 'BUILDER',
    tier: 3,
    role: 'Code Generator',
    description: 'Episodic working memory for code generation',
    memoryType: 'episodic',
  },
  {
    id: 'researcher',
    name: 'RESEARCHER',
    tier: 3,
    role: 'Data Fetcher',
    description: 'Semantic search, scraping, and data gathering',
    memoryType: 'semantic',
  },
  // TIER 4: Quality Gatekeepers
  {
    id: 'critic',
    name: 'CRITIC',
    tier: 4,
    role: 'QA Tester',
    description: 'Evaluation, rules memory, and feedback loops',
    memoryType: 'episodic',
  },
];

// ============================================================================
// INITIAL AGENT STATES
// ============================================================================

const createInitialAgentStates = (): Map<string, AgentState> => {
  const states = new Map<string, AgentState>();
  
  AGENT_CONFIGS.forEach(config => {
    states.set(config.id, {
      agentId: config.id,
      status: 'IDLE',
      currentTask: undefined,
      lastActivity: Date.now(),
      submissions: [],
      errors: [],
    });
  });
  
  return states;
};

// ============================================================================
// USE AGENT STORE HOOK
// ============================================================================

export function useAgentStore() {
  const [agents, setAgents] = useState<Map<string, AgentState>>(createInitialAgentStates);
  const [lastWakeUp, setLastWakeUp] = useState<number | null>(null);

  // Get all agents as array
  const getAllAgents = useCallback((): AgentState[] => {
    return Array.from(agents.values());
  }, [agents]);

  // Get single agent state
  const getAgent = useCallback((agentId: string): AgentState | undefined => {
    return agents.get(agentId);
  }, [agents]);

  // Get agent config
  const getAgentConfig = useCallback((agentId: string): AgentConfig | undefined => {
    return AGENT_CONFIGS.find(c => c.id === agentId);
  }, []);

  // Get agents by tier
  const getAgentsByTier = useCallback((tier: AgentTier): AgentState[] => {
    const configIds = AGENT_CONFIGS.filter(c => c.tier === tier).map(c => c.id);
    return Array.from(agents.values()).filter(a => configIds.includes(a.agentId));
  }, [agents]);

  // Set agent status with timestamp
  const setAgentStatus = useCallback((
    agentId: string, 
    status: AgentStatus, 
    task?: string
  ) => {
    setAgents(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(agentId);
      
      if (current) {
        newMap.set(agentId, {
          ...current,
          status,
          currentTask: task || current.currentTask,
          lastActivity: Date.now(),
        });
      }
      
      return newMap;
    });
  }, []);

  // Add submission to agent
  const addSubmission = useCallback((agentId: string, submissionId: string) => {
    setAgents(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(agentId);
      
      if (current) {
        newMap.set(agentId, {
          ...current,
          submissions: [...current.submissions, submissionId],
          lastActivity: Date.now(),
        });
      }
      
      return newMap;
    });
  }, []);

  // Add error to agent
  const addError = useCallback((agentId: string, error: string) => {
    setAgents(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(agentId);
      
      if (current) {
        newMap.set(agentId, {
          ...current,
          errors: [...current.errors.slice(-9), error], // Keep last 10
          status: 'FAILED',
          lastActivity: Date.now(),
        });
      }
      
      return newMap;
    });
  }, []);

  // Wake up all agents (Director first, then cascade)
  const wakeUpAllAgents = useCallback(async (goal: string) => {
    setLastWakeUp(Date.now());
    
    // TIER 1: Orchestrator wakes up first
    setAgentStatus('orchestrator', 'WAKING_UP', `Parsing goal: ${goal.substring(0, 50)}...`);
    
    // Simulate Orchestrator processing
    await new Promise(resolve => setTimeout(resolve, 500));
    setAgentStatus('orchestrator', 'PROCESSING', `Analyzing: ${goal.substring(0, 50)}...`);
    
    // Tier 2: Managers wake up
    await new Promise(resolve => setTimeout(resolve, 300));
    setAgentStatus('design_manager', 'WAKING_UP');
    setAgentStatus('engineering_manager', 'WAKING_UP');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setAgentStatus('design_manager', 'PROCESSING', 'Slicing design context...');
    setAgentStatus('engineering_manager', 'PROCESSING', 'Mapping dependencies...');
    
    // Tier 3: Workers wake up
    await new Promise(resolve => setTimeout(resolve, 300));
    setAgentStatus('builder', 'WAKING_UP');
    setAgentStatus('researcher', 'WAKING_UP');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setAgentStatus('builder', 'PROCESSING', 'Generating code...');
    setAgentStatus('researcher', 'PROCESSING', 'Searching data...');
    
    // Tier 4: Critic wakes up
    await new Promise(resolve => setTimeout(resolve, 200));
    setAgentStatus('critic', 'WAKING_UP');
    setAgentStatus('critic', 'PROCESSING', 'Preparing validation...');
    
  }, [setAgentStatus]);

  // Complete agent work
  const completeAgent = useCallback((agentId: string) => {
    setAgentStatus(agentId, 'COMPLETED');
    
    // Auto-transition to IDLE after brief moment
    setTimeout(() => {
      setAgentStatus(agentId, 'IDLE');
    }, 2000);
  }, [setAgentStatus]);

  // Reset all agents to IDLE
  const resetAllAgents = useCallback(() => {
    setAgents(createInitialAgentStates());
    setLastWakeUp(null);
  }, []);

  return {
    agents,
    getAllAgents,
    getAgent,
    getAgentConfig,
    getAgentsByTier,
    setAgentStatus,
    addSubmission,
    addError,
    wakeUpAllAgents,
    completeAgent,
    resetAllAgents,
    lastWakeUp,
    agentConfigs: AGENT_CONFIGS,
  };
}

// ============================================================================
// AGENT STATUS COLORS & LABELS
// ============================================================================

export const STATUS_COLORS: Record<AgentStatus, string> = {
  IDLE: '#00d2ff',
  WAKING_UP: '#ffaa00',
  PROCESSING: '#00d2ff',
  SUBMITTING: '#aa88ff',
  REVIEWING: '#ff88aa',
  COMPLETED: '#00ff88',
  FAILED: '#ff3366',
};

export const STATUS_LABELS: Record<AgentStatus, string> = {
  IDLE: 'IDLE',
  WAKING_UP: 'WAKING UP',
  PROCESSING: 'PROCESSING',
  SUBMITTING: 'SUBMITTING',
  REVIEWING: 'REVIEWING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};
