import { NextRequest, NextResponse } from "next/server";
import { updateSejourRates } from "@/lib/sejourRatesService";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = await params;
    const sejourId = p.id;
    const body = await request.json();
    const strategy = body.strategy || "tcmb_banknote_selling";
    const manualRates = body.manualRates;

    if (!sejourId) {
      return NextResponse.json(
        { error: "Missing sejourId" },
        { status: 400 },
      );
    }

    // Kullanıcının oturumunu doğrula (varsa)
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userErr,
      } = await authSupabase.auth.getUser();
      if (userErr || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Servis ile işlemleri yap
    const result = await updateSejourRates(sejourId, strategy, manualRates);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Update Sejour Rates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
