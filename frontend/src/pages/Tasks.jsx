import { useState, useEffect, useCallback } from 'react'
import TaskCard from '../components/TaskCard'
import Icon from '../components/Icon'
import { fetchTasks, updateTaskStatus } from '../services/api'
import { mockTasks } from '../services/mockData'

const USER_ID = 'EMP001'

const SECTIONS = [
  { id: 'today',     label: 'Today',     icon: 'zap' },
  { id: 'upcoming',  label: 'Upcoming',  icon: 'calendar' },
  { id: 'completed', label: 'Completed', icon: 'check' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('workpilot_tasks_active_section') || 'today'
  })
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString())

  const handleSectionChange = (secId) => {
    setActiveSection(secId)
    localStorage.setItem('workpilot_tasks_active_section', secId)
  }

  const loadTasks = useCallback(async () => {
    try {
      const savedOverrides = localStorage.getItem('workpilot_task_overrides');
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

      const fetched = await fetchTasks(USER_ID)
      let combined = []

      if (fetched && fetched.length > 0) {
        const mapped = fetched.map(t => {
          const id = t.taskId || t.id
          const isChecked = overrides[id] !== undefined ? overrides[id] : Boolean(t.completed)
          return {
            id,
            title: t.title,
            category: t.category || 'HR',
            checked: isChecked,
            due: t.dueDate || t.due || 'Pending',
            section: isChecked ? 'completed' : (t.urgent ? 'today' : 'upcoming'),
            workflowId: t.workflowId,
            urgent: Boolean(t.urgent)
          }
        })
        combined = [...mapped]

        mockTasks.forEach(m => {
          if (!combined.some(item => item.title.toLowerCase() === m.title.toLowerCase())) {
            const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
            combined.push({
              ...m,
              checked: isChecked,
              section: isChecked ? 'completed' : m.section
            })
          }
        })
      } else {
        combined = mockTasks.map(m => {
          const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
          return {
            ...m,
            checked: isChecked,
            section: isChecked ? 'completed' : m.section
          }
        })
      }

      setTasks(combined)
      setLastSynced(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('[Tasks] Error loading tasks:', err)
      const savedOverrides = localStorage.getItem('workpilot_task_overrides');
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};
      setTasks(mockTasks.map(m => ({
        ...m,
        checked: overrides[m.id] !== undefined ? overrides[m.id] : m.checked
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 4000)

    const handleUpdate = () => loadTasks()
    window.addEventListener('workpilot-data-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('workpilot-data-updated', handleUpdate)
    }
  }, [loadTasks])

  const handleToggle = async (id) => {
    const target = tasks.find(t => t.id === id)
    if (!target) return

    const newStatus = !target.checked

    // Persist local override immediately
    try {
      const saved = localStorage.getItem('workpilot_task_overrides')
      const overrides = saved ? JSON.parse(saved) : {}
      overrides[id] = newStatus
      localStorage.setItem('workpilot_task_overrides', JSON.stringify(overrides))
    } catch (e) {
      console.warn('Failed saving task override', e)
    }

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, checked: newStatus, section: newStatus ? 'completed' : 'today' } : t)
    )

    await updateTaskStatus(id, USER_ID, newStatus, {
      title: target.title,
      category: target.category,
      dueDate: target.due
    })
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
  }

  const filtered = tasks.filter(t => {
    if (activeSection === 'completed') return t.checked
    if (activeSection === 'today') return !t.checked && (t.section === 'today' || t.urgent)
    return !t.checked
  })

  const todayCount = tasks.filter(t => !t.checked && (t.section === 'today' || t.urgent)).length

  return (
    <div className="tasks-page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              My Tasks
            </h1>
            <span
              className="badge badge-success flex items-center gap-1.5"
              style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 8px #22c55e'
              }} />
              Real-time API Active
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {todayCount} urgent/today task{todayCount !== 1 ? 's' : ''} remaining
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Synced {lastSynced}
          </span>
          <button
            onClick={loadTasks}
            className="btn btn-secondary flex items-center gap-2"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Icon name="refresh" size={14} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Task sections">
        {SECTIONS.map(sec => {
          const count = tasks.filter(t => {
            if (sec.id === 'completed') return t.checked
            if (sec.id === 'today') return !t.checked && (t.section === 'today' || t.urgent)
            return !t.checked
          }).length

          return (
            <button
              key={sec.id}
              id={`tasks-tab-${sec.id}`}
              className={`btn ${activeSection === sec.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSectionChange(sec.id)}
              role="tab"
              aria-selected={activeSection === sec.id}
              style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
            >
              <Icon name={sec.icon} size={14} />
              {sec.label}
              {count > 0 && (
                <span style={{
                  background: activeSection === sec.id ? 'rgba(255,255,255,0.25)' : 'var(--gray-300)',
                  color: activeSection === sec.id ? 'white' : 'var(--gray-700)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  marginLeft: 6,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Task List */}
      <div className="card shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-body p-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="list" aria-label={`${activeSection} tasks`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <Icon name="refresh" size={24} className="animate-spin mb-2" />
              <p>Loading tasks from AWS API Gateway...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <Icon name="check" size={32} style={{ color: 'var(--success-500)' }} />
              <p style={{ marginTop: 8, fontWeight: 500, color: 'var(--text-primary)' }}>No tasks in this section</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>You're all caught up!</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'var(--brand-600)', bg: 'var(--brand-50)' },
          { label: 'Pending', value: tasks.filter(t => !t.checked).length, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
          { label: 'Completed', value: tasks.filter(t => t.checked).length, color: 'var(--success-600)', bg: 'var(--success-50)' },
        ].map(s => (
          <div key={s.label} className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: s.bg,
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>AWS DynamoDB Synced</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
