import Icon from '../components/Icon'

const SETTING_SECTIONS = [
  {
    title: 'Profile',
    items: [
      { label: 'Full Name',    value: 'Alex Morgan',       icon: 'user' },
      { label: 'Role',         value: 'Product Engineer',  icon: 'star' },
      { label: 'Department',   value: 'Product',           icon: 'grid' },
      { label: 'Employee ID',  value: 'EMP001',            icon: 'external' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'AI Assistant Language', value: 'English (US)',  icon: 'bot' },
      { label: 'Notifications',          value: 'All enabled',  icon: 'bell' },
      { label: 'Default Region',         value: 'us-east-1 (N. Virginia)', icon: 'server' },
    ],
  },
]

const MICROSERVICES = [
  { name: 'Agent & RAG Microservice', type: 'AWS Lambda (Node.js 20)', endpoint: '/api/chat', status: 'Operational', latency: '42ms' },
  { name: 'Tasks & Reminders Microservice', type: 'AWS Lambda (Node.js 20)', endpoint: '/api/tasks', status: 'Operational', latency: '18ms' },
  { name: 'HR & Employee Microservice', type: 'AWS Lambda (Node.js 20)', endpoint: '/api/leave', status: 'Operational', latency: '14ms' },
  { name: 'IT Support & Assets Microservice', type: 'AWS Lambda (Node.js 20)', endpoint: '/api/it-assets', status: 'Operational', latency: '16ms' },
  { name: 'Onboarding Microservice', type: 'AWS Lambda (Node.js 20)', endpoint: '/api/onboarding', status: 'Operational', latency: '21ms' },
  { name: 'Bedrock Knowledge Base', type: 'OpenSearch Serverless Vector', endpoint: 'AOSS Vector Index', status: 'Healthy', latency: '110ms' },
]

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            System Settings & Architecture
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Manage account preferences, microservices connection, and AI options
          </p>
        </div>
        <span className="badge badge-success flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            display: 'inline-block',
            boxShadow: '0 0 10px #22c55e'
          }} />
          All Microservices Operational
        </span>
      </div>

      {/* Profile Card */}
      <div className="card shadow-sm p-4" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}>
              AM
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Alex Morgan
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Product Engineer · Product Department
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-brand text-xs">User ID: EMP001</span>
                <span className="badge badge-gray text-xs">Access Level: Full</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm text-xs px-3" id="settings-edit-profile">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Microservices System Health Section */}
      <div className="card shadow-sm p-5" style={{ borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title" style={{ fontSize: '1rem', fontWeight: 700 }}>AWS Microservices Architecture & System Health</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Independent serverless microservices connected via Amazon API Gateway
            </p>
          </div>
          <span className="badge badge-brand text-xs">5 Lambdas Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MICROSERVICES.map(ms => (
            <div key={ms.name} className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between" style={{ background: 'var(--gray-50)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{ms.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ms.type} • Endpoint: {ms.endpoint}</div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ms.latency}</span>
                <span className="badge badge-success text-xs font-semibold">{ms.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setting Sections */}
      {SETTING_SECTIONS.map(section => (
        <div key={section.title} className="card shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-header p-4 border-b border-gray-100">
            <span className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{section.title}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {section.items.map((item, idx) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: idx < section.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <Icon name={item.icon} size={16} />
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 1 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {item.value}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-xs"
                  id={`settings-edit-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  aria-label={`Edit ${item.label}`}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Danger Zone */}
      <div className="card shadow-sm p-4" style={{ borderRadius: 16, borderColor: 'var(--danger-200)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--danger-600)' }}>Reset AI Assistant Local Cache</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Clear local cached conversation states and reset page navigation overrides
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="btn btn-sm text-xs px-3"
            style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', border: '1px solid var(--danger-200)' }}
            id="settings-reset-history"
          >
            Clear Cache & Reload
          </button>
        </div>
      </div>
    </div>
  )
}
