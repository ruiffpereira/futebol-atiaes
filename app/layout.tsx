import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Atiães em Movimento · Torneio Futebol 5',
  description: 'Placar ao vivo do torneio',
  manifest: '/manifest.json',
  // iOS não suporta transparência no ícone (fica preto) → usa versão opaca com fundo branco.
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  // black-translucent: a status bar do iOS fica por cima do header verde (texto branco)
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Atiães Futebol' },
};
// topbar verde a condizer com o header (browser + PWA standalone, Android + iOS)
export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
