import { Pool } from 'pg';
import type { InventoryItem, Zone } from '@/types/inventory';

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPgPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return globalForPg.pgPool;
}

export async function getLocalZones(): Promise<Zone[]> {
  const pool = getPgPool();
  const { rows } = await pool.query<Zone>(
    `select id, user_id, name, description, sort_order, created_at
     from public.zones
     order by sort_order asc, created_at asc`
  );
  return rows;
}

export async function getLocalItems(): Promise<InventoryItem[]> {
  const pool = getPgPool();
  const { rows } = await pool.query<InventoryItem>(
    `select
       id,
       user_id,
       zone_id,
       name,
       category,
       quantity,
       unit,
       location_detail,
       has_expiry,
       to_char(expiry_date, 'YYYY-MM-DD') as expiry_date,
       item_photo_url,
       spot_photo_url,
       notes,
       created_at,
       updated_at
     from public.items
     order by updated_at desc`
  );
  return rows;
}
