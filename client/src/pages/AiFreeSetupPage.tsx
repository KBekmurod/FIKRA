import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { folderApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import { SUBJECTS, COMPULSORY_IDS, SPEC_BY_CATEGORY, type SubjectId, type Context } from '../constants/subjects'

interface Folder {
  _id: string
  title: string
  context: Context
  materialId?: { charCount: number; title: string }
}

interface SelectedSubject {
  id: SubjectId
  context: Context
  folderIds: string[]
  count: number
}

export default function AiFreeSetupPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/testlar/ai')
  const toast = useToast()

  const [selected, setSelected] = useState<SelectedSubject[]>([])
  const [foldersBySubj, setFoldersBySubj] = useState<Record<string, Folder[]>>({})
  const [starting, setStarting] = useState(false)

  // Fan qo'shish
  const addSubject = async (id: SubjectId) => {
    if (selected.length >= 5) {
      toast.error("Maksimum 5 ta fan")
      return
    }
    if (selected.some(s => s.id === id)) {
      toast.info("Bu fan allaqachon tanlangan")
      return
    }
    const context: Context = COMPULSORY_IDS.includes(id) ? 'majburiy' : 'mutaxassislik'
    setSelected(prev => [...prev, { id, context, folderIds: [], count: context === 'majburiy' ? 10 : 20 }])

    // Papkalarni yuklash
    if (!foldersBySubj[id]) {
      try {
        const { data } = await folderApi.bySubject(id, context)
        setFoldersBySubj(prev => ({ ...prev, [id]: data.folders }))
      } catch {}
    }
  }

  const removeSubject = (id: SubjectId) => {
    setSelected(prev => prev.filter(s => s.id !== id))
  }

  const toggleFolder = (subjId: SubjectId, folderId: string) => {
    setSelected(prev => prev.map(s => {
      if (s.id !== subjId) return s
      const has = s.folderIds.includes(folderId)
      return { ...s, folderIds: has ? s.folderIds.filter(id => id !== folderId) : [...s.folderIds, folderId] }
    }))
  }

  const updateCount = (id: SubjectId, count: number) => {
    setSelected(prev => prev.map(s => s.id === id ? { ...s, count } : s))
  }

  const totalQuestions = selected.reduce((a, s) => a + s.count, 0)
  const isReady = selected.length >= 2 && selected.every(s => s.folderIds.length > 0)

  const startTest = async () => {
    if (!isReady) {
      toast.error("Kamida 2 ta fan va har biri uchun papka tanlash kerak")
      return
    }
    setStarting(true)
    try {
      const { data } = await api.post('/api/personal-tests/ai-free', {
        subjects: selected.map(s => ({
          id: s.id,
          folderIds: s.folderIds,
          count: s.count,
        })),
      })

      navigate(`/personal-tests/${data.testId}/run`, {
        state: {
          testId: data.testId,
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          totalQuestions: data.totalQuestions,
          durationSeconds: data.durationSeconds,
          questions: data.questions,
        },
      })
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Test yaratishda xato")
      setStarting(false)
    }
  }

  // Tanlash uchun barcha fanlar
  const availableSubjects: SubjectId[] = [
    ...COMPULSORY_IDS,
    ...SPEC_BY_CATEGORY.aniq_tabiiy,
    ...SPEC_BY_CATEGORY.gumanitar,
    ...SPEC_BY_CATEGORY.chet_tili,
    ...SPEC_BY_CATEGORY.boshqa,
  ]

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>🎯 AI erkin tanlov</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }}>
          2-5 ta fan tanlang, har biri uchun papkalar va savol sonini belgilang
        </p>

        {/* Tanlangan fanlar */}
        {selected.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }}>
              ✓ TANLANGAN ({selected.length}/5) · Jami: {totalQuestions} savol
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {selected.map(s => {
                const subj = SUBJECTS[s.id]
                const list = foldersBySubj[s.id] || []
                return (
                  <div key={s.id} style={{
                    background: 'var(--s1)',
                    border: `1px solid ${s.folderIds.length > 0 ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.25)'}`,
                    borderRadius: 12, padding: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{subj?.icon}</span>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>
                        {subj?.name}
                        <span style={{ fontSize: 10, color: 'var(--txt-3)', marginLeft: 6 }}>· {s.context}</span>
                      </div>
                      <button
                        onClick={() => removeSubject(s.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--r)', fontSize: 18, cursor: 'pointer',
                          padding: '0 4px',
                        }}
                      >×</button>
                    </div>

                    {/* Savol soni slider */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }}>SAVOL SONI</label>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--acc-l)' }}>{s.count}</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        step={5}
                        value={s.count}
                        onChange={e => updateCount(s.id, parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--acc)' }}
                      />
                    </div>

                    {/* Papkalar */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        PAPKALAR {s.folderIds.length > 0 && <span style={{ color: 'var(--g)' }}>({s.folderIds.length} ta)</span>}
                      </label>
                      {list.length === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--r)', fontStyle: 'italic', padding: '4px 0' }}>
                          Papka yo'q — Omborga material yuklang
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: 4 }}>
                          {list.map(f => {
                            const isSel = s.folderIds.includes(f._id)
                            return (
                              <button
                                key={f._id}
                                onClick={() => toggleFolder(s.id, f._id)}
                                style={{
                                  background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                                  border: `1px solid ${isSel ? 'var(--g)' : 'var(--f)'}`,
                                  borderRadius: 8, padding: '6px 10px',
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer', color: 'var(--txt)',
                                  fontSize: 11, textAlign: 'left',
                                }}
                              >
                                <span style={{
                                  width: 14, height: 14, borderRadius: 4,
                                  background: isSel ? 'var(--g)' : 'transparent',
                                  border: `1.5px solid ${isSel ? 'var(--g)' : 'var(--txt-3)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {isSel && <span style={{ color: '#0a0a14', fontSize: 10, fontWeight: 800 }}>✓</span>}
                                </span>
                                <span style={{ flex: 1 }}>{f.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Fan qo'shish */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
          ➕ FAN QO'SHISH
        </div>
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
        }}>
          {availableSubjects.map(id => {
            const subj = SUBJECTS[id]
            const isSelected = selected.some(s => s.id === id)
            return (
              <button
                key={id}
                onClick={() => !isSelected && addSubject(id)}
                disabled={isSelected || selected.length >= 5}
                style={{
                  padding: '6px 10px',
                  fontSize: 11, fontWeight: 600,
                  background: isSelected ? 'rgba(0,212,170,0.1)' : 'var(--s1)',
                  border: `1px solid ${isSelected ? 'var(--g)' : 'var(--f)'}`,
                  borderRadius: 100,
                  color: isSelected ? 'var(--g)' : 'var(--txt-2)',
                  cursor: isSelected || selected.length >= 5 ? 'default' : 'pointer',
                  opacity: isSelected || selected.length >= 5 ? 0.6 : 1,
                }}
              >
                {subj?.icon} {subj?.name}
              </button>
            )
          })}
        </div>

        {/* Boshlash tugmasi */}
        <button
          onClick={startTest}
          disabled={!isReady || starting}
          style={{
            width: '100%',
            background: isReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
            color: isReady ? 'white' : 'var(--txt-3)',
            border: 'none', borderRadius: 14,
            padding: '15px 18px',
            fontSize: 14, fontWeight: 800,
            cursor: isReady && !starting ? 'pointer' : 'default',
            opacity: starting ? 0.6 : 1,
          }}
        >
          {starting ? '⏳ Yaratilmoqda...' :
            isReady ? `🚀 ${totalQuestions} ta savolli testni boshlash` :
            'Kamida 2 ta fan tanlang'}
        </button>

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}
