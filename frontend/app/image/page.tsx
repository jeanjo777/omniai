// OmniAI - Page Génération d'Images (DALL-E 3) — Redesign Glassmorphism
'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import {
  Image as ImageIcon, Loader2, Download, Sparkles,
  Wand2, Maximize2, X, ArrowRight, Copy, Check,
  RectangleHorizontal, Square, RectangleVertical,
  Palette, Aperture, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const styles = [
  { value: 'vivid', label: 'Vivid', desc: 'Couleurs vibrantes et intenses', icon: Palette },
  { value: 'natural', label: 'Naturel', desc: 'Rendu photoréaliste', icon: Aperture },
]

const sizes = [
  { value: '1024x1024', label: '1:1', desc: '1024 x 1024', icon: Square },
  { value: '1024x1792', label: '9:16', desc: '1024 x 1792', icon: RectangleVertical },
  { value: '1792x1024', label: '16:9', desc: '1792 x 1024', icon: RectangleHorizontal },
]

const suggestions = [
  { text: 'Un chat astronaute flottant dans l\'espace', icon: Sparkles },
  { text: 'Paysage cyberpunk néon sous la pluie', icon: Zap },
  { text: 'Portrait d\'un robot en aquarelle', icon: Palette },
  { text: 'Forêt enchantée avec des lucioles magiques', icon: Wand2 },
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
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(index)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050510]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-sm -z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Images IA
              </h1>
              <p className="text-sm text-gray-400">
                Propulsé par DALL-E 3 — Créez des images uniques en quelques secondes
              </p>
            </div>
          </div>
        </div>

        {/* Main Input Card — Glassmorphism */}
        <div className="relative rounded-2xl overflow-hidden mb-8 animate-slide-up">
          {/* Glass border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 rounded-2xl" />

          <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-6">
            {/* Prompt Input */}
            <div className="mb-5">
              <label htmlFor="image-prompt" className="flex items-center gap-2 text-sm font-medium mb-2.5 text-gray-200">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Décrivez votre image
              </label>
              <div className="relative group">
                <textarea
                  ref={textareaRef}
                  id="image-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Un paysage fantastique avec des montagnes cristallines sous un ciel aurore boréale..."
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 text-sm text-gray-100 resize-none placeholder-gray-600 transition-all duration-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-600">
                  {prompt.length}/1000
                </div>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mb-6">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className="group/chip flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer"
                >
                  <s.icon className="w-3 h-3 text-gray-600 group-hover/chip:text-indigo-400 transition-colors duration-200" />
                  {s.text}
                </button>
              ))}
            </div>

            {/* Options Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Style Selector */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">Style</label>
                <div className="flex gap-2">
                  {styles.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStyle(s.value)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                        style === s.value
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <s.icon className="w-4 h-4" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">Format</label>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSize(s.value)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${
                        size === s.value
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      <span className="text-xs">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="group/btn relative flex items-center justify-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-purple-500 cursor-pointer whitespace-nowrap overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? 'Génération...' : 'Générer'}
                {!loading && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform duration-200" />}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {images.length === 0 && !loading ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl border border-white/[0.05]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-700" />
              </div>
            </div>
            <p className="text-lg text-gray-400 font-medium">Vos créations apparaîtront ici</p>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Décrivez ce que vous imaginez et laissez DALL-E 3 créer des images extraordinaires
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Loading skeleton */}
            {loading && (
              <div className="aspect-square rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-400">Création en cours...</p>
                  <p className="text-xs text-gray-600 mt-1">Cela peut prendre quelques secondes</p>
                </div>
              </div>
            )}

            {images.map((img, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
                onClick={() => setLightbox(img)}
              >
                <img
                  src={img.url}
                  alt={img.revisedPrompt}
                  className="w-full aspect-square object-cover"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="w-full p-4">
                    <p className="text-white/90 text-xs line-clamp-2 mb-3 leading-relaxed">{img.revisedPrompt}</p>
                    <div className="flex gap-2">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopyPrompt(img.revisedPrompt, i) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                      >
                        {copiedPrompt === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrompt === i ? 'Copié' : 'Prompt'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightbox(img) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Agrandir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            title="Fermer"
            aria-label="Fermer la visionneuse"
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.revisedPrompt}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
            <div className="bg-white/[0.05] backdrop-blur-2xl rounded-xl px-5 py-3 border border-white/[0.08]">
              <p className="text-white/80 text-sm text-center leading-relaxed">{lightbox.revisedPrompt}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
