export function Flash({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${error ? 'bg-maroon-100 text-maroon' : 'bg-gold-100 text-navy'}`}
    >
      {error ?? notice}
    </div>
  );
}
