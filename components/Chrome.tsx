'use client';

import { usePathname } from 'next/navigation';

/**
 * Server-rendered header/footer are passed in as already-rendered nodes, so
 * this component only decides whether to show them — it never needs to know
 * anything about what's inside them. Routes under /wall render fullscreen,
 * with no site chrome, for projecting at a venue.
 */
export function Chrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = pathname?.startsWith('/wall');

  if (bare) return <div id="main">{children}</div>;
  return (
    <>
      {header}
      <div id="main">{children}</div>
      {footer}
    </>
  );
}
