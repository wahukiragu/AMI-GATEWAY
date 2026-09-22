import type { Metadata, Viewport } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { site } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: `${site.name} | ${site.org}`, template: `%s | ${site.name}` },
  description: `Record the connections made at the ${site.event} and see how culture turns into trade.`,
  metadataBase: new URL(site.siteUrl),
};

export const viewport: Viewport = { themeColor: '#121642', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
