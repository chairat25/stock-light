# Changelog

All notable changes to **Stock Light** will be documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.1] - 2026-11-25

### Added
- **Inline Add-to-List in Item Modal**: Users can now add new options directly inside every dropdown list (**โซนในห้อง**, **หมวดหมู่**, และ **หน่วยนับ**) via both an inline `+ เพิ่ม` button and a `+ เพิ่ม...ใหม่...` dropdown option, auto-selecting and persisting the newly added option immediately.

### Changed
- Updated default Next.js dev/start port in `package.json` from `3000` to `3090` to avoid local port conflicts.

---

## [0.1.0] - 2026-11-25

### Added
- **Project Foundation**:
  - Initialized Next.js App Router + TypeScript project with Vanilla CSS design system.
  - Created `PLAN.md`, `CHANGELOG.md`, `.env.example`, and `supabase/schema.sql` (PostgreSQL schema with RLS policies for `zones` and `items`).
- **Anti-Slop Design System**:
  - Warm tactile paper-and-ink palette (`#F7F5F0` canvas, `#1C1B18` ink, `#C4572D` terracotta accent, semantic sage/ochre/brick statuses).
  - Curated typography pairing `IBM Plex Sans Thai`, `Instrument Serif`, and `IBM Plex Mono`.
- **Supabase Auth SSO**:
  - Implemented Supabase SSR client, server helper, middleware session refresh, and `/auth/callback` route.
  - Built `/login` page supporting Google SSO, GitHub SSO, Enterprise OIDC/SAML SSO (`signInWithSSO`), Email Magic Link, and instant Demo Mode fallback.
- **Cloudflare R2 Image Storage**:
  - Built `/api/upload` route using `@aws-sdk/client-s3` to upload item photos and room-spot photos directly to Cloudflare R2 with MIME/size validation.
  - Added client-side image compression and local fallback preview when R2 credentials are not yet configured.
- **Room Inventory UI**:
  - Interactive inventory workspace with single-line typographic ledger summary, room zone filter tabs, live search, expiry status filters, and Grid/List view toggle.
  - Dual-photo cards supporting 1-click toggle between **Item Photo** and **Room Spot Photo** ("จุดที่เก็บ"), plus inline `- / +` quantity stepper.
  - Full Add/Edit item modal (name, quantity, unit, zone, exact location note, optional expiry date toggle, dual photo uploader) and Detail Drawer.
  - Custom Room Zone creator so users can organize spaces matching their actual room.
