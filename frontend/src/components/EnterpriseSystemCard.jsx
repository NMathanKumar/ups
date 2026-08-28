import Icon from './Icon'

export default function EnterpriseSystemCard({ system, name, status, icon, bg, color }) {
  const item = system || { name, status, icon, bg, color }

  return (
    <div className="system-card" role="listitem" style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
    }}>
      <div className="system-icon" style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: item.bg || '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: item.color || '#4f46e5', display: 'flex', alignItems: 'center' }}>
          <Icon name={item.icon || 'check'} size={20} />
        </span>
      </div>
      <div className="system-info" style={{ flex: 1, minWidth: 0 }}>
        <div className="system-name" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
        <div className="system-status-row" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span className="status-dot online" aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span className="system-status-text" style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>{item.status}</span>
        </div>
      </div>
    </div>
  )
}
