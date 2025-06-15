'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// This component is responsible for listening to auth changes and refreshing the
// page to ensure server components are updated with the latest session.
export default function SupabaseListener({
  serverAccessToken,
}: {
  serverAccessToken?: string
}) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // This will trigger a soft refresh, re-running server components
        // and loading the latest data from Supabase.
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, router, supabase])

  return null
} 