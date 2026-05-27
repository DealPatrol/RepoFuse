'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Lightbulb,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Heart,
  Code2,
  FilePlus2,
} from 'lucide-react'
import type { Analysis } from '@/lib/queries'
import type { AppIdeaSuggestion, AppIdeaChatResponse, ChatMessage } from '@/lib/app-idea-chat-types'
import { createLikedAppId, getLikedApps, toggleLikedApp } from '@/lib/liked-apps'

const DIFFICULTY_META = {
  easy: { label: 'Easy', class: 'bg-chart-1/10 text-chart-1' },
  medium: { label: 'Medium', class: 'bg-chart-2/10 text-chart-2' },
  hard: { label: 'Hard', class: 'bg-destructive/10 text-destructive' },
}

const STARTER_PROMPTS = [
  'Vibe-code a SaaS from my existing repos',
  'Turn my repo patterns into a developer tool',
  'Use my codebase to assemble an AI product',
  'Find the fastest app I can build from existing files',
]

function SuggestionCard({
  suggestion,
  liked,
  onToggleLiked,
}: {
  suggestion: AppIdeaSuggestion
  liked: boolean
  onToggleLiked: (suggestion: AppIdeaSuggestion) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const diff = DIFFICULTY_META[suggestion.difficulty] ?? DIFFICULTY_META.medium

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 hover:border-border">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-foreground text-sm">{suggestion.name}</h3>
            <Badge variant="outline" className="text-xs shrink-0">{suggestion.type}</Badge>
          </div>
          <p className="text-xs text-chart-2 font-medium">{suggestion.tagline}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={`text-xs ${diff.class}`}>{diff.label}</Badge>
          <button
            type="button"
            onClick={() => onToggleLiked(suggestion)}
            aria-pressed={liked}
            aria-label={liked ? `Remove ${suggestion.name} from liked apps` : `Like ${suggestion.name}`}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
              liked
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                : 'border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/40'
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{suggestion.estimatedEffort}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="h-3 w-3 shrink-0" />
          <span className="truncate">{suggestion.monetizationAngle}</span>
        </div>
      </div>

      {suggestion.suggestedStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.suggestedStack.map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
          ))}
        </div>
      )}

      {suggestion.reusePlan && (
        <div className="mb-3 rounded-lg border border-chart-2/20 bg-chart-2/5 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <Code2 className="h-3.5 w-3.5 text-chart-2" />
            RepoFuse assembly plan
          </div>
          {suggestion.reusePlan}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Less detail' : 'Files and why now'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-xs text-muted-foreground border-t border-border pt-3">
          {suggestion.sourceFiles && suggestion.sourceFiles.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Code2 className="h-3.5 w-3.5" />
                Reuse these files
              </div>
              <div className="space-y-1">
                {suggestion.sourceFiles.slice(0, 4).map((file) => (
                  <div key={file} className="truncate rounded bg-muted px-2 py-1 font-mono">{file}</div>
                ))}
              </div>
            </div>
          )}
          {suggestion.filesToCreate && suggestion.filesToCreate.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <FilePlus2 className="h-3.5 w-3.5" />
                Create these files
              </div>
              <div className="space-y-1">
                {suggestion.filesToCreate.slice(0, 4).map((file) => (
                  <div key={file} className="truncate rounded bg-muted px-2 py-1 font-mono">{file}</div>
                ))}
              </div>
            </div>
          )}
          <div>{suggestion.whyNow}</div>
        </div>
      )}
    </Card>
  )
}

interface ChatBubbleProps {
  message: ChatMessage & { suggestions?: AppIdeaSuggestion[]; followUpQuestions?: string[] }
  onFollowUp?: (q: string) => void
  likedIds: Set<string>
  onToggleLiked: (suggestion: AppIdeaSuggestion) => void
}

