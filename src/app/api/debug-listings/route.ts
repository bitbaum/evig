import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await import('@/db');
    const { listings } = await import('@/db/schema');
    const result = await db.select().from(listings).limit(1);
    return NextResponse.json({ ok: true, count: result.length });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ 
      ok: false, 
      error: error.message, 
      stack: error.stack?.split('\n').slice(0, 5) 
    }, { status: 500 });
  }
}
