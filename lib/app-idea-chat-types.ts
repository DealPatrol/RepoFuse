export interface AppIdeaSuggestion {
  name: string
  tagline: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedEffort: string
  suggestedStack: string[]
  monetizationAngle: string
  whyNow: string
  reusePlan?: string
  sourceFiles?: string[]
  filesToCreate?: string[]
}

export interface AppIdeaChatResponse {
  reply: string
  suggestions: AppIdeaSuggestion[]
  followUpQuestions: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
