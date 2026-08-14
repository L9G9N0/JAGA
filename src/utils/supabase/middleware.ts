import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Static files or internal API assets shouldn't trigger checks
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return supabaseResponse;
  }

  // Get user role if authenticated
  let role = 'public';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) {
      role = profile.role;
    }
  }

  const isDevoteeRoute = path.startsWith('/devotee');
  const isAdminRoute = path.startsWith('/admin');
  const isAuthRoute = path === '/login' || path === '/signup';

  // 1. Unauthenticated users cannot access protected routes
  if ((isDevoteeRoute || isAdminRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Pending devotees are restricted to the /devotee/pending waitlist page
  if (user && role === 'pending_devotee') {
    if (isDevoteeRoute && path !== '/devotee/pending') {
      return NextResponse.redirect(new URL('/devotee/pending', request.url));
    }
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/devotee/pending', request.url));
    }
  }

  // 3. Devotee routes require devotee, guru, or admin role
  if (isDevoteeRoute && role === 'public') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Admin/Guru routes require admin or guru role
  if (isAdminRoute && role !== 'admin' && role !== 'guru') {
    // If they are a verified devotee, redirect to devotee dashboard; otherwise home
    if (role === 'devotee') {
      return NextResponse.redirect(new URL('/devotee/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. Redirect already authenticated users away from login/signup
  if (isAuthRoute && user) {
    if (role === 'pending_devotee') {
      return NextResponse.redirect(new URL('/devotee/pending', request.url));
    } else if (role === 'devotee') {
      return NextResponse.redirect(new URL('/devotee/dashboard', request.url));
    } else if (role === 'admin' || role === 'guru') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return supabaseResponse;
}
