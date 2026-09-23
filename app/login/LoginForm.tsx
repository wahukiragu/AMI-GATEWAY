'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function withGoogle() {
    setError('');
    setGoogleBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) {
      setGoogleBusy(false);
      setError('Google sign-in is not available right now. Please use the email code instead.');
    }
    // On success Supabase redirects the browser to Google, so no further action here.
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) {
      setError(err.message.toLowerCase().includes('rate') ? 'Please wait a minute before asking for another code.' : 'We could not send the code. Please try again.');
      return;
    }
    setEmail(clean);
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6,8}$/.test(code.trim())) {
      setError('Enter the code from the email. It is 6 to 8 digits.');
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (err) {
      setError('That code did not work. Check it, or ask for a new one.');
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (step === 'email') {
    return (
      <div>
        <button
          type="button"
          onClick={withGoogle}
          disabled={googleBusy}
          className="btn btn-ghost w-full justify-center gap-3 border-navy/20"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.32 3-7.31Z" />
            <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.5c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H1.06v2.58A10 10 0 0 0 10 20Z" />
            <path fill="#FBBC05" d="M4.41 11.92a6 6 0 0 1 0-3.84V5.5H1.06a10 10 0 0 0 0 9l3.35-2.58Z" />
            <path fill="#EA4335" d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.5l3.35 2.58C5.2 5.71 7.4 3.96 10 3.96Z" />
          </svg>
          {googleBusy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="my-5 flex items-center gap-3 text-sm text-navy-500" role="separator">
          <span className="h-px flex-1 bg-navy/10" /> or <span className="h-px flex-1 bg-navy/10" />
        </div>

        <form onSubmit={sendCode} noValidate>
          <label htmlFor="email" className="label">Your email address</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {error ? <p className="err" role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
          <p className="hint mt-3">New here? Either option creates your portal. You will stay signed in on this device until you log out.</p>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={verify} noValidate>
      <p className="mb-4">We sent a code to <strong>{email}</strong>. It can take a minute to arrive.</p>
      <label htmlFor="code" className="label">Code from the email</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" className="input text-center text-2xl tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} />
      {error ? <p className="err" role="alert">{error}</p> : null}
      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
      <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => { setStep('email'); setCode(''); setError(''); }}>Use a different email</button>
    </form>
  );
}
