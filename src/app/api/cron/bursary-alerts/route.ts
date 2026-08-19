import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bursary/cron/check-alerts`, {
    method: 'POST',
    headers: { 'X-Cron-Secret': process.env.CRON_SECRET! },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
