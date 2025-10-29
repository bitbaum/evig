import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    return NextResponse.json({ ok: true, received: body }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export const dynamic = 'force-dynamic'







