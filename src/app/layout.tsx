import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Stock Light — ระบบเก็บนับของใช้ในห้อง',
  description:
    'บันทึกและติดตามของใช้ในห้อง จำนวนคงเหลือ วันหมดอายุ ตำแหน่งที่จัดเก็บ พร้อมภาพถ่ายตัวสินค้าและจุดที่วางในห้อง',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${ibmPlexSansThai.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
