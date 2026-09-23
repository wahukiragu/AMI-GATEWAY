import type { MetadataRoute } from 'next';
import { site } from '@/lib/config';

// Next.js auto-serves this at /manifest.webmanifest and links it in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.org}`,
    short_name: site.name,
    description: `Record the connections made at ${site.org} events and see how culture turns into trade.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F3EA',
    theme_color: '#121642',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
