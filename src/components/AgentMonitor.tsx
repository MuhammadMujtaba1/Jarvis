import Orchestrator from '../agents/Orchestrator'
import './AgentMonitor.css'

interface AgentMonitorProps {
  orchestrator: Orchestrator | null
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ orchestrator }) => {
  if (!orchestrator) {
    return (
      <div className="agent-monitor panel-enhanced">
        <div className="panel-title text-glow">🤖 AGENTS</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Initializing agents...
        </div>
      </div>
    )
  }

  const agents = [
    { name: 'Orchestrator', tier: 1, status: 'active' },
    { name: 'Design Manager', tier: 2, status: 'idle' },
    { name: 'Engineer Manager', tier: 2, status: 'processing' },
    { name: 'Builder', tier: 3, status: 'idle' },
    { name: 'Researcher', tier: 3, status: 'waiting' },
    { name: 'Critic', tier: 4, status: 'idle' }
  ]

  return (
    <div className="agent-monitor panel-enhanced">
      <div className="panel-title text-glow">🤖 AGENT STATUS</div>

      <div className="agents-grid">
        {agents.map((agent) => (
          <div key={agent.name} className="agent-badge">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-tier">T{agent.tier}</div>
            <div className={`agent-status ${agent.status}`}>{agent.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentMonitor
