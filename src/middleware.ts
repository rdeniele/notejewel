import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const isAuthRoute =
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/sign-up";

    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

    // Admin route protection
    if (isAdminRoute) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(
          new URL("/login", process.env.NEXT_PUBLIC_BASE_URL),
        );
      }

      // Check if user is admin by checking the database
      try {
        const dbUser = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/check-admin?email=${user.email}`,
        ).then(async (response) => {
          if (!response.ok) {
            return { isAdmin: false };
          }
          return await response.json();
        });

        if (!dbUser.isAdmin) {
          return NextResponse.redirect(
            new URL("/", process.env.NEXT_PUBLIC_BASE_URL),
          );
        }
      } catch (error) {
        console.error('Admin check error:', error);
        return NextResponse.redirect(
          new URL("/", process.env.NEXT_PUBLIC_BASE_URL),
        );
      }
    }

    if (isAuthRoute) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(
          new URL("/", process.env.NEXT_PUBLIC_BASE_URL),
        );
      }
    }

    const { searchParams, pathname } = new URL(request.url);

    if (!searchParams.get("noteId") && pathname === "/") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { newestNoteId } = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/fetch-newest-note?userId=${user.id}`,
        ).then(async (response) => {
          // Check if response is ok and content-type is JSON
          if (!response.ok) {
            console.error('API response not ok:', response.status, response.statusText);
            return { newestNoteId: null };
          }
          
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              return await response.json();
            } catch (error) {
              console.error('JSON parsing error:', error);
              return { newestNoteId: null };
            }
          } else {
            console.error('Response is not JSON:', await response.text());
            return { newestNoteId: null };
          }
        });

        if (newestNoteId) {
          const url = request.nextUrl.clone();
          url.searchParams.set("noteId", newestNoteId);
          return NextResponse.redirect(url);
        } else {
          const { noteId } = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-new-note?userId=${user.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          ).then((res) => res.json());
          const url = request.nextUrl.clone();
          url.searchParams.set("noteId", noteId);
          return NextResponse.redirect(url);
        }
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next({
      request,
    });
  }
}