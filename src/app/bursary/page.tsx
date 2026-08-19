'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBursaryFunds } from '@/lib/api'
import type { BursaryFund } from '@/types/bursary'
import { Landmark, Building2, Wallet, Calendar, ArrowRight } from 'lucide-react'

export default function BursaryListingPage() {
  const [funds, setFunds] = useState<BursaryFund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [deadlineBefore, setDeadlineBefore] = useState('')

  useEffect(() => {
    fetchFunds()
  }, [])

  async function fetchFunds() {
    setLoading(true)
    setError(null)
    try {
      const data = await getBursaryFunds()
      setFunds(data.funds || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load bursaries')
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setMinAmount('')
    setMaxAmount('')
    setDeadlineBefore('')
  }

  const filteredFunds = funds.filter((fund) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matches =
        fund.name?.toLowerCase().includes(q) ||
        fund.description?.toLowerCase().includes(q) ||
        fund.providerName?.toLowerCase().includes(q)
      if (!matches) return false
    }
    if (minAmount && (fund.totalAmount ?? 0) < parseInt(minAmount)) return false
    if (maxAmount && (fund.totalAmount ?? 0) > parseInt(maxAmount)) return false
    if (deadlineBefore && fund.deadline && new Date(fund.deadline) > new Date(deadlineBefore)) return false
    return true
  })

  const isFiltered = Boolean(searchQuery || minAmount || maxAmount || deadlineBefore)

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="border-b border-border bg-elimux-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-4">
            <Landmark className="w-4 h-4" />
            ElimuX Bursary Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Bursaries & Financial Aid</h1>
          <p className="mt-2 text-muted max-w-2xl">
            Discover funding opportunities from County Governments, NG-CDF, NGOs, Corporates, and Foundations.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-elimux-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {isFiltered && (
                  <button onClick={clearFilters} className="text-sm text-primary-400 hover:text-primary-300">
                    Clear all
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keyword..."
                  className="w-full px-3 py-2 rounded-md bg-elimux-dark border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Amount Range (KES)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 rounded-md bg-elimux-dark border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50"
                  />
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 rounded-md bg-elimux-dark border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Deadline Before</label>
                <input
                  type="date"
                  value={deadlineBefore}
                  onChange={(e) => setDeadlineBefore(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-elimux-dark border border-border text-sm text-foreground focus:outline-none focus:border-primary-500/50"
                />
              </div>
            </div>

            <Link
              href="/bursary/provider/register"
              className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-primary-500/30 text-primary-400 text-sm font-medium hover:bg-primary-500/10 transition-colors w-full justify-center"
            >
              <Building2 className="w-4 h-4" />
              Register as a Provider
            </Link>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">{error}</div>
            ) : filteredFunds.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted text-lg">
                  {funds.length === 0 ? 'No bursaries available yet. Check back soon!' : 'No bursaries match your filters.'}
                </p>
                {isFiltered && funds.length > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-primary-400 hover:text-primary-300 font-medium">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted mb-4">
                  {filteredFunds.length} bursar{filteredFunds.length === 1 ? 'y' : 'ies'} found
                </p>
                {filteredFunds.map((fund) => (
                  <Link
                    key={fund.id}
                    href={`/bursary/fund/${fund.id}`}
                    className="block bg-elimux-card border border-border rounded-xl hover:border-primary-500/40 transition-colors p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{fund.name}</h3>
                          <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs font-medium rounded-full">
                            Open
                          </span>
                        </div>
                        <p className="text-muted text-sm line-clamp-2 mb-3">{fund.description || 'No description available.'}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted">
                          {fund.providerName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {fund.providerName}
                            </span>
                          )}
                          {fund.totalAmount ? (
                            <span className="flex items-center gap-1">
                              <Wallet className="w-4 h-4" />
                              {fund.currency || 'KES'} {fund.totalAmount.toLocaleString()}
                            </span>
                          ) : null}
                          {fund.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Deadline: {new Date(fund.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
