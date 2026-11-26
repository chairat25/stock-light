export type ExpiryStatus = 'none' | 'ok' | 'expiring_soon' | 'expired';

export interface Zone {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  sort_order: number;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  user_id?: string;
  zone_id: string | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location_detail: string;
  has_expiry: boolean;
  expiry_date: string | null; // YYYY-MM-DD
  item_photo_url: string | null;
  spot_photo_url: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ItemFormInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  zone_id: string | null;
  location_detail: string;
  has_expiry: boolean;
  expiry_date: string | null;
  item_photo_url: string | null;
  spot_photo_url: string | null;
  notes: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  isDemo: boolean;
}
