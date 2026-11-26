# Stock Light — Master Plan & Roadmap

> ระบบเก็บนับและจัดระเบียบของใช้ในห้อง (Room Inventory & Spatial Storage Tracker)  
> ออกแบบด้วยแนวคิด **Anti-Slop / Editorial Utility** — เรียบง่าย ชัดเจน อบอุ่น ใช้งานได้จริงใน 1–2 แตะ

---

## 1. เป้าหมายหลัก (Core Objectives)

1. **รู้ทันทีว่าในห้องมีอะไรบ้าง** — ค้นหา กรองตามโซน/จุดเก็บ และดูจำนวนคงเหลือได้ทันที
2. **นับจำนวนเพิ่ม/ลดได้ไว** — ปุ่ม `- / +` บนการ์ดของใช้ ไม่ต้องเปิดหน้าแก้ไขทุกครั้ง
3. **ติดตามวันหมดอายุ (มีหรือไม่มีก็ได้)** — แยกชัดเจนระหว่างของที่มีวันหมดอายุ (แจ้งเตือนใกล้หมดอายุ / หมดอายุแล้ว) กับของใช้ทั่วไปที่ไม่มีวันหมดอายุ
4. **จำตำแหน่งในห้องได้แม่นยำ** — ระบุได้ทั้ง **โซน (Zone)** เช่น โต๊ะทำงาน, ตู้เสื้อผ้า, ชั้นวางของ และ **จุดวางเฉพาะ (Spot Detail)** เช่น "ลิ้นชักบนขวา หลังกล่องสีขาว"
5. **ภาพถ่ายคู่ (Dual Photo Context)** — เก็บได้ทั้ง **รูปตัวสิ่งของ** และ **รูปจุดที่วางในห้อง** ("ชิ้นนี้อยู่ตรงนี้ของห้องนะ") อัปโหลดขึ้น **Cloudflare R2**
6. **ระบบยืนยันตัวตน (Authentication)** — รองรับ **Supabase Auth SSO** (Google, GitHub, Enterprise OIDC/SAML SSO, Magic Link, Email/Password) พร้อม **Demo Mode** ให้ทดลองใช้งานได้ทันทีแม้ยังไม่ได้ตั้งค่าคีย์

---

## 2. สถาปัตยกรรมระบบ (System Architecture)

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend & API** | Next.js (App Router, TypeScript) | รวม UI และ Server API Routes ไว้ในโปรเจกต์เดียว ป้องกัน secret key หลุดไปฝั่ง client |
| **Styling** | Vanilla CSS + Design Tokens | ควบคุม visual hierarchy, typography, texture และ micro-interactions ได้แม่นยำ ไม่มี generic SaaS bloat |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Auth SSO) | รองรับ OAuth/SSO ครบวงจร พร้อม Row Level Security แยกข้อมูลตาม `user_id` |
| **Image Storage** | Cloudflare R2 (S3-compatible) + Presigned / Server Upload API | ค่าใช้จ่ายต่ำ ไม่มี egress fee รองรับ public CDN domain ของ Cloudflare |
| **Fallback / Demo** | LocalStorage + Indexed-safe compressed images | ใช้งานและทดสอบได้ทันทีในเครื่องโดยไม่ต้องรอตั้งค่า env |

---

## 3. แนวคิดการออกแบบ (Anti-Slop Design System)

- **Visual Direction**: Warm Tactile Home Catalog (แรงบันดาลใจจาก Muji, Kinfolk, Things 3)
- **Color Palette**:
  - Canvas: `#F7F5F0` (Warm Alabaster Paper)
  - Surface: `#FFFFFF` + Hairline Border `#E6E1D6`
  - Primary Ink: `#1C1B18` / Secondary: `#635F56` / Muted: `#938E82`
  - Accent: `#C4572D` (Terracotta Clay)
  - Status: Sage (`#2D6A4F`), Ochre (`#B4690E`), Brick (`#B42318`)
- **Typography**:
  - Body & Thai UI: `IBM Plex Sans Thai`
  - Editorial Accent / Wordmark: `Instrument Serif`
  - Numbers, Dates, Counts: `IBM Plex Mono`
