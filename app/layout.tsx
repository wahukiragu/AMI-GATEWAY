import type { Metadata, Viewport } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Chrome } from '@/components/Chrome';
import { site } from '@/lib/config';

function safeSiteUrl(): URL {
  try {
    return new URL(site.siteUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export const metadata: Metadata = {
  title: { default: `${site.name} | ${site.org}`, template: `%s | ${site.name}` },
  description: `Record the connections made at the ${site.event} and see how culture turns into trade.`,
  metadataBase: safeSiteUrl(),
};

export const viewport: Viewport = { themeColor: '#121642', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Chrome header={<SiteHeader />} footer={<Footer />}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
