import { NextRequest, NextResponse } from "next/server";
import { updateProjectRates } from "@/lib/projectRatesService";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = await params;
    const projectId = p.id;
    const { strategy } = await request.json();

    if (!projectId || !strategy) {
      return NextResponse.json(
        { error: "Missing projectId or strategy" },
        { status: 400 },
      );
    }

    // Kullanıcının oturumunu doğrula
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auth işlemi (sadece token geçerli mi kontrol ediyoruz, yetkiye bakmıyoruz, varsayım)
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

    // Servis ile işlemleri yap
    const result = await updateProjectRates(projectId, strategy);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Update Project Rates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
