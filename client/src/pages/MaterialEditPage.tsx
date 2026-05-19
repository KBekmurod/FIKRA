import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'

export default function MaterialEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folderId') || ''
  const goBack = useGoBack(folderId ? `/ombor/folder/${folderId}` : '/ombor')
  const toast = useToast()

  const [material, setMaterial] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hasTest, setHasTest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAppendMode, setShowAppendMode] = useState(false)
  const [appendText, setAppendText] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/api/materials/${id}`)
      .then(({ data }: any) => {
        const m = data.material || data
        setMaterial(m)
        setTitle(m.title)
        setContent(m.content)
        setHasTest(!!m.hasGeneratedTest)
      })
      .catch(() => toast.error("Material yuklanmadi"))
      .finally(() => setLoading(false))
  }, [id])

  const save = async () => {
    if (!id) return
    if (!title.trim()) { toast.error("Sarlavha kerak"); return }
    if (content.length < 500) { toast.error("Matn kamida 500 belgi"); return }
    if (content.length > 30000) { toast.error("Matn maksimum 30,000 belgi"); return }

    setSaving(true)
    try {
      await api.put(`/api/materials/${id}`, { title, content })
      toast.success("Material yangilandi!")
      navigate(folderId ? `/ombor/folder/${folderId}` : '/ombor')
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Saqlashda xato")
    } finally {
      setSaving(false)
    }
  }

  const appendAndSave = async () => {
    if (!appendText.trim()) {
      toast.error("Qo'shimcha matn kerak")
      return
    }
    const newContent = content + '\n\n' + appendText.trim()
    if (newContent.length > 30000) {
      toast.error(`Birga qo'shganda 30,000 belgidan oshib ketadi (jami ${newContent.length})`)
      return
    }

    setSaving(true)
    try {
      await api.put(`/api/materials/${id}`, { title, content: newContent })
      toast.success("Qo'shildi va saqlandi!")
      navigate(folderId ? `/ombor/folder/${folderId}` : '/ombor')
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Saqlashda xato")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }} /></div>
  }

  if (!material) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Material topilmadi</p>
        <button onClick={goBack} className="btn btn-primary" style={{ marginTop: 16 }}>Qaytish</button>
      </div>
    )
  }

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>
          ✏️ Material tahriri
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        {/* Test ogohlantirish */}
        {hasTest && (
          <div style={{
            padding: 12,
            background: 'rgba(255,204,68,0.08)',
            border: '1px solid rgba(255,204,68,0.25)',
            borderRadius: 10,
            fontSize: 11,
            color: 'var(--txt-2)',
            lineHeight: 1.5,
            marginBottom: 14,
          }}>
            ⚠️ <strong style={{ color: 'var(--y)' }}>Diqqat:</strong> Bu papkadan
            test allaqachon yaratilgan. Materialni tahrirlash test'ga ta'sir
            qilmaydi — test eski versiyaga asoslangan qoladi.
          </div>
        )}

        {/* Tab tanlovi */}
        <div className="seg-tabs">
          <button
            className={`seg-tab ${!showAppendMode ? 'active' : ''}`}
            onClick={() => setShowAppendMode(false)}
          >✏️ Tahrir</button>
          <button
            className={`seg-tab ${showAppendMode ? 'active' : ''}`}
            onClick={() => setShowAppendMode(true)}
          >➕ Qo'shimcha qo'shish</button>
        </div>

        {!showAppendMode ? (
          // ─── TAHRIRLASH REJIMI ──────────────────────────────────────────
          <>
            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Sarlavha
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              style={{
                width: '100%',
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                color: 'var(--txt)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                marginBottom: 12,
              }}
            />

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Matn ({content.length.toLocaleString()} / 30,000)
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={14}
              maxLength={30000}
              style={{
                width: '100%',
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                color: 'var(--txt)',
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            <button
              onClick={save}
              disabled={saving}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 14 }}
            >
              {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
            </button>
          </>
        ) : (
          // ─── QO'SHIMCHA QO'SHISH REJIMI ─────────────────────────────────
          <>
            <div style={{
              padding: 10,
              background: 'rgba(0,212,170,0.06)',
              border: '1px solid rgba(0,212,170,0.2)',
              borderRadius: 10,
              fontSize: 11,
              color: 'var(--txt-2)',
              marginBottom: 12,
              lineHeight: 1.5,
            }}>
              💡 Mavjud matnga qo'shimcha qo'shing — mavjud matn{' '}
              <strong>o'chmaydi</strong>, faqat ostiga qo'shiladi.
              <br />
              Joriy hajm: <strong>{content.length.toLocaleString()}</strong> belgi
            </div>

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Yangi qo'shimcha matn
            </label>
            <textarea
              value={appendText}
              onChange={e => setAppendText(e.target.value)}
              placeholder="Bu yerga yangi material qo'shing..."
              rows={12}
              maxLength={30000 - content.length}
              style={{
                width: '100%',
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                color: 'var(--txt)',
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{
              fontSize: 10, color: 'var(--txt-3)',
              marginTop: 4, textAlign: 'right',
            }}>
              {appendText.length.toLocaleString()} qo'shimcha · Jami{' '}
              {(content.length + appendText.length).toLocaleString()} / 30,000
            </div>

            <button
              onClick={appendAndSave}
              disabled={saving || !appendText.trim()}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 14, opacity: (saving || !appendText.trim()) ? 0.5 : 1 }}
            >
              {saving ? '⏳ Saqlanmoqda...' : "➕ Qo'shish va saqlash"}
            </button>
          </>
        )}

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}
