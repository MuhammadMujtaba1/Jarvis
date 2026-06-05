/**
 * AGENT DETAILS MODAL
 * Glassmorphism UI for viewing agent details and submissions
 */

import React, { useEffect, useCallback } from 'react';
import { AgentState, AgentSubmission } from '../types';
import { agentRegistry } from '../utils/AgentSubmissionRegistry';
import { STATUS_COLORS, STATUS_LABELS, AGENT_CONFIGS } from '../hooks/useAgentStore';

interface AgentDetailsModalProps {
  agentId: string;
  agentState: AgentState;
  isOpen: boolean;
  onClose: () => void;
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agentId,
  agentState,
  isOpen,
  onClose,
}) => {
  const config = AGENT_CONFIGS.find(c => c.id === agentId);
  const submissions = agentRegistry.getAgentSubmissions(agentId);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const statusColor = STATUS_COLORS[agentState.status];
  const isPulsing = agentState.status === 'PROCESSING' || agentState.status === 'WAKING_UP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 18, 0.95) 0%, rgba(18, 18, 31, 0.95) 100%)',
          border: '1px solid rgba(0, 210, 255, 0.4)',
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.25), 0 0 80px rgba(0, 210, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(0, 210, 255, 0.2)' }}
        >
          <div className="flex items-center gap-4">
            {/* Agent Icon */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}11 100%)`,
                border: `1px solid ${statusColor}44`,
              }}
            >
              T{config.tier}
            </div>
            
            <div>
              <h2 
                className="text-xl font-bold tracking-wider"
                style={{ color: '#00d2ff', fontFamily: 'Courier New, monospace' }}
              >
                {config.name}
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'rgba(0, 210, 255, 0.6)' }}
              >
                {config.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${isPulsing ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
              />
              <span 
                className="text-xs font-bold tracking-wider"
                style={{ color: statusColor }}
              >
                {STATUS_LABELS[agentState.status]}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'rgba(0, 210, 255, 0.1)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                color: '#00d2ff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 210, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 210, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 210, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(85vh-80px)]">
          {/* Left Column - What They Were Told */}
          <div 
            className="flex-1 p-4 lg:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r"
            style={{ borderColor: 'rgba(0, 210, 255, 0.15)' }}
          >
            <h3 
              className="text-sm font-bold tracking-wider mb-4 flex items-center gap-2"
              style={{ color: '#00d2ff' }}
            >
              <span>📋</span>
              STUFF I WAS TOLD TO DO
            </h3>

            {submissions.length === 0 ? (
              <div 
                className="p-4 rounded-lg text-center"
                style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(0, 210, 255, 0.1)' }}
              >
                <p style={{ color: 'rgba(0, 210, 255, 0.4)' }}>
                  No tasks assigned yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.slice(0, 5).map((submission) => (
                  <div 
                    key={submission.id}
                    className="p-4 rounded-lg"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(0, 210, 255, 0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="text-xs"
                        style={{ color: 'rgba(0, 210, 255, 0.5)' }}
                      >
                        {new Date(submission.timestamp).toLocaleString()}
                      </span>
                      <StatusBadge status={submission.status} />
                    </div>
                    <p 
                      className="text-sm"
                      style={{ color: '#00d2ff', fontFamily: 'Courier New, monospace' }}
                    >
                      {submission.promptAssigned}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - What They Did */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <h3 
              className="text-sm font-bold tracking-wider mb-4 flex items-center gap-2"
              style={{ color: '#00d2ff' }}
            >
              <span>✨</span>
              WHAT I DID
            </h3>

            {submissions.length === 0 ? (
              <div 
                className="p-4 rounded-lg text-center"
                style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(0, 210, 255, 0.1)' }}
              >
                <p style={{ color: 'rgba(0, 210, 255, 0.4)' }}>
                  Awaiting first submission...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 3).map((submission) => (
                  <SubmissionOutput 
                    key={submission.id}
                    submission={submission}
                    agentId={agentId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ status: AgentSubmission['status'] }> = ({ status }) => {
  const config = {
    approved: { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)', label: 'APPROVED' },
    rejected_by_qa: { color: '#ff3366', bg: 'rgba(255, 51, 102, 0.1)', label: 'REJECTED' },
    pending: { color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.1)', label: 'PENDING' },
  };

  const { color, bg, label } = config[status];

  return (
    <span 
      className="text-xs px-2 py-1 rounded"
      style={{ background: bg, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
};

interface SubmissionOutputProps {
  submission: AgentSubmission;
  agentId: string;
}

const SubmissionOutput: React.FC<SubmissionOutputProps> = ({ submission, agentId }) => {
  const isCode = agentId === 'builder' || typeof submission.outputData === 'string' && 
    submission.outputData.includes('function') || 
    submission.outputData.includes('class ') ||
    submission.outputData.includes('const ') ||
    submission.outputData.includes('import ');

  const isCritic = agentId === 'critic';

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ 
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(0, 210, 255, 0.2)',
      }}
    >
      {/* Output Header */}
      <div 
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: 'rgba(0, 210, 255, 0.05)', borderBottom: '1px solid rgba(0, 210, 255, 0.1)' }}
      >
        <span 
          className="text-xs font-bold"
          style={{ color: 'rgba(0, 210, 255, 0.7)' }}
        >
          {new Date(submission.timestamp).toLocaleTimeString()}
        </span>
        <StatusBadge status={submission.status} />
      </div>

      {/* Output Content */}
      <div className="p-4 max-h-64 overflow-auto">
        {isCode ? (
          <pre 
            className="text-xs overflow-x-auto"
            style={{ 
              color: '#00d2ff',
              fontFamily: 'Courier New, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {typeof submission.outputData === 'string' 
              ? submission.outputData.substring(0, 1000) + (submission.outputData.length > 1000 ? '...' : '')
              : JSON.stringify(submission.outputData, null, 2)
            }
          </pre>
        ) : isCritic ? (
          <div className="space-y-2">
            {Array.isArray(submission.outputData) ? (
              submission.outputData.map((item: any, i: number) => (
                <div key={i} className="text-sm" style={{ color: '#00d2ff' }}>
                  {item}
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: '#00d2ff' }}>
                {typeof submission.outputData === 'string' 
                  ? submission.outputData 
                  : JSON.stringify(submission.outputData)
                }
              </p>
            )}
          </div>
        ) : (
          <p 
            className="text-sm"
            style={{ color: '#00d2ff', whiteSpace: 'pre-wrap' }}
          >
            {typeof submission.outputData === 'string' 
              ? submission.outputData 
              : JSON.stringify(submission.outputData, null, 2)
            }
          </p>
        )}
      </div>

      {/* QA Feedback */}
      {submission.qaFeedback && (
        <div 
          className="px-4 py-3 border-t"
          style={{ 
            background: 'rgba(255, 51, 102, 0.05)',
            borderColor: 'rgba(255, 51, 102, 0.2)',
          }}
        >
          <p 
            className="text-xs font-bold mb-1"
            style={{ color: '#ff3366' }}
          >
            QA FEEDBACK:
          </p>
          <p 
            className="text-xs"
            style={{ color: 'rgba(255, 51, 102, 0.8)' }}
          >
            {submission.qaFeedback}
          </p>
        </div>
      )}

      {/* Artifacts */}
      {submission.artifactsCreated && submission.artifactsCreated.length > 0 && (
        <div 
          className="px-4 py-3 border-t"
          style={{ borderColor: 'rgba(0, 210, 255, 0.1)' }}
        >
          <p 
            className="text-xs font-bold mb-1"
            style={{ color: 'rgba(0, 210, 255, 0.6)' }}
          >
            ARTIFACTS:
          </p>
          <div className="flex flex-wrap gap-2">
            {submission.artifactsCreated.map((artifact, i) => (
              <span 
                key={i}
                className="text-xs px-2 py-1 rounded"
                style={{ 
                  background: 'rgba(0, 210, 255, 0.1)',
                  color: '#00d2ff',
                  border: '1px solid rgba(0, 210, 255, 0.2)',
                }}
              >
                {artifact}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetailsModal;
