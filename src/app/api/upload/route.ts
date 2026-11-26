import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { createSupabaseServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
]);

export async function POST(request: Request) {
  try {
    // 1. If Supabase is configured, require an authenticated user
    let userFolder = 'local';
    if (isSupabaseServerConfigured()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

      if (!user) {
        return NextResponse.json(
          { error: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ' },
          { status: 401 }
        );
      }
      userFolder = user.id;
    }

    const r2Ready = isR2Configured();
    const localUploadDir = process.env.LOCAL_UPLOAD_DIR;

    // 2. If neither R2 nor local Docker volume upload is configured, use client demo fallback
    if (!r2Ready && !localUploadDir) {
      return NextResponse.json({
        mode: 'local-fallback',
        message: 'Cloudflare R2 ยังไม่ได้ตั้งค่า ระบบจะเก็บรูปในโหมดทดลองชั่วคราว',
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') || 'item').replace(/[^a-z0-9_-]/gi, '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพที่อัปโหลด' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP หรือ AVIF เท่านั้น' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์ต้องไม่เกิน 10 MB' },
        { status: 400 }
      );
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const randomId = crypto.randomBytes(8).toString('hex');
    const datePrefix = new Date().toISOString().slice(0, 10);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (r2Ready) {
      const key = `stock-light/${userFolder}/${datePrefix}/${kind}-${randomId}.${ext}`;
      const url = await uploadToR2({
        key,
        body: buffer,
        contentType: file.type,
      });

      return NextResponse.json({
        mode: 'cloudflare-r2',
        url,
        key,
      });
    }

    // Persist to Docker volume / local disk directory
    const filename = `${datePrefix}-${kind}-${randomId}.${ext}`;
    await mkdir(localUploadDir!, { recursive: true });
    await writeFile(path.join(localUploadDir!, filename), buffer);

    return NextResponse.json({
      mode: 'local-disk',
      url: `/api/uploads/${filename}`,
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปโหลดรูปภาพได้' },
      { status: 500 }
    );
  }
}