- **Anti-Slop Guardrails**:
  - ไม่มีพื้นหลังสีม่วงนีออน หรือ dark-mode boilerplate
  - ไม่มี Bento Box ยัดไอคอนล้นหน้าจอ หรือ Dashboard widget ที่ไม่จำเป็น
  - ใช้ Ledger Summary แถวเดียวที่คลิกกรองได้จริง

---

## 4. โครงสร้างฐานข้อมูล (Supabase PostgreSQL)

ไฟล์อ้างอิง: [`supabase/schema.sql`](./supabase/schema.sql)

- **`zones`**: เก็บโซน/จุดหลักในห้องของแต่ละผู้ใช้ (`id`, `user_id`, `name`, `description`, `sort_order`, `created_at`)
- **`items`**: เก็บรายการของใช้ (`id`, `user_id`, `zone_id`, `name`, `category`, `quantity`, `unit`, `location_detail`, `has_expiry`, `expiry_date`, `item_photo_url`, `spot_photo_url`, `notes`, `created_at`, `updated_at`)
- **RLS Policies**: ผู้ใช้เข้าถึง อัปเดต และลบได้เฉพาะข้อมูลที่ `auth.uid() = user_id`

---

## 5. แผนการดำเนินงาน (Execution Phases)

### Phase 1 — Foundation, Architecture & Documentation ✅
- [x] วางโครงสร้าง Next.js (App Router, TypeScript, Vanilla CSS)
- [x] สร้าง `PLAN.md`, `CHANGELOG.md`, `.env.example`, `supabase/schema.sql`
- [x] สร้างระบบ Design Tokens และ Typography (`src/app/globals.css`)

### Phase 2 — Auth (Supabase SSO) & Storage (Cloudflare R2) ✅
- [x] ตั้งค่า Supabase SSR client (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] สร้างหน้า `/login` รองรับ Google SSO, GitHub SSO, Enterprise OIDC SSO, Email Magic Link และ Demo Mode
- [x] สร้าง `/auth/callback` สำหรับรับ OAuth/SSO code exchange
- [x] สร้าง `/api/upload` สำหรับอัปโหลดภาพขึ้น Cloudflare R2 (พร้อมตรวจสอบสิทธิ์และชนิดไฟล์ + fallback เมื่อยังไม่ได้ตั้งค่า R2)

### Phase 3 — Core Room Inventory Experience ✅
- [x] ระบบจัดเก็บข้อมูลแบบ Hybrid Repository (สลับอัตโนมัติระหว่าง Supabase DB กับ Demo LocalStorage)
- [x] หน้าหลักคลังของใช้ในห้อง: Ledger Summary, Zone Filter Tabs, Search & Expiry Filter, Grid/List View
- [x] การ์ดของใช้พร้อมปุ่ม `- / +` นับจำนวนทันที และสวิตช์สลับดู **รูปของ** ↔ **รูปจุดที่เก็บ**
- [x] Modal เพิ่ม/แก้ไขรายการ: ใส่ชื่อ, จำนวน, หน่วย, โซน, ตำแหน่งละเอียด, สวิตช์วันหมดอายุ, อัปโหลดรูปคู่ 2 ภาพ
- [x] Drawer ดูรายละเอียดของใช้ + ภาพคู่ขนาดใหญ่ + ปรับจำนวน/ลบรายการ
- [x] ระบบจัดการโซนในห้อง (เพิ่มโซนใหม่ได้ตามผังห้องจริง)

### Phase 4 — Next Milestones (Planned)
- [ ] **Room Visual Map Pinning**: อัปโหลดภาพมุมกว้างของห้องแล้วปักหมุด `(x, y)` บนรูปห้องว่าของชิ้นนี้อยู่ตรงไหน
- [ ] **Barcode / QR Label Print**: พิมพ์สติกเกอร์ QR แปะกล่องเก็บของ สแกนแล้วเห็นรายการในกล่องทันที
- [ ] **Expiry Notifications**: แจ้งเตือนผ่าน Email / LINE Notify / Web Push ก่อนของหมดอายุ 7 วันและ 30 วัน
- [ ] **Quick Audit Mode (โหมดเช็กสต็อกประจำเดือน)**: ไล่ติ๊กตรวจสอบของทีละโซนพร้อมบันทึกประวัติการปรับจำนวน
- [ ] **Export / Backup**: ส่งออกรายการเป็น CSV / JSON