function ChatBubble({ message, onFollowUp, likedIds, onToggleLiked }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`flex-1 space-y-3 ${isUser ? 'items-end flex flex-col' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 w-full">
            {message.suggestions.map((s) => (
              <SuggestionCard
                key={s.name}
                suggestion={s}
                liked={likedIds.has(createLikedAppId(s.name, s.tagline))}
                onToggleLiked={onToggleLiked}
              />
            ))}
          </div>
        )}

        {!isUser && message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.followUpQuestions.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => onFollowUp?.(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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
}

export function PatternAnalyzer({ completedAnalyses }: PatternAnalyzerProps) {
  const searchParams = useSearchParams()
  const analysisFromUrl = searchParams.get('analysisId')
  const initialAnalysisId =
    analysisFromUrl && completedAnalyses.some((a) => a.id === analysisFromUrl)
      ? analysisFromUrl
      : 'none'

  const [messages, setMessages] = useState<FullChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your VibeCoding copilot. Tell me what you want to build and I'll turn your connected repo patterns into app ideas, source files to reuse, and files RepoFuse should create next.",
      suggestions: [],
      followUpQuestions: STARTER_PROMPTS,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(initialAnalysisId)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      analysisFromUrl &&
      completedAnalyses.some((a) => a.id === analysisFromUrl) &&
      selectedAnalysisId !== analysisFromUrl
    ) {
      setSelectedAnalysisId(analysisFromUrl)
    }
  }, [analysisFromUrl, completedAnalyses, selectedAnalysisId])


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setLikedIds(new Set(getLikedApps().map((app) => app.id)))
  }, [])

  const handleToggleLiked = (suggestion: AppIdeaSuggestion) => {
    const id = createLikedAppId(suggestion.name, suggestion.tagline)
    const { apps } = toggleLikedApp({
      id,
      name: suggestion.name,
      tagline: suggestion.tagline,
      description: suggestion.description,
      type: suggestion.type,
      difficulty: suggestion.difficulty,
      estimatedEffort: suggestion.estimatedEffort,
      suggestedStack: suggestion.suggestedStack,
      monetizationAngle: suggestion.monetizationAngle,
      whyNow: suggestion.whyNow,
      reusePlan: suggestion.reusePlan,
      sourceFiles: suggestion.sourceFiles,
      filesToCreate: suggestion.filesToCreate,
    })
    setLikedIds(new Set(apps.map((app) => app.id)))
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInput('')
      setLoading(true)

      const history: ChatMessage[] = messages
        .map(({ role, content }) => ({ role, content }))
        .slice(-8)

      const analysisId =
        selectedAnalysisId && selectedAnalysisId !== 'none' ? selectedAnalysisId : undefined

      try {
        const res = await fetch('/api/app-idea-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, analysisId, history }),
        })

        let data: { error?: string } & Partial<AppIdeaChatResponse> = {}
        try {
          data = await res.json()
        } catch {
          throw new Error(res.ok ? 'Invalid server response' : `Request failed (${res.status})`)
        }

        if (!res.ok) {
          throw new Error(data.error || `Request failed (${res.status})`)
        }

        const reply = data.reply?.trim()
        if (!reply) {
          throw new Error('Empty response from server')
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            suggestions: data.suggestions ?? [],
            followUpQuestions: data.followUpQuestions ?? [],
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
      }
    },
    [loading, messages, selectedAnalysisId],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-5 w-5 text-chart-2" />
          <h1 className="text-2xl font-bold text-foreground">VibeCoding Chat</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Describe what you want to build and RepoFuse will map existing GitHub/GitLab repo code into a build plan.
        </p>
      </div>

      {completedAnalyses.length > 0 && (
        <div className="mb-4 flex-shrink-0">
          <Card className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-chart-2 shrink-0" />
                <span className="text-sm font-medium text-foreground">Ground the vibe in an analyzed codebase</span>
              </div>
              <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
                <SelectTrigger className="w-[220px] h-8 text-sm">
                  <SelectValue placeholder="No codebase selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No codebase</SelectItem>
                  {completedAnalyses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            likedIds={likedIds}
            onToggleLiked={handleToggleLiked}
            onFollowUp={(q) => void sendMessage(q)}
          />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 pt-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Describe the app you want RepoFuse to assemble from your repos..."
            disabled={loading}
            className="min-h-12 flex-1 resize-none"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-12 w-12"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Like any app card to pin it to Idea Board.
        </p>
      </div>
    </div>
  )
}
