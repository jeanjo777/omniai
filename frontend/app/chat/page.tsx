// OmniAI - Page Chat IA
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ReactMarkdown from 'react-markdown'
import {
  Send,
  Loader2,
  Bot,
  User,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Code,
  Image,
  Lightbulb,
  Zap,
  Copy,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title?: string
  updated_at: string
  messages?: Message[]
}

const SUGGESTIONS = [
  { icon: Code, text: 'Explique-moi les closures en JavaScript', color: 'text-blue-500' },
  { icon: Image, text: "Donne-moi des idées de prompts pour DALL-E", color: 'text-purple-500' },
  { icon: Lightbulb, text: 'Comment optimiser les performances React ?', color: 'text-yellow-500' },
  { icon: Zap, text: 'Crée une API REST avec Express et Supabase', color: 'text-orange-500' },
]

export default function ChatPage() {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const token = session?.access_token

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  // Load conversation history
  const loadHistory = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch {
      // History is not critical
    }
  }, [token])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title) return conv.title
    const firstMsg = conv.messages?.find(m => m.role === 'user')
    if (firstMsg) return firstMsg.content.slice(0, 40) + (firstMsg.content.length > 40 ? '...' : '')
    return 'Nouvelle conversation'
  }

  const startNewChat = () => {
    setActiveConversationId(null)
    setMessages([])
    setInput('')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const selectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id)
    if (conv.messages && conv.messages.length > 0) {
      const sorted = [...conv.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(sorted)
    } else {
      setMessages([])
    }
  }

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isStreaming) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Placeholder for assistant response
    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    }])

    try {
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Try streaming first
      const res = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: activeConversationId
        }),
        signal: controller.signal
      })

      if (!res.ok) {
        // Fallback to non-streaming
        const fallbackRes = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            message: messageText,
            conversationId: activeConversationId
          })
        })

        const fallbackData = await fallbackRes.json()
        if (fallbackData.error) throw new Error(fallbackData.error)

        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fallbackData.message } : m)
        )
        if (fallbackData.conversationId) {
          setActiveConversationId(fallbackData.conversationId)
        }
        loadHistory()
        return
      }

      // Stream reading
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('Stream non disponible')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) throw new Error(data.error)
            if (data.chunk) {
              fullContent += data.chunk
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
              )
            }
            if (data.done && data.conversationId) {
              setActiveConversationId(data.conversationId)
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      // If stream returned nothing, fallback
      if (!fullContent) {
        const fallbackRes = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            message: messageText,
            conversationId: activeConversationId
          })
        })
        const fallbackData = await fallbackRes.json()
        if (fallbackData.error) throw new Error(fallbackData.error)

        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fallbackData.message } : m)
        )
        if (fallbackData.conversationId) {
          setActiveConversationId(fallbackData.conversationId)
        }
      }

      loadHistory()
    } catch (error: any) {
      if (error.name === 'AbortError') return
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Désolé, une erreur est survenue. Veuillez réessayer." }
            : m
        )
      )
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [input, isStreaming, token, activeConversationId, loadHistory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex flex-col`}
      >
        <div className="p-3">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 transition-colors cursor-pointer text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune conversation</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left ${
                  activeConversationId === conv.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{getConversationTitle(conv)}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-gray-500" />
            ) : (
              <PanelLeft className="w-5 h-5 text-gray-500" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h1 className="font-semibold">OmniAI Chat</h1>
          </div>
          {activeConversationId && (
            <button
              type="button"
              onClick={startNewChat}
              className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </header>

        {/* ============ MESSAGES ============ */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome */
            <div className="flex flex-col items-center justify-center h-full px-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Bonjour !</h2>
              <p className="text-gray-500 mb-10 text-center max-w-md">
                Je suis OmniAI, votre assistant IA. Posez-moi n'importe quelle question !
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(s.text)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all cursor-pointer text-left group"
                  >
                    <s.icon className={`w-5 h-5 mt-0.5 ${s.color} flex-shrink-0`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="animate-fade-in group">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                      message.role === 'assistant'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium mb-1 block">
                        {message.role === 'assistant' ? 'OmniAI' : 'Vous'}
                      </span>

                      {message.role === 'assistant' ? (
                        <div className="relative">
                          <div className="prose dark:prose-invert prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-indigo-500 prose-code:before:content-[''] prose-code:after:content-['']">
                            <ReactMarkdown>
                              {message.content || (isStreaming ? '' : '...')}
                            </ReactMarkdown>
                          </div>

                          {/* Typing dots */}
                          {isStreaming && !message.content && (
                            <div className="flex gap-1.5 py-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce typing-dot-1" />
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce typing-dot-2" />
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce typing-dot-3" />
                            </div>
                          )}

                          {/* Copy button */}
                          {message.content && !isStreaming && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="absolute -right-2 top-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                              title="Copier"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ============ INPUT ============ */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent resize-none focus:outline-none text-sm max-h-[200px] py-1 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              OmniAI peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
