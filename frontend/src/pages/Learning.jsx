import { useState, useEffect, useCallback } from 'react'
import Icon from '../components/Icon'
import { fetchTasks } from '../services/api'
import { mockLearning } from '../services/mockData'

const USER_ID = 'EMP001'

const STATUS_STYLES = {
  'completed':   { badge: 'badge-success', label: 'Completed' },
  'in-progress': { badge: 'badge-warning', label: 'In Progress' },
  'not-started': { badge: 'badge-gray',    label: 'Not Started' },
}

function ProgressBar({ pct }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Learning() {
  const [courses, setCourses] = useState(mockLearning)
  const [loading, setLoading] = useState(true)

  const loadLearningData = useCallback(async () => {
    setLoading(true)
    const tasks = await fetchTasks(USER_ID)
    const learningTasks = tasks.filter(t => t.category === 'LEARNING' || t.category === 'ONBOARDING')

    if (learningTasks && learningTasks.length > 0) {
      const dynamicCourses = learningTasks.map((t, idx) => ({
        id: t.taskId || `course-${idx}`,
        title: t.title,
        category: 'Required',
        status: t.completed ? 'completed' : 'in-progress',
        progress: t.completed ? 100 : 25,
        deadline: t.dueDate || 'Assigned via Onboarding',
      }))

      setCourses(prev => {
        const merged = [...dynamicCourses]
        prev.forEach(p => {
          if (!merged.some(m => m.title.toLowerCase() === p.title.toLowerCase())) {
            merged.push(p)
          }
        })
        return merged
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLearningData()

    const handleUpdate = () => {
      loadLearningData()
    }
    window.addEventListener('workpilot-data-updated', handleUpdate)
    return () => window.removeEventListener('workpilot-data-updated', handleUpdate)
  }, [loadLearningData])

  const required = courses.filter(c => c.category === 'Required' || c.category === 'LEARNING')
  const elective = courses.filter(c => c.category === 'Elective')
  const avgProgress = required.length > 0
    ? Math.round(required.reduce((a, b) => a + b.progress, 0) / required.length)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Learning
          </h1>
          <p className="text-secondary">Track and complete your assigned training & onboarding courses</p>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="card mb-4" style={{
        background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%)',
        borderColor: 'transparent',
      }}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 4 }}>
                Overall Compliance Progress
              </div>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>{avgProgress}%</div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white' }}><Icon name="star" size={28} /></span>
            </div>
          </div>
          <div className="progress-track" style={{ height: 8, background: 'rgba(255,255,255,0.2)' }}>
            <div className="progress-fill" style={{ width: `${avgProgress}%`, background: 'white' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: 8 }}>
            {required.filter(l => l.status === 'completed').length} of {required.length} required courses completed
          </div>
        </div>
      </div>

      {/* Required Training */}
      <h2 className="section-title">Required Training</h2>
      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 20 }}>Loading training data...</p>
      ) : (
        <div className="grid-2 mb-6">
          {required.map(course => {
            const st = STATUS_STYLES[course.status] || STATUS_STYLES['in-progress']
            return (
              <div key={course.id} className="learning-card">
                <div className="learning-card-header">
                  <div>
                    <div className="learning-card-title">{course.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{course.deadline}</div>
                  </div>
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                </div>
                <div className="learning-progress-row">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Progress</span>
                  <span className="learning-pct">{course.progress}%</span>
                </div>
                <ProgressBar pct={course.progress} />
              </div>
            )
          })}
        </div>
      )}

      {/* Elective Courses */}
      <h2 className="section-title">Elective Courses</h2>
      <div className="grid-2">
        {elective.map(course => {
          const st = STATUS_STYLES[course.status] || STATUS_STYLES['not-started']
          return (
            <div key={course.id} className="learning-card">
              <div className="learning-card-header">
                <div>
                  <div className="learning-card-title">{course.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{course.deadline}</div>
                </div>
                <span className={`badge ${st.badge}`}>{st.label}</span>
              </div>
              <div className="learning-progress-row">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Progress</span>
                <span className="learning-pct">{course.progress}%</span>
              </div>
              <ProgressBar pct={course.progress} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
