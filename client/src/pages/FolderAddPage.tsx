import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { SUBJECTS, type Context } from '../constants/subjects'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'

export default function FolderAddPage() {
  const navigate = useNavigate()
  const { subjectId } = useParams<{ subjectId: string }>()
  const [searchParams] = useSearchParams()
  const context = (searchParams.get('context') as Context) || 'mutaxassislik'
  const goBack = useGoBack(`/ombor/${subjectId}?context=${context}`)
  const toast = useToast()

  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const subj = subjectId ? SUBJECTS[subjectId as keyof typeof SUBJECTS] : null
  if (!subj) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Fan topilmadi</div>
  }

  const standardCount = context === 'majburiy' ? 10 : 30

  const submitFolder = async () => {
    const finalTitle = title.trim() || `Yangi papka — ${new Date().toLocaleDateString('uz-UZ')}`
    setSaving(true)
    try {
      const { data: f } = await api.post('/api/folders', {
        subjectId,
        title: finalTitle,
        context,
      })
      toast.success('Papka yaratildi!')
      // Papka ichiga kiramiz
      navigate(`/ombor/folder/${f.folder._id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Xatolik')
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
          ⊕ Yangi Papka ({subj.name})
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{
          padding: 12,
          background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
          border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--txt-2)',
          marginBottom: 20,
        }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik'}
          </strong>
          {' '}konteksti · AI <strong>{standardCount} ta test</strong> yaratadi
        </div>

        <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 8, display: 'block' }}>
          Mavzu yoki Papka nomi
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Masalan: Kvadrat tenglamalar"
          maxLength={200}
          autoFocus
          style={{
            width: '100%',
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            color: 'var(--txt)',
            borderRadius: 10,
            padding: '14px',
            fontSize: 14,
            marginBottom: 24,
          }}
        />

        <button
          onClick={submitFolder}
          disabled={saving}
          className="btn btn-primary btn-block btn-lg"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '⏳ Yaratilmoqda...' : '📁 Papka yaratish'}
        </button>
      </div>
    </>
  )
}
