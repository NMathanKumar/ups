import { useState } from 'react'
import Icon from '../components/Icon'
import { mockPolicies } from '../services/mockData'

const CATEGORIES = ['All', 'Leave', 'Benefits', 'WFH', 'Attendance', 'Security', 'General']

export default function Policies({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

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
          <p className="text-secondary">Search and explore company documents</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('assistant')}
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
          placeholder="Search policies, documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search policies"
          style={{ paddingLeft: 36 }}
        />
      </div>

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
                  onClick={() => onNavigate('assistant')}
                  id={`policy-ask-${policy.id}`}
                  aria-label={`Ask AI about ${policy.name}`}
                >
                  <Icon name="bot" size={13} />
                  Ask AI
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  id={`policy-view-${policy.id}`}
                  aria-label={`View ${policy.name}`}
                >
                  <Icon name="external" size={13} />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="card mt-4" style={{ padding: 14, background: 'var(--brand-50)', borderColor: 'var(--brand-100)' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--brand-500)' }}><Icon name="zap" size={15} /></span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--brand-700)', fontWeight: 500 }}>
            WorkPilot AI can answer specific questions about any of these policies. Click &ldquo;Ask AI&rdquo; next to any document.
          </span>
        </div>
      </div>
    </div>
  )
}
