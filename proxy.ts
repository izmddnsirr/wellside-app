import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const requireAuthRedirect = (request: NextRequest, targetPathname: string) => {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = targetPathname;
  return NextResponse.redirect(redirectUrl);
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!supabaseUrl || !supabaseKey) {
    return requireAuthRedirect(request, "/staff");
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const pathname = request.nextUrl.pathname;
    const isHome = pathname.startsWith("/home");
    return requireAuthRedirect(request, isHome ? "/login" : "/staff");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    const pathname = request.nextUrl.pathname;
    const isHome = pathname.startsWith("/home");
    return requireAuthRedirect(request, isHome ? "/login" : "/staff");
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return requireAuthRedirect(request, "/staff");
  }

  if (pathname.startsWith("/barber") && profile.role !== "barber") {
    return requireAuthRedirect(request, "/staff");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/barber/:path*", "/home/:path*"],
};
