'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trash2, Copy, AlertCircle, Check } from 'lucide-react'
import { AIProvider, getProviderName, getEstimatedCost } from '@/lib/ai-providers'

interface APIKey {
  id: string
  provider: string
  enabled: boolean
  created_at: string
  last_used_at: string | null
}

export function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(false)
  const [newProvider, setNewProvider] = useState<AIProvider | ''>('')
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const providers: AIProvider[] = ['anthropic', 'openai', 'grok', 'deepinfra']

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/ai-keys')
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && Array.isArray(data.keys)) {
          setKeys(data.keys)
        }
      } catch {
        // Keys optional until user adds one
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProvider || !newKey) {
      setError('Please select a provider and enter an API key')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider, apiKey: newKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add API key')
      }

      const data = await response.json()
      setKeys([...keys, data.key])
      setNewProvider('')
      setNewKey('')
      setSuccess(`${getProviderName(newProvider as AIProvider)} API key added successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add API key')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Delete ${provider} API key?`)) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai-keys?provider=${provider}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete API key')

      setKeys(keys.filter((k) => k.provider !== provider))
      setSuccess(`${provider} API key deleted`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Key Management</h2>
        <p className="text-muted-foreground mt-2">
          Add your own API keys to use premium AI models and save on costs. Your keys are encrypted and only decryptable by you.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Add API Key</h3>
        <form onSubmit={handleAddKey} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select value={newProvider} onValueChange={(v) => setNewProvider(v as AIProvider)}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {getProviderName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="key">API Key</Label>
              <Input
                id="key"
                type="password"
                placeholder="Enter your API key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <Button disabled={loading || !newProvider || !newKey}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Key
          </Button>
        </form>
      </Card>

      {keys.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Your API Keys</h3>
          <div className="space-y-3">
            {keys.map((key) => {
              const cost = getEstimatedCost(key.provider as AIProvider)
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{getProviderName(key.provider as AIProvider)}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Est. cost: ${cost.inputCost}/${cost.outputCost} per 1M tokens
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.provider)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-6 bg-muted/30">
        <h3 className="font-semibold text-lg mb-3">Cost Savings</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            By bringing your own API keys, you pay significantly less than using our included Claude AI.
          </p>
          <p className="font-medium text-foreground">Estimated savings with BYOK plan:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>DeepSeek: 95% cheaper than builtin Claude</li>
            <li>GPT-4o: 40% cheaper than builtin Claude</li>
            <li>Grok: 90% cheaper than builtin Claude</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
