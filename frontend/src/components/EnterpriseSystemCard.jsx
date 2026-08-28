import Icon from './Icon'

export default function EnterpriseSystemCard({ system, name, status, icon, bg, color }) {
  const item = system || { name, status, icon, bg, color }

  return (
    <div className="system-card" role="listitem">
      <div className="system-icon" style={{ background: item.bg || 'var(--gray-100)' }}>
        <span style={{ color: item.color || 'var(--gray-600)' }}>
          <Icon name={item.icon || 'check'} size={20} />
        </span>
      </div>
      <div className="system-info">
        <div className="system-name">{item.name}</div>
        <div className="system-status-row">
          <span className="status-dot online" aria-hidden="true" />
          <span className="system-status-text">{item.status}</span>
        </div>
      </div>
    </div>
  )
}
