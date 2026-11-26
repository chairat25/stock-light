import type { ExpiryStatus, InventoryItem } from '@/types/inventory';

export const DEFAULT_CATEGORIES = [
  'อาหารและเครื่องดื่ม',
  'ยาและวิตามิน',
  'ของใช้ส่วนตัว / สกินแคร์',
  'อุปกรณ์อิเล็กทรอนิกส์',
  'เสื้อผ้าและผ้า',
  'ของใช้ทั่วไป',
  'อุปกรณ์ทำความสะอาด',
];

export const DEFAULT_UNITS = ['ชิ้น', 'ขวด', 'กล่อง', 'ซอง', 'แพ็ค', 'ม้วน', 'หลอด', 'ถุง', 'คู่'];

export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = expiryDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(item: Pick<InventoryItem, 'has_expiry' | 'expiry_date'>): ExpiryStatus {
  if (!item.has_expiry || !item.expiry_date) return 'none';
  const days = getDaysUntilExpiry(item.expiry_date);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'ok';
}

export function formatExpiryLabel(item: Pick<InventoryItem, 'has_expiry' | 'expiry_date'>): string {
  if (!item.has_expiry || !item.expiry_date) {
    return 'ไม่มีวันหมดอายุ';
  }
  const days = getDaysUntilExpiry(item.expiry_date);
  if (days === null) return 'ไม่มีวันหมดอายุ';
  if (days < 0) return `หมดอายุแล้ว ${Math.abs(days)} วัน`;
  if (days === 0) return 'หมดอายุวันนี้';
  if (days <= 30) return `อีก ${days} วันหมดอายุ`;
  return `หมดอายุ ${formatThaiDate(item.expiry_date)}`;
}

export function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  return `${d} ${months[m - 1]} ${y + 543}`;
}

/**
 * Compresses an image file on the client before uploading (or storing in demo mode)
 * to keep uploads fast and bandwidth light.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          resolve({ blob, dataUrl });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Cannot load image'));
    };

    img.src = objectUrl;
  });
}
