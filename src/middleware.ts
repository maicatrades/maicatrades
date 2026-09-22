import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabasePublicConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && (path === "/pro" || path.startsWith("/api/pro/"))) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/login") {
    const proUrl = request.nextUrl.clone();
    proUrl.pathname = "/pro";
    proUrl.search = "";
    return NextResponse.redirect(proUrl);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/pro/:path*", "/api/pro/:path*"],
};
