'use client';

import { useState } from 'react';
import { MapPin, Minus, Plus, Camera, Clock, Package } from 'lucide-react';
import type { InventoryItem, Zone } from '@/types/inventory';
import { formatExpiryLabel, getExpiryStatus } from '@/lib/inventory-helpers';

interface ItemCardProps {
  item: InventoryItem;
  zone?: Zone;
  onSelect: (item: InventoryItem) => void;
  onAdjustQuantity: (item: InventoryItem, delta: number) => void;
}

export function ItemCard({ item, zone, onSelect, onAdjustQuantity }: ItemCardProps) {
  const [photoView, setPhotoView] = useState<'item' | 'spot'>('item');

  const hasDualPhotos = Boolean(item.item_photo_url && item.spot_photo_url && item.item_photo_url !== item.spot_photo_url);
  const activePhoto =
    photoView === 'spot'
      ? item.spot_photo_url || item.item_photo_url
      : item.item_photo_url || item.spot_photo_url;

  const expiryStatus = getExpiryStatus(item);
  const expiryLabel = formatExpiryLabel(item);

  return (
    <article className="item-card" id={`item-card-${item.id}`}>
      <div className="card-media" onClick={() => onSelect(item)} role="button" tabIndex={0}>
        {activePhoto ? (
          <img
            src={activePhoto}
            alt={photoView === 'spot' ? `จุดที่เก็บ ${item.name}` : item.name}
            loading="lazy"
          />
        ) : (
          <div className="card-media-empty">
            <Camera size={22} strokeWidth={1.6} />
            <span>ยังไม่มีภาพถ่าย</span>
          </div>
        )}

        {(item.item_photo_url || item.spot_photo_url) && (
          <div
            className="photo-mode-switch"
            onClick={(e) => e.stopPropagation()}
            aria-label="สลับภาพตัวของกับจุดที่เก็บ"
          >
            <button
              type="button"
              className={`photo-mode-btn ${photoView === 'item' ? 'active' : ''}`}
              onClick={() => setPhotoView('item')}
            >
              <Package size={12} />
              ตัวของ
            </button>
            <button
              type="button"
              className={`photo-mode-btn ${photoView === 'spot' ? 'active' : ''}`}
              onClick={() => setPhotoView('spot')}
              title={hasDualPhotos ? 'ดูภาพจุดที่วางในห้อง' : 'ดูภาพตำแหน่งจัดเก็บ'}
            >
              <MapPin size={12} />
              จุดที่เก็บ
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-meta-row">
          <span className="zone-tag">
            <MapPin size={13} strokeWidth={1.8} />
            {zone?.name || 'ยังไม่ระบุโซน'}
          </span>

          <span className={`expiry-badge ${expiryStatus}`}>
            {item.has_expiry && <Clock size={11} strokeWidth={2} />}
            {expiryLabel}
          </span>
        </div>

        <h3 className="card-title" onClick={() => onSelect(item)}>
          {item.name}
        </h3>

        <p className="card-location">
          {item.location_detail || 'ยังไม่ได้ระบุตำแหน่งละเอียดในห้อง'}
        </p>

        <div className="card-footer">
          <div className="qty-stepper" aria-label={`จำนวน ${item.name}`}>
            <button
              type="button"
              className="qty-btn"
              onClick={() => onAdjustQuantity(item, -1)}
              disabled={item.quantity <= 0}
              aria-label="ลดจำนวน"
            >
              <Minus size={14} />
            </button>
            <span className="qty-value">
              {item.quantity}
              <span className="qty-unit">{item.unit}</span>
            </span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => onAdjustQuantity(item, 1)}
              aria-label="เพิ่มจำนวน"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            onClick={() => onSelect(item)}
          >
            รายละเอียด
          </button>
        </div>
      </div>
    </article>
  );
}
