import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { materialApi } from '../api/endpoints'
import type { StudyMaterial } from '../types'
import { useToast } from '../components/Toast'
import './MaterialAddPage.css'

export default function MaterialEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [material, setMaterial] = useState<StudyMaterial | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    materialApi.get(id).then(({ data }) => {
      setMaterial(data.material)
      setTitle(data.material.title)
      setContent(data.material.content)
    }).catch(() => {
      toast.error("Material topilmadi")
      navigate('/subjects')
    }).finally(() => setLoading(false))
  }, [id])

  const onSave = async () => {
    if (!id) return
    if (content.length < 50) {
      toast.error("Matn juda qisqa (kamida 50 belgi)")
      return
    }
    setSaving(true)
    try {
      await materialApi.update(id, { title, content })
      toast.success("Yangilandi!")
      navigate(`/subjects/${material!.subjectId}`)
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-overlay"><div className="big-spinner" /></div>
  if (!material) return null

  return (
    <div className="material-add-page">
      <header className="add-header">
        <button className="btn-back" onClick={() => navigate(`/subjects/${material.subjectId}`)}>←</button>
        <h1>✏️ Tahrirlash</h1>
      </header>

      <div className="form-group">
        <label>Sarlavha</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Matn <span className="char-count">{content.length} / 30000 belgi</span></label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 30000))}
          rows={16}
        />
      </div>

      <button
        className="btn-primary btn-full"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
      </button>
    </div>
  )
}
