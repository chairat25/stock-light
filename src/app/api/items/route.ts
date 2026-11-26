import { NextResponse } from 'next/server';
import { getLocalItems, getPgPool, isPostgresConfigured } from '@/lib/db';

export async function GET() {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const items = await getLocalItems();
    return NextResponse.json(items);
  } catch (err) {
    console.error('[GET /api/items]', err);
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const pool = getPgPool();
    const { rows } = await pool.query(
      `insert into public.items (
         zone_id, name, category, quantity, unit, location_detail,
         has_expiry, expiry_date, item_photo_url, spot_photo_url, notes
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning
         id, user_id, zone_id, name, category, quantity, unit, location_detail,
         has_expiry, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date,
         item_photo_url, spot_photo_url, notes, created_at, updated_at`,
      [
        body.zone_id || null,
        name,
        String(body.category || 'ของใช้ทั่วไป'),
        Math.max(0, Number(body.quantity) || 0),
        String(body.unit || 'ชิ้น'),
        String(body.location_detail || ''),
        Boolean(body.has_expiry),
        body.has_expiry && body.expiry_date ? body.expiry_date : null,
        body.item_photo_url || null,
        body.spot_photo_url || null,
        String(body.notes || ''),
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/items]', err);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
