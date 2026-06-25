import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const backendUrl = `${BACKEND_URL}/api/flight-tickets/${path.join("/")}${queryString}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Flight tickets GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const body = await request.json();

    const backendUrl = `${BACKEND_URL}/api/flight-tickets/${path.join("/")}`;
    console.log("🔵 Next.js API Route: POST isteği gönderiliyor:", backendUrl);
    console.log(
      "🔵 Next.js API Route: Gönderilen body:",
      JSON.stringify(body, null, 2),
    );

    let response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: request.headers.get("Authorization") || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (fetchError: any) {
      console.error("❌ Backend bağlantı hatası:", fetchError);
      return NextResponse.json(
        {
          error: "Backend sunucusuna bağlanılamadı",
          details:
            fetchError?.message ||
            "Backend çalışmıyor olabilir. Lütfen backend sunucusunun çalıştığından emin olun.",
          backendUrl,
        },
        { status: 503 },
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("❌ Response JSON parse hatası:", jsonError);
      const text = await response.text();
      console.error("❌ Response text:", text);
      return NextResponse.json(
        {
          error: "Backend yanıtı parse edilemedi",
          details: text.substring(0, 500),
        },
        { status: response.status || 500 },
      );
    }

    console.log(
      "🔵 Next.js API Route: Backend response status:",
      response.status,
    );
    console.log(
      "🔵 Next.js API Route: Backend response data:",
      JSON.stringify(data, null, 2),
    );

    if (!response.ok) {
      console.error("❌ Next.js API Route: Backend hatası:", data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("❌ Flight tickets POST error:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const body = await request.json();

    const backendUrl = `${BACKEND_URL}/api/flight-tickets/${path.join("/")}`;
    console.log("🔵 Next.js API Route: PUT isteği gönderiliyor:", backendUrl);
    console.log(
      "🔵 Next.js API Route: Gönderilen body:",
      JSON.stringify(body, null, 2),
    );

    let response;
    try {
      response = await fetch(backendUrl, {
        method: "PUT",
        headers: {
          Authorization: request.headers.get("Authorization") || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (fetchError: any) {
      console.error("❌ Backend bağlantı hatası:", fetchError);
      return NextResponse.json(
        {
          error: "Backend sunucusuna bağlanılamadı",
          details:
            fetchError?.message ||
            "Backend çalışmıyor olabilir. Lütfen backend sunucusunun çalıştığından emin olun.",
          backendUrl,
        },
        { status: 503 },
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("❌ Response JSON parse hatası:", jsonError);
      const text = await response.text();
      console.error("❌ Response text:", text);
      return NextResponse.json(
        {
          error: "Backend yanıtı parse edilemedi",
          details: text.substring(0, 500),
        },
        { status: response.status || 500 },
      );
    }

    console.log(
      "🔵 Next.js API Route: Backend response status:",
      response.status,
    );
    console.log(
      "🔵 Next.js API Route: Backend response data:",
      JSON.stringify(data, null, 2),
    );

    if (!response.ok) {
      console.error("❌ Next.js API Route: Backend hatası:", data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("❌ Flight tickets PUT error:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;

    const backendUrl = `${BACKEND_URL}/api/flight-tickets/${path.join("/")}`;

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Flight tickets DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
