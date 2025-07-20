import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookiesStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {
      cookies: {
        getAll() {
          return cookiesStore.getAll();
        },

        setAll(newCookies) {
          try {
            newCookies.forEach(({ name, value, options }) =>
              cookiesStore.set({ name, value, ...options })
            );
          } catch (error) {
            console.log("something wen't wrong", error);
          }
        },
      },
    }
  );
}
