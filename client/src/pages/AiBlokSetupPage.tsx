import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { folderApi, streamJsonFetch } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import { SUBJECTS, type SubjectId } from '../constants/subjects'

// Frontend yo'nalishlar — backend bilan moslashtirilgan
const DIRECTIONS = [
  { id: 'engineering',    name: 'Muhandislik · Texnologiya', icon: '⚙️', spec: ['math', 'fizika'] as SubjectId[] },
  { id: 'medicine',       name: "Tibbiyot · Q-xo'jaligi",    icon: '🏥', spec: ['bio', 'kimyo'] as SubjectId[] },
  { id: 'international',  name: 'Xalqaro · Turizm',           icon: '🌍', spec: ['tarix', 'ingliz'] as SubjectId[] },
  { id: 'philology',      name: 'Filologiya',                  icon: '📖', spec: ['adab', 'ingliz'] as SubjectId[] },
  { id: 'economy',        name: 'Iqtisod · IT',                icon: '💰', spec: ['math', 'ingliz'] as SubjectId[] },
  { id: 'geodesy',        name: 'Geodeziya · Kadastr',         icon: '🗺',  spec: ['tarix', 'geo'] as SubjectId[] },
  { id: 'law',            name: "Huquq · Davlat boshqaruvi",   icon: '⚖',  spec: ['huquq', 'tarix'] as SubjectId[] },
  { id: 'german_studies', name: 'Nemis tili va madaniyati',    icon: '🇩🇪', spec: ['nemis', 'adab'] as SubjectId[] },
  { id: 'french_studies', name: 'Fransuz tili va madaniyati',  icon: '🇫🇷', spec: ['fransuz', 'adab'] as SubjectId[] },
  { id: 'arabic_studies', name: 'Arab tili va sharqshunoslik', icon: '🕌',  spec: ['arab', 'tarix'] as SubjectId[] },
]

const COMPULSORY: SubjectId[] = ['uztil', 'math', 'tarix']

interface Folder {
  _id: string
  title: string
  subjectId: string
  context: string
  materialId?: { charCount: number; title: string }
}

