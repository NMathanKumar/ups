import Icon from './Icon'

const CATEGORY_COLORS = {
  Learning:   { color: 'var(--warning-600)', bg: 'var(--warning-50)' },
  HR:         { color: 'var(--brand-600)',   bg: 'var(--brand-50)' },
  Onboarding: { color: 'var(--success-600)', bg: 'var(--success-50)' },
  'IT Support':{ color: 'var(--info-600)',   bg: 'var(--info-50)' },
  IT:         { color: 'var(--info-600)',   bg: 'var(--info-50)' },
  General:    { color: 'var(--gray-600)',    bg: 'var(--gray-100)' },
}

export default function TaskCard({ task, onToggle }) {
  if (!task) return null

  const catKey = task.category || 'General'
  const styles = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.General || { color: '#475569', bg: '#f1f5f9' }
  const { color, bg } = styles

  return (
    <div
      className={`task-item ${task.checked ? 'completed' : ''}`}
      role="listitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        background: task.checked ? '#f8fafc' : '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${task.checked ? '#cbd5e1' : color}`,
        borderRadius: 12,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      <button
        className={`task-checkbox ${task.checked ? 'checked' : ''}`}
        onClick={() => onToggle && onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.checked ? 'incomplete' : 'complete'}`}
        id={`task-check-${task.id}`}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: task.checked ? 'none' : '2px solid #cbd5e1',
          background: task.checked ? '#22c55e' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {task.checked && <Icon name="check" size={13} style={{ color: 'white' }} />}
      </button>

      <div className="task-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="task-title" style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: task.checked ? '#94a3b8' : '#0f172a',
          textDecoration: task.checked ? 'line-through' : 'none',
          marginBottom: 4,
        }}>
          {task.title}
        </div>
        <div className="task-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            className="badge"
            style={{
              background: bg,
              color,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: '0.725rem',
              fontWeight: 700,
            }}
          >
            {task.category || 'General'}
          </span>
          <span className="task-due" style={{ fontSize: '0.775rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="calendar" size={12} />
            {task.due || task.dueDate || 'Pending'}
          </span>
          {task.urgent && !task.checked && (
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: '0.725rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
              }}
            >
              Urgent
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
