'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Sign-in failed');
      router.push('/');
      router.refresh();
    } catch (er) {
      setErr(er.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-veil">
      <form className="login-card" onSubmit={submit}>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <span className="brand-logo">✦</span> Libre Studio
        </div>
        <h1>Sign in to design</h1>
        <p className="muted">Demo auth: no password — your email just creates/opens your workspace on this instance.</p>
        <input
          className="input"
          style={{ width: '100%', marginTop: 14 }}
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{err}</p>}
        <button className="btn primary" style={{ width: '100%', marginTop: 14 }} disabled={busy}>
          {busy ? 'Opening workspace…' : 'Continue'} →
        </button>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 14 }}>
          By continuing you accept that this is a clean-room demo product, not affiliated with Canva.
        </p>
      </form>
    </div>
  );
}
