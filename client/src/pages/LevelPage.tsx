import { useEffect, useState } from 'react'
import { levelApi } from '../api/endpoints'
import { GRADE_META } from '../constants/subjects'
import type { UserLevelData, LevelHistoryItem } from '../types'

export default function LevelPage() {
  const [level, setLevel] = useState<UserLevelData | null>(null)
  const [history, setHistory] = useState<LevelHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'now' | 'history'>('now')

  useEffect(() => {
    Promise.all([levelApi.current(), levelApi.history()])
      .then(([curr, hist]) => {
        setLevel(curr.data)
        setHistory(hist.data.history || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !level) {
    return (
      <div className="page" style={{ padding: 20 }}>
        <div className="skel-card" />
      </div>
    )
  }

  const grade = level.currentGrade
  const gradeMeta = GRADE_META[grade]
  const versionInGrade =
    grade === 'beta' ? level.currentVersion :
    grade === 'delta' ? level.currentVersion - 3 :
    level.currentVersion - 7

  const next = level.nextVersionInfo
  const allTotal = level.standardTests.total + level.personalTests.total + level.miniTests.total

  return (
    <>
      <div className="header">
        <div className="header-logo">📊 Daraja</div>
      </div>

      {/* Tab */}
      <div style={{ padding: '4px 20px 0' }}>
        <div className="seg-tabs">
          <button
            className={`seg-tab ${tab === 'now' ? 'active' : ''}`}
            onClick={() => setTab('now')}
          >Joriy oy</button>
          <button
            className={`seg-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >Tarix</button>
        </div>
      </div>

      {tab === 'now' ? (
        <>
          {/* Asosiy daraja kartasi */}
          <div style={{ padding: '12px 20px 0' }}>
            <div style={{
              background: `linear-gradient(135deg, ${gradeMeta.bgColor}, transparent)`,
              border: `1.5px solid ${gradeMeta.color}40`,
              borderRadius: 18,
              padding: 22,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 60,
                fontWeight: 900,
                color: gradeMeta.color,
                lineHeight: 1,
                marginBottom: 8,
                textShadow: `0 0 24px ${gradeMeta.color}50`,
              }}>{gradeMeta.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: gradeMeta.color }}>
                {gradeMeta.name} {versionInGrade}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }}>
                Versiya {level.currentVersion}/10 · Joriy oy
              </div>

              <div style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>
                    {level.accuracyPercent}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>Aniqlik</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>
                    {allTotal}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>Savol ishlangan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyingi daraja */}
          {!next.isMax && (
            <div style={{ padding: '12px 20px 0' }}>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 8 }}>
                  Keyingi daraja: <strong style={{ color: 'var(--txt)' }}>
                    {GRADE_META[next.nextGrade as keyof typeof GRADE_META]?.name} {
                      next.nextGrade === 'beta' ? next.nextVersion :
                      next.nextGrade === 'delta' ? (next.nextVersion as number) - 3 :
                      (next.nextVersion as number) - 7
                    }
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span>Aniqlik kerak</span>
                  <span style={{ fontWeight: 700 }}>
                    {next.currentAccuracy || 0}% / {next.requiredAccuracy || 0}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--s2)', borderRadius: 100, marginBottom: 12 }}>
                  <div style={{
                    height: '100%',
                    background: next.isReady ? 'var(--g)' : 'var(--acc)',
                    width: `${Math.min(100, ((next.currentAccuracy || 0) / (next.requiredAccuracy || 1)) * 100)}%`,
                    borderRadius: 100,
                    transition: 'width 0.3s',
                  }} />
                </div>

                {(next.questionsNeeded || 0) > 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--y)' }}>
                    ⏳ Yana <strong>{next.questionsNeeded}</strong> ta savol ishlash kerak
                  </div>
                ) : next.isReady ? (
                  <div style={{ fontSize: 11, color: 'var(--g)', fontWeight: 700 }}>
                    ✓ Keyingi testda yangi darajaga o'tish ehtimoli yuqori!
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>
                    Aniqligingizni oshirib ko'ring
                  </div>
                )}

                {next.testSource === 'mini' && (
                  <div style={{
                    marginTop: 10, padding: 10,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: 10,
                    fontSize: 11, color: 'var(--txt-2)',
                  }}>
                    ⚠️ Alfa darajaga o'tish uchun <strong>mini-testlar</strong> kerak.
                    Xatolar tahlilidan ularni yarating.
                  </div>
                )}
              </div>
            </div>
          )}

          {next.isMax && (
            <div style={{ padding: '12px 20px 0' }}>
              <div className="card" style={{ textAlign: 'center', padding: 22 }}>
                <div style={{ fontSize: 40 }}>🏆</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--y)', marginTop: 8 }}>
                  Maksimal daraja!
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }}>
                  Siz ALFA 3 darajasiga yetdingiz
                </div>
              </div>
            </div>
          )}

          {/* Test natijalari */}
          <div className="section-title">Test natijalari (joriy oy)</div>
          <div style={{ padding: '0 20px', display: 'grid', gap: 8 }}>
            <ResultRow
              icon="📝"
              label="Fikra standart testlar"
              correct={level.standardTests.correct}
              total={level.standardTests.total}
            />
            <ResultRow
              icon="📚"
              label="Shaxsiy testlar"
              correct={level.personalTests.correct}
              total={level.personalTests.total}
            />
            <ResultRow
              icon="🎯"
              label="Mini-testlar (xatolardan)"
              correct={level.miniTests.correct}
              total={level.miniTests.total}
            />
          </div>

          {/* Eslatma */}
          <div style={{ padding: '14px 20px 24px' }}>
            <div style={{
              padding: 12,
              background: 'rgba(123,104,238,0.08)',
              border: '1px solid rgba(123,104,238,0.18)',
              borderRadius: 12,
              fontSize: 11,
              color: 'var(--txt-2)',
              lineHeight: 1.5,
            }}>
              💡 Daraja <strong>har oy boshida</strong> avtomatik nolga tushadi.
              O'tgan oylar tarixda saqlanib qoladi — bu sizni har oy yangidan harakat qilishga undaydi.
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '12px 20px 24px' }}>
          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 36 }}>📅</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>Tarix bo'sh</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }}>
                Birinchi oyingizni yakunlang
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {history.map((h, i) => {
                const hMeta = GRADE_META[h.grade]
                const vInG =
                  h.grade === 'beta' ? h.maxVersion :
                  h.grade === 'delta' ? h.maxVersion - 3 :
                  h.maxVersion - 7
                const total = h.standardTests.total + h.personalTests.total + h.miniTests.total
                const correct = h.standardTests.correct + h.personalTests.correct + h.miniTests.correct
                const acc = total > 0 ? Math.round((correct / total) * 100) : 0
                return (
                  <div key={i} className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 48, height: 48,
                      background: hMeta.bgColor,
                      border: `1px solid ${hMeta.color}40`,
                      borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 18, color: hMeta.color,
                    }}>{hMeta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {h.monthKey} · {hMeta.name} {vInG}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                        {total} savol · {acc}% aniqlik
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function ResultRow({ icon, label, correct, total }: { icon: string; label: string; correct: number; total: number }) {
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
          {total > 0 ? `${correct}/${total} to'g'ri (${acc}%)` : "Hozircha yo'q"}
        </div>
      </div>
    </div>
  )
}
