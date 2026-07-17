import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key = serviceKey || anonKey;

    if (!url || !key) {
      return NextResponse.json({ error: "Missing DB config" }, { status: 500 });
    }

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const query = `%${q}%`;

    // Query multiple tables in parallel
    const [
      projectsRes,
      quotesRes,
      hotelsRes,
      agenciesRes,
      sejourRes
    ] = await Promise.all([
      client.from("projects").select("id, name, reference").or(`name.ilike.${query},reference.ilike.${query}`).limit(5),
      client.from("quotes").select("id, company_name, reference").or(`company_name.ilike.${query},reference.ilike.${query}`).limit(5),
      client.from("hotels").select("id, name").ilike("name", query).limit(5),
      client.from("agencies").select("id, name").ilike("name", query).limit(5),
      client.from("sejour").select("id, tour_name").ilike("tour_name", query).limit(5)
    ]);

    const results: any[] = [];

    if (projectsRes.data) {
      projectsRes.data.forEach((p: any) => {
        results.push({
          type: "project",
          id: p.id,
          title: p.name,
          subtitle: p.reference,
          href: `/projects/${p.id}`,
        });
      });
    }

    if (quotesRes.data) {
      quotesRes.data.forEach((q: any) => {
        results.push({
          type: "quote",
          id: q.id,
          title: q.company_name || q.reference,
          subtitle: q.reference,
          href: `/quotes/${q.id}`,
        });
      });
    }

    if (hotelsRes.data) {
      hotelsRes.data.forEach((h: any) => {
        results.push({
          type: "hotel",
          id: h.id,
          title: h.name,
          subtitle: "Otel",
          href: `/hotels`,
        });
      });
    }

    if (agenciesRes.data) {
      agenciesRes.data.forEach((a: any) => {
        results.push({
          type: "agency",
          id: a.id,
          title: a.name,
          subtitle: "Acente",
          href: `/agencies`,
        });
      });
    }

    if (sejourRes.data && !sejourRes.error) {
      sejourRes.data.forEach((s: any) => {
        results.push({
          type: "sejour",
          id: s.id,
          title: s.tour_name,
          subtitle: "Sejour",
          href: `/sejour/${s.id}`,
        });
      });
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[SearchAPI] Global error:", err);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
