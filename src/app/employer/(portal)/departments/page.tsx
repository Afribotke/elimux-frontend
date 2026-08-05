'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employerId, setEmployerId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', head_name: '', head_email: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await getUserWithTimeout()
      if (!user) return
      
      const { data: emp } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (emp) {
        setEmployerId(emp.id)
        const { data: depts } = await supabase
          .from('employer_departments')
          .select('*')
          .eq('employer_id', emp.id)
          .order('name')
        setDepartments(depts || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employerId) return
    setSubmitting(true)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('employer_departments')
      .insert({ ...form, employer_id: employerId })
    
    if (!error) {
      setForm({ name: '', description: '', head_name: '', head_email: '' })
      const { data: depts } = await supabase
        .from('employer_departments')
        .select('*')
        .eq('employer_id', employerId)
        .order('name')
      setDepartments(depts || [])
    }
    setSubmitting(false)
  }

  async function deleteDept(id: string) {
    if (!confirm('Delete this department?')) return
    const supabase = createClient()
    await supabase.from('employer_departments').delete().eq('id', id)
    setDepartments(departments.filter(d => d.id !== id))
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Departments</h2>
      <p className="text-muted-foreground">Manage departments. Department heads can submit requisitions to central HR.</p>

      <Card>
        <CardHeader><CardTitle>Add Department</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>Head Name *</Label>
              <Input value={form.head_name} onChange={e => setForm({...form, head_name: e.target.value})} required />
            </div>
            <div>
              <Label>Head Email *</Label>
              <Input type="email" value={form.head_email} onChange={e => setForm({...form, head_email: e.target.value})} required />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Button type="submit" disabled={submitting}>Add Department</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {departments.map(dept => (
          <Card key={dept.id}>
            <CardContent className="pt-6 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{dept.name}</h3>
                <p className="text-sm text-muted-foreground">{dept.description || 'No description'}</p>
                <p className="text-sm mt-1">Head: {dept.head_name} ({dept.head_email})</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteDept(dept.id)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
        {departments.length === 0 && <p className="text-muted-foreground">No departments yet.</p>}
      </div>
    </div>
  )
}
