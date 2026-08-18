import { supabase } from '@/lib/supabase'

interface AwardPointsResult {
  success: boolean
  points_awarded?: number
  id?: string
  error?: string
  valid_keys?: string[]
}

export async function awardPoints(
  userId: string,
  actionKey: string,
  options?: {
    points?: number
    studentId?: string
    referenceType?: string
    referenceId?: string
  }
): Promise<AwardPointsResult> {
  const { data, error } = await supabase.rpc('award_points', {
    p_user_id: userId,
    p_action_key: actionKey,
    p_points: options?.points ?? null,
    p_student_id: options?.studentId ?? null,
    p_reference_type: options?.referenceType ?? null,
    p_reference_id: options?.referenceId ?? null,
  })

  if (error) {
    console.error('award_points RPC error:', error.message)
    return { success: false, error: error.message }
  }

  return data as AwardPointsResult
}

// Usage:
// const result = await awardPoints(user.id, 'daily_login')
// if (!result.success) console.log('Failed:', result.error, result.valid_keys)
