import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (data)
        return NextResponse.redirect(
          new URL("/documents", process.env.NEXT_PUBLIC_APP_URL),
        );

      throw new Error(error?.message);
    } catch (error) {
      console.log(error);
      return NextResponse.redirect(
        new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}