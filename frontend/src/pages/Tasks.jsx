import { useState } from 'react'
import TaskCard from '../components/TaskCard'
import Icon from '../components/Icon'
import { mockTasks } from '../services/mockData'

const SECTIONS = [
  { id: 'today',     label: 'Today',     icon: 'zap' },
  { id: 'upcoming',  label: 'Upcoming',  icon: 'calendar' },
  { id: 'completed', label: 'Completed', icon: 'check' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState(mockTasks)
  const [activeSection, setActiveSection] = useState('today')

  const handleToggle = (id) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t)
    )
  }

  const filtered = tasks.filter(t => t.section === activeSection)
  const todayCount = tasks.filter(t => t.section === 'today' && !t.checked).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            My Tasks
          </h1>
          <p className="text-secondary">
            {todayCount} task{todayCount !== 1 ? 's' : ''} remaining today
          </p>
        </div>
        <button className="btn btn-primary" id="tasks-add-btn">
          <Icon name="check" size={15} />
          Add Task
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Task sections">
        {SECTIONS.map(sec => {
          const count = tasks.filter(t => t.section === sec.id && (sec.id !== 'completed' ? !t.checked : t.checked)).length
          return (
            <button
              key={sec.id}
              id={`tasks-tab-${sec.id}`}
              className={`btn ${activeSection === sec.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSection(sec.id)}
              role="tab"
              aria-selected={activeSection === sec.id}
            >
              <Icon name={sec.icon} size={14} />
              {sec.label}
              {count > 0 && (
                <span style={{
                  background: activeSection === sec.id ? 'rgba(255,255,255,0.25)' : 'var(--gray-300)',
                  color: activeSection === sec.id ? 'white' : 'var(--gray-600)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '1px 7px',
                  marginLeft: 4,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Task List */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list" aria-label={`${activeSection} tasks`}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <Icon name="check" size={32} />
              <p style={{ marginTop: 8 }}>No tasks in this section</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid-3 mt-4">
        {[
          { label: 'Total',     value: tasks.length,                    color: 'var(--brand-500)',   bg: 'var(--brand-50)' },
          { label: 'Pending',   value: tasks.filter(t=>!t.checked).length, color: 'var(--warning-500)', bg: 'var(--warning-50)' },
          { label: 'Completed', value: tasks.filter(t=>t.checked).length,  color: 'var(--success-500)', bg: 'var(--success-50)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
