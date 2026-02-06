// OmniAI - Page Génération d'Images
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Image as ImageIcon, Loader2, Download, Sparkles, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const styles = [
  { value: 'vivid', label: 'Vivid' },
  { value: 'natural', label: 'Naturel' },
]

const sizes = [
  { value: '1024x1024', label: '1024 x 1024' },
  { value: '1024x1792', label: '1024 x 1792 (Portrait)' },
  { value: '1792x1024', label: '1792 x 1024 (Paysage)' },
]

interface GeneratedImage {
  url: string
  revisedPrompt: string
}

export default function ImagePage() {
  const { session } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('vivid')
  const [size, setSize] = useState('1024x1024')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)

    try {
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, style, size }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setImages((prev) => [{ url: data.url, revisedPrompt: data.revisedPrompt || prompt }, ...prev])
      toast.success('Image générée !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Images IA</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Créez des images uniques avec DALL-E 3
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-8">
          <label htmlFor="image-prompt" className="block text-sm font-medium mb-2">
            Décrivez votre image
          </label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex : Un chat astronaute flottant dans l'espace avec la Terre en arrière-plan, style digital art..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <label htmlFor="style" className="block text-xs font-medium text-gray-500 mb-1.5">
                Style
              </label>
              <div className="relative">
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                >
                  {styles.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="size" className="block text-xs font-medium text-gray-500 mb-1.5">
                Taille
              </label>
              <div className="relative">
                <select
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                >
                  {sizes.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Génération...' : 'Générer'}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {images.length === 0 && !loading ? (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Vos images apparaîtront ici</p>
            <p className="text-sm mt-1">Décrivez ce que vous voulez créer</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm text-gray-500">Génération en cours...</p>
                </div>
              </div>
            )}

            {images.map((img, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <img
                  src={img.url}
                  alt={img.revisedPrompt}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end">
                  <div className="w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-white text-xs line-clamp-2 mb-2">{img.revisedPrompt}</p>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-md hover:bg-white/30 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Télécharger
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
