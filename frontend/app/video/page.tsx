// OmniAI - Page Génération de Vidéos (Higgsfield Image-to-Video)
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import {
  Video, Loader2, Play, Clock, CheckCircle, AlertCircle,
  Upload, X, ImagePlus, Film, ChevronDown
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
  { value: 'dop-lite', label: 'DoP Lite', desc: 'Rapide & economique' },
  { value: 'dop-turbo', label: 'DoP Turbo', desc: 'Equilibre qualite/vitesse' },
  { value: 'dop-preview', label: 'DoP Preview', desc: 'Meilleure qualite' },
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
        toast.error(`${file.name} : format non supporte (JPEG, PNG, WebP)`)
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
          if (data.status === 'completed') toast.success('Video prete !')
          if (data.status === 'failed') toast.error(data.error || 'Erreur de generation')
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
      toast.error('Decrivez le mouvement souhaite')
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
      toast.success('Generation lancee !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la generation')
    }
    setLoading(false)
  }

  const statusConfig = {
    processing: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'En cours...' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Termine' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Echec' },
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Videos IA</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Higgsfield DoP — Image to Video</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Uploadez 1 a 3 images et decrivez le mouvement souhaite pour generer une video cinematique.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-8">

          {/* Image Upload Zone */}
          <label className="block text-sm font-medium mb-2">
            Images source ({images.length}/3)
          </label>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-4 flex-wrap">
              {/* Image Previews */}
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                  <img src={img.url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    title="Supprimer cette image"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                    {i + 1}
                  </div>
                </div>
              ))}

              {/* Add Button */}
              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Ajouter</span>
                </button>
              )}

              {/* Empty State */}
              {images.length === 0 && (
                <div className="flex-1 text-center py-2">
                  <Upload className="w-8 h-8 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-400">Glissez vos images ici ou cliquez sur +</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">JPEG, PNG, WebP — Max 10 MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              title="Selectionner des images"
              aria-label="Selectionner des images pour la generation video"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addImages(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Prompt */}
          <div className="mt-4">
            <label htmlFor="video-prompt" className="block text-sm font-medium mb-2">
              Decrivez le mouvement / style
            </label>
            <textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : Camera dolly avant avec mouvement cinematique lent, profondeur de champ..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Model + Generate */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-end">
            <div className="flex-1">
              <label htmlFor="model" className="block text-xs font-medium text-gray-500 mb-1.5">
                Modele
              </label>
              <div className="relative">
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                >
                  {models.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label} — {m.desc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || images.length === 0 || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {loading ? 'Lancement...' : 'Generer la video'}
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Vos videos apparaitront ici</p>
            <p className="text-sm mt-1">Uploadez des images et decrivez le mouvement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => {
              const cfg = statusConfig[job.status]
              return (
                <div
                  key={job.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-medium flex-1 line-clamp-2">{job.prompt}</p>
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                      <cfg.icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>

                  {job.status === 'processing' && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{job.progress}%</p>
                    </div>
                  )}

                  {job.status === 'completed' && job.videoUrl && (
                    <video
                      src={job.videoUrl}
                      controls
                      className="w-full rounded-lg mt-3 max-h-[400px] bg-black"
                      playsInline
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
