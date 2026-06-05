/**
 * AGENT SUBMISSION REGISTRY
 * Centralized historical ledger for all agent outputs
 */

import { AgentSubmission, AgentTier } from '../types';
import { v4 as uuidv4 } from 'uuid';

class AgentSubmissionRegistry {
  private submissions: Map<string, AgentSubmission> = new Map();
  private maxHistory: number = 100;

  /**
   * Submit work from an agent
   */
  submitWork(submission: Omit<AgentSubmission, 'id' | 'timestamp'>): AgentSubmission {
    const fullSubmission: AgentSubmission = {
      ...submission,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    this.submissions.set(fullSubmission.id, fullSubmission);
    this.pruneOldSubmissions();

    console.log(`[Registry] ${submission.agentName} submitted: ${submission.id}`);
    
    return fullSubmission;
  }

  /**
   * Get submission by ID
   */
  getSubmission(id: string): AgentSubmission | undefined {
    return this.submissions.get(id);
  }

  /**
   * Get all submissions for an agent
   */
  getAgentSubmissions(agentId: string): AgentSubmission[] {
    return Array.from(this.submissions.values())
      .filter(s => s.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get submissions by tier
   */
  getTierSubmissions(tier: AgentTier): AgentSubmission[] {
    return Array.from(this.submissions.values())
      .filter(s => s.tier === tier)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get all submissions
   */
  getAllSubmissions(): AgentSubmission[] {
    return Array.from(this.submissions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent submissions
   */
  getRecentSubmissions(limit: number = 10): AgentSubmission[] {
    return this.getAllSubmissions().slice(0, limit);
  }

  /**
   * Update submission status (for QA review)
   */
  updateStatus(id: string, status: 'approved' | 'rejected_by_qa' | 'pending', feedback?: string): boolean {
    const submission = this.submissions.get(id);
    if (!submission) return false;

    submission.status = status;
    if (feedback) {
      submission.qaFeedback = feedback;
    }

    this.submissions.set(id, submission);
    return true;
  }

  /**
   * Get pending submissions (for QA)
   */
  getPendingSubmissions(): AgentSubmission[] {
    return Array.from(this.submissions.values())
      .filter(s => s.status === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get rejected submissions (for builder to fix)
   */
  getRejectedSubmissions(agentId?: string): AgentSubmission[] {
    let subs = Array.from(this.submissions.values())
      .filter(s => s.status === 'rejected_by_qa');
    
    if (agentId) {
      subs = subs.filter(s => s.agentId === agentId);
    }
    
    return subs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get approved submissions
   */
  getApprovedSubmissions(agentId?: string): AgentSubmission[] {
    let subs = Array.from(this.submissions.values())
      .filter(s => s.status === 'approved');
    
    if (agentId) {
      subs = subs.filter(s => s.agentId === agentId);
    }
    
    return subs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get submission stats
   */
  getStats() {
    const all = Array.from(this.submissions.values());
    return {
      total: all.length,
      approved: all.filter(s => s.status === 'approved').length,
      rejected: all.filter(s => s.status === 'rejected_by_qa').length,
      pending: all.filter(s => s.status === 'pending').length,
      byTier: {
        1: all.filter(s => s.tier === 1).length,
        2: all.filter(s => s.tier === 2).length,
        3: all.filter(s => s.tier === 3).length,
        4: all.filter(s => s.tier === 4).length,
      },
    };
  }

  /**
   * Prune old submissions when exceeding max history
   */
  private pruneOldSubmissions(): void {
    if (this.submissions.size <= this.maxHistory) return;

    const sorted = Array.from(this.submissions.entries())
      .sort(([, a], [, b]) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const toRemove = sorted.slice(this.maxHistory);
    toRemove.forEach(([id]) => this.submissions.delete(id));
  }

  /**
   * Clear all submissions
   */
  clear(): void {
    this.submissions.clear();
  }

  /**
   * Export submissions as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getAllSubmissions(), null, 2);
  }
}

// Singleton instance
export const agentRegistry = new AgentSubmissionRegistry();

// ============================================================================
// HELPER FUNCTIONS FOR AGENTS
// ============================================================================

export function submitAgentWork(
  agentId: string,
  agentName: string,
  tier: AgentTier,
  promptAssigned: string,
  outputData: string | object,
  artifactsCreated?: string[]
): AgentSubmission {
  return agentRegistry.submitWork({
    agentId,
    agentName,
    tier,
    promptAssigned,
    outputData,
    status: 'pending',
    artifactsCreated,
  });
}

export function approveSubmission(id: string, feedback?: string): boolean {
  return agentRegistry.updateStatus(id, 'approved', feedback);
}

export function rejectSubmission(id: string, feedback: string): boolean {
  return agentRegistry.updateStatus(id, 'rejected_by_qa', feedback);
}
