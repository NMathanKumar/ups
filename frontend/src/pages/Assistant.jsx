import { useState, useRef, useEffect, useCallback } from 'react'
import ChatMessage from '../components/ChatMessage'
import SourceCard from '../components/SourceCard'
import ActionCard from '../components/ActionCard'
import Toast from '../components/Toast'
import Icon from '../components/Icon'
import { queryAssistant } from '../services/api'

const EXAMPLE_PROMPTS = [
  { key: 'wfh',      text: 'What is the work from home policy?',   icon: 'file' },
  { key: 'leave',    text: 'How many leave days do I have?',       icon: 'calendar' },
  { key: 'training', text: 'What training do I need to complete?', icon: 'book' },
  { key: 'vpn',      text: "My VPN isn't working.",                icon: 'wifi' },
]

const USER_ID = 'EMP001' // Configurable in a real auth implementation

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Assistant({ currentUser }) {
  const [messages, setMessages] = useState([])
  const [extras, setExtras]     = useState([])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [toasts, setToasts]     = useState([])
  const messagesEndRef = useRef(null)

  const empId = currentUser?.employee_id || 'EMP001'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Check for pending search query from Dashboard or other pages
  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('workpilot_pending_prompt')
    if (pendingPrompt) {
      sessionStorage.removeItem('workpilot_pending_prompt')
      sendMessage(pendingPrompt)
    }
  }, [sendMessage])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const sendMessage = useCallback(async (text, confirmed = false, originalPrompt = null) => {
    if (!text.trim()) return
    const queryText = originalPrompt || text
    if (!confirmed) {
      const userMsg = { id: Date.now(), role: 'user', content: queryText, time: getTime() }
      setMessages(prev => [...prev, userMsg])
    }
    setInput('')
    setIsTyping(true)

    try {
      const result = await queryAssistant(queryText, empId, confirmed)
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: result.answer,
        time: getTime(),
        status: result.status,
        requiresConfirmation: result.requiresConfirmation,
        queryText: queryText,
      }
      setMessages(prev => [...prev, aiMsg])

      if (confirmed && result.status === 'COMPLETED') {
        window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
      }

      if (result.sources && result.sources.length > 0) {
        const primarySource = result.sources[0]
        setExtras(prev => [...prev, {
          id: aiMsg.id,
          source: {
            fileName: primarySource.document,
            system:   primarySource.category ?? result.category ?? 'Enterprise KB',
          },
          action: null,
        }])
      }
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: err.message?.includes('VITE_API_BASE_URL')
          ? '⚠️ ' + err.message
          : "I'm having trouble connecting to the knowledge base. Please check your network connection and try again.",
        time: getTime(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }, [empId])

  const handleConfirmAction = (msg) => {
    addToast('✓ Confirmation received. Executing workflow...', 'info')
    sendMessage(msg.queryText, true)
  }

  const handleCancelAction = (msg) => {
    addToast('Action cancelled', 'info')
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'ai',
      content: '❌ Action request was cancelled. No changes were made to DynamoDB.',
      time: getTime(),
    }])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handlePromptClick = (prompt) => {
    sendMessage(prompt.text)
  }

  const handleReminderCreated = (label) => {
    addToast(`✓ Reminder created: "${label.substring(0, 35)}${label.length > 35 ? '...' : ''}"`, 'success')
  }

  const isEmpty = messages.length === 0

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          AI Assistant Workspace
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Real-time company knowledge base grounded by Amazon Bedrock &amp; OpenSearch
        </p>
      </div>

      {/* Chat Layout */}
      <div className="chat-layout">
        {/* Messages Area */}
        <div className="chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
          {isEmpty ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)', boxShadow: '0 8px 24px rgba(255, 153, 0, 0.4)' }}>
                <Icon name="zap" size={32} style={{ color: '#ffffff' }} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>How can I help you today?</h2>
              <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: 28 }}>
                Ask me anything about company policies, HR, learning, IT support, or your onboarding journey.
              </p>
              <div className="example-prompts" role="list" aria-label="Example questions">
                {EXAMPLE_PROMPTS.map(prompt => (
                  <button
                    key={prompt.key}
                    className="example-prompt"
                    onClick={() => handlePromptClick(prompt)}
                    id={`example-prompt-${prompt.key}`}
                    role="listitem"
                    style={{ borderRadius: 12, border: '1px solid #e2e8f0', padding: '12px 16px' }}
                  >
                    <Icon name={prompt.icon} size={15} style={{ color: '#ff9900' }} />
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => {
                const extra = extras.find(e => e.id === msg.id)
                return (
                  <div key={msg.id}>
                    <ChatMessage message={msg} currentUser={currentUser} />
                    {(msg.requiresConfirmation || msg.status === 'CONFIRMATION_REQUIRED') && (
                      <div style={{ marginTop: 12, marginLeft: 44, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirmAction(msg)}
                          disabled={isTyping}
                          id={`confirm-action-btn-${msg.id}`}
                          style={{ background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)', color: '#ffffff', border: 'none', fontWeight: 700 }}
                        >
                          <Icon name="check" size={15} />
                          Confirm &amp; Execute Workflow
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleCancelAction(msg)}
                          disabled={isTyping}
                          id={`cancel-action-btn-${msg.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {extra && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <SourceCard source={extra.source} />
                        {extra.action && (
                          <ActionCard
                            action={extra.action}
                            onReminderCreated={handleReminderCreated}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {isTyping && (
                <div className="message-row ai">
                  <div className="message-avatar ai-avatar" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #232f3e, #131921)', color: '#ff9900', border: '1.5px solid #ff9900' }}>⚡</div>
                  <div className="message-bubble ai-bubble typing-indicator" role="status" aria-label="WorkPilot AI is typing">
                    <span className="typing-dot" style={{ background: '#ff9900' }} />
                    <span className="typing-dot" style={{ background: '#ff9900' }} />
                    <span className="typing-dot" style={{ background: '#ff9900' }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          {!isEmpty && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {EXAMPLE_PROMPTS.slice(0, 2).map(p => (
                <button
                  key={p.key}
                  className="quick-action"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 999, border: '1px solid #e2e8f0' }}
                  onClick={() => handlePromptClick(p)}
                >
                  {p.text}
                </button>
              ))}
            </div>
          )}
          <form className="chat-input-row" onSubmit={handleSubmit} aria-label="Send a message">
            <textarea
              id="chat-input"
              className="chat-input"
              placeholder="Ask anything about your workplace..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Message input"
              disabled={isTyping}
              style={{ borderRadius: 12, border: '1.5px solid #cbd5e1' }}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isTyping}
              id="chat-send-btn"
              aria-label="Send message"
              style={{ background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)', color: '#ffffff', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(255, 153, 0, 0.35)' }}
            >
              <Icon name="send" size={18} />
            </button>
          </form>
          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            WorkPilot AI uses company knowledge base only. Grounded in Amazon Bedrock &amp; DynamoDB.
          </p>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
