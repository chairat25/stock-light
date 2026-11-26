# Stock Light — ระบบเก็บนับของใช้ในห้อง

เว็บแอปพลิเคชันสำหรับบันทึกและติดตามของใช้ภายในห้อง รู้ทันทีว่า **มีอะไรบ้าง เหลือกี่ชิ้น หมดอายุเมื่อไหร่ และวางอยู่ตรงไหนของห้อง** พร้อมภาพถ่ายคู่ (ภาพตัวสินค้า + ภาพจุดที่วางในห้อง)

## ฟีเจอร์หลัก (v0.1.0)
- **Dual-Photo Context**: เก็บภาพถ่ายได้ 2 มุมต่อ 1 ชิ้น — **รูปตัวสิ่งของ** และ **รูปจุดที่เก็บในห้อง** ("ชิ้นนี้อยู่ตรงนี้ของห้องนะ") อัปโหลดขึ้น **Cloudflare R2**
- **Quick Quantity Stepper**: เพิ่ม/ลดจำนวนคงเหลือได้ทันทีจากหน้าหลัก (`- / +`)
- **Optional Expiry Tracking**: ระบุได้ว่าของชิ้นนั้นมีวันหมดอายุหรือไม่ พร้อมกรองรายการที่ใกล้หมดอายุ (≤ 30 วัน) และหมดอายุแล้ว
- **Room Zones & Spot Details**: จัดหมวดหมู่ตามโซนจริงในห้อง (เช่น โต๊ะทำงาน, ตู้เสื้อผ้า, ห้องน้ำ, มุมกาแฟ) เพิ่มโซนเองได้ พร้อมรายละเอียดตำแหน่งชัดเจน
- **Supabase Auth SSO**: รองรับ Google SSO, GitHub SSO, Enterprise SAML/OIDC SSO และ Email Magic Link
- **Instant Demo Mode**: ทดลองใช้งานได้ทันทีโดยไม่ต้องรอตั้งค่า env

## การเริ่มต้นใช้งาน (Setup)

```bash
npm install
cp .env.example .env.local
npm run dev
```

### 1. ตั้งค่า Supabase (Database + Auth SSO)
1. สร้างโปรเจกต์บน [Supabase](https://supabase.com)
2. นำ SQL ใน [`supabase/schema.sql`](./supabase/schema.sql) ไปรันใน **SQL Editor**
3. เปิดใช้งาน OAuth / SSO Providers (Google, GitHub หรือ SAML/OIDC) ใน **Authentication → Providers** และตั้ง Redirect URL เป็น `http://localhost:3090/auth/callback` (และโดเมน Production ของคุณ)
4. ใส่ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน `.env.local`

### 2. ตั้งค่า Cloudflare R2 (Image Storage)
1. สร้าง Bucket ใน **Cloudflare Dashboard → R2** และเปิด Public Access (หรือผูก Custom Domain)
2. สร้าง R2 API Token (สิทธิ์ Object Read & Write)
3. ใส่ค่า `CLOUDFLARE_R2_*` ทั้งหมดใน `.env.local`

## เอกสารการพัฒนาต่อเนื่อง
- แผนงานและ Roadmap: [`PLAN.md`](./PLAN.md)
- ประวัติการเปลี่ยนแปลง: [`CHANGELOG.md`](./CHANGELOG.md)
