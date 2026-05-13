import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSubject, formatBytes } from '../constants/subjects'
import { materialApi } from '../api/endpoints'
import type { MaterialLimits } from '../types'
import { useToast } from '../components/Toast'
import './MaterialAddPage.css'

type Tab = 'text' | 'image' | 'file'

export default function MaterialAddPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const subject = getSubject(subjectId || '')

  const [tab, setTab] = useState<Tab>('text')
  const [limits, setLimits] = useState<MaterialLimits | null>(null)

  // Text tab
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')

  // Image/File tab — draft (extract qilingan matn)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftKind, setDraftKind] = useState<'ocr' | 'file' | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftText, setDraftText] = useState('')
  const [draftMeta, setDraftMeta] = useState<any>(null)

  // Processing state
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    materialApi.limits().then(({ data }) => setLimits(data)).catch(() => {})
  }, [])

  if (!subject) {
    return (
      <div className="material-add-page">
        <div className="error-state">Fan topilmadi</div>
        <button className="btn-back" onClick={() => navigate('/subjects')}>← Orqaga</button>
      </div>
    )
  }

  // ─── Tab 1: Matn (copy-paste) saqlash ─────────────────────────────────
  const onTextSave = async () => {
    if (!textContent.trim() || textContent.length < (limits?.rules.minTextChars || 50)) {
      toast.error(`Matn juda qisqa (kamida ${limits?.rules.minTextChars || 50} belgi)`)
      return
    }
    setSaving(true)
    try {
      await materialApi.createText(subject.id, textTitle || `${subject.name} — matn`, textContent)
      toast.success("Material qo'shildi!")
      navigate(`/subjects/${subject.id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  // ─── Tab 2: Rasm (OCR) ────────────────────────────────────────────────
  const onImagePick = async (file: File) => {
    if (file.size > (limits?.rules.maxImageBytes || 3 * 1024 * 1024)) {
      toast.error(`Rasm juda katta (maksimum 3 MB)`)
      return
    }
    setExtracting(true)
    try {
      const { data } = await materialApi.ocrExtract(file)
      setDraftId(data.draftId)
      setDraftKind('ocr')
      setDraftText(data.text)
      setDraftTitle(`${subject.name} — ${file.name.split('.')[0]}`)
      setDraftMeta(data.sourceMeta)
      toast.info(data.notice || "Matnni tekshirib chiqing")
    } catch (e: any) {
      toast.error(e.response?.data?.error || "OCR xatoligi")
    } finally {
      setExtracting(false)
    }
  }

  // ─── Tab 3: Fayl (PDF/DOCX/PPTX) ──────────────────────────────────────
  const onFilePick = async (file: File) => {
    if (file.size > (limits?.rules.maxFileBytes || 7 * 1024 * 1024)) {
      toast.error(`Fayl juda katta (maksimum 7 MB)`)
      return
    }
    setExtracting(true)
    try {
      const { data } = await materialApi.fileParse(file)
      setDraftId(data.draftId)
      setDraftKind('file')
      setDraftText(data.text)
      setDraftTitle(`${subject.name} — ${file.name.split('.')[0]}`)
      setDraftMeta(data.sourceMeta)
      if (data.wasTrimmed) {
        toast.info(`Matn juda uzun edi (${data.originalChars} belgi) — qisqartirildi`)
      } else {
        toast.info(data.notice || "Matnni tekshirib chiqing")
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Fayl tahlilida xatolik")
    } finally {
      setExtracting(false)
    }
  }

  // ─── Draft saqlash (OCR/File uchun) ───────────────────────────────────
  const onDraftSave = async () => {
    if (!draftId || !draftKind) return
    if (draftText.length < (limits?.rules.minTextChars || 50)) {
      toast.error(`Matn juda qisqa (kamida ${limits?.rules.minTextChars || 50} belgi)`)
      return
    }
    setSaving(true)
    try {
      if (draftKind === 'ocr') {
        await materialApi.ocrSave(draftId, subject.id, draftTitle, draftText)
      } else {
        await materialApi.fileSave(draftId, subject.id, draftTitle, draftText)
      }
      toast.success("Material qo'shildi!")
      navigate(`/subjects/${subject.id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Saqlashda xatolik")
    } finally {
      setSaving(false)
    }
  }

  const onDraftCancel = () => {
    setDraftId(null)
    setDraftKind(null)
    setDraftText('')
    setDraftTitle('')
    setDraftMeta(null)
  }

  const maxChars  = limits?.rules.maxTextChars || 30000
  const ocrLeft   = limits ? (limits.ocrUploads.limit === null ? -1 : (limits.ocrUploads.limit - limits.ocrUploads.used)) : -1
  const fileLeft  = limits ? (limits.fileUploads.limit === null ? -1 : (limits.fileUploads.limit - limits.fileUploads.used)) : -1

  return (
    <div className="material-add-page">
      <header className="add-header">
        <button className="btn-back" onClick={() => navigate(`/subjects/${subject.id}`)}>←</button>
        <h1>{subject.icon} Material qo'shish</h1>
      </header>

      {/* Draft mode (OCR/File natijasi) — boshqa tab'ni ko'rsatmaymiz */}
      {draftId && draftKind ? (
        <div className="draft-editor">
          <div className="notice-banner">
            <span>⚠️</span>
            <div>
              <strong>Matnni tekshirib chiqing</strong>
              <div className="notice-text">
                {draftKind === 'ocr'
                  ? "OCR 100% aniq bo'lmasligi mumkin — kerak bo'lsa tahrirlang"
                  : "Fayldan ajratilgan matn — kerak bo'lsa tahrirlang"}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Sarlavha</label>
            <input
              type="text"
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              placeholder="Material nomi"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>
              Matn ({draftText.length}/{maxChars} belgi)
            </label>
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value.slice(0, maxChars))}
              rows={14}
              placeholder="Matn shu yerda..."
            />
          </div>

          {draftMeta && (
            <div className="meta-info">
              {draftMeta.fileName && <div>📄 {draftMeta.fileName}</div>}
              {draftMeta.fileSizeKb && <div>{formatBytes(draftMeta.fileSizeKb)}</div>}
              {draftMeta.pageCount && <div>{draftMeta.pageCount} sahifa</div>}
            </div>
          )}

          <div className="draft-actions">
            <button className="btn-secondary" onClick={onDraftCancel} disabled={saving}>
              Bekor qilish
            </button>
            <button className="btn-primary" onClick={onDraftSave} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab switcher */}
          <div className="add-tabs">
            <button className={`add-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
              <span>📝</span> Matn
            </button>
            <button className={`add-tab ${tab === 'image' ? 'active' : ''}`} onClick={() => setTab('image')}>
              <span>📷</span> Rasm
            </button>
            <button className={`add-tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>
              <span>📁</span> Fayl
            </button>
          </div>

          {/* TEXT TAB */}
          {tab === 'text' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Sarlavha (ixtiyoriy)</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder={`${subject.name} — matn`}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>
                  Matn
                  <span className="char-count">
                    {textContent.length} / {maxChars} belgi
                  </span>
                </label>
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value.slice(0, maxChars))}
                  rows={14}
                  placeholder={`O'quv materialingizni shu yerga yopishtiring (kamida ${limits?.rules.minTextChars || 50}, maksimum ${maxChars} belgi)`}
                />
              </div>

              <div className="info-text">
                💡 <strong>Free tarif:</strong> 1 ta fanga 1 ta matn material<br/>
                💎 <strong>Pro tarif:</strong> 20 tagacha material
              </div>

              <button
                className="btn-primary btn-full"
                onClick={onTextSave}
                disabled={saving || textContent.length < (limits?.rules.minTextChars || 50)}
              >
                {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
              </button>
            </div>
          )}

          {/* IMAGE TAB */}
          {tab === 'image' && (
            <div className="tab-content">
              <div className="upload-area" onClick={() => imageInputRef.current?.click()}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  hidden
                  onChange={e => e.target.files?.[0] && onImagePick(e.target.files[0])}
                />
                <div className="upload-icon">📷</div>
                <div className="upload-title">Rasm yuklang</div>
                <div className="upload-sub">
                  AI rasmdan matnni avtomatik ajratib oladi (OCR)
                </div>
                <div className="upload-formats">
                  .jpg, .jpeg, .png · Maks 3 MB
                </div>
              </div>

              <div className="info-text">
                💡 <strong>Bugun qoldi:</strong> {ocrLeft === -1 ? '∞' : `${ocrLeft} ta OCR`}<br/>
                ⚠️ Test yaratishdan oldin matnni tekshirib chiqing — OCR 100% aniq bo'lmasligi mumkin
              </div>
            </div>
          )}

          {/* FILE TAB */}
          {tab === 'file' && (
            <div className="tab-content">
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  hidden
                  onChange={e => e.target.files?.[0] && onFilePick(e.target.files[0])}
                />
                <div className="upload-icon">📁</div>
                <div className="upload-title">Fayl yuklang</div>
                <div className="upload-sub">
                  PDF, Word yoki PowerPoint
                </div>
                <div className="upload-formats">
                  .pdf, .docx, .pptx · Maks 7 MB, 20 sahifa
                </div>
              </div>

              <div className="info-text">
                💡 <strong>Bugun qoldi:</strong> {fileLeft === -1 ? '∞' : `${fileLeft} ta fayl`}<br/>
                ⚠️ Bu funksiya faqat Pro/VIP tariflarda mavjud
              </div>
            </div>
          )}
        </>
      )}

      {extracting && (
        <div className="loading-overlay">
          <div className="big-spinner" />
          <div>Matn ajratilmoqda...</div>
        </div>
      )}
    </div>
  )
}
