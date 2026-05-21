'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Sparkles,
  Loader2,
  Send,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  FileCode,
  Package,
  Copy,
  Check,
  Database,
} from 'lucide-react'
import type { Analysis } from '@/lib/queries'
import type {
  AppIdeaSuggestion,
  AppIdeaChatResponse,
  ChatMessage,
  StarterFile,
} from '@/app/api/app-idea-chat/route'

const DIFFICULTY_META = {
  easy: { label: 'Easy', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  hard: { label: 'Hard', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const STARTER_PROMPTS = [
  'I want to build a SaaS dashboard',
  'I want to build something with AI',
  'I need an e-commerce store',
  'I want to build a developer tool',
]

function SuggestionCard({ suggestion }: { suggestion: AppIdeaSuggestion }) {
  const [expanded, setExpanded] = useState(false)
  const diff = DIFFICULTY_META[suggestion.difficulty] ?? DIFFICULTY_META.medium

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-white text-sm">{suggestion.name}</h3>
            <span className="text-xs text-white/40 border border-white/10 rounded px-1.5 py-0.5">
              {suggestion.type}
            </span>
          </div>
          <p className="text-xs text-cyan-400">{suggestion.tagline}</p>
        </div>
        <span className={`text-xs shrink-0 border rounded-full px-2 py-0.5 ${diff.class}`}>
          {diff.label}
        </span>
      </div>

      <p className="text-xs text-white/60 mb-3">{suggestion.description}</p>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1 text-white/40">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{suggestion.estimatedEffort}</span>
        </div>
        <div className="flex items-center gap-1 text-white/40">
          <TrendingUp className="h-3 w-3 shrink-0" />
          <span className="truncate">{suggestion.monetizationAngle}</span>
        </div>
      </div>

      {suggestion.suggestedStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.suggestedStack.map((tech) => (
            <span
              key={tech}
              className="text-xs border border-white/10 rounded px-1.5 py-0.5 text-white/50"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Less' : 'Why now'}
      </button>

      {expanded && (
        <div className="mt-3 text-xs text-white/50 border-t border-white/10 pt-3">
          {suggestion.whyNow}
        </div>
      )}
    </div>
  )
}

function StarterFileCard({ file }: { file: StarterFile }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(file.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3">
      <FileCode className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-cyan-300 truncate">{file.path}</span>
          <span className="text-xs text-white/30 shrink-0 border border-white/10 rounded px-1">
            {file.repoName}
          </span>
        </div>
        <p className="text-xs text-white/50 mb-1">{file.purpose}</p>
        <p className="text-xs text-cyan-400/70 italic">{file.relevance}</p>
        {file.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {file.technologies.slice(0, 4).map((t) => (
              <span key={t} className="text-xs text-white/30 border border-white/10 rounded px-1">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 text-white/30 hover:text-white/60 transition-colors mt-0.5"
        title="Copy path"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

interface ChatBubbleProps {
  message: ChatMessage & {
    suggestions?: AppIdeaSuggestion[]
    followUpQuestions?: string[]
    starterFiles?: StarterFile[]
    templateSummary?: string
  }
  onFollowUp?: (q: string) => void
}

function ChatBubble({ message, onFollowUp }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-cyan-600' : 'bg-white/10'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white/60" />
        )}
      </div>

      <div className={`flex-1 space-y-4 ${isUser ? 'items-end flex flex-col' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${
            isUser
              ? 'bg-cyan-600 text-white rounded-tr-sm'
              : 'bg-white/10 text-white/90 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Starter kit from existing repos */}
        {!isUser && message.starterFiles && message.starterFiles.length > 0 && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Starter Code from Your Repos
              </p>
            </div>
            {message.templateSummary && (
              <p className="text-xs text-white/50 mb-2">{message.templateSummary}</p>
            )}
            <div className="space-y-2">
              {message.starterFiles.map((f) => (
                <StarterFileCard key={`${f.repoName}/${f.path}`} file={f} />
              ))}
            </div>
          </div>
        )}

        {/* App idea suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 w-full">
            {message.suggestions.map((s) => (
              <SuggestionCard key={s.name} suggestion={s} />
            ))}
          </div>
        )}

        {/* Follow-up question chips */}
        {!isUser && message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.followUpQuestions.map((q) => (
              <button
                key={q}
                onClick={() => onFollowUp?.(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface PatternAnalyzerProps {
  completedAnalyses: Analysis[]
}

type FullChatMessage = ChatMessage & {
  suggestions?: AppIdeaSuggestion[]
  followUpQuestions?: string[]
  starterFiles?: StarterFile[]
  templateSummary?: string
}

export function PatternAnalyzer({ completedAnalyses }: PatternAnalyzerProps) {
  const [messages, setMessages] = useState<FullChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: FullChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const history = updatedMessages
        .filter((m) => !m.suggestions?.length)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch('/api/app-idea-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          analysisId: selectedAnalysisId || undefined,
          history,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Request failed')
      }

      const data: AppIdeaChatResponse = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          suggestions: data.suggestions,
          followUpQuestions: data.followUpQuestions,
          starterFiles: data.starterFiles,
          templateSummary: data.templateSummary,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 10rem)' }}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">App Idea Chat</h1>
          </div>
          <p className="text-white/50 text-sm">
            Describe what you want to build — RepoFuse surfaces relevant code from your repos as a starter template.
          </p>
        </div>

        {completedAnalyses.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
              <SelectTrigger className="w-[200px] h-8 text-sm bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="No codebase selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No codebase</SelectItem>
                {completedAnalyses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-6">
            <div className="h-16 w-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center">
              <Package className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-lg font-semibold text-white">What do you want to build?</h2>
              <p className="text-sm text-white/40">
                {completedAnalyses.length > 0
                  ? 'I\'ll search your connected repos for code you can use as a starting point.'
                  : 'Tell me your idea and I\'ll suggest the best project approach and tech stack.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-sm px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-white/50 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
            {completedAnalyses.length === 0 && (
              <p className="text-xs text-white/25 max-w-xs">
                Connect a repo via Analyses to get personalized starter code from your existing projects.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-4 pr-1">
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg}
                onFollowUp={(q) => sendMessage(q)}
              />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white/60" />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-white/10 mt-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Describe what you want to build…"
            disabled={loading}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-white/25 mt-2">
          Each message costs {100} credits.
          {completedAnalyses.length > 0 && selectedAnalysisId
            ? ' Searching your codebase for relevant starter files.'
            : completedAnalyses.length > 0
            ? ' Select a codebase above to surface starter code from your repos.'
            : ''}
        </p>
      </div>
    </div>
  )
}
