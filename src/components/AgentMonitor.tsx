/**
 * AGENT MONITOR - 4-Tier Agent Grid with Modal Integration
 * Clickable agent cards that open the details modal
 */

import React, { useState } from 'react';
import { useAgentStore, AGENT_CONFIGS, STATUS_COLORS, STATUS_LABELS } from '../hooks/useAgentStore';
import AgentDetailsModal from './AgentDetailsModal';
import './AgentMonitor.css';

interface AgentMonitorProps {
  orchestrator: any;
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ orchestrator }) => {
  const {
    agents,
    getAgent,
  } = useAgentStore();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Get agent config by ID
  const getConfig = (id: string) => AGENT_CONFIGS.find(c => c.id === id);

  // Open modal for agent
  const openAgentModal = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  // Close modal
  const closeModal = () => {
    setSelectedAgent(null);
  };

  return (
    <div className="agent-monitor panel-enhanced">
      <div className="panel-title text-glow">🤖 AGENTS</div>

      <div className="agents-grid">
        {AGENT_CONFIGS.map((config) => {
          const state = getAgent(config.id);
          const status = state?.status || 'IDLE';
          const statusColor = STATUS_COLORS[status];
          const isActive = status !== 'IDLE';

          return (
            <div 
              key={config.id}
              className={`agent-badge ${isActive ? 'agent-active' : ''}`}
              onClick={() => openAgentModal(config.id)}
              style={{
                borderColor: `${statusColor}40`,
                boxShadow: isActive ? `0 0 15px ${statusColor}30` : 'none',
              }}
            >
              {/* Tier Badge */}
              <div 
                className="agent-tier"
                style={{ 
                  background: `${statusColor}20`,
                  borderColor: `${statusColor}60`,
                  color: statusColor,
                }}
              >
                T{config.tier}
              </div>

              {/* Agent Name */}
              <div className="agent-name">{config.name}</div>

              {/* Status */}
              <div className={`agent-status ${status.toLowerCase()}`}>
                <div 
                  className="status-dot"
                  style={{
                    background: statusColor,
                    boxShadow: `0 0 8px ${statusColor}`,
                    animation: (status === 'PROCESSING' || status === 'WAKING_UP') 
                      ? 'pulse-dot 1s infinite' 
                      : 'none',
                  }}
                />
                <span style={{ color: statusColor }}>
                  {STATUS_LABELS[status]}
                </span>
              </div>

              {/* Click hint */}
              <div className="agent-hint">Click for details</div>
            </div>
          );
        })}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && getAgent(selectedAgent) && (
        <AgentDetailsModal
          agentId={selectedAgent}
          agentState={getAgent(selectedAgent)!}
          isOpen={true}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AgentMonitor;
