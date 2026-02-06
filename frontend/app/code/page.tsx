// OmniAI - Page Génération de Code
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Code, Play, Wrench, BookOpen, Loader2, Copy, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

type Mode = 'generate' | 'fix' | 'explain'

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'SQL', 'HTML/CSS']

const modes: { key: Mode; label: string; icon: typeof Play; description: string }[] = [
  { key: 'generate', label: 'Générer', icon: Play, description: 'Générer du code à partir d\'une description' },
  { key: 'fix', label: 'Corriger', icon: Wrench, description: 'Corriger et améliorer du code existant' },
  { key: 'explain', label: 'Expliquer', icon: BookOpen, description: 'Expliquer du code en détail' },
]

export default function CodePage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('generate')
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const handleSubmit = async () => {
    if (mode === 'generate' && !prompt.trim()) return
    if ((mode === 'fix' || mode === 'explain') && !code.trim()) return

    setLoading(true)
    setResult('')

    try {
      const token = session?.access_token
      let endpoint = ''
      let body: Record<string, string> = {}

      switch (mode) {
        case 'generate':
          endpoint = '/api/code'
          body = { prompt, language }
          break
        case 'fix':
          endpoint = '/api/code/fix'
          body = { code, error }
          break
        case 'explain':
          endpoint = '/api/code/explain'
          body = { code }
          break
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setResult(data.code || data.fixedCode || data.explanation || JSON.stringify(data, null, 2))
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du traitement')
    }
    setLoading(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Code IA</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Générez, corrigez et expliquez du code en quelques secondes
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => { setMode(m.key); setResult('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === m.key
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              {mode === 'generate' ? (
                <>
                  <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex : Créer une fonction qui trie un tableau par ordre croissant..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />

                  <label htmlFor="language" className="block text-sm font-medium mt-4 mb-2">
                    Langage
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                    >
                      {languages.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </>
              ) : (
                <>
                  <label htmlFor="code-input" className="block text-sm font-medium mb-2">
                    {mode === 'fix' ? 'Code à corriger' : 'Code à expliquer'}
                  </label>
                  <textarea
                    id="code-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Collez votre code ici..."
                    rows={10}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono resize-none"
                  />

                  {mode === 'fix' && (
                    <>
                      <label htmlFor="error-msg" className="block text-sm font-medium mt-4 mb-2">
                        Message d&apos;erreur (optionnel)
                      </label>
                      <input
                        id="error-msg"
                        type="text"
                        value={error}
                        onChange={(e) => setError(e.target.value)}
                        placeholder="Ex : TypeError: Cannot read property..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      />
                    </>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {loading ? 'Traitement...' : modes.find((m) => m.key === mode)!.label}
              </button>
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Résultat</span>
                {result && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                )}
              </div>

              {result ? (
                <pre className="flex-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-auto text-sm font-mono whitespace-pre-wrap">
                  {result}
                </pre>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Le résultat apparaîtra ici</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
