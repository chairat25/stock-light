'use client';

import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface ZoneModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export function ZoneModal({ onClose, onCreate }: ZoneModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <MapPin size={18} color="var(--accent)" />
            เพิ่มโซนใหม่ในห้อง
          </h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field-group">
              <label className="field-label" htmlFor="zone-name">
                ชื่อโซน / บริเวณในห้อง *
              </label>
              <input
                id="zone-name"
                type="text"
                className="field-input"
                placeholder="เช่น ใต้เตียง, ชั้นวางหนังสือ, ระเบียง, ตู้เย็น"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="zone-desc">
                คำอธิบายสั้นๆ (ไม่บังคับ)
              </label>
              <input
                id="zone-desc"
                type="text"
                className="field-input"
                placeholder="เช่น กล่องพลาสติกใส 3 ใบฝั่งหัวเตียง"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'กำลังเพิ่ม...' : 'เพิ่มโซน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
