import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { UpdateKeyTermSchema } from '@/lib/validation/schemas'

export const PATCH = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const termId = params.id
  const body = await req.json()
  const parsed = UpdateKeyTermSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const admin = createAdminSupabaseClient()

  const { data: term, error } = await supabase
    .from('key_terms')
    .select('id, user_id, value, is_edited, original_value')
    .eq('id', termId)
    .single()

  if (error || !term) {
    return NextResponse.json({ message: 'Term not found.' }, { status: 404 })
  }
  if (term.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  const updatePayload: Record<string, unknown> = {
    value: parsed.data.value,
    is_edited: true,
  }

  // Preserve original AI value on first edit only
  if (!term.is_edited) {
    updatePayload.original_value = term.value
  }

  const { data: updated, error: updateError } = await admin
    .from('key_terms')
    .update(updatePayload)
    .eq('id', termId)
    .select('id, value, original_value, is_edited')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ message: 'Failed to update term.' }, { status: 500 })
  }

  return NextResponse.json(updated)
})
