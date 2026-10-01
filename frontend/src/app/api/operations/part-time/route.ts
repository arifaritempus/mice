import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(url, key);
}

const cleanDescription = (desc: any) => {
  if (!desc) return "";
  return String(desc)
    .replace(/\s*\[S:[^\]]*\]/g, "")
    .replace(/\s*\[R:[^\]]*\]/g, "")
    .trim();
};

const isPartTime = (...values: any[]) => {
  return values.some((value) => {
    if (!value) return false;
    const text = String(value)
      .toLowerCase()
      .replace(/i̇/g, "i")
      .replace(/ı/g, "i");
    return (
      (text.includes("part") && text.includes("time")) ||
      text.includes("part-time") ||
      text.includes("parttime") ||
      text.includes("yari zamanli") ||
      text.includes("insan kaynaklari") ||
      text.includes("host") ||
      text.includes("supervisor") ||
      text.includes("supervizor") ||
      text.includes("personel")
    );
  });
};

const parseFilterTokens = (value: any): string[] => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [String(value).trim().toLowerCase()].filter(Boolean);
};

async function fetchFromSupabase(request: NextRequest) {
  const supabase = getSupabaseClient();
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.max(
    1,
    parseInt(url.searchParams.get("pageSize") || "20", 10),
  );
  const searchRaw = String(url.searchParams.get("searchTerm") || "")
    .trim()
    .toLowerCase();
  const searchParts = searchRaw.split(/\s+/).filter(Boolean);
  const voucherTerms = parseFilterTokens(url.searchParams.get("voucherTerms"));
  const customerTerms = parseFilterTokens(
    url.searchParams.get("customerTerms"),
  );
  const hotelTerms = parseFilterTokens(url.searchParams.get("hotelTerms"));
  const supplierTerms = parseFilterTokens(
    url.searchParams.get("supplierTerms"),
  );
  const employeeTerms = parseFilterTokens(
    url.searchParams.get("employeeTerms"),
  );
  const filter = String(url.searchParams.get("filter") || "all").toLowerCase();
  const startDate = String(url.searchParams.get("startDate") || "");
  const endDate = String(url.searchParams.get("endDate") || "");
  const sortField = String(url.searchParams.get("sortField") || "created_at");
  const sortDirection =
    url.searchParams.get("sortDirection")?.toLowerCase() === "asc"
      ? "asc"
      : "desc";

  const [
    { data: sejourExtrasRaw, error: sejourError },
    { data: projectPurchasesRaw, error: projectError },
    { data: allCategories },
  ] = await Promise.all([
    supabase
      .from("sejour_extra_services")
      .select(`
        id,
        sejour_id,
        service_type_id,
        supplier_id,
        service_description,
        price,
        currency,
        cost_price,
        cost_currency,
        created_at,
        service_types(name),
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          status,
          agencies(name),
          hotels(name)
        )
      `)
      .eq("sejours.status", "KONFIRME")
      .order("created_at", { ascending: false }),
    supabase
      .from("project_purchase_items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, parent_id, code"),
  ]);

  if (sejourError && sejourError.code !== "PGRST205") {
    console.warn("sejour_extra_services error:", sejourError.message);
  }
  if (projectError && projectError.code !== "PGRST205") {
    console.warn("project_purchase_items error:", projectError.message);
  }

  const categoryMap = (allCategories || []).reduce(
    (acc: any, c: any) => ({ ...acc, [c.id]: c.name }),
    {},
  );

  const sejourItems = (sejourExtrasRaw || [])
    .filter((row: any) =>
      isPartTime(row.service_types?.name, row.service_description),
    )
    .map((row: any) => ({
      id: `sejour:${row.id}`,
      sejour_id: String(row.sejour_id || ""),
      voucher_number: String(row.sejours?.voucher_number || ""),
      customer_type: "sejour" as const,
      check_in_date: row.sejours?.check_in_date || "",
      check_out_date: row.sejours?.check_out_date || "",
      employee_name:
        row.service_description ||
        row.service_types?.name ||
        "Part-Time Çalışan",
      service_type: row.service_types?.name || "Part-Time",
      customer_name:
        row.sejours?.agencies?.name || row.sejours?.customer_name || "",
      company_name: row.sejours?.customer_name || "",
      hotel_name: row.sejours?.hotels?.name || "",
      supplier: row.supplier_id || "Tedarikçi",
      supplier_id: row.supplier_id,
      description: row.service_description || "",
      price: Number(row.price || 0),
      currency: row.currency || "TRY",
      cost_price: Number(row.cost_price || 0),
      cost_currency: row.cost_currency || row.currency || "TRY",
      fx: 1,
      totalTRY: Number(row.cost_price || row.price || 0),
      hours: "",
      status: "active" as const,
      notes: "",
      created_at: row.created_at || "",
    }));

  const projectPartTime = (projectPurchasesRaw || []).filter((row: any) =>
    isPartTime(
      categoryMap[row.category],
      categoryMap[row.sub_category],
      cleanDescription(row.description),
    ),
  );

  const projectIds = Array.from(
    new Set(projectPartTime.map((r: any) => r.project_id).filter(Boolean)),
  );
  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, reference, company_name, start_date, end_date, agency_id, hotel_id, status",
    )
    .in("id", projectIds);

  const agencyIds = Array.from(
    new Set((projects || []).map((p: any) => p.agency_id).filter(Boolean)),
  );
  const hotelIds = Array.from(
    new Set((projects || []).map((p: any) => p.hotel_id).filter(Boolean)),
  );
  const supplierIds = Array.from(
    new Set(
      [
        ...sejourItems.map((s: any) => s.supplier_id),
        ...projectPartTime.map((p: any) => p.supplier_id),
      ].filter(Boolean),
    ),
  );

  const [{ data: agencies }, { data: hotels }, { data: suppliers }] =
    await Promise.all([
      agencyIds.length
        ? supabase.from("agencies").select("id, name").in("id", agencyIds)
        : Promise.resolve({ data: [] }),
      hotelIds.length
        ? supabase.from("hotels").select("id, name").in("id", hotelIds)
        : Promise.resolve({ data: [] }),
      supplierIds.length
        ? supabase.from("suppliers").select("id, name").in("id", supplierIds)
        : Promise.resolve({ data: [] }),
    ]);

  const agencyMap = (agencies || []).reduce(
    (acc: any, a: any) => ({ ...acc, [a.id]: a.name }),
    {},
  );
  const hotelMap = (hotels || []).reduce(
    (acc: any, h: any) => ({ ...acc, [h.id]: h.name }),
    {},
  );
  const supplierMap = (suppliers || []).reduce(
    (acc: any, s: any) => ({ ...acc, [s.id]: s.name }),
    {},
  );
  const projectMap = (projects || []).reduce(
    (acc: any, p: any) => ({ ...acc, [p.id]: p }),
    {},
  );

  // Update Sejour supplier names
  sejourItems.forEach((item: any) => {
    item.supplier = supplierMap[item.supplier_id] || item.supplier || "Tedarikçi";
  });

  const miceItems = projectPartTime.map((row: any) => {
    const proj = projectMap[row.project_id] || {};
    const cleaned = cleanDescription(row.description);
    const subName =
      categoryMap[row.sub_category] ||
      categoryMap[row.category] ||
      "Part-Time";
    const empName = cleaned || subName || "Part-Time Çalışan";
    const supplier =
      supplierMap[row.supplier_id] ||
      hotelMap[row.hotel_id] ||
      hotelMap[proj.hotel_id] ||
      "Tedarikçi";

    return {
      id: `project:${row.id}`,
      sejour_id: `project:${row.project_id}`,
      voucher_number: String(
        proj.reference ||
          `PRJ-${String(row.project_id).slice(0, 8).toUpperCase()}`,
      ),
      customer_type: "mice" as const,
      project_type: "project" as const,
      project_id: String(row.project_id || ""),
      check_in_date: proj.start_date || "",
      check_out_date: proj.end_date || "",
      employee_name: empName,
      service_type: subName,
      customer_name: agencyMap[proj.agency_id] || "",
      company_name: proj.company_name || "",
      hotel_name: hotelMap[proj.hotel_id] || "",
      supplier,
      description: cleaned,
      price: Number(row.total_price || 0),
      currency: row.currency || "TRY",
      cost_price: Number(row.total_price || 0),
      cost_currency: row.currency || "TRY",
      fx: Number(row.fx || 1),
      totalTRY: Number(
        row.total_try || Number(row.total_price || 0) * Number(row.fx || 1),
      ),
      hours: "",
      status: "active" as const,
      notes: "",
      created_at: row.created_at || "",
    };
  });

  const merged = [...sejourItems, ...miceItems];

  const matchesTypeFilter = (row: any) =>
    filter === "all" ||
    (filter === "mice" && row.customer_type === "mice") ||
    (filter === "sejour" && row.customer_type === "sejour");

  const baseFiltered = merged.filter((row: any) => {
    const d = String(row.check_in_date || "").slice(0, 10);
    const rangePass =
      (!startDate || d >= startDate) && (!endDate || d <= endDate);
    if (!rangePass) return false;

    const matchesFieldTerms = (terms: string[], values: any[]) => {
      if (!Array.isArray(terms) || terms.length === 0) return true;
      const target = values
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return terms.some((term) => target.includes(term));
    };

    const hasScopedTerms =
      voucherTerms.length ||
      customerTerms.length ||
      hotelTerms.length ||
      supplierTerms.length ||
      employeeTerms.length;

    if (hasScopedTerms) {
      return (
        matchesFieldTerms(voucherTerms, [
          row.voucher_number,
          row.sejour_id,
        ]) &&
        matchesFieldTerms(customerTerms, [
          row.customer_name,
          row.company_name,
        ]) &&
        matchesFieldTerms(hotelTerms, [row.hotel_name]) &&
        matchesFieldTerms(supplierTerms, [row.supplier]) &&
        matchesFieldTerms(employeeTerms, [
          row.employee_name,
          row.service_type,
          row.description,
        ])
      );
    }

    if (searchParts.length === 0) return true;
    const haystack = [
      row.employee_name,
      row.voucher_number,
      row.service_type,
      row.customer_type,
      row.customer_name,
      row.company_name,
      row.supplier,
      row.hotel_name,
      row.description,
      row.check_in_date,
      row.check_out_date,
    ]
      .map((v) => String(v || "").toLowerCase())
      .join(" ");
    return searchParts.every((term) => haystack.includes(term));
  });

  const typeCounts = {
    all: baseFiltered.length,
    mice: baseFiltered.filter((r: any) => r.customer_type === "mice").length,
    sejour: baseFiltered.filter((r: any) => r.customer_type === "sejour").length,
  };

  const filtered = baseFiltered.filter(matchesTypeFilter);

  filtered.sort((a: any, b: any) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    const av = a[sortField] ?? "";
    const bv = b[sortField] ?? "";
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  return {
    success: true,
    data: pageItems,
    total,
    totalPages,
    page,
    pageSize,
    typeCounts,
    message: "Part-time verileri başarıyla getirildi",
  };
}

export async function GET(request: NextRequest) {
  // If BACKEND_URL is configured, try fetching from backend first
  if (BACKEND_URL && BACKEND_URL !== "http://localhost:3000") {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.toString();
      const queryString = query ? `?${query}` : "";
      const backendUrl = `${BACKEND_URL}/api/operations/part-time${queryString}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: request.headers.get("Authorization") || "",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          return NextResponse.json(data, { status: 200 });
        }
      }
    } catch {
      // Backend not running or timed out; fall through to direct Supabase query
    }
  }

  try {
    const result = await fetchFromSupabase(request);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Operations part-time Supabase error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Part-time verileri alınamadı",
        details: error?.message || "",
      },
      { status: 500 },
    );
  }
}

