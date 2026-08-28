import Icon from './Icon'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const formattedText = message.content.split('\n').map((line, i) => (
    <span key={i}>{line}{i < message.content.split('\n').length - 1 && <br />}</span>
  ))

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'}`} role="listitem">
      <div className={`message-avatar ${isUser ? 'user-avatar-chat' : 'ai-avatar'}`} aria-hidden="true">
        {isUser ? 'AM' : '⚡'}
      </div>
      <div className="message-bubble-wrap">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {formattedText}
        </div>
        <span className="message-meta">
          {isUser ? 'You' : 'WorkPilot AI'} · {message.time}
        </span>
      </div>
    </div>
  )
}
