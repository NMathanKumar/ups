import Icon from '../components/Icon'

const SETTING_SECTIONS = [
  {
    title: 'Profile',
    items: [
      { label: 'Full Name',    value: 'Alex Morgan',       icon: 'user' },
      { label: 'Role',         value: 'Product Engineer',  icon: 'star' },
      { label: 'Department',   value: 'Product',           icon: 'grid' },
      { label: 'Email',        value: 'alex.morgan@company.com', icon: 'external' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'AI Assistant Language', value: 'English (US)',  icon: 'bot' },
      { label: 'Notifications',          value: 'All enabled',  icon: 'bell' },
      { label: 'Default Region',         value: 'ap-southeast-1', icon: 'server' },
    ],
  },
  {
    title: 'Connected Systems',
    items: [
      { label: 'HR System',              value: 'Connected ✓',     icon: 'users' },
      { label: 'Learning Management',    value: 'Connected ✓',     icon: 'book' },
      { label: 'Onboarding Portal',      value: 'Connected ✓',     icon: 'star' },
      { label: 'IT Support ITSM',        value: 'Connected ✓',     icon: 'monitor' },
    ],
  },
]

export default function Settings() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Settings
        </h1>
        <p className="text-secondary">Manage your preferences and account</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
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
              <div style={{ marginTop: 8 }}>
                <span className="badge badge-brand">Employee ID: EMP-28947</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" id="settings-edit-profile">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Setting Sections */}
      {SETTING_SECTIONS.map(section => (
        <div key={section.title} className="card mb-4">
          <div className="card-header">
            <span className="card-title">{section.title}</span>
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
                  className="btn btn-ghost btn-sm"
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
      <div className="card" style={{ borderColor: 'var(--danger-200)' }}>
        <div className="card-header">
          <span className="card-title" style={{ color: 'var(--danger-600)' }}>Danger Zone</span>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Reset AI History</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Clear all conversation history with WorkPilot AI
              </div>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', border: '1px solid var(--danger-200)' }} id="settings-reset-history">
              Reset History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
