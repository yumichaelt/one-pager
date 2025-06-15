import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          // Must 'await cookies()' to get the actual cookie store.
          return (await cookies()).get(name)?.value
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          try {
            // Must 'await cookies()' before calling .set()
            await (await cookies()).set({ name, value, ...options })
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove: async (name: string, options: CookieOptions) => {
          try {
            // Must 'await cookies()' before calling .set() to remove
            await (await cookies()).set({ name, value: '', ...options })
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
      // This part is also critical to prevent data caching.
      global: {
        fetch: (input, init) => {
          return fetch(input, { ...init, cache: 'no-store' });
        }
      }
    }
  )
}