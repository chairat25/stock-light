'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, KeyRound, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';

export default function LoginPage() {
  const supabaseReady = isSupabaseConfigured();
  const [email, setEmail] = useState('');
  const [ssoDomain, setSsoDomain] = useState(
    process.env.NEXT_PUBLIC_SSO_DOMAIN || ''
  );
  const [showEnterpriseSso, setShowEnterpriseSso] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ ANON_KEY ใน .env.local');
      return;
    }
    setError(null);
    setLoading(provider);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(null);
    }
  }

  async function handleEnterpriseSSO(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('ยังไม่ได้ตั้งค่า Supabase ใน .env.local');
      return;
    }
    if (!ssoDomain.trim()) {
      setError('กรุณากรอกโดเมนองค์กรสำหรับ SSO (เช่น company.com)');
      return;
    }
    setError(null);
    setLoading('sso');
    const { data, error: ssoError } = await supabase.auth.signInWithSSO({
      domain: ssoDomain.trim(),
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (ssoError) {
      setError(ssoError.message);
      setLoading(null);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('ยังไม่ได้ตั้งค่า Supabase ใน .env.local');
      return;
    }
    if (!email.trim()) return;
    setError(null);
    setMessage(null);
    setLoading('email');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(null);
    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage('ส่งลิงก์เข้าสู่ระบบไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย');
    }
  }

  return (
    <div className="login-shell">
      {/* Left Editorial Panel */}
      <section className="login-editorial">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: '2rem',
              letterSpacing: '-0.01em',
            }}
          >
            Stock Light
          </div>
          <p style={{ color: 'rgba(244, 240, 232, 0.72)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            บันทึกของใช้ในห้อง พร้อมตำแหน่งที่เก็บและภาพถ่าย
          </p>
        </div>

        <div>
          <img
            src="/demo/desk-drawer.jpg"
            alt="การจัดเก็บของใช้ในห้องอย่างเป็นระเบียบ"
            className="login-editorial-img"
          />
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 500,
              lineHeight: 1.35,
              margin: '0 0 0.75rem',
              maxWidth: '24ch',
            }}
          >
            รู้เสมอว่าของชิ้นนี้อยู่ตรงไหน เหลือกี่ชิ้น และหมดอายุเมื่อไหร่
          </h1>
          <p style={{ color: 'rgba(244, 240, 232, 0.68)', fontSize: '0.9rem', maxWidth: '42ch' }}>
            ยืนยันตัวตนปลอดภัยด้วย Supabase Auth SSO และจัดเก็บภาพถ่ายความละเอียดสูงบน Cloudflare R2
          </p>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'rgba(244, 240, 232, 0.5)' }}>
          Stock Light · Room Inventory Catalog
        </div>
      </section>

      {/* Right Auth Form Pane */}
      <main className="login-form-pane">
        <div className="login-card">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>เข้าสู่ระบบ</h2>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              เลือกวิธีเข้าสู่ระบบผ่าน Supabase Auth SSO เพื่อซิงก์คลังของใช้ในห้องของคุณ
            </p>
          </div>

          {!supabaseReady && (
            <div
              style={{
                padding: '0.8rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-warn-bg)',
                color: 'var(--status-warn-fg)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            >
              <strong>ยังไม่ได้ใส่คีย์ Supabase ใน .env.local</strong> — คุณสามารถคัดลอก{' '}
              <code>.env.example</code> เพื่อเปิดใช้งาน SSO จริง หรือกดทดลองใช้งานใน Demo Mode ด้านล่างได้ทันที
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-danger-bg)',
                color: 'var(--status-danger-fg)',
                fontSize: '0.84rem',
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-ok-bg)',
                color: 'var(--status-ok-fg)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {/* OAuth / SSO Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              type="button"
              className="sso-btn"
              onClick={() => handleOAuth('google')}
              disabled={loading !== null}
            >
              <ShieldCheck size={17} color="var(--accent)" />
              {loading === 'google' ? 'กำลังเชื่อมต่อ Google...' : 'ดำเนินการต่อด้วย Google SSO'}
            </button>

            <button
              type="button"
              className="sso-btn"
              onClick={() => handleOAuth('github')}
              disabled={loading !== null}
            >
              <KeyRound size={17} />
              {loading === 'github' ? 'กำลังเชื่อมต่อ GitHub...' : 'ดำเนินการต่อด้วย GitHub SSO'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem' }}
              onClick={() => setShowEnterpriseSso((v) => !v)}
            >
              {showEnterpriseSso ? 'ซ่อน Enterprise SAML / OIDC SSO' : 'เข้าสู่ระบบด้วย Enterprise SSO (SAML / OIDC)'}
            </button>

            {showEnterpriseSso && (
              <form
                onSubmit={handleEnterpriseSSO}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  padding: '0.85rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <label className="field-label" htmlFor="sso-domain">
                  โดเมนองค์กร (SSO Domain)
                </label>
                <input
                  id="sso-domain"
                  type="text"
                  className="field-input"
                  placeholder="company.com"
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={loading !== null}
                >
                  {loading === 'sso' ? 'กำลังเปลี่ยนเส้นทาง...' : 'เข้าสู่ระบบผ่านองค์กร'}
                </button>
              </form>
            )}
          </div>

          <div className="divider-text">หรือเข้าสู่ระบบด้วยอีเมล</div>

          <form
            onSubmit={handleMagicLink}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div className="field-group">
              <label className="field-label" htmlFor="login-email">
                อีเมล (Magic Link)
              </label>
              <input
                id="login-email"
                type="email"
                className="field-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem' }}
              disabled={loading !== null}
            >
              <Mail size={16} />
              {loading === 'email' ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์เข้าสู่ระบบ'}
            </button>
          </form>

          {!supabaseReady && (
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-hairline)' }}>
              <Link
                href="/"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.7rem' }}
              >
                เข้าใช้งาน Demo Mode ทันที
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
