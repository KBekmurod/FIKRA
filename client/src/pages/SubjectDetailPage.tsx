import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSubject, formatChars, formatBytes } from '../constants/subjects'
import { materialApi, personalTestApi } from '../api/endpoints'
import type { StudyMaterial, PersonalTest } from '../types'
import { useToast } from '../components/Toast'
import './SubjectDetailPage.css'

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const subject = getSubject(subjectId || '')

  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [tests, setTests] = useState<PersonalTest[]>([])
  const [loading, setLoading] = useState(true)
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<{ count: number; totalChars: number } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [confirmGen, setConfirmGen] = useState(false)
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!subject) return
    Promise.all([
      materialApi.list(subject.id),
      personalTestApi.history(subject.id),
    ]).then(([mRes, tRes]) => {
      setMaterials(mRes.data.materials || [])
      setTests(tRes.data.tests || [])
    }).catch(() => {
      toast.error("Ma'lumotlar yuklanmadi")
    }).finally(() => setLoading(false))
  }, [subject?.id])

  // Estimate generation
  const onEstimate = async () => {
    if (materials.length === 0) {
      toast.error("Avval material qo'shing")
      return
    }
    setEstimating(true)
    try {
      // Tanlangan materiallar yoki hammasi
      const ids = selectedMaterialIds.size > 0
        ? Array.from(selectedMaterialIds)
        : materials.map(m => m._id)

      const totalChars = materials
        .filter(m => ids.includes(m._id))
        .reduce((s, m) => s + m.charCount, 0)

      const count = Math.min(20, Math.max(3, Math.floor(totalChars / 500)))
      setEstimate({ count, totalChars })
      setConfirmGen(true)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setEstimating(false)
    }
  }

  // Generate test
  const onGenerate = async () => {
    if (!estimate || !subject) return
    setGenerating(true)
    setConfirmGen(false)
    try {
      const ids = selectedMaterialIds.size > 0
        ? Array.from(selectedMaterialIds)
        : materials.map(m => m._id)

      const { data } = await personalTestApi.generate(subject.id, ids, estimate.count)
      // Test ekraniga otish
      navigate(`/personal-tests/${data.testId}/run`, { state: data })
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || 'AI test yaratishda xatolik')
    } finally {
      setGenerating(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm("Materialni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.")) return
    try {
      await materialApi.delete(id)
      setMaterials(prev => prev.filter(m => m._id !== id))
      toast.success("O'chirildi")
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik")
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedMaterialIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!subject) {
    return (
      <div className="subject-detail-page">
        <div className="error-state">Fan topilmadi</div>
        <button onClick={() => navigate('/subjects')} className="btn-back">← Orqaga</button>
      </div>
    )
  }

  const totalChars = materials.reduce((s, m) => s + m.charCount, 0)
  const completedTests = tests.filter(t => t.status === 'completed')
  const correctTotal = completedTests.reduce((s, t) => s + t.totalCorrect, 0)
  const totalQs = completedTests.reduce((s, t) => s + t.totalQuestions, 0)
  const accuracy = totalQs > 0 ? Math.round((correctTotal / totalQs) * 100) : 0

  return (
    <div className="subject-detail-page">
      <header className="detail-header">
        <button className="btn-back" onClick={() => navigate('/subjects')}>←</button>
        <div className="detail-title">
          <span className="header-icon">{subject.icon}</span>
          <h1>{subject.name}</h1>
        </div>
      </header>

      {/* Statistika */}
      <div className="stats-card">
        <div className="stat-item">
          <div className="stat-label">Materiallar</div>
          <div className="stat-value">{materials.length}</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-label">Jami belgi</div>
          <div className="stat-value">{formatChars(totalChars)}</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-label">Testlar</div>
          <div className="stat-value">{completedTests.length}</div>
        </div>
        {completedTests.length > 0 && (
          <>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-label">Aniqlik</div>
              <div className="stat-value">{accuracy}%</div>
            </div>
          </>
        )}
      </div>

      {/* Tezkor harakatlar */}
      <div className="actions-section">
        <h2>Tezkor harakatlar</h2>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => navigate(`/subjects/${subject.id}/add`)}
          >
            <span className="action-icon">⊕</span>
            <div className="action-text">
              <div className="action-title">Ma'lumot qo'shish</div>
              <div className="action-sub">Matn, rasm yoki fayl</div>
            </div>
          </button>

          <button
            className="action-btn"
            onClick={onEstimate}
            disabled={materials.length === 0 || estimating || generating}
          >
            <span className="action-icon">🤖</span>
            <div className="action-text">
              <div className="action-title">
                {generating ? 'AI ishlamoqda...' : 'AI test yaratish'}
              </div>
              <div className="action-sub">
                {materials.length === 0 ? "Avval material qo'shing" : 'Materiallardan test'}
              </div>
            </div>
          </button>

          <button
            className="action-btn"
            onClick={() => navigate(`/test`)}
          >
            <span className="action-icon">📝</span>
            <div className="action-text">
              <div className="action-title">Standart DTM test</div>
              <div className="action-sub">Fikra savollar bazasidan</div>
            </div>
          </button>
        </div>
      </div>

      {/* Materiallar ro'yxati */}
      <div className="materials-section">
        <h2>
          Materiallarim
          <span className="section-count">{materials.length}</span>
        </h2>
        {selectedMaterialIds.size > 0 && (
          <div className="selection-info">
            {selectedMaterialIds.size} ta tanlandi · AI test uchun
            <button onClick={() => setSelectedMaterialIds(new Set())}>Bekor qilish</button>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">Materiallar yo'q</div>
            <div className="empty-text">Birinchi materialingizni qo'shing 👇</div>
            <button
              className="empty-cta"
              onClick={() => navigate(`/subjects/${subject.id}/add`)}
            >
              ⊕ Material qo'shish
            </button>
          </div>
        ) : (
          <div className="materials-list">
            {materials.map(m => (
              <div key={m._id} className={`material-card ${selectedMaterialIds.has(m._id) ? 'selected' : ''}`}>
                <button
                  className="material-select-btn"
                  onClick={() => toggleSelect(m._id)}
                >
                  {selectedMaterialIds.has(m._id) ? '☑' : '☐'}
                </button>
                <div className="material-source-icon" title={m.source}>
                  {m.source === 'text' && '📝'}
                  {m.source === 'ocr' && '📷'}
                  {m.source === 'file' && '📁'}
                </div>
                <div className="material-info">
                  <div className="material-title">{m.title}</div>
                  <div className="material-meta">
                    <span>{formatChars(m.charCount)} belgi</span>
                    {m.sourceMeta?.pageCount ? <><span className="dot">·</span><span>{m.sourceMeta.pageCount} sahifa</span></> : null}
                    {m.sourceMeta?.fileSizeKb ? <><span className="dot">·</span><span>{formatBytes(m.sourceMeta.fileSizeKb)}</span></> : null}
                  </div>
                </div>
                <div className="material-actions">
                  <button
                    className="material-action-btn"
                    onClick={() => navigate(`/materials/${m._id}/edit`)}
                    title="Tahrirlash"
                  >
                    ✏️
                  </button>
                  <button
                    className="material-action-btn danger"
                    onClick={() => onDelete(m._id)}
                    title="O'chirish"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mening testlarim */}
      {completedTests.length > 0 && (
        <div className="my-tests-section">
          <h2>
            Mening testlarim
            <span className="section-count">{completedTests.length}</span>
          </h2>
          <div className="tests-list">
            {completedTests.slice(0, 5).map(t => (
              <div key={t._id} className="test-history-card">
                <div className="test-icon">
                  {t.testType === 'mini' ? '🎯' : '📊'}
                </div>
                <div className="test-info">
                  <div className="test-title">
                    {t.testType === 'mini' ? 'Mini-test' : 'Material testi'}
                  </div>
                  <div className="test-meta">
                    {t.totalCorrect}/{t.totalQuestions} · {t.scorePercent}%
                    <span className="dot">·</span>
                    <span>{new Date(t.endTime!).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
                <div className={`test-score ${t.scorePercent >= 70 ? 'good' : t.scorePercent >= 50 ? 'mid' : 'low'}`}>
                  {t.scorePercent}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modal: nechta test yaratish */}
      {confirmGen && estimate && (
        <div className="modal-backdrop" onClick={() => setConfirmGen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🤖 AI test yaratamizmi?</h3>
            <p className="modal-text">
              {formatChars(estimate.totalChars)} belgili materialdan{' '}
              <strong>{estimate.count} ta test</strong> savol yarataman.
            </p>
            <p className="modal-hint">
              Bu jarayon 15-30 soniya davom etadi.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmGen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={onGenerate} disabled={generating}>
                {generating ? "Yaratilmoqda..." : "Ha, boshla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading-overlay">Yuklanmoqda...</div>}
      {generating && (
        <div className="loading-overlay">
          <div className="big-spinner" />
          <div>AI testlar yaratmoqda...</div>
        </div>
      )}
    </div>
  )
}
