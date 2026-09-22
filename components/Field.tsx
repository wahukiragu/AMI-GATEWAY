export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="label">
        {label} {hint ? <span className="hint font-normal">{hint}</span> : null}
      </label>
      {children}
      {error ? <p className="err" role="alert">{error}</p> : null}
    </div>
  );
}
