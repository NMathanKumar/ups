import Icon from './Icon'

const CATEGORY_COLORS = {
  Learning:   { color: 'var(--warning-600)', bg: 'var(--warning-50)' },
  HR:         { color: 'var(--brand-600)',   bg: 'var(--brand-50)' },
  Onboarding: { color: 'var(--success-600)', bg: 'var(--success-50)' },
  'IT Support':{ color: 'var(--info-600)',   bg: 'var(--info-50)' },
  General:    { color: 'var(--gray-600)',    bg: 'var(--gray-100)' },
}

export default function TaskCard({ task, onToggle }) {
  const { color, bg } = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General

  return (
    <div
      className={`task-item ${task.checked ? 'completed' : ''}`}
      role="listitem"
    >
      <button
        className={`task-checkbox ${task.checked ? 'checked' : ''}`}
        onClick={() => onToggle && onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.checked ? 'incomplete' : 'complete'}`}
        id={`task-check-${task.id}`}
      >
        {task.checked && <Icon name="check" size={11} />}
      </button>

      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span
            className="badge"
            style={{ background: bg, color }}
          >
            {task.category}
          </span>
          <span className="task-due">
            <Icon name="calendar" size={11} />
            {task.due}
          </span>
          {task.urgent && !task.checked && (
            <span className="badge badge-danger">Urgent</span>
          )}
        </div>
      </div>
    </div>
  )
}
