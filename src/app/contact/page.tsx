'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, User, CheckCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to send message')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className='min-h-screen py-12 px-4 max-w-4xl mx-auto'>
      <h1 className='text-4xl font-bold text-foreground mb-4 text-center'>
        Contact <span className='text-primary-400'>ElimuX</span>
      </h1>
      <p className='text-muted text-center mb-12 max-w-xl mx-auto'>
        Have questions about studying abroad? Need help finding the right program? We are here to help.
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Contact Info */}
        <div className='space-y-6'>
          <div className='bg-elimux-card rounded-xl p-6 border border-border'>
            <Mail className='w-8 h-8 text-primary-400 mb-3' />
            <h3 className='text-lg font-bold text-foreground mb-1'>Email Us</h3>
            <p className='text-muted text-sm'>support@elimux.ke</p>
          </div>
          <div className='bg-elimux-card rounded-xl p-6 border border-border'>
            <MessageSquare className='w-8 h-8 text-primary-400 mb-3' />
            <h3 className='text-lg font-bold text-foreground mb-1'>Live Chat</h3>
            <p className='text-muted text-sm'>Available 9 AM - 6 PM EAT</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className='bg-elimux-card rounded-xl p-6 border border-border'>
          {submitted ? (
            <div className='text-center py-8'>
              <CheckCircle className='w-12 h-12 text-success mx-auto mb-3' />
              <h3 className='text-xl font-bold text-foreground mb-2'>Message Sent!</h3>
              <p className='text-muted'>We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm'>
                  {error}
                </div>
              )}
              <div>
                <label htmlFor='name' className='text-sm text-muted mb-1 block flex items-center gap-2'>
                  <User className='w-4 h-4' /> Name
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  required
                  autoComplete='name'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label htmlFor='email' className='text-sm text-muted mb-1 block flex items-center gap-2'>
                  <Mail className='w-4 h-4' /> Email
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  required
                  autoComplete='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label htmlFor='subject' className='text-sm text-muted mb-1 block'>Subject</label>
                <input
                  id='subject'
                  name='subject'
                  type='text'
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label htmlFor='message' className='text-sm text-muted mb-1 block'>Message</label>
                <textarea
                  id='message'
                  name='message'
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
                />
              </div>
              <button
                type='submit'
                disabled={sending}
                className='w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
              >
                <Send className='w-4 h-4' />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
