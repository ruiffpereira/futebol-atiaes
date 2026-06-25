import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import { APP_VERSION } from '@/lib/version';

const v = `?v=${APP_VERSION}`;

export const metadata: Metadata = {
  title: 'Atiães em Movimento · Torneio Futebol 5',
  description: 'Placar ao vivo do torneio',
  // o link do manifest é injetado automaticamente pelo app/manifest.ts (/manifest.webmanifest)
  // iOS não suporta transparência no ícone (fica preto) → usa versão opaca com fundo branco.
  icons: { icon: `/icon.png${v}`, apple: `/apple-icon.png${v}` },
  // black-translucent: a status bar do iOS fica por cima do header verde (texto branco)
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Atiães Futebol' },
};
// topbar verde a condizer com o header (browser + PWA standalone, Android + iOS)
export const viewport: Viewport = {
  themeColor: '#15803d', // verde do header (claro); ajustado em runtime para #22c55e no tema dark
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // tranca o pinch-to-zoom em mobile
  userScalable: false,
  viewportFit: 'cover',
};

// Aplica o tema guardado antes da pintura (evita flash de tema errado).
const themeInit = `(function(){try{var m=localStorage.getItem('theme');if(m!=='dark'&&m!=='light'&&m!=='system')m='system';if(m==='dark'||m==='light'){document.documentElement.setAttribute('data-theme',m);}var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var t=d?'#22c55e':'#15803d';var e=document.querySelector('meta[name="theme-color"]');if(e)e.setAttribute('content',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
