import { useState } from 'react'
import Icon from './Icon'

export default function ActionCard({ action, onReminderCreated }) {
  const [confirmed, setConfirmed] = useState(false)

  const handleAction = () => {
    setConfirmed(true)
    if (onReminderCreated) onReminderCreated(action.label)
  }

  return (
    <div className="action-card" role="complementary" aria-label="Recommended action">
      <div className="action-card-label">
        <Icon name="zap" size={12} />
        Recommended Next Step
      </div>
      <div className="action-card-text">{action.label}</div>
      {confirmed ? (
        <div className="action-card-confirmed">
          <Icon name="check" size={14} />
          Reminder created — &ldquo;{action.label.substring(0, 40)}{action.label.length > 40 ? '...' : ''}&rdquo;
        </div>
      ) : (
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAction}
          id="action-card-btn"
        >
          <Icon name="bell" size={14} />
          {action.button}
        </button>
      )}
    </div>
  )
}