export default function AiBlokSetupPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/testlar/ai')
  const toast = useToast()

  const [selectedDir, setSelectedDir] = useState<string | null>(null)
  const [folders, setFolders] = useState<Record<string, Folder[]>>({})
  const [selectedFolders, setSelectedFolders] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)

  const dir = DIRECTIONS.find(d => d.id === selectedDir)
  const allSubjects: SubjectId[] = dir ? [...COMPULSORY, ...dir.spec] : []

  // Yo'nalish tanlanganda har fan uchun papkalarni yuklash
  useEffect(() => {
    if (!dir) return
    setLoading(true)
    const subjectsToLoad = [...COMPULSORY, ...dir.spec]

    Promise.all(subjectsToLoad.map(async (sid) => {
      try {
        // Majburiy fanlar uchun context=majburiy, mutaxassislik uchun context=mutaxassislik
        const context = COMPULSORY.includes(sid) ? 'majburiy' : 'mutaxassislik'
        // math/tarix dual-context — agar dir.spec'da bo'lsa mutaxassislik
        const isInSpec = dir.spec.includes(sid)
        const finalContext = isInSpec ? 'mutaxassislik' : 'majburiy'

        const { data } = await folderApi.bySubject(sid, finalContext)
        return [sid, data.folders] as const
      } catch {
        return [sid, [] as Folder[]] as const
      }
    })).then(results => {
      const map: Record<string, Folder[]> = {}
      results.forEach(([sid, list]) => { map[sid] = list })
      setFolders(map)
      setLoading(false)
    })
  }, [selectedDir])

  const toggleFolder = (subjectId: string, folderId: string) => {
    setSelectedFolders(prev => {
      const curr = prev[subjectId] || []
      const next = curr.includes(folderId)
        ? curr.filter(id => id !== folderId)
        : [...curr, folderId]
      return { ...prev, [subjectId]: next }
    })
  }

  const allReady = dir && allSubjects.every(sid =>
    (selectedFolders[sid] || []).length > 0
  )

  const startTest = async () => {
    if (!dir || !allReady) {
      toast.error("Barcha fanlar uchun papka tanlash kerak")
      return
    }
    setStarting(true)
    try {
      const subjectsPayload: Record<string, { folderIds: string[] }> = {}
      allSubjects.forEach(sid => {
        subjectsPayload[sid] = { folderIds: selectedFolders[sid] || [] }
      })

      const { data } = await streamJsonFetch<any>('/api/personal-tests/ai-blok', {
        direction: dir.id,
        subjects: subjectsPayload,
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

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>📦 AI maxsus blok</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        {/* 1. Yo'nalish tanlash */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
          1. YO'NALISH TANLANG
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
          {DIRECTIONS.map(d => (
            <button
              key={d.id}
              onClick={() => { setSelectedDir(d.id); setSelectedFolders({}) }}
              style={{
                background: selectedDir === d.id ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                border: `1.5px solid ${selectedDir === d.id ? 'var(--acc)' : 'var(--f)'}`,
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', color: 'var(--txt)', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }}>
                  Spec: {d.spec.map(s => SUBJECTS[s]?.name).join(' + ')}
                </div>
              </div>
              {selectedDir === d.id && <span style={{ color: 'var(--acc-l)' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* 2. Papkalar tanlash */}
        {dir && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              2. HAR FAN UCHUN PAPKA TANLANG
            </div>

            {loading ? (
              <div className="skel-card" />
            ) : (
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {allSubjects.map(sid => {
                  const subj = SUBJECTS[sid]
                  const list = folders[sid] || []
                  const isCompulsory = COMPULSORY.includes(sid)
                  const count = isCompulsory ? 10 : 30
                  const selected = selectedFolders[sid] || []

                  return (
                    <div key={sid} style={{
                      background: 'var(--s1)',
                      border: `1px solid ${selected.length > 0 ? 'rgba(0,212,170,0.3)' : 'var(--f)'}`,
                      borderRadius: 12, padding: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{subj?.icon}</span>
                        <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>
                          {subj?.name}
                          <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 500, marginLeft: 6 }}>
                            · {count} savol · {isCompulsory ? 'majburiy' : 'mutaxassislik'}
                          </span>
                        </div>
                        {selected.length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--g)', fontWeight: 700 }}>
                            {selected.length} ta tanlandi
                          </span>
                        )}
                      </div>

                      {list.length === 0 ? (
                        <div style={{
                          fontSize: 11, color: 'var(--r)',
                          padding: '8px 0', fontStyle: 'italic',
                        }}>
                          ⚠️ Papka yo'q — Omborga material yuklang
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: 4 }}>
                          {list.map(f => {
                            const isSel = selected.includes(f._id)
                            return (
                              <button
                                key={f._id}
                                onClick={() => toggleFolder(sid, f._id)}
                                style={{
                                  background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                                  border: `1px solid ${isSel ? 'var(--g)' : 'var(--f)'}`,
                                  borderRadius: 8, padding: '7px 10px',
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer', color: 'var(--txt)',
                                  fontSize: 11, textAlign: 'left',
                                }}
                              >
                                <span style={{
                                  width: 16, height: 16, borderRadius: 4,
                                  background: isSel ? 'var(--g)' : 'transparent',
                                  border: `1.5px solid ${isSel ? 'var(--g)' : 'var(--txt-3)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {isSel && <span style={{ color: '#0a0a14', fontSize: 11, fontWeight: 800 }}>✓</span>}
                                </span>
                                <span style={{ flex: 1 }}>{f.title}</span>
                                {f.materialId && (
                                  <span style={{ color: 'var(--txt-3)', fontSize: 9 }}>
                                    {f.materialId.charCount.toLocaleString()} b.
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Boshlash tugmasi */}
            <button
              onClick={startTest}
              disabled={!allReady || starting}
              style={{
                width: '100%',
                background: allReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
                color: allReady ? 'white' : 'var(--txt-3)',
                border: 'none', borderRadius: 14,
                padding: '15px 18px',
                fontSize: 14, fontWeight: 800,
                cursor: allReady && !starting ? 'pointer' : 'default',
                opacity: starting ? 0.6 : 1,
              }}
            >
              {starting ? '⏳ Yaratilmoqda... (30-90 sek)' : '🚀 90 ta savolli blok testni boshlash'}
            </button>
          </>
        )}

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}
