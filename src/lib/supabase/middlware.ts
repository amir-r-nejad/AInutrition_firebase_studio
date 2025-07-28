import { AUTH_ROUTES } from '@/features/auth/lib/config';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

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

  if (pathname.startsWith('/approve')) {
    const token = searchParams.get('token');
    const requestId = searchParams.get('requestId');
    const coachId = searchParams.get('coachId');

    // Allow access only if all required parameters are present
    if (!token || !requestId || !coachId)
      return NextResponse.redirect(new URL('/error', request.url));

    // Must be authenticated to approve requests
    if (!user) return NextResponse.redirect(new URL('/login', request.url));

    return supabaseRes;
  }

  // Handle coach client dashboard access
  if (pathname.startsWith('/coach-dashboard/clients/') && user) {
    const pathSegments = pathname.split('/');
    const clientId = pathSegments[3]; // /coach-dashboard/clients/[clientId]/...

    if (clientId && clientId !== 'page') {
      // Verify coach has access to this client
      const { data: coachData } = await supabase
        .from('coaches')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!coachData)
        return NextResponse.redirect(new URL('/coach-dashboard', request.url));

      const { data: accessData } = await supabase
        .from('coach_clients')
        .select('id')
        .eq('coach_id', user.id)
        .eq('client_id', clientId)
        .eq('status', 'accepted')
        .single();

      if (!accessData)
        return NextResponse.redirect(
          new URL('/coach-dashboard/clients', request.url)
        );
    }
  }

  // Handle password reset flow
  if (pathname.startsWith('/reset-password')) {
    if (
      searchParams.get('type') === 'recovery' &&
      searchParams.get('token_hash')?.startsWith('pkce')
    )
      return supabaseRes;

    if (user) {
      // Get user profile to determine redirect destination
      const { data: profile } = await supabase
        .from('profile')
        .select('user_role, is_onboarding_complete')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_onboarding_complete) {
        const redirectUrl =
          profile.user_role === 'coach' ? '/coach-dashboard' : '/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect unauthenticated users to login (except for auth routes)
  if (!user && !AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // Get user profile to determine redirect destination
    const { data: profile } = await supabase
      .from('profile')
      .select('user_role, is_onboarding_complete')
      .eq('user_id', user.id)
      .single();

    if (profile?.is_onboarding_complete) {
      const redirectUrl =
        profile.user_role === 'coach' ? '/coach-dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // If onboarding not complete, redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Handle dashboard and onboarding access for authenticated users
  if (
    user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/coach-dashboard'))
  ) {
    const { data: profile } = await supabase
      .from('profile')
      .select('user_role, is_onboarding_complete')
      .eq('user_id', user.id)
      .single();

    console.log('Profile data:', profile);

    if (!profile) return supabaseRes;

    if (!profile.is_onboarding_complete && !pathname.startsWith('/onboarding'))
      return NextResponse.redirect(new URL('/onboarding', request.url));

    if (profile.is_onboarding_complete) {
      if (pathname.startsWith('/onboarding')) {
        const redirectUrl =
          profile.user_role === 'coach' ? '/coach-dashboard' : '/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      if (
        profile.user_role === 'coach' &&
        pathname.startsWith('/dashboard') &&
        !pathname.startsWith('/coach-dashboard')
      ) {
        return NextResponse.redirect(new URL('/coach-dashboard', request.url));
      }

      if (
        profile.user_role === 'client' &&
        pathname.startsWith('/coach-dashboard')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return supabaseRes;
}
