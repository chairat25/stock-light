import type { InventoryItem, Zone } from '@/types/inventory';

function offsetDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEMO_ZONES: Zone[] = [
  {
    id: 'zone-desk',
    name: 'โต๊ะทำงาน',
    description: 'ลิ้นชักและชั้นวางเหนือโต๊ะทำงาน',
    sort_order: 1,
  },
  {
    id: 'zone-closet',
    name: 'ตู้เสื้อผ้า',
    description: 'ชั้นบนสุด กล่องผ้าลินิน และราวแขวน',
    sort_order: 2,
  },
  {
    id: 'zone-bath',
    name: 'ห้องน้ำ / อ่างล้างหน้า',
    description: 'ชั้นไม้ติดผนังและตู้กระจก',
    sort_order: 3,
  },
  {
    id: 'zone-pantry',
    name: 'มุมชงกาแฟ / ของกิน',
    description: 'เคาน์เตอร์ไม้ริมหน้าต่างและชั้นวางของแห้ง',
    sort_order: 4,
  },
];

export function createDemoItems(): InventoryItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'item-vitc',
      zone_id: 'zone-desk',
      name: 'วิตามินซี 1000mg (ขวดแก้วสีชา)',
      category: 'ยาและวิตามิน',
      quantity: 2,
      unit: 'ขวด',
      location_detail: 'ชั้นวางไม้เหนือโต๊ะทำงาน ด้านขวาติดหน้าต่าง',
      has_expiry: true,
      expiry_date: offsetDate(14),
      item_photo_url: '/demo/vitamins.jpg',
      spot_photo_url: '/demo/desk-drawer.jpg',
      notes: 'ทานวันละ 1 เม็ดหลังอาหารเช้า ขวดสำรองยังไม่ได้แกะซีล',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'item-cables-aa',
      zone_id: 'zone-desk',
      name: 'ถ่านชาร์จ AA Eneloop + สาย USB-C สำรอง',
      category: 'อุปกรณ์อิเล็กทรอนิกส์',
      quantity: 6,
      unit: 'ก้อน',
      location_detail: 'ลิ้นชักซ้ายของโต๊ะทำงาน ช่องแบ่งกลาง',
      has_expiry: false,
      expiry_date: null,
      item_photo_url: '/demo/desk-drawer.jpg',
      spot_photo_url: '/demo/desk-drawer.jpg',
      notes: 'ชาร์จเต็มไว้แล้ว 4 ก้อน อยู่ในช่องไม้ถัดจากกระเป๋าผ้าสีเขียว',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'item-skincare',
      zone_id: 'zone-bath',
      name: 'เซ็ตคลีนเซอร์ & โทนเนอร์บำรุงผิว',
      category: 'ของใช้ส่วนตัว / สกินแคร์',
      quantity: 3,
      unit: 'ขวด',
      location_detail: 'ชั้นไม้ติดผนังข้างกระจกห้องน้ำ ถัดจากผ้าเช็ดหน้าสีขาว',
      has_expiry: true,
      expiry_date: offsetDate(145),
      item_photo_url: '/demo/skincare.jpg',
      spot_photo_url: '/demo/skincare.jpg',
      notes: 'เปิดใช้แล้วเมื่อเดือนก่อน เหลือประมาณ 70%',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'item-coffee',
      zone_id: 'zone-pantry',
      name: 'เมล็ดกาแฟคั่วกลาง (ถุงคราฟท์ 250g)',
      category: 'อาหารและเครื่องดื่ม',
      quantity: 1,
      unit: 'ถุง',
      location_detail: 'เคาน์เตอร์ไม้ริมหน้าต่าง ข้างโถเซรามิกฝาไม้',
      has_expiry: true,
      expiry_date: offsetDate(-3),
      item_photo_url: '/demo/coffee.jpg',
      spot_photo_url: '/demo/coffee.jpg',
      notes: 'คั่วเมื่อ 3 เดือนก่อน ควรรีบชงให้หมดหรือใช้ดับกลิ่นตู้เย็น',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'item-closet-boxes',
      zone_id: 'zone-closet',
      name: 'ผ้าปูที่นอนสำรอง & ปลอกหมอนลินิน',
      category: 'เสื้อผ้าและผ้า',
      quantity: 2,
      unit: 'ชุด',
      location_detail: 'ตู้เสื้อผ้า ชั้นบนสุด กล่องผ้าลินินใบที่ 2 นับจากซ้าย',
      has_expiry: false,
      expiry_date: null,
      item_photo_url: '/demo/closet.jpg',
      spot_photo_url: '/demo/closet.jpg',
      notes: 'ซักรีดเรียบร้อยแล้ว ใส่ซองกันชื้นไว้ด้านในกล่อง',
      created_at: now,
      updated_at: now,
    },
  ];
}
