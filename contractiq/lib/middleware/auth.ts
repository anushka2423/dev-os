import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<Record<string, string>> }
type AuthedHandler = (
  req: NextRequest,
  user: { id: string; email: string },
  ctx: { params: Record<string, string> }
) => Promise<Response>

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await ctx.params
    return handler(req, { id: user.id, email: user.email! }, { params })
  }
}
