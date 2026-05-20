'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  Lightbulb,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
} from 'lucide-react'
import type { Analysis } from '@/lib/queries'
import type { AppIdeaSuggestion, AppIdeaChatResponse, ChatMessage } from '@/app/api/app-idea-chat/route'

const DIFFICULTY_META = {
  easy: { label: 'Easy', class: 'bg-chart-1/10 text-chart-1' },
  medium: { label: 'Medium', class: 'bg-chart-2/10 text-chart-2' },
  hard: { label: 'Hard', class: 'bg-destructive/10 text-destructive' },
}

const STARTER_PROMPTS = [
  'I want to build a developer tool',
  'I want to create a SaaS business',
  'I want to build something with AI',
  'I need a quick side project to ship',
]

function SuggestionCard({ suggestion }: { suggestion: AppIdeaSuggestion }) {
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
        <Badge className={`text-xs shrink-0 ${diff.class}`}>{diff.label}</Badge>
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

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Less detail' : 'Why now'}
      </button>

      {expanded && (
        <div className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
          {suggestion.whyNow}
        </div>
      )}
    </Card>
  )
}

interface ChatBubbleProps {
  message: ChatMessage & { suggestions?: AppIdeaSuggestion[]; followUpQuestions?: string[] }
  onFollowUp?: (q: string) => void
}

function ChatBubble({ message, onFollowUp }: ChatBubbleProps) {
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
          className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${
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
              <SuggestionCard key={s.name} suggestion={s} />
            ))}
          </div>
        )}

        {!isUser && message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.followUpQuestions.map((q) => (
              <button
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
  const [messages, setMessages] = useState<FullChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your App Idea advisor. Tell me what kind of app you want to build — your tech stack preferences, target audience, or problem you want to solve — and I'll suggest the best project ideas for you.",
      suggestions: [],
      followUpQuestions: STARTER_PROMPTS,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
        .filter((m) => !m.suggestions?.length && !m.followUpQuestions?.length)
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
        const data = await res.json()
        throw new Error(data.error || 'Request failed')
      }

      const data: AppIdeaChatResponse = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          suggestions: data.suggestions,
          followUpQuestions: data.followUpQuestions,
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
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-5 w-5 text-chart-2" />
          <h1 className="text-2xl font-bold text-foreground">App Idea Chat</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Describe what you want to build and get tailored project ideas — optionally grounded in your codebase.
        </p>
      </div>

      {/* Codebase selector */}
      {completedAnalyses.length > 0 && (
        <div className="mb-4 flex-shrink-0">
          <Card className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-chart-2 shrink-0" />
                <span className="text-sm font-medium text-foreground">Ground ideas in your codebase</span>
              </div>
              <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
                <SelectTrigger className="w-[220px] h-8 text-sm">
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
          </Card>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            onFollowUp={(q) => {
              setInput(q)
              sendMessage(q)
            }}
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

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Describe the kind of app you want to build..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
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
          Each message costs credits. Be specific for better results.
        </p>
      </div>
    </div>
  )
}
