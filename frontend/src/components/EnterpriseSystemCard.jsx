import Icon from './Icon'

export default function EnterpriseSystemCard({ system }) {
  return (
    <div className="system-card" role="listitem">
      <div className="system-icon" style={{ background: system.bg }}>
        <span style={{ color: system.color }}>
          <Icon name={system.icon} size={20} />
        </span>
      </div>
      <div className="system-info">
        <div className="system-name">{system.name}</div>
        <div className="system-status-row">
          <span className="status-dot online" aria-hidden="true" />
          <span className="system-status-text">{system.status}</span>
        </div>
      </div>
    </div>
  )
}
