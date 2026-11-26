import { NextResponse } from 'next/server';
import { getPgPool, isPostgresConfigured } from '@/lib/db';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const pool = getPgPool();

    // Quick quantity-only update
    if (Object.keys(body).length === 1 && typeof body.quantity === 'number') {
      const { rows } = await pool.query(
        `update public.items
         set quantity = $1
         where id = $2
         returning
           id, user_id, zone_id, name, category, quantity, unit, location_detail,
           has_expiry, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date,
           item_photo_url, spot_photo_url, notes, created_at, updated_at`,
        [Math.max(0, body.quantity), id]
      );
      if (!rows[0]) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    const { rows } = await pool.query(
      `update public.items
       set
         zone_id = $1,
         name = $2,
         category = $3,
         quantity = $4,
         unit = $5,
         location_detail = $6,
         has_expiry = $7,
         expiry_date = $8,
         item_photo_url = $9,
         spot_photo_url = $10,
         notes = $11
       where id = $12
       returning
         id, user_id, zone_id, name, category, quantity, unit, location_detail,
         has_expiry, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date,
         item_photo_url, spot_photo_url, notes, created_at, updated_at`,
      [
        body.zone_id || null,
        String(body.name || '').trim(),
        String(body.category || 'ของใช้ทั่วไป'),
        Math.max(0, Number(body.quantity) || 0),
        String(body.unit || 'ชิ้น'),
        String(body.location_detail || ''),
        Boolean(body.has_expiry),
        body.has_expiry && body.expiry_date ? body.expiry_date : null,
        body.item_photo_url || null,
        body.spot_photo_url || null,
        String(body.notes || ''),
        id,
      ]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[PATCH /api/items/[id]]', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const { id } = await context.params;
    const pool = getPgPool();
    await pool.query(`delete from public.items where id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/items/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
