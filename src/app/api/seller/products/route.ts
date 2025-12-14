import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasPermission } from '@/middleware/admin'
import { PERMISSIONS } from '@/lib/constants'
import { getMedusaConfig } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

// POST /api/seller/products
// Creates a Medusa product on behalf of the signed-in seller
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const canSell = await hasPermission(PERMISSIONS.SELL_PRODUCTS)
    if (!canSell) {
      return NextResponse.json({ error: 'Verkauf nicht erlaubt' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      price, // CHF as string or number
      category,
      brand,
      condition,
      location,
      imageUrls = [], // from /api/uploads
      publish = true, // default publish
    } = body || {}

    if (!title || !price || !condition || !location) {
      return NextResponse.json({ error: 'Erforderliche Felder fehlen' }, { status: 400 })
    }

    const amount = Math.round(Number(price) * 100)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Ungültiger Preis' }, { status: 400 })
    }

    const medusa = getMedusaConfig()
    if (!medusa.backendUrl || !medusa.adminApiKey) {
      return NextResponse.json({ error: 'Medusa Admin API nicht konfiguriert' }, { status: 500 })
    }

    const payload = {
      title,
      description: description || undefined,
      status: publish ? 'published' : 'draft',
      options: [{ title: 'Default' }],
      variants: [
        {
          title: 'Default',
          prices: [
            {
              amount,
              currency_code: 'chf',
            },
          ],
        },
      ],
      images: imageUrls,
      metadata: {
        seller_user_id: session.user.id,
        seller_type: 'private',
        condition,
        location,
        brand: brand || undefined,
        category: category || undefined,
        fulfillment: 'direct_seller',
        review_status: publish ? 'auto' : 'pending',
        // helpful linking from storefront → dashboard
        source: 'revampit-community',
      },
    }

    const resp = await fetch(`${medusa.backendUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${medusa.adminApiKey}`,
        // also include publishable in case of gateway checks
        'x-publishable-api-key': medusa.publishableKey || '',
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('Medusa create product failed', resp.status, text)
      return NextResponse.json({ error: 'Produktanlage fehlgeschlagen' }, { status: 502 })
    }

    const data = await resp.json()
    return NextResponse.json({ ok: true, product: data.product || data })
  } catch (error) {
    console.error('Seller product error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

