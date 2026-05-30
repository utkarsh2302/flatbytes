import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // MUST use getUser() not getSession() per Supabase SSR docs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.searchParams.set("next", pathname);
    url.search = new URLSearchParams({ next: pathname }).toString();
    return NextResponse.redirect(url);
  }

  // ── /admin/* — auth bypassed for local preview ──
  // TODO: re-enable before production push
  if (pathname.startsWith("/admin") && process.env.NODE_ENV === "production") {
    if (!user) return redirectTo("/login");

    const { data: adminRows } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1);

    if (!adminRows || adminRows.length === 0) return redirectTo("/login");
  }

  // ── /broker/* — auth bypassed for local preview ──
  // TODO: re-enable before production push
  if (pathname.startsWith("/broker") && pathname !== "/broker/register" && process.env.NODE_ENV === "production") {
    if (!user) return redirectTo("/login");

    const { data: brokerRows } = await supabase
      .from("brokers")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1);

    if (!brokerRows || brokerRows.length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/broker/register";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // ── /dev/* — requires users.role = 'developer' ──
  if (pathname.startsWith("/dev")) {
    if (!user) return redirectTo("/login");

    const { data: devRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (devRow?.role !== "developer") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect logged-in users away from /login ──
  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next") ?? "/projects";
    const url = request.nextUrl.clone();
    url.pathname = next.startsWith("/") ? next : "/projects";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
