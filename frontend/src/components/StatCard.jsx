import Icon from './Icon'

export default function StatCard({ label, value, subtext, color, bgColor, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: bgColor }}>
          <span style={{ color }}>
            <Icon name={icon} size={18} />
          </span>
        </div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-subtext">{subtext}</div>
      </div>
    </div>
  )
}
