import { Goal } from '../types'
import './TaskMonitor.css'

interface TaskMonitorProps {
  activeGoal: Goal | null
}

const TaskMonitor: React.FC<TaskMonitorProps> = ({ activeGoal }) => {
  return (
    <div className="task-monitor panel">
      <div className="monitor-header">TASKS</div>
      
      {activeGoal ? (
        <div className="task-list">
          {activeGoal.taskDAG.map((task, index) => (
            <div key={task.id} className="task-item">
              <div className="task-number">{index + 1}</div>
              <div className="task-info">
                <div className="task-name">{task.title}</div>
                <div className={`task-status ${task.status}`}>{task.status.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          No active tasks
        </div>
      )}
    </div>
  )
}

export default TaskMonitor
