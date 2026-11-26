'use client';

import { useState } from 'react';
import { X, MapPin, Clock, Minus, Plus, Pencil, Trash2, Package, Tag } from 'lucide-react';
import type { InventoryItem, Zone } from '@/types/inventory';
import {
  formatExpiryLabel,
  formatThaiDate,
  getExpiryStatus,
} from '@/lib/inventory-helpers';

interface ItemDrawerProps {
  item: InventoryItem;
  zone?: Zone;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onAdjustQuantity: (item: InventoryItem, delta: number) => void;
}

export function ItemDrawer({
  item,
  zone,
  onClose,
  onEdit,
  onDelete,
  onAdjustQuantity,
}: ItemDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expiryStatus = getExpiryStatus(item);
  const expiryLabel = formatExpiryLabel(item);

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>{item.category}</div>
            <h2 className="modal-title">{item.name}</h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="ปิดรายละเอียด"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.25rem' }}>
          {/* Dual Photo Showcase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {item.item_photo_url && (
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Package size={13} />
                  ภาพตัวสิ่งของ
                </div>
                <img
                  src={item.item_photo_url}
                  alt={item.name}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                  }}
                />
              </div>
            )}

            {item.spot_photo_url && (
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    marginBottom: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <MapPin size={13} />
                  จุดที่วางในห้อง (&ldquo;ชิ้นนี้อยู่ตรงนี้ของห้องนะ&rdquo;)
                </div>
                <img
                  src={item.spot_photo_url}
                  alt={`ตำแหน่งจัดเก็บ ${item.name}`}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent-border)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Quantity Adjuster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1rem',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>จำนวนคงเหลือ</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                }}
              >
                {item.quantity}{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontSize: '0.88rem',
                    fontWeight: 400,
                    color: 'var(--ink-secondary)',
                  }}
                >
                  {item.unit}
                </span>
              </div>
            </div>

            <div className="qty-stepper">
              <button
                type="button"
                className="qty-btn"
                onClick={() => onAdjustQuantity(item, -1)}
                disabled={item.quantity <= 0}
                aria-label="ลดจำนวน"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                className="qty-btn"
                onClick={() => onAdjustQuantity(item, 1)}
                aria-label="เพิ่มจำนวน"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>ตำแหน่งในห้อง</div>
                <div style={{ fontWeight: 500 }}>{zone?.name || 'ยังไม่ระบุโซน'}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                  {item.location_detail || 'ไม่ได้ระบุรายละเอียดตำแหน่ง'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <Clock size={16} color="var(--ink-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>สถานะวันหมดอายุ</div>
                <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`expiry-badge ${expiryStatus}`}>{expiryLabel}</span>
                  {item.has_expiry && item.expiry_date && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.8rem',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      ({formatThaiDate(item.expiry_date)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <Tag size={16} color="var(--ink-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>บันทึกเพิ่มเติม</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                  {item.notes || '— ไม่มีบันทึกเพิ่มเติม —'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {!confirmDelete ? (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: 'var(--status-danger-fg)' }}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} />
              ลบรายการ
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(item)}
              >
                ยืนยันการลบ
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                ยกเลิก
              </button>
            </div>
          )}

          <button type="button" className="btn btn-primary" onClick={() => onEdit(item)}>
            <Pencil size={15} />
            แก้ไขข้อมูล
          </button>
        </div>
      </aside>
    </div>
  );
}
