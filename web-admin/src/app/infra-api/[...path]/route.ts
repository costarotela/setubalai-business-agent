import { NextRequest, NextResponse } from 'next/server';

const INFRA_API_BASE = 'http://localhost:9993';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/infra-api', '');
  const search = request.nextUrl.search;
  const url = `${INFRA_API_BASE}${path}${search}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Infrastructure API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from infrastructure API', details: error.message },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/infra-api', '');
  const url = `${INFRA_API_BASE}${path}`;

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Infrastructure API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to post to infrastructure API', details: error.message },
      { status: 502 }
    );
  }
}
