import { BusinessMetrics } from '../agents/orchestratorMetrics'
import './MetricsDisplay.css'

interface MetricsDisplayProps {
  metrics: BusinessMetrics | null
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-display panel-enhanced">
        <div className="panel-title text-glow">SYSTEM</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Loading metrics...
        </div>
      </div>
    )
  }

  return (
    <div className="metrics-display panel-enhanced">
      <div className="panel-title text-glow">SYSTEM METRICS</div>

      <div className="metric-item">
        <span className="metric-label">CPU Usage</span>
        <div className="metric-bar">
          <div className="metric-fill" style={{ width: '85%' }}></div>
        </div>
        <span className="metric-value">85%</span>
      </div>

      <div className="metric-item">
        <span className="metric-label">RAM Usage</span>
        <div className="metric-bar">
          <div className="metric-fill" style={{ width: '50%' }}></div>
        </div>
        <span className="metric-value">3.0 GB / 6.0 GB</span>
      </div>

      <div className="metric-item">
        <span className="metric-label">SWAP Usage</span>
        <div className="metric-bar">
          <div className="metric-fill" style={{ width: '29%' }}></div>
        </div>
        <span className="metric-value">29%</span>
      </div>

      <div className="gauge-container">
        <div className="gauge">
          <div className="gauge-value">100%</div>
        </div>
      </div>

      <div className="system-info">
        <div>Uptime: 0d, 1h, 49m</div>
        <div>Temp: 62°C</div>
        <div>CPU: 1584 MHz</div>
      </div>
    </div>
  )
}

export default MetricsDisplay
