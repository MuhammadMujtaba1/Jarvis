import { Agent } from '../types'
import './SystemMonitor.css'

interface SystemMonitorProps {
  selectedAgent: Agent | null
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ selectedAgent }) => {
  return (
    <div className="system-monitor panel">
      <div className="monitor-header">SYSTEM</div>
      
      <div className="metric-item">
        <span className="metric-label">CPU Usage</span>
        <span className="metric-value">100%</span>
      </div>
      
      <div className="metric-item">
        <span className="metric-label">RAM Usage</span>
        <span className="metric-value">50%</span>
      </div>
      
      <div className="metric-item">
        <span className="metric-label">SWAP Usage</span>
        <span className="metric-value">29%</span>
      </div>

      <div className="gauge">
        <div className="gauge-value">100%</div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
        <div>Uptime: 0d, 1h, 49m</div>
        <div>RAM: 1.0 GB / [S]</div>
        <div>CPU: 1584 MHz</div>
      </div>
    </div>
  )
}

export default SystemMonitor
