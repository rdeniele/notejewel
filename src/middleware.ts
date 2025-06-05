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
        // Look for something like this that might be causing the issue:
        // const data = await response.json(); // This line might be failing

        // Make sure to check the response content-type before parsing:
        if (response.headers.get("content-type")?.includes("application/json")) {
          const data = await response.json();
          return data;
        } else {
          // Handle non-JSON response
          const text = await response.text();
          return { newestNoteId: text }; // or handle it in a way that suits your app
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
}