import { Orchestrator } from '../agents/Orchestrator'
import './AgentMonitor.css'

interface AgentMonitorProps {
  orchestrator: Orchestrator | null
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ orchestrator }) => {
  // All agents start with IDLE status on initial render
  // Statuses are updated dynamically from orchestrator state
  const agents = [
    { name: 'Orchestrator', tier: 1, status: 'idle' as const },
    { name: 'Design Manager', tier: 2, status: 'idle' as const },
    { name: 'Engineer Manager', tier: 2, status: 'idle' as const },
    { name: 'Builder', tier: 3, status: 'idle' as const },
    { name: 'Researcher', tier: 3, status: 'idle' as const },
    { name: 'Critic', tier: 4, status: 'idle' as const }
  ]

  return (
    <div className="agent-monitor panel-enhanced">
      <div className="panel-title text-glow">🤖 AGENTS</div>

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
