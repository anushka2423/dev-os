import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RouteContext = { params: Record<string, string> }
type AuthedHandler = (
  req: NextRequest,
  user: { id: string; email: string },
  ctx: RouteContext
) => Promise<Response>

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, { id: user.id, email: user.email! }, ctx)
  }
}
