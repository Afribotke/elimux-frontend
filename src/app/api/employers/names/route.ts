import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const resp = await fetch(`${apiUrl}/api/employer-names/search?q=${encodeURIComponent(q)}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Employer Search API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
