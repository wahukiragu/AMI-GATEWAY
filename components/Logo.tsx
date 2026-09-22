import Image from 'next/image';

// Files under /public are served by URL, not imported as modules — hence the string path
// (and explicit width/height, since Next can't read intrinsic dimensions from a URL).
export function Logo({ className = 'h-14 w-auto' }: { className?: string }) {
  return (
    <Image
      src="/brand/ami-logo.png"
      alt="African Musicology Institute"
      width={900}
      height={900}
      priority
      className={className}
    />
  );
}
