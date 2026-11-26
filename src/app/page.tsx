import { redirect } from 'next/navigation';
import {
  createSupabaseServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';
import { getLocalItems, getLocalZones, isPostgresConfigured } from '@/lib/db';
import { DEMO_ZONES, createDemoItems } from '@/lib/demo-data';
import { InventoryApp } from '@/components/InventoryApp';
import type { AuthUser, InventoryItem, Zone } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabaseReady = isSupabaseServerConfigured();

  // 1. Supabase Cloud Mode (Auth SSO + Supabase PostgreSQL)
  if (supabaseReady) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect('/login');
      }

      const [{ data: zonesData }, { data: itemsData }] = await Promise.all([
        supabase.from('zones').select('*').order('sort_order', { ascending: true }),
        supabase.from('items').select('*').order('updated_at', { ascending: false }),
      ]);

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split('@')[0] ||
          'ผู้ใช้งาน',
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        isDemo: false,
      };

      return (
        <InventoryApp
          user={authUser}
          initialZones={(zonesData as Zone[]) || []}
          initialItems={(itemsData as InventoryItem[]) || []}
          storageMode="supabase"
        />
      );
    }
  }

  // 2. Local Docker PostgreSQL Mode (via DATABASE_URL)
  if (isPostgresConfigured()) {
    try {
      const [zonesData, itemsData] = await Promise.all([
        getLocalZones(),
        getLocalItems(),
      ]);

      const localUser: AuthUser = {
        id: 'local-user',
        email: 'local@docker.postgres',
        name: 'Local DB',
        isDemo: false,
      };

      return (
        <InventoryApp
          user={localUser}
          initialZones={zonesData}
          initialItems={itemsData}
          storageMode="postgres"
        />
      );
    } catch (err) {
      console.error('[Local Postgres Load Error]', err);
    }
  }

  // 3. Interactive Demo Mode (LocalStorage)
  const demoUser: AuthUser = {
    id: 'demo-user',
    email: 'demo@stock-light.local',
    name: 'Demo',
    isDemo: true,
  };

  return (
    <InventoryApp
      user={demoUser}
      initialZones={DEMO_ZONES}
      initialItems={createDemoItems()}
      storageMode="demo"
    />
  );
}
