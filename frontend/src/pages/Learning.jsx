import Icon from '../components/Icon'
import { mockLearning } from '../services/mockData'

const STATUS_STYLES = {
  'completed':   { badge: 'badge-success', label: 'Completed' },
  'in-progress': { badge: 'badge-warning', label: 'In Progress' },
  'not-started': { badge: 'badge-gray',    label: 'Not Started' },
}

function ProgressBar({ pct }) {
  const cls = pct === 100 ? 'success' : pct < 50 ? 'warning' : ''
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Learning() {
  const required = mockLearning.filter(l => l.category === 'Required')
  const elective = mockLearning.filter(l => l.category === 'Elective')
  const avgProgress = Math.round(required.reduce((a, b) => a + b.progress, 0) / required.length)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Learning
          </h1>
          <p className="text-secondary">Track and complete your training courses</p>
        </div>
        <button className="btn btn-primary" id="learning-browse-btn">
          <Icon name="book" size={15} />
          Browse Courses
        </button>
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
      <div className="grid-2 mb-6">
        {required.map(course => {
          const st = STATUS_STYLES[course.status]
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
              {course.status !== 'completed' && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12, width: '100%' }}
                  id={`course-start-${course.id}`}
                >
                  {course.progress > 0 ? 'Continue Course' : 'Start Course'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Elective Courses */}
      <h2 className="section-title">Elective Courses</h2>
      <div className="grid-2">
        {elective.map(course => {
          const st = STATUS_STYLES[course.status]
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
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12, width: '100%' }}
                id={`course-explore-${course.id}`}
              >
                {course.progress > 0 ? 'Continue' : 'Explore'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
