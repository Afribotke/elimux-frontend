'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAIStatus, setAIMode, type AIStatus } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { Cpu, Zap, Sparkles, CheckCircle2, XCircle } from 'lucide-react'

const MODES: { value: AIStatus['mode']; label: string; description: string; icon: typeof Sparkles }[] = [
  { value: 'launch', label: 'Launch (Quality)', description: 'Anthropic primary', icon: Sparkles },
  { value: 'scale', label: 'Scale (Cost)', description: 'DeepSeek primary', icon: Zap },
]

export default function ProviderStatus() {
  const { adminKey } = useAdminKey()
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAIStatus(adminKey)
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI provider status')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    load()
  }, [load])

  async function handleModeChange(mode: AIStatus['mode']) {
    if (!adminKey || switching || status?.mode === mode) return
    setSwitching(true)
    setError(null)
    try {
      await setAIMode(mode, adminKey)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch mode')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="bg-elimux-card rounded-xl p-5 border border-border">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary-400" />
        AI Provider Status
      </h2>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : !status ? (
        <p className="text-muted text-sm">Failed to load status.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => handleModeChange(m.value)}
                disabled={switching}
                className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 ${
                  status.mode === m.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-border hover:bg-muted/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <m.icon className={`w-4 h-4 ${status.mode === m.value ? 'text-primary-400' : 'text-muted'}`} />
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{m.description}</p>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted mb-2">
            Fallback order: {status.order.join(' → ')}
          </p>

          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {status.providers.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-foreground capitalize">{p.name}</span>
                {p.available ? (
                  <span className="text-xs text-elimux-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> No API key
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
