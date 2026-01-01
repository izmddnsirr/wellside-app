import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const requireAuthRedirect = (request: NextRequest) => {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/staff";
  return NextResponse.redirect(redirectUrl);
};

export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return requireAuthRedirect(request);
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
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return requireAuthRedirect(request);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return requireAuthRedirect(request);
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return requireAuthRedirect(request);
  }

  if (pathname.startsWith("/barber") && profile.role !== "barber") {
    return requireAuthRedirect(request);
  }

  if (pathname.startsWith("/home") && profile.role !== "customer") {
    return requireAuthRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/barber/:path*", "/home/:path*"],
};
