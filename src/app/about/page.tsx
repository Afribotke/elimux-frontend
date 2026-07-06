import { Globe, Target, Shield, Users, Zap, Heart } from 'lucide-react'

export default function AboutPage() {
  const values = [
    { icon: Globe, title: 'Global Reach', description: 'Connect with educational institutions across 100+ countries worldwide.' },
    { icon: Target, title: 'Precision Matching', description: 'AI-powered search helps students find the perfect programs for their goals.' },
    { icon: Shield, title: 'Trusted Data', description: 'Verified institution information with regular updates and quality checks.' },
    { icon: Users, title: 'Student-First', description: 'Built by and for students, with features that matter most to learners.' },
    { icon: Zap, title: 'Fast Discovery', description: 'Find relevant programs in seconds, not hours of searching.' },
    { icon: Heart, title: 'Free Forever', description: 'Basic search and discovery features are free for all students.' },
  ]

  return (
    <main className='min-h-screen py-12 px-4 max-w-4xl mx-auto'>
      <h1 className='text-4xl font-bold text-foreground mb-4 text-center'>
        About <span className='text-primary-400'>ElimuX</span>
      </h1>
      <p className='text-muted text-center text-lg mb-12 max-w-2xl mx-auto'>
        Empowering students worldwide to discover and connect with the best educational opportunities.
      </p>

      <div className='bg-elimux-card rounded-2xl p-8 mb-12 border border-border'>
        <h2 className='text-2xl font-bold text-foreground mb-4'>Our Mission</h2>
        <p className='text-muted leading-relaxed'>
          ElimuX is a global education discovery platform that connects students with universities, colleges, TVET institutes, and specialized training programs. We believe every student deserves access to quality education information.
        </p>
      </div>

      <h2 className='text-2xl font-bold text-foreground mb-6 text-center'>Our Values</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12'>
        {values.map((value, index) => (
          <div key={index} className='bg-elimux-card rounded-xl p-5 border border-border'>
            <value.icon className='w-8 h-8 text-primary-400 mb-3' />
            <h3 className='text-lg font-bold text-foreground mb-2'>{value.title}</h3>
            <p className='text-sm text-muted'>{value.description}</p>
          </div>
        ))}
      </div>

      <div className='bg-gradient-to-r from-primary-600/20 to-primary-800/20 rounded-2xl p-8 border border-primary-500/20 text-center'>
        <h2 className='text-2xl font-bold text-foreground mb-2'>Join the Community</h2>
        <p className='text-muted mb-6'>Be part of the growing network of students and institutions on ElimuX.</p>
        <div className='grid grid-cols-3 gap-4'>
          <div><p className='text-3xl font-bold text-primary-400'>100+</p><p className='text-sm text-muted'>Countries</p></div>
          <div><p className='text-3xl font-bold text-primary-400'>20+</p><p className='text-sm text-muted'>Categories</p></div>
          <div><p className='text-3xl font-bold text-primary-400'>15+</p><p className='text-sm text-muted'>Institution Types</p></div>
        </div>
      </div>
    </main>
  )
}
