import { NextResponse } from 'next/server';
import { getLocalZones, getPgPool, isPostgresConfigured } from '@/lib/db';

export async function GET() {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const zones = await getLocalZones();
    return NextResponse.json(zones);
  } catch (err) {
    console.error('[GET /api/zones]', err);
    return NextResponse.json({ error: 'Failed to load zones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: 'PostgreSQL is not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();
    const sortOrder = Number(body.sort_order) || 0;

    if (!name) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    const pool = getPgPool();
    const { rows } = await pool.query(
      `insert into public.zones (name, description, sort_order)
       values ($1, $2, $3)
       returning id, user_id, name, description, sort_order, created_at`,
      [name, description, sortOrder]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/zones]', err);
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
  }
}
