import { AUTH_ROUTES } from '@/features/auth/lib/config';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseRes = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies) {
          newCookies.forEach(({ name, value }) =>
            request.cookies.set({ name, value })
          );
          supabaseRes = NextResponse.next({ request });
          newCookies.forEach(({ name, value, options }) =>
            supabaseRes.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  const { pathname, searchParams } = request.nextUrl;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith('/reset-password')) {
    if (
      searchParams.get('type') === 'recovery' &&
      searchParams.get('token_hash')?.startsWith('pkce')
    )
      return supabaseRes;

    if (user) NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && !AUTH_ROUTES.some((route) => pathname.startsWith(route)))
    return NextResponse.redirect(new URL('/login', request.url));

  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    user &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))
  ) {
    const { data } = await supabase
      .from('profile')
      .select('is_onboarding_complete')
      .eq('user_id', user.id)
      .single();

    console.log(data);

    if (!data) return supabaseRes;

    if (pathname.startsWith('/dashboard') && !data.is_onboarding_complete)
      return NextResponse.redirect(new URL('/onboarding', request.url));

    if (pathname.startsWith('/onboarding') && data.is_onboarding_complete)
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseRes;
}
