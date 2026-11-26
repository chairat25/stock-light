# Stock Light — ระบบเก็บนับของใช้ในห้อง

เว็บแอปพลิเคชันสำหรับบันทึกและติดตามของใช้ภายในห้อง รู้ทันทีว่า **มีอะไรบ้าง เหลือกี่ชิ้น หมดอายุเมื่อไหร่ และวางอยู่ตรงไหนของห้อง** พร้อมภาพถ่ายคู่ (ภาพตัวสินค้า + ภาพจุดที่วางในห้อง)

## ฟีเจอร์หลัก (v0.2.0)
- **One-Command Docker Compose**: รัน PostgreSQL 16 + Next.js Service ด้วย `docker compose up -d` คำสั่งเดียวจบ
- **Dual-Photo Context**: เก็บภาพถ่ายได้ 2 มุมต่อ 1 ชิ้น — **รูปตัวสิ่งของ** และ **รูปจุดที่เก็บในห้อง** ("ชิ้นนี้อยู่ตรงนี้ของห้องนะ") อัปโหลดขึ้น **Cloudflare R2** หรือเก็บลง Docker Volume อัตโนมัติ
- **Quick Quantity Stepper**: เพิ่ม/ลดจำนวนคงเหลือได้ทันทีจากหน้าหลัก (`- / +`)
- **Inline Add-to-List**: เพิ่มโซน หมวดหมู่ และหน่วยนับใหม่ได้ทันทีจากใน Dropdown
- **Optional Expiry Tracking**: ระบุได้ว่าของชิ้นนั้นมีวันหมดอายุหรือไม่ พร้อมกรองรายการที่ใกล้หมดอายุ (≤ 30 วัน) และหมดอายุแล้ว
- **Supabase Auth SSO**: รองรับ Google SSO, GitHub SSO, Enterprise SAML/OIDC SSO และ Email Magic Link

---

## รันเร็วที่สุดด้วย Docker Compose (คำสั่งเดียวจบ)

```bash
git clone https://github.com/chairat25/stock-light.git
cd stock-light
docker compose up -d
```

จากนั้นเปิดใช้งานที่ **`http://localhost:3090`** ได้เลย:
- สร้างฐานข้อมูล **PostgreSQL 16** พร้อมตาราง `zones` / `items` และโซนเริ่มต้นให้อัตโนมัติ (พอร์ต `5439` บนเครื่อง host)
- บันทึกข้อมูลและรูปภาพลง Docker Volume ถาวร (`stock_light_pgdata` และ `stock_light_uploads`)
- หากต้องการเปลี่ยนพอร์ตหรือต่อ Supabase / Cloudflare R2 สามารถสร้างไฟล์ `.env` จาก `.env.example` แล้วรัน `docker compose up -d --build`

หยุดการทำงาน:
```bash
docker compose down
```

---

## การรันแบบ Development (ไม่ต้องใช้ Docker)

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
