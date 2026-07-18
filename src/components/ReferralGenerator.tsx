'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Mail, MessageCircle, Send, Gift, Loader2, RefreshCw, Ticket } from 'lucide-react'
import { createReferral, getReferralStatus, redeemReferral, awardPoints, type ReferralRow } from '@/lib/api'

const STORAGE_KEY = 'elimux_referral_code'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

interface ReferralGeneratorProps {
  className?: string
}

export default function ReferralGenerator({ className = '' }: ReferralGeneratorProps) {
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState<ReferralRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Redemption state (the "friend" side of the loop)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemEmail, setRedeemEmail] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  // No auth in this app - the only way to remember "your" code across visits
  // is to stash it in this browser and re-fetch its live status.
  useEffect(() => {
    const storedCode = localStorage.getItem(STORAGE_KEY)
    if (storedCode) {
      setChecking(true)
      getReferralStatus(storedCode)
        .then(({ data }) => setReferral(data))
        .catch(() => localStorage.removeItem(STORAGE_KEY))
        .finally(() => setChecking(false))
    }

    // Prefill the redemption code when arriving via a ?ref= share link
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setRedeemCode(ref.trim().toUpperCase())
  }, [])

  const handleGenerate = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await createReferral(email)
      setReferral(data)
      localStorage.setItem(STORAGE_KEY, data.referrer_code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate referral code')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    if (!referral) return
    setChecking(true)
    try {
      const { data } = await getReferralStatus(referral.referrer_code)
      setReferral(data)
    } catch {
      // Keep showing the last known state - a failed refresh isn't worth an error banner.
    } finally {
      setChecking(false)
    }
  }

  const handleCopy = async () => {
    if (!referral) return
    await navigator.clipboard.writeText(referral.referrer_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trackShare = () => {
    awardPoints('share').catch(() => {
      // Points are a bonus - never block a share on a gamification hiccup.
    })
  }

  const shareUrl = referral ? `https://www.elimux.ke/leaderboard?ref=${referral.referrer_code}` : ''
  const shareText = referral
    ? `Join me on ElimuX and find your next school or program! Use my referral code ${referral.referrer_code}: ${shareUrl}`
    : ''

  const shareLinks = referral
    ? {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        email: `mailto:?subject=${encodeURIComponent('Check out ElimuX')}&body=${encodeURIComponent(shareText)}`,
      }
    : null

  const handleRedeem = async () => {
    setRedeemMsg(null)
    setRedeemError(null)
    if (!redeemCode.trim()) {
      setRedeemError('Enter the referral code')
      return
    }
    if (!isValidEmail(redeemEmail)) {
      setRedeemError('Enter a valid email address')
      return
    }
    setRedeeming(true)
    try {
      await redeemReferral(redeemCode.trim().toUpperCase(), redeemEmail.trim())
      setRedeemMsg('Referral confirmed — welcome to ElimuX! Your friend just earned their reward.')
      setRedeemCode('')
      setRedeemEmail('')
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Failed to redeem referral code')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className={`rounded-2xl border border-border bg-elimux-card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-5 h-5 text-primary-400" />
        <h2 className="text-xl font-bold text-foreground">Refer a friend</h2>
      </div>
      <p className="text-sm text-muted mb-5">
        Share your referral code and earn rewards when friends join ElimuX.
      </p>

      {!referral ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || checking}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate code
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-wider text-primary-400">
              {referral.referrer_code}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={shareLinks!.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={shareLinks!.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10 transition-colors"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
            <a
              href={shareLinks!.email}
              onClick={trackShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  referral.status === 'completed'
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                }`}
              >
                {referral.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
              {referral.status === 'completed' && referral.reward_given && (
                <span className="inline-flex items-center gap-1 text-xs text-primary-400 font-medium">
                  <Gift className="w-3.5 h-3.5" />
                  Reward earned
                </span>
              )}
            </div>
            <button
              onClick={refreshStatus}
              disabled={checking}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Refresh status
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

      <div className="border-t border-border mt-6 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Ticket className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-foreground">Have a referral code?</h3>
        </div>
        <p className="text-xs text-muted mb-3">Enter it with your email to confirm the referral.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="sm:w-32 h-11 px-4 rounded-lg border border-border bg-background text-foreground font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="email"
            value={redeemEmail}
            onChange={(e) => setRedeemEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm
          </button>
        </div>
        {redeemMsg && <p className="text-sm text-green-400 mt-3">{redeemMsg}</p>}
        {redeemError && <p className="text-sm text-red-400 mt-3">{redeemError}</p>}
      </div>
    </div>
  )
}
