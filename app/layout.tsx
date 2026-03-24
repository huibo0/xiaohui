import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '小惠 - 你的健康小助手',
  description: '专属健康管理小工具，吃药提醒、症状记录、饮食指南',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '小惠',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#fdf2f8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
