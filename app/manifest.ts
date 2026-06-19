import type { MetadataRoute } from 'next';
import { APP_VERSION } from '@/lib/version';

// Manifest dinâmico: os URLs dos ícones levam ?v=APP_VERSION → cada deploy muda
// a versão e o Android volta a descarregar o ícone/splash da app instalada.
export default function manifest(): MetadataRoute.Manifest {
  const v = `?v=${APP_VERSION}`;
  return {
    name: 'Atiães em Movimento — Torneio Futebol 5',
    short_name: 'Atiães Futebol',
    description: 'Placar ao vivo do Torneio Futebol 5 «Atiães em Movimento»',
    start_url: '/',
    display: 'standalone',
    background_color: '#dcfce7',
    theme_color: '#15803d',
    icons: [
      // transparentes (uso geral)
      { src: `/icon-192.png${v}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icon.png${v}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      // full-bleed (ecrã principal Android → bola grande, sem anel branco)
      { src: `/icon-maskable.png${v}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
