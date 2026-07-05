'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, User, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <main className='min-h-screen py-12 px-4 max-w-4xl mx-auto'>
      <h1 className='text-4xl font-bold text-white mb-4 text-center'>
        Contact <span className='text-primary-400'>ElimuX</span>
      </h1>
      <p className='text-gray-400 text-center mb-12 max-w-xl mx-auto'>
        Have questions about studying abroad? Need help finding the right program? We are here to help.
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Contact Info */}
        <div className='space-y-6'>
          <div className='bg-elimux-card rounded-xl p-6 border border-gray-700/50'>
            <Mail className='w-8 h-8 text-primary-400 mb-3' />
            <h3 className='text-lg font-bold text-white mb-1'>Email Us</h3>
            <p className='text-gray-400 text-sm'>support@elimux.ke</p>
          </div>
          <div className='bg-elimux-card rounded-xl p-6 border border-gray-700/50'>
            <MessageSquare className='w-8 h-8 text-primary-400 mb-3' />
            <h3 className='text-lg font-bold text-white mb-1'>Live Chat</h3>
            <p className='text-gray-400 text-sm'>Available 9 AM - 6 PM EAT</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className='bg-elimux-card rounded-xl p-6 border border-gray-700/50'>
          {submitted ? (
            <div className='text-center py-8'>
              <CheckCircle className='w-12 h-12 text-success mx-auto mb-3' />
              <h3 className='text-xl font-bold text-white mb-2'>Message Sent!</h3>
              <p className='text-gray-400'>We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='text-sm text-gray-400 mb-1 block flex items-center gap-2'>
                  <User className='w-4 h-4' /> Name
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label className='text-sm text-gray-400 mb-1 block flex items-center gap-2'>
                  <Mail className='w-4 h-4' /> Email
                </label>
                <input
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label className='text-sm text-gray-400 mb-1 block'>Subject</label>
                <input
                  type='text'
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-primary-500'
                />
              </div>
              <div>
                <label className='text-sm text-gray-400 mb-1 block'>Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className='w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-primary-500'
                />
              </div>
              <button
                type='submit'
                className='w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2'
              >
                <Send className='w-4 h-4' />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
