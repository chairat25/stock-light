'use client';

import { useState, useRef } from 'react';
import { X, Upload, MapPin, Package, Trash2, Loader2, Plus, Check } from 'lucide-react';
import type { InventoryItem, ItemFormInput, Zone } from '@/types/inventory';
import { compressImageFile } from '@/lib/inventory-helpers';

const ADD_NEW_VALUE = '__ADD_NEW__';

interface ItemModalProps {
  initialItem?: InventoryItem | null;
  zones: Zone[];
  categories: string[];
  units: string[];
  onCreateZone: (name: string, description: string) => Promise<Zone | null>;
  onAddCategory: (category: string) => void;
  onAddUnit: (unit: string) => void;
  onClose: () => void;
  onSave: (input: ItemFormInput, existingId?: string) => Promise<void>;
}

export function ItemModal({
  initialItem,
  zones,
  categories,
  units,
  onCreateZone,
  onAddCategory,
  onAddUnit,
  onClose,
  onSave,
}: ItemModalProps) {
  const [name, setName] = useState(initialItem?.name ?? '');
  const [category, setCategory] = useState(
    initialItem?.category ?? categories[0] ?? 'ของใช้ทั่วไป'
  );
  const [quantity, setQuantity] = useState<number>(initialItem?.quantity ?? 1);
  const [unit, setUnit] = useState(initialItem?.unit ?? units[0] ?? 'ชิ้น');
  const [zoneId, setZoneId] = useState<string>(initialItem?.zone_id ?? zones[0]?.id ?? '');
  const [locationDetail, setLocationDetail] = useState(initialItem?.location_detail ?? '');
  const [hasExpiry, setHasExpiry] = useState<boolean>(initialItem?.has_expiry ?? false);
  const [expiryDate, setExpiryDate] = useState<string>(initialItem?.expiry_date ?? '');
  const [itemPhotoUrl, setItemPhotoUrl] = useState<string | null>(
    initialItem?.item_photo_url ?? null
  );
  const [spotPhotoUrl, setSpotPhotoUrl] = useState<string | null>(
    initialItem?.spot_photo_url ?? null
  );
  const [notes, setNotes] = useState(initialItem?.notes ?? '');

  // Inline "Add to list" states for Zone, Category, and Unit
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [creatingZone, setCreatingZone] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const [uploadingSlot, setUploadingSlot] = useState<'item' | 'spot' | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemFileRef = useRef<HTMLInputElement>(null);
  const spotFileRef = useRef<HTMLInputElement>(null);

  async function handleConfirmNewZone() {
    const trimmed = newZoneName.trim();
    if (!trimmed || creatingZone) return;
    setCreatingZone(true);
    try {
      const created = await onCreateZone(trimmed, '');
      if (created) {
        setZoneId(created.id);
      }
      setNewZoneName('');
      setAddingZone(false);
    } finally {
      setCreatingZone(false);
    }
  }

  function handleConfirmNewCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function handleConfirmNewUnit() {
    const trimmed = newUnitName.trim();
    if (!trimmed) return;
    onAddUnit(trimmed);
    setUnit(trimmed);
    setNewUnitName('');
    setAddingUnit(false);
  }

  async function handlePhotoUpload(file: File, slot: 'item' | 'spot') {
    setError(null);
    setUploadingSlot(slot);
    try {
      const { blob, dataUrl } = await compressImageFile(file);

      const formData = new FormData();
      formData.append('file', new File([blob], `${slot}.jpg`, { type: 'image/jpeg' }));
      formData.append('kind', slot);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'อัปโหลดรูปไม่สำเร็จ');
      }

      const finalUrl = data.mode === 'cloudflare-r2' && data.url ? data.url : dataUrl;

      if (data.mode === 'cloudflare-r2') {
        setUploadHint('อัปโหลดภาพขึ้น Cloudflare R2 เรียบร้อยแล้ว');
      } else {
        setUploadHint('บันทึกรูปภาพในโหมดทดลอง (ตั้งค่า Cloudflare R2 ใน .env.local เพื่อเก็บบนคลาวด์)');
      }

      if (slot === 'item') {
        setItemPhotoUrl(finalUrl);
      } else {
        setSpotPhotoUrl(finalUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดระหว่างอัปโหลดรูปภาพ');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณากรอกชื่อสิ่งของ');
      return;
    }
    if (hasExpiry && !expiryDate) {
      setError('กรุณาเลือกวันหมดอายุ หรือปิดสวิตช์หากของชิ้นนี้ไม่มีวันหมดอายุ');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          quantity: Math.max(0, Number(quantity) || 0),
          unit: unit.trim() || 'ชิ้น',
          zone_id: zoneId || null,
          location_detail: locationDetail.trim(),
          has_expiry: hasExpiry,
          expiry_date: hasExpiry ? expiryDate : null,
          item_photo_url: itemPhotoUrl,
          spot_photo_url: spotPhotoUrl,
          notes: notes.trim(),
        },
        initialItem?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialItem ? 'แก้ไขรายการของใช้' : 'เพิ่มของใช้ในห้อง'}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--status-danger-bg)',
                  color: 'var(--status-danger-fg)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Dual Photo Upload */}
            <div className="field-group">
              <span className="field-label">ภาพถ่ายสิ่งของ &amp; จุดที่วางในห้อง (Cloudflare R2)</span>
              <div className="photo-upload-grid">
                {/* Item Photo */}
                <div
                  className="photo-dropzone"
                  onClick={() => itemFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={itemFileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, 'item');
                    }}
                  />
                  {itemPhotoUrl ? (
                    <>
                      <img src={itemPhotoUrl} alt="ภาพตัวสิ่งของ" />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemPhotoUrl(null);
                        }}
                        aria-label="ลบภาพตัวของ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : uploadingSlot === 'item' ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      <span style={{ fontSize: '0.8rem' }}>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <Package size={20} color="var(--ink-secondary)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>รูปตัวสิ่งของ</span>
                      <span style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                        แตะเพื่อถ่ายหรือเลือกรูป
                      </span>
                    </>
                  )}
                </div>

                {/* Spot Photo */}
                <div
                  className="photo-dropzone"
                  onClick={() => spotFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={spotFileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, 'spot');
                    }}
                  />
                  {spotPhotoUrl ? (
                    <>
                      <img src={spotPhotoUrl} alt="ภาพจุดที่วางในห้อง" />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSpotPhotoUrl(null);
                        }}
                        aria-label="ลบภาพจุดที่วาง"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : uploadingSlot === 'spot' ? (
                    <>
                      <Loader2 size={20} />
                      <span style={{ fontSize: '0.8rem' }}>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={20} color="var(--accent)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>รูปจุดที่เก็บในห้อง</span>
                      <span style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                        &ldquo;ชิ้นนี้อยู่ตรงนี้ของห้องนะ&rdquo;
                      </span>
                    </>
                  )}
                </div>
              </div>
              {uploadHint && (
                <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Upload size={12} />
                  {uploadHint}
                </span>
              )}
            </div>

            {/* Name */}
            <div className="field-group">
              <label className="field-label" htmlFor="item-name">
                ชื่อสิ่งของ *
              </label>
              <input
                id="item-name"
                type="text"
                className="field-input"
                placeholder="เช่น วิตามินซี 1000mg, ถ่านชาร์จ AA, กระดาษทิชชู่"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Quantity + Unit (with inline Add Unit) */}
            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="item-qty">
                  จำนวนคงเหลือ
                </label>
                <input
                  id="item-qty"
                  type="number"
                  min={0}
                  className="field-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="field-label" htmlFor="item-unit">
                    หน่วยนับ
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '0.1rem 0.35rem', fontSize: '0.74rem', color: 'var(--accent)' }}
                    onClick={() => setAddingUnit((v) => !v)}
                  >
                    <Plus size={12} />
                    เพิ่มหน่วย
                  </button>
                </div>

                {addingUnit ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="เช่น แผง, แกลลอน"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmNewUnit();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-icon"
                      onClick={handleConfirmNewUnit}
                      aria-label="ยืนยันเพิ่มหน่วยนับ"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => {
                        setAddingUnit(false);
                        setNewUnitName('');
                      }}
                      aria-label="ยกเลิก"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <select
                    id="item-unit"
                    className="field-select"
                    value={unit}
                    onChange={(e) => {
                      if (e.target.value === ADD_NEW_VALUE) {
                        setAddingUnit(true);
                      } else {
                        setUnit(e.target.value);
                      }
                    }}
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value={ADD_NEW_VALUE}>+ เพิ่มหน่วยนับใหม่...</option>
                  </select>
                )}
              </div>
            </div>

            {/* Zone + Category (both with inline Add to list) */}
            <div className="field-row">
              <div className="field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="field-label" htmlFor="item-zone">
                    โซนในห้อง
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '0.1rem 0.35rem', fontSize: '0.74rem', color: 'var(--accent)' }}
                    onClick={() => setAddingZone((v) => !v)}
                  >
                    <Plus size={12} />
                    เพิ่มโซน
                  </button>
                </div>

                {addingZone ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="เช่น ใต้เตียง, ชั้นหนังสือ"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmNewZone();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-icon"
                      onClick={handleConfirmNewZone}
                      disabled={creatingZone}
                      aria-label="ยืนยันเพิ่มโซน"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => {
                        setAddingZone(false);
                        setNewZoneName('');
                      }}
                      aria-label="ยกเลิก"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <select
                    id="item-zone"
                    className="field-select"
                    value={zoneId}
                    onChange={(e) => {
                      if (e.target.value === ADD_NEW_VALUE) {
                        setAddingZone(true);
                      } else {
                        setZoneId(e.target.value);
                      }
                    }}
                  >
                    <option value="">— ยังไม่ระบุโซน —</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                    <option value={ADD_NEW_VALUE}>+ เพิ่มโซนใหม่...</option>
                  </select>
                )}
              </div>

              <div className="field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="field-label" htmlFor="item-category">
                    หมวดหมู่
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '0.1rem 0.35rem', fontSize: '0.74rem', color: 'var(--accent)' }}
                    onClick={() => setAddingCategory((v) => !v)}
                  >
                    <Plus size={12} />
                    เพิ่มหมวดหมู่
                  </button>
                </div>

                {addingCategory ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="เช่น เครื่องเขียน, ของสะสม"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmNewCategory();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-icon"
                      onClick={handleConfirmNewCategory}
                      aria-label="ยืนยันเพิ่มหมวดหมู่"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => {
                        setAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      aria-label="ยกเลิก"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <select
                    id="item-category"
                    className="field-select"
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === ADD_NEW_VALUE) {
                        setAddingCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value={ADD_NEW_VALUE}>+ เพิ่มหมวดหมู่ใหม่...</option>
                  </select>
                )}
              </div>
            </div>

            {/* Exact location detail */}
            <div className="field-group">
              <label className="field-label" htmlFor="item-location">
                อยู่ตรงไหนของห้อง (ระบุจุดละเอียด)
              </label>
              <input
                id="item-location"
                type="text"
                className="field-input"
                placeholder="เช่น ลิ้นชักบนขวา หลังกล่องสีขาว / ชั้น 2 ติดหน้าต่าง"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
              />
            </div>

            {/* Expiry Toggle */}
            <div className="field-group">
              <div className="toggle-row">
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>มีวันหมดอายุหรือไม่?</div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--ink-muted)' }}>
                    เปิดไว้สำหรับอาหาร ยา วิตามิน หรือสกินแคร์ เพื่อให้ระบบช่วยเตือน
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                  />
                  <span className="switch-track" />
                </label>
              </div>

              {hasExpiry && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="field-label" htmlFor="item-expiry-date">
                    วันหมดอายุ
                  </label>
                  <input
                    id="item-expiry-date"
                    type="date"
                    className="field-input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="field-group">
              <label className="field-label" htmlFor="item-notes">
                บันทึกเพิ่มเติม
              </label>
              <textarea
                id="item-notes"
                className="field-textarea"
                placeholder="เช่น ซื้อจากร้านไหน, เปิดใช้เมื่อไหร่, เหลือประมาณกี่เปอร์เซ็นต์"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || uploadingSlot !== null}
            >
              {saving ? 'กำลังบันทึก...' : initialItem ? 'บันทึกการแก้ไข' : 'เพิ่มลงคลังห้อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
