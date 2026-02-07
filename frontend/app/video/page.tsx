// OmniAI - Page Génération de Vidéos (Higgsfield DoP) — Redesign Glassmorphism
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import {
  Loader2, Play, Clock, CheckCircle, AlertCircle,
  Upload, X, ImagePlus, Film, Sparkles,
  Zap, Gauge, Crown, Download, RotateCcw, Coins
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Job {
  id: string
  prompt: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
}

interface ImagePreview {
  file: File
  url: string
}

const models = [
  { value: 'dop-lite', label: 'DoP Lite', desc: 'Rapide & économique', speed: '~30s', icon: Zap },
  { value: 'dop-turbo', label: 'DoP Turbo', desc: 'Équilibre qualité/vitesse', speed: '~60s', icon: Gauge },
  { value: 'dop-preview', label: 'DoP Preview', desc: 'Meilleure qualité', speed: '~90s', icon: Crown },
]

export default function VideoPage() {
  const { session } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('dop-turbo')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<Record<string, NodeJS.Timeout>>({})

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    return () => {
      Object.values(pollRef.current).forEach(clearInterval)
      images.forEach(img => URL.revokeObjectURL(img.url))
    }
  }, [])

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages: ImagePreview[] = []
    const allowed = ['image/jpeg', 'image/png', 'image/webp']

    for (const file of Array.from(files)) {
      if (images.length + newImages.length >= 3) {
        toast.error('Maximum 3 images')
        break
      }
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name} : format non supporté (JPEG, PNG, WebP)`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} : taille max 10 MB`)
        continue
      }
      newImages.push({ file, url: URL.createObjectURL(file) })
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
    }
  }, [images.length])

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
  }, [addImages])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const pollStatus = (jobId: string) => {
    const token = session?.access_token
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/video/${jobId}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()

        setJobs(prev =>
          prev.map(j =>
            j.id === jobId
              ? { ...j, status: data.status, progress: data.progress || j.progress, videoUrl: data.videoUrl }
              : j
          )
        )

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          delete pollRef.current[jobId]
          if (data.status === 'completed') toast.success('Vidéo prête !')
          if (data.status === 'failed') toast.error(data.error || 'Erreur de génération')
        }
      } catch {
        clearInterval(interval)
        delete pollRef.current[jobId]
      }
    }, 3000)

    pollRef.current[jobId] = interval
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      toast.error('Ajoutez au moins une image')
      return
    }
    if (!prompt.trim()) {
      toast.error('Décrivez le mouvement souhaité')
      return
    }

    setLoading(true)

    try {
      const token = session?.access_token
      const formData = new FormData()
      images.forEach(img => formData.append('images', img.file))
      formData.append('prompt', prompt)
      formData.append('model', model)

      const res = await fetch(`${API_URL}/api/video/generate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await res.json()

      if (res.status === 402) {
        toast.error(
          `Points insuffisants (${data.balance || 0} pts). Il vous faut ${data.cost || 5} pts.`,
          { duration: 5000 }
        )
        setLoading(false)
        return
      }

      if (data.error) throw new Error(data.error)

      const newJob: Job = {
        id: data.jobId,
        prompt,
        status: 'processing',
        progress: 0,
      }

      setJobs(prev => [newJob, ...prev])
      pollStatus(data.jobId)
      setPrompt('')
      setImages(prev => {
        prev.forEach(img => URL.revokeObjectURL(img.url))
        return []
      })
      toast.success('Génération lancée !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération')
    }
    setLoading(false)
  }

  const statusConfig = {
    processing: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'En cours...' },
    completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Terminé' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Échec' },
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Background handled by global layout aurora */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl opacity-20 blur-sm -z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Vidéos IA
              </h1>
              <p className="text-sm text-gray-400">
                Higgsfield DoP — Transformez vos images en vidéos cinématiques
              </p>
            </div>
          </div>
        </div>

        {/* Main Input Card — Glassmorphism */}
        <div className="relative rounded-2xl overflow-hidden mb-8 animate-slide-up">
          {/* Glass border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-indigo-500/30 rounded-2xl" />

          <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-6">

            {/* Image Upload Zone */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-medium mb-2.5 text-gray-200">
                <ImagePlus className="w-4 h-4 text-violet-400" />
                Images source
                <span className="text-xs text-gray-500 font-normal ml-1">({images.length}/3)</span>
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative rounded-xl p-5 transition-all duration-200 border-2 border-dashed ${
                  dragActive
                    ? 'border-violet-500/60 bg-violet-500/10'
                    : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Image Previews */}
                  {images.map((img, i) => (
                    <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/[0.1] group shadow-lg">
                      <img src={img.url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                      <button
                        type="button"
                        title="Supprimer cette image"
                        aria-label={`Supprimer l'image ${i + 1}`}
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] text-center py-1 font-medium">
                        Image {i + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add Button */}
                  {images.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-28 h-28 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 cursor-pointer"
                    >
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[11px] font-medium">Ajouter</span>
                    </button>
                  )}

                  {/* Empty State */}
                  {images.length === 0 && (
                    <div className="flex-1 text-center py-3">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm text-gray-400">Glissez vos images ici ou cliquez sur +</p>
                      <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP — Max 10 MB par image</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  title="Sélectionner des images"
                  aria-label="Sélectionner des images pour la génération vidéo"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addImages(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-5">
              <label htmlFor="video-prompt" className="flex items-center gap-2 text-sm font-medium mb-2.5 text-gray-200">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Décrivez le mouvement / style
              </label>
              <textarea
                id="video-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex : Camera dolly avant avec mouvement cinématique lent, profondeur de champ, lumière dorée..."
                rows={2}
                className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30 text-sm text-gray-100 resize-none placeholder-gray-600 transition-all duration-200"
              />
            </div>

            {/* Model + Generate */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Model Selector */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">Modèle</label>
                <div className="flex gap-2">
                  {models.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setModel(m.value)}
                      className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-center transition-all duration-200 cursor-pointer border ${
                        model === m.value
                          ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <m.icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{m.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{m.speed}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || images.length === 0 || !prompt.trim()}
                className="group/btn relative flex items-center justify-center gap-2 px-8 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-purple-500 cursor-pointer whitespace-nowrap overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {loading ? 'Lancement...' : 'Générer'}
                {!loading && (
                  <span className="flex items-center gap-1 text-xs opacity-70">
                    <Coins className="w-3 h-3" />5 pts
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl border border-white/[0.05]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-10 h-10 text-gray-700" />
              </div>
            </div>
            <p className="text-lg text-gray-400 font-medium">Vos vidéos apparaîtront ici</p>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Uploadez des images et décrivez le mouvement pour créer des vidéos cinématiques
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobs.map(job => {
              const cfg = statusConfig[job.status]
              return (
                <div
                  key={job.id}
                  className="relative rounded-2xl overflow-hidden"
                >
                  {/* Subtle border glow based on status */}
                  <div className={`absolute -inset-[1px] rounded-2xl ${
                    job.status === 'processing' ? 'bg-gradient-to-br from-amber-500/20 via-transparent to-amber-500/10' :
                    job.status === 'completed' ? 'bg-gradient-to-br from-emerald-500/20 via-transparent to-emerald-500/10' :
                    'bg-gradient-to-br from-red-500/20 via-transparent to-red-500/10'
                  }`} />

                  <div className={`relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl border p-5 shadow-xl transition-all duration-300 ${cfg.border}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 line-clamp-2">{job.prompt}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${cfg.color} ${cfg.bg} whitespace-nowrap border ${cfg.border}`}>
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all duration-700 relative"
                            style={{ width: `${Math.max(job.progress, 5)}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">Génération en cours...</p>
                          <p className="text-xs text-gray-400 font-medium tabular-nums">{job.progress}%</p>
                        </div>
                      </div>
                    )}

                    {/* Video Player */}
                    {job.status === 'completed' && job.videoUrl && (
                      <div className="mt-3">
                        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/50">
                          <video
                            src={job.videoUrl}
                            controls
                            className="w-full max-h-[400px]"
                            playsInline
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <a
                            href={job.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-gray-300 text-xs rounded-lg hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {job.status === 'failed' && (
                      <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-red-400">La génération a échoué. Veuillez réessayer avec d'autres paramètres.</p>
                          <button
                            type="button"
                            onClick={() => setPrompt(job.prompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap ml-3"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Réessayer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
