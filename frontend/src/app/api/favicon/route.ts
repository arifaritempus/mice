import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await client
        .from("settings")
        .select("value")
        .eq("key", "general_settings")
        .maybeSingle();

      if (data?.value) {
        const settings =
          typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (settings.dark_icon_logo) {
          return NextResponse.redirect(settings.dark_icon_logo);
        }
      }
    }
  } catch (error) {
    console.error("Favicon API Error:", error);
  }

  // Fallback
  const requestUrl = new URL(request.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  return NextResponse.redirect(new URL("/LOGO_NAVY.png", baseUrl));
}
