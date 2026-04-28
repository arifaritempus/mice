import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const queryString = query ? `?${query}` : '';
    const backendUrl = `${BACKEND_URL}/api/reports/data${queryString}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Reports data proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: error?.message || '' },
      { status: 500 }
    );
  }
}
