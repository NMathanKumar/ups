import { useState } from 'react'
import Icon from '../components/Icon'
import SourceCard from '../components/SourceCard'
import { queryAssistant } from '../services/api'
import { mockPolicies } from '../services/mockData'

const USER_ID = 'EMP001'
const CATEGORIES = ['All', 'Leave', 'Benefits', 'WFH', 'Attendance', 'Security', 'General']

export default function Policies({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAskAI = async (queryText) => {
    const q = queryText || search
    if (!q.trim()) return
    setLoading(true)
    setAiResult(null)

    try {
      const result = await queryAssistant(q, USER_ID)
      setAiResult(result)
    } catch (err) {
      setAiResult({
        answer: `Unable to search Knowledge Base: ${err.message}`,
        sources: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const filtered = mockPolicies.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Company Policies
          </h1>
          <p className="text-secondary">Search and explore verified company documents</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleAskAI('What are the company policies?')}
          id="policies-ask-ai-header"
        >
          <Icon name="bot" size={15} />
          Ask AI
        </button>
      </div>

      {/* Search */}
      <div className="search-wrapper mb-4">
        <Icon name="search" size={16} className="search-icon" />
        <input
          id="policies-search"
          className="form-input"
          type="search"
          placeholder="Ask a policy question or search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAskAI(search)}
          aria-label="Search policies"
          style={{ paddingLeft: 36 }}
        />
        <button
          className="btn btn-secondary btn-sm"
          style={{ position: 'absolute', right: 8, top: 6 }}
          onClick={() => handleAskAI(search)}
          disabled={!search.trim() || loading}
        >
          Search RAG
        </button>
      </div>

      {/* AI Result Card */}
      {loading && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
            <span className="typing-dot" />
            Querying Bedrock Knowledge Base...
          </div>
        </div>
      )}

      {aiResult && !loading && (
        <div className="card mb-6" style={{ borderLeft: '3px solid var(--brand-500)', background: 'var(--brand-50)' }}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Icon name="zap" size={16} />
              <span className="card-title">Grounded AI Answer</span>
            </div>
            <span className="badge badge-brand">Grounded</span>
          </div>
          <div className="card-body">
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {aiResult.answer}
            </p>

            {aiResult.sources && aiResult.sources.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Knowledge Base Source:</span>
                <div style={{ marginTop: 6 }}>
                  <SourceCard source={{ fileName: aiResult.sources[0].document, system: aiResult.sources[0].category || 'HR Policy' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }} role="group" aria-label="Filter by category">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            id={`policy-filter-${cat.toLowerCase()}`}
            className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Policy List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Icon name="search" size={32} />
          <p style={{ marginTop: 8 }}>No policies found for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="list" aria-label="Policy documents">
          {filtered.map(policy => (
            <div key={policy.id} className="policy-card" role="listitem">
              <div className="policy-icon" style={{ background: policy.bg }}>
                <span style={{ color: policy.color }}>
                  <Icon name="file" size={20} />
                </span>
              </div>
              <div className="policy-info">
                <div className="policy-name">{policy.name}</div>
                <div className="policy-meta">
                  <span className="badge badge-gray" style={{ marginRight: 6 }}>{policy.category}</span>
                  Updated {policy.updated}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleAskAI(`What is the ${policy.name}?`)}
                  id={`policy-ask-${policy.id}`}
                  aria-label={`Ask AI about ${policy.name}`}
                >
                  <Icon name="bot" size={13} />
                  Ask AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
