'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  LogOut,
  LogIn,
  MapPin,
  Minus,
  Camera,
  FolderPlus,
} from 'lucide-react';
import type { AuthUser, InventoryItem, ItemFormInput, Zone } from '@/types/inventory';
import { DEMO_ZONES, createDemoItems } from '@/lib/demo-data';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_UNITS,
  formatExpiryLabel,
  getExpiryStatus,
} from '@/lib/inventory-helpers';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ItemCard } from './ItemCard';
import { ItemModal } from './ItemModal';
import { ItemDrawer } from './ItemDrawer';
import { ZoneModal } from './ZoneModal';

const STORAGE_ITEMS_KEY = 'stock_light_demo_items_v1';
const STORAGE_ZONES_KEY = 'stock_light_demo_zones_v1';
const STORAGE_CATEGORIES_KEY = 'stock_light_categories_v1';
const STORAGE_UNITS_KEY = 'stock_light_units_v1';

interface InventoryAppProps {
  user: AuthUser;
  initialZones: Zone[];
  initialItems: InventoryItem[];
  storageMode: 'supabase' | 'postgres' | 'demo';
}

type ExpiryFilter = 'all' | 'expiring_soon' | 'expired' | 'has_expiry' | 'no_expiry';

export function InventoryApp({
  user,
  initialZones,
  initialItems,
  storageMode,
}: InventoryAppProps) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [hydratedDemo, setHydratedDemo] = useState(storageMode !== 'demo');

  const [search, setSearch] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  // Load saved custom categories & units
  useEffect(() => {
    try {
      const savedCats = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      const savedUnits = localStorage.getItem(STORAGE_UNITS_KEY);
      if (savedCats) setCustomCategories(JSON.parse(savedCats));
      if (savedUnits) setCustomUnits(JSON.parse(savedUnits));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Hydrate Demo Mode from localStorage so changes persist across reloads
  useEffect(() => {
    if (!user.isDemo) return;
    try {
      const savedZones = localStorage.getItem(STORAGE_ZONES_KEY);
      const savedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (savedZones) {
        setZones(JSON.parse(savedZones));
      } else {
        setZones(DEMO_ZONES);
      }
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      } else {
        setItems(createDemoItems());
      }
    } catch {
      setZones(DEMO_ZONES);
      setItems(createDemoItems());
    } finally {
      setHydratedDemo(true);
    }
  }, [user.isDemo]);

  useEffect(() => {
    if (!user.isDemo || !hydratedDemo) return;
    try {
      localStorage.setItem(STORAGE_ZONES_KEY, JSON.stringify(zones));
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors in demo mode
    }
  }, [zones, items, user.isDemo, hydratedDemo]);

  const categories = useMemo(() => {
    const set = new Set<string>([...DEFAULT_CATEGORIES, ...customCategories]);
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [customCategories, items]);

  const units = useMemo(() => {
    const set = new Set<string>([...DEFAULT_UNITS, ...customUnits]);
    items.forEach((it) => {
      if (it.unit) set.add(it.unit);
    });
    return Array.from(set);
  }, [customUnits, items]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, Zone>();
    zones.forEach((z) => map.set(z.id, z));
    return map;
  }, [zones]);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let expiringSoon = 0;
    let expired = 0;

    for (const item of items) {
      totalUnits += item.quantity;
      const st = getExpiryStatus(item);
      if (st === 'expiring_soon') expiringSoon++;
      if (st === 'expired') expired++;
    }

    return {
      itemCount: items.length,
      totalUnits,
      expiringSoon,
      expired,
    };
  }, [items]);

  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.zone_id) {
        counts.set(item.zone_id, (counts.get(item.zone_id) || 0) + 1);
      }
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedZoneId !== 'all' && item.zone_id !== selectedZoneId) {
        return false;
      }

      const st = getExpiryStatus(item);
      if (expiryFilter === 'expiring_soon' && st !== 'expiring_soon') return false;
      if (expiryFilter === 'expired' && st !== 'expired') return false;
      if (expiryFilter === 'has_expiry' && !item.has_expiry) return false;
      if (expiryFilter === 'no_expiry' && item.has_expiry) return false;

      if (!q) return true;
      const zName = item.zone_id ? zoneMap.get(item.zone_id)?.name ?? '' : '';
      return (
        item.name.toLowerCase().includes(q) ||
        item.location_detail.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        zName.toLowerCase().includes(q)
      );
    });
  }, [items, search, selectedZoneId, expiryFilter, zoneMap]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  async function handleSaveItem(input: ItemFormInput, existingId?: string) {
    const now = new Date().toISOString();

    if (storageMode === 'demo') {
      if (existingId) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === existingId ? { ...it, ...input, updated_at: now } : it
          )
        );
      } else {
        const newItem: InventoryItem = {
          id: `item-${Date.now()}`,
          ...input,
          created_at: now,
          updated_at: now,
        };
        setItems((prev) => [newItem, ...prev]);
      }
      return;
    }

    if (storageMode === 'postgres') {
      if (existingId) {
        const res = await fetch(`/api/items/${existingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('ไม่สามารถอัปเดตรายการในฐานข้อมูลได้');
        const updated: InventoryItem = await res.json();
        setItems((prev) => prev.map((it) => (it.id === existingId ? updated : it)));
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('ไม่สามารถบันทึกรายการลงฐานข้อมูลได้');
        const created: InventoryItem = await res.json();
        setItems((prev) => [created, ...prev]);
      }
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    if (existingId) {
      const { data, error } = await supabase
        .from('items')
        .update(input)
        .eq('id', existingId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setItems((prev) => prev.map((it) => (it.id === existingId ? data : it)));
    } else {
      const { data, error } = await supabase
        .from('items')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setItems((prev) => [data, ...prev]);
    }
  }

  async function handleAdjustQuantity(item: InventoryItem, delta: number) {
    const nextQty = Math.max(0, item.quantity + delta);
    if (nextQty === item.quantity) return;

    const now = new Date().toISOString();
    // Optimistic update
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, quantity: nextQty, updated_at: now } : it
      )
    );

    if (storageMode === 'postgres') {
      await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: nextQty }),
      });
      return;
    }

    if (storageMode === 'supabase') {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.from('items').update({ quantity: nextQty }).eq('id', item.id);
      }
    }
  }

  async function handleDeleteItem(item: InventoryItem) {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setSelectedItemId(null);

    if (storageMode === 'postgres') {
      await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      return;
    }

    if (storageMode === 'supabase') {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.from('items').delete().eq('id', item.id);
      }
    }
  }

  async function handleCreateZone(name: string, description: string): Promise<Zone | null> {
    if (storageMode === 'demo') {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name,
        description,
        sort_order: zones.length + 1,
      };
      setZones((prev) => [...prev, newZone]);
      return newZone;
    }

    if (storageMode === 'postgres') {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sort_order: zones.length + 1,
        }),
      });
      if (!res.ok) return null;
      const created: Zone = await res.json();
      setZones((prev) => [...prev, created]);
      return created;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('zones')
      .insert({
        user_id: user.id,
        name,
        description,
        sort_order: zones.length + 1,
      })
      .select()
      .single();
    if (!error && data) {
      const created = data as Zone;
      setZones((prev) => [...prev, created]);
      return created;
    }
    return null;
  }

  function handleAddCategory(category: string) {
    setCustomCategories((prev) => {
      if (prev.includes(category)) return prev;
      const next = [...prev, category];
      try {
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  function handleAddUnit(unit: string) {
    setCustomUnits((prev) => {
      if (prev.includes(unit)) return prev;
      const next = [...prev, unit];
      try {
        localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-wordmark">Stock Light</span>
            <span className="brand-subtitle">คลังของใช้ในห้อง</span>
          </div>

          <div className="topbar-actions">
            <button
              id="btn-add-item"
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} />
              เพิ่มของใหม่
            </button>

            <div className="user-pill" title={user.email}>
              <span className="user-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span>{user.isDemo ? 'โหมดทดลอง' : user.name}</span>
            </div>

            {storageMode === 'supabase' ? (
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={handleSignOut}
                title="ออกจากระบบ"
                aria-label="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <Link href="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.8rem' }}>
                <LogIn size={15} />
                เข้าสู่ระบบ SSO
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {storageMode === 'demo' && (
          <div className="notice-bar">
            <span>
              กำลังใช้งานใน <strong>Demo Mode</strong> — เพิ่ม แก้ไข นับจำนวน และอัปโหลดรูปทดสอบได้ทันที
              {' (เชื่อมต่อ Supabase SSO / PostgreSQL และ Cloudflare R2 ได้ในไฟล์ .env.local)'}
            </span>
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
              ดูหน้า Login SSO →
            </Link>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">ของใช้ในห้องของฉัน</h1>
            <p className="page-subtitle">
              เช็กจำนวนคงเหลือ วันหมดอายุ และจุดที่วางพร้อมภาพถ่ายในที่เดียว
            </p>
          </div>
        </div>

        {/* Typographic Ledger Summary (Anti-Slop) */}
        <section className="ledger-strip" aria-label="สรุปสถานะคลังในห้อง">
          <button
            type="button"
            className={`ledger-item ${expiryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setExpiryFilter('all')}
          >
            <span className="ledger-num">{stats.itemCount}</span>
            <span>รายการทั้งหมด</span>
          </button>

          <span className="ledger-divider" />

          <div className="ledger-item" style={{ cursor: 'default' }}>
            <span className="ledger-num">{stats.totalUnits}</span>
            <span>ชิ้นรวมทั้งหมด</span>
          </div>

          <span className="ledger-divider" />

          <button
            type="button"
            className={`ledger-item ${expiryFilter === 'expiring_soon' ? 'active' : ''}`}
            onClick={() =>
              setExpiryFilter(expiryFilter === 'expiring_soon' ? 'all' : 'expiring_soon')
            }
          >
            <span className="ledger-num warn">{stats.expiringSoon}</span>
            <span>ใกล้หมดอายุ (≤ 30 วัน)</span>
          </button>

          <span className="ledger-divider" />

          <button
            type="button"
            className={`ledger-item ${expiryFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setExpiryFilter(expiryFilter === 'expired' ? 'all' : 'expired')}
          >
            <span className="ledger-num danger">{stats.expired}</span>
            <span>หมดอายุแล้ว</span>
          </button>
        </section>

        {/* Controls: Search, Filter, View, Zones */}
        <section className="controls-bar">
          <div className="controls-top">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                id="search-items"
                type="search"
                className="search-input"
                placeholder="ค้นหาชื่อของ ตำแหน่งในห้อง หรือหมวดหมู่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="controls-right">
              <select
                aria-label="กรองตามวันหมดอายุ"
                className="select-compact"
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
              >
                <option value="all">สถานะหมดอายุ: ทั้งหมด</option>
                <option value="expiring_soon">ใกล้หมดอายุ (≤ 30 วัน)</option>
                <option value="expired">หมดอายุแล้ว</option>
                <option value="has_expiry">เฉพาะของที่มีวันหมดอายุ</option>
                <option value="no_expiry">เฉพาะของที่ไม่มีวันหมดอายุ</option>
              </select>

              <div className="view-toggle" role="group" aria-label="รูปแบบการแสดงผล">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="แสดงแบบการ์ด"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="แสดงแบบรายการ"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Room Zones Strip */}
          <div className="zones-strip" role="tablist" aria-label="โซนในห้อง">
            <button
              type="button"
              role="tab"
              aria-selected={selectedZoneId === 'all'}
              className={`zone-pill ${selectedZoneId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedZoneId('all')}
            >
              <span>ทุกโซนในห้อง</span>
              <span className="zone-pill-count">{items.length}</span>
            </button>

            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                role="tab"
                aria-selected={selectedZoneId === z.id}
                className={`zone-pill ${selectedZoneId === z.id ? 'active' : ''}`}
                onClick={() => setSelectedZoneId(z.id)}
              >
                <MapPin size={13} />
                <span>{z.name}</span>
                <span className="zone-pill-count">{zoneCounts.get(z.id) || 0}</span>
              </button>
            ))}

            <button
              type="button"
              className="zone-pill zone-add-pill"
              onClick={() => setZoneModalOpen(true)}
            >
              <FolderPlus size={13} />
              <span>เพิ่มโซน</span>
            </button>
          </div>
        </section>

        {/* Items Display */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 500, color: 'var(--ink-primary)' }}>
              ไม่พบรายการของใช้ที่ตรงกับเงื่อนไข
            </p>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem' }}>
              ลองล้างตัวกรอง หรือกดเพิ่มของชิ้นใหม่พร้อมถ่ายรูปจุดที่วางไว้ในห้อง
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} />
              เพิ่มของใช้ชิ้นแรก
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <section className="items-grid" aria-label="รายการของใช้ในห้อง">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                zone={item.zone_id ? zoneMap.get(item.zone_id) : undefined}
                onSelect={(it) => setSelectedItemId(it.id)}
                onAdjustQuantity={handleAdjustQuantity}
              />
            ))}
          </section>
        ) : (
          <section className="items-list" aria-label="รายการของใช้ในห้องแบบตาราง">
            {filteredItems.map((item) => {
              const zone = item.zone_id ? zoneMap.get(item.zone_id) : undefined;
              const expiryStatus = getExpiryStatus(item);
              const thumb = item.item_photo_url || item.spot_photo_url;
              return (
                <div key={item.id} className="list-row">
                  <div
                    className="list-thumb"
                    onClick={() => setSelectedItemId(item.id)}
                    role="button"
                    tabIndex={0}
                  >
                    {thumb ? <img src={thumb} alt={item.name} /> : <Camera size={16} />}
                  </div>

                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      {zone?.name || 'ยังไม่ระบุโซน'}
                      {item.location_detail ? ` · ${item.location_detail}` : ''}
                    </div>
                  </div>

                  <div className="list-hide-mobile">
                    <span className={`expiry-badge ${expiryStatus}`}>
                      {formatExpiryLabel(item)}
                    </span>
                  </div>

                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleAdjustQuantity(item, -1)}
                      disabled={item.quantity <= 0}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="qty-value">
                      {item.quantity}
                      <span className="qty-unit">{item.unit}</span>
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleAdjustQuantity(item, 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost list-hide-mobile"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* Modals & Drawers */}
      {modalOpen && (
        <ItemModal
          initialItem={editingItem}
          zones={zones}
          categories={categories}
          units={units}
          onCreateZone={handleCreateZone}
          onAddCategory={handleAddCategory}
          onAddUnit={handleAddUnit}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {selectedItem && (
        <ItemDrawer
          item={selectedItem}
          zone={selectedItem.zone_id ? zoneMap.get(selectedItem.zone_id) : undefined}
          onClose={() => setSelectedItemId(null)}
          onEdit={(it) => {
            setSelectedItemId(null);
            setEditingItem(it);
            setModalOpen(true);
          }}
          onDelete={handleDeleteItem}
          onAdjustQuantity={handleAdjustQuantity}
        />
      )}

      {zoneModalOpen && (
        <ZoneModal
          onClose={() => setZoneModalOpen(false)}
          onCreate={async (name, description) => {
            await handleCreateZone(name, description);
          }}
        />
      )}
    </div>
  );
}
