import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS, COMPULSORY_IDS, SPEC_IDS, formatChars } from '../constants/subjects'
import { materialApi, personalTestApi } from '../api/endpoints'
import type { SubjectsSummary, PersonalTest } from '../types'
import './SubjectsPage.css'

type Tab = 'majburiy' | 'mutaxassislik'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('majburiy')
  const [summary, setSummary] = useState<SubjectsSummary>({})
  const [testCounts, setTestCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      materialApi.subjectsSummary().catch(() => ({ data: { summary: {} } })),
      personalTestApi.history().catch(() => ({ data: { tests: [], total: 0 } })),
    ]).then(([sumRes, testRes]) => {
      setSummary(sumRes.data.summary || {})
      // Test count per subject
      const counts: Record<string, number> = {}
      ;(testRes.data.tests || []).forEach((t: PersonalTest) => {
        counts[t.subjectId] = (counts[t.subjectId] || 0) + 1
      })
      setTestCounts(counts)
    }).finally(() => setLoading(false))
  }, [])

  const ids = tab === 'majburiy' ? COMPULSORY_IDS : SPEC_IDS

  return (
    <div className="subjects-page">
      <header className="page-header">
        <h1>📚 Fanlar</h1>
        <p className="page-sub">Materiallar yuklang, AI bilan testlar yarating</p>
      </header>

      <div className="tab-switcher">
        <button
          className={`tab-btn ${tab === 'majburiy' ? 'active' : ''}`}
          onClick={() => setTab('majburiy')}
        >
          Majburiy
        </button>
        <button
          className={`tab-btn ${tab === 'mutaxassislik' ? 'active' : ''}`}
          onClick={() => setTab('mutaxassislik')}
        >
          Mutaxassislik
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Yuklanmoqda...</div>
      ) : (
        <div className="subjects-grid">
          {ids.map(id => {
            const subj = SUBJECTS[id]
            const stat = summary[id]
            const tCount = testCounts[id] || 0
            return (
              <button
                key={id}
                className="subject-card"
                onClick={() => navigate(`/subjects/${id}`)}
              >
                <div className="subject-icon">{subj.icon}</div>
                <div className="subject-info">
                  <div className="subject-name">{subj.name}</div>
                  <div className="subject-stats">
                    {stat ? (
                      <>
                        <span>{stat.count} material</span>
                        <span className="dot">·</span>
                        <span>{formatChars(stat.totalChars)} belgi</span>
                        <span className="dot">·</span>
                        <span>{tCount} test</span>
                      </>
                    ) : (
                      <span className="empty-hint">Material yo'q — qo'shing</span>
                    )}
                  </div>
                </div>
                <div className="subject-arrow">›</div>
              </button>
            )
          })}
        </div>
      )}

      <div className="info-banner">
        <span className="info-icon">💡</span>
        <span>Har bir fanga o'z materiallaringizni yuklang. AI ulardan sizga test savollar yaratib beradi.</span>
      </div>
    </div>
  )
}
