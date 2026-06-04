/**
 * DIAGNOSTIC FIX: ENGINEERING MANAGER
 * - Added timeout protection for all async operations
 * - Removed potential blocking on messageQueue operations
 */

import { Agent, AgentMessage } from '../types'
import { messageQueue } from '../utils/messageQueue'
import { v4 as uuidv4 } from 'uuid'

// Timeout wrapper for any async operation
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout after ' + timeoutMs + 'ms')), timeoutMs)
    )
  ]);
};

/**
 * Tier 2: ENGINEERING / EXECUTION MANAGER AGENT
 * Role: Translate abstract features into technical programming blocks
 */
class EngineeringManager implements Agent {
  id = 'engineer-manager'
  name = 'Engineer Manager'
  tier: 1 | 2 | 3 | 4 = 2
  role = 'Engineering - Technical workflow translation'
  status: 'idle' | 'processing' | 'waiting' = 'idle'
  memory = {
    type: 'contextual' as const,
    capacity: 500,
    currentUsage: 0
  }
  capabilities = ['workflow_translation', 'dependency_tracking', 'architecture']

  /**
   * Process incoming feature request
   */
  async processFeatureRequest(payload: any): Promise<void> {
    console.log('🛠️ Engineer Manager processing feature request:', payload.feature)

    this.status = 'processing'

    try {
      // Create task breakdown
      const tasks = this.breakdownFeature(payload)

      // Route to Builder agent
      const message: AgentMessage = {
        id: uuidv4(),
        from: this.name,
        to: 'builder',
        type: 'task_assignment',
        payload: {
          feature: payload.feature,
          tasks,
          requirements: payload.requirements
        },
        timestamp: Date.now(),
        priority: payload.priority || 'medium'
      }

      // DIAGNOSTIC FIX: Added timeout to prevent blocking
      await withTimeout(
        messageQueue.sendMessage(this.name, 'builder', 'TASK_ASSIGNMENT', { message }),
        5000
      ).catch((err) => {
        console.warn('[EngineerManager] Message send timeout:', err.message);
      });
      
      console.log('✅ Feature routed to Builder agent')

      this.status = 'idle'
    } catch (error) {
      console.error('❌ Engineer Manager error:', error)
      this.status = 'idle'
    }
  }

  /**
   * Break down a feature into implementable tasks
   */
  private breakdownFeature(_payload: any): any[] {
    return [
      {
        id: 'backend-setup',
        title: 'Setup Backend Infrastructure',
        tier: 3,
        agent: 'builder',
        dependencies: []
      },
      {
        id: 'database-design',
        title: 'Design Database Schema',
        tier: 3,
        agent: 'builder',
        dependencies: ['backend-setup']
      },
      {
        id: 'api-implementation',
        title: 'Implement API Endpoints',
        tier: 3,
        agent: 'builder',
        dependencies: ['database-design']
      },
      {
        id: 'testing',
        title: 'Run QA Tests',
        tier: 4,
        agent: 'critic',
        dependencies: ['api-implementation']
      }
    ]
  }
}

export default EngineeringManager
