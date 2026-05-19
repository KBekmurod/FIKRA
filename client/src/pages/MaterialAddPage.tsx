import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { SUBJECTS, type Context } from '../constants/subjects'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'

type Tab = 'text' | 'ocr' | 'file'

export default function MaterialAddPage() {
  const navigate = useNavigate()
  const { subjectId } = useParams<{ subjectId: string }>()
  const [searchParams] = useSearchParams()
  const context = (searchParams.get('context') as Context) || 'mutaxassislik'
  const goBack = useGoBack(`/ombor/${subjectId}?context=${context}`)
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const subj = subjectId ? SUBJECTS[subjectId as keyof typeof SUBJECTS] : null
  if (!subj) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Fan topilmadi</div>
  }

  const standardCount = context === 'majburiy' ? 10 : 30

  // ─── Avtomatik sarlavha generatsiyasi ──────────────────────────────────
  // Sarlavha bo'sh bo'lsa matnning birinchi qatoridan yaratiladi.
  const autoTitle = (text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return `Material — ${new Date().toLocaleDateString('uz-UZ')}`

    // Birinchi qatorni olamiz
    const firstLine = trimmed.split('\n')[0].trim()
    if (firstLine.length === 0) {
      return `Material — ${new Date().toLocaleDateString('uz-UZ')}`
    }

    // Agar juda uzun bo'lsa, 60 belgida kesib qo'shamiz
    if (firstLine.length > 70) {
      // So'zlarda silliq kesish
      const words = firstLine.split(/\s+/)
      let result = ''
      for (const w of words) {
        if ((result + ' ' + w).trim().length > 60) break
        result = (result + ' ' + w).trim()
      }
      return (result || firstLine.slice(0, 60)) + '...'
    }
    return firstLine
  }

  const submitText = async () => {
    if (content.length < 500) { toast.error("Matn juda kichik (kamida 500 belgi)"); return }
    if (content.length > 30000) { toast.error("Matn juda katta (maksimum 30,000 belgi)"); return }

    // Sarlavha bo'sh bo'lsa matndan avtomatik yaratiladi
    const finalTitle = title.trim() || autoTitle(content)
    setSaving(true)
    try {
      // 1. Material yaratish
      const { data: mat } = await api.post('/api/materials/text', {
        subjectId, title: finalTitle, content,
      })
      // 2. Papka yaratish
      const { data: f } = await api.post('/api/folders', {
        materialId: mat.material._id,
        subjectId,
        title: finalTitle,
        context,
      })
      toast.success('Material va papka yaratildi!')
      navigate(`/ombor/folder/${f.folder._id}?fresh=1`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  const submitOcr = async (file: File) => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data: drft } = await api.post('/api/materials/ocr/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Foydalanuvchi tahrirlash imkoniyatiga ega bo'lsin — kontent state'ga qo'yamiz
      setContent(drft.text)
      setTab('text')
      toast.success('Matn ajratildi. Tekshiring va sarlavha bering!')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'OCR xatolik')
    } finally {
      setSaving(false)
    }
  }

  const submitFile = async (file: File) => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data: drft } = await api.post('/api/materials/file/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      setContent(drft.text)
      setTab('text')
      toast.success(`Fayl tahlil qilindi! ${drft.charCount} belgi. Tekshiring va sarlavha bering.`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Fayl xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>
          ⊕ {subj.icon} {subj.name}
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
          padding: 12,
          background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
          border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--txt-2)',
          marginBottom: 14,
        }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik'}
          </strong>
          {' '}konteksti · AI <strong>{standardCount} ta test</strong> yaratadi
        </div>

        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>📝 Matn</button>
          <button className={`seg-tab ${tab === 'ocr' ? 'active' : ''}`} onClick={() => setTab('ocr')}>📷 Rasm</button>
          <button className={`seg-tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>📁 Fayl</button>
        </div>

        {tab === 'text' && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Sarlavha <span style={{ color: 'var(--txt-3)', fontSize: 10, fontWeight: 400 }}>(ixtiyoriy)</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Bo'sh qoldirsangiz, matndan avtomatik yaratiladi"
              maxLength={200}
              style={{
                width: '100%',
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                color: 'var(--txt)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                marginBottom: 4,
              }}
            />
            {!title.trim() && content.length >= 50 && (
              <div style={{ fontSize: 10, color: 'var(--txt-3)', marginBottom: 12, fontStyle: 'italic' }}>
                📝 Avtomatik: "{autoTitle(content)}"
              </div>
            )}
            {(title.trim() || content.length < 50) && <div style={{ height: 8 }} />}

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Matn (500–30,000 belgi)
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Matningizni shu yerga joylang..."
              rows={12}
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
            <div style={{
              fontSize: 10, color: content.length > 30000 ? 'var(--r)' : 'var(--txt-3)',
              marginTop: 4, textAlign: 'right',
            }}>
              {content.length.toLocaleString()} / 30,000
            </div>

            <button
              onClick={submitText}
              disabled={saving || content.length < 500}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 14, opacity: (saving || content.length < 500) ? 0.5 : 1 }}
            >
              {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash va papka yaratish'}
            </button>
          </div>
        )}

        {tab === 'ocr' && (
          <div>
            <div style={{
              padding: 14,
              background: 'var(--s1)',
              border: '1px dashed var(--f)',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32 }}>📷</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }}>
                Rasm yuklang — AI matnni o'qib chiqaradi (JPG, PNG, maks 3 MB)
              </div>
              <label style={{
                display: 'inline-block',
                background: 'var(--acc)', color: 'white',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Rasm tanlash
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) submitOcr(f) }}
                  disabled={saving}
                />
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 10, textAlign: 'center' }}>
              ⚠️ OCR 100% aniq emas — natijani tahrirlash uchun "Matn" tabga o'tasiz
            </div>
          </div>
        )}

        {tab === 'file' && (
          <div>
            <div style={{
              padding: 14,
              background: 'var(--s1)',
              border: '1px dashed var(--f)',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32 }}>📁</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }}>
                PDF, DOCX, PPTX — matn ajratiladi (maks 7 MB, 20 sahifa)
              </div>
              <label style={{
                display: 'inline-block',
                background: 'var(--acc)', color: 'white',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Fayl tanlash
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) submitFile(f) }}
                  disabled={saving}
                />
              </label>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </>
  )
}
