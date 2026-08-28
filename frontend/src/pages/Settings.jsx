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

export default function Settings({ currentUser }) {
  const userName = currentUser?.name || 'Priya Sharma'
  const userRole = currentUser?.designation || currentUser?.title || 'Senior Product Manager'
  const userDept = currentUser?.department || 'Product & Enterprise'
  const empId = currentUser?.employee_id || 'EMP001'
  const userEmail = currentUser?.email || 'priya.sharma@apex-enterprise.com'
  const userPhone = currentUser?.phone_number || '+1 555-0192'
  const userGender = currentUser?.gender || 'Female'

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const SETTING_SECTIONS = [
    {
      title: 'Profile Information',
      items: [
        { label: 'Full Name',    value: userName,    icon: 'user' },
        { label: 'Role / Title', value: userRole,    icon: 'star' },
        { label: 'Department',   value: userDept,    icon: 'grid' },
        { label: 'Work Email',   value: userEmail,   icon: 'mail' },
        { label: 'Phone Number', value: userPhone,   icon: 'help' },
        { label: 'Gender',       value: userGender,  icon: 'user' },
        { label: 'Employee ID',  value: empId,       icon: 'external' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'AI Assistant Language', value: 'English (US)',  icon: 'bot' },
        { label: 'Notifications',          value: 'All enabled',  icon: 'bell' },
        { label: 'Default AWS Region',     value: 'us-east-1 (N. Virginia)', icon: 'server' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            System Settings &amp; Architecture
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Manage logged in account profile, AWS microservices connection, and AI options
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
      <div className="card shadow-sm p-5 mb-6" style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div className="card-body">
          <div className="flex items-center gap-5 flex-wrap">
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 6px 16px rgba(255, 153, 0, 0.35)',
              border: '3px solid #ffffff'
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {userName}
              </div>
              <div style={{ color: '#475569', fontSize: '0.9375rem', fontWeight: 500, marginTop: 2 }}>
                {userRole} · {userDept}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge text-xs" style={{ background: '#232f3e', color: '#ffffff', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>
                  User ID: {empId}
                </span>
                <span className="badge text-xs" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>
                  AWS Cognito Authenticated
                </span>
                <span className="badge text-xs" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>
                  Access Level: Full
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Microservices System Health Section */}
      <div className="card shadow-sm p-5 mb-6" style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>AWS Microservices Architecture &amp; System Health</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              Independent serverless microservices connected via Amazon API Gateway &amp; AWS Cognito
            </p>
          </div>
          <span className="badge text-xs" style={{ background: '#232f3e', color: '#ff9900', padding: '4px 12px', borderRadius: 999, fontWeight: 700 }}>
            5 Lambdas Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MICROSERVICES.map(ms => (
            <div key={ms.name} className="p-3.5 rounded-xl flex items-center justify-between" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{ms.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ms.type} • {ms.endpoint}</div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ms.latency}</span>
                <span className="badge badge-success text-xs font-semibold">{ms.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setting Sections */}
      {SETTING_SECTIONS.map(section => (
        <div key={section.title} className="card shadow-sm mb-6" style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
          <div className="card-header p-4 border-b border-gray-100" style={{ background: '#f8fafc' }}>
            <span className="card-title" style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{section.title}</span>
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
                  borderBottom: idx < section.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#232f3e' }}>
                    <Icon name={item.icon} size={16} />
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: 1, fontWeight: 500 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    {item.value}
                  </div>
                </div>
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
