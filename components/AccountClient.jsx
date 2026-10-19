'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { planById } from '@/lib/pricing';

export default function AccountClient({ user, provider, hasOpenAI, hasNVIDIA, sub, usage, stripeReady }) {
  const router = useRouter();
  const [openai, setOpenai] = useState('');
  const [nvidia, setNvidia] = useState('');
  const [selProvider, setSelProvider] = useState(provider || 'heuristic');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');

  const save = async () => {
    setBusy(true); setOut('');
    const body = { provider: selProvider };
    if (openai.trim()) body.openaiKey = openai.trim();
    if (nvidia.trim()) body.nvidiaKey = nvidia.trim();
    const r = await fetch('/api/user/keys', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) { setOut('Saved ✓'); setOpenai(''); setNvidia(''); router.refresh(); }
    else setOut('Failed to save');
  };

  const clearKey = async (col) => {
    await fetch('/api/user/keys', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [col]: null }) });
    router.refresh();
  };

  const cancel = async () => {
    setBusy(true);
    const r = await fetch('/api/billing/cancel', { method: 'POST' });
    setBusy(false);
    if (r.ok) router.refresh();
  };

  const demo = async (plan) => {
    setBusy(true);
    const r = await fetch('/api/billing/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    setBusy(false);
    if (r.ok) router.refresh();
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  const planDef = planById(sub?.plan);

  return (
    <div className="page-wrap">
      <header className="page-head">
        <a className="btn small" href="/">← Back</a>
        <span className="spacer" />
        <button className="btn small" onClick={logout}>Sign out</button>
      </header>

      <h1>Account</h1>
      <p className="muted">{user.email}</p>

      <div className="account-grid">
        <section className="card">
          <h3>Subscription</h3>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <span className="plan-chip big">{planDef.name}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {sub?.status ? `status: ${sub.status}` : 'no subscription row'}
              {sub?.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ''}
            </span>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <a className="btn small" href="/pricing">Change plan</a>
            {stripeReady ? (
              <span className="muted" style={{ fontSize: 12 }}>Stripe portal: configure STRIPE keys → portal session route</span>
            ) : (
              sub?.plan && sub.plan !== 'FREE' ? <button className="btn small danger" disabled={busy} onClick={cancel}>Cancel subscription</button> : null
            )}
          </div>

          <div className="quota-grid">
            {usage && Object.entries(usage).map(([kind, q]) => (
              <div key={kind} className="quota-item">
                <b>{kind === 'AI_IMAGE' ? 'Magic images' : 'Magic text'}</b>
                <div className="meter"><i style={{ width: `${Math.min(100, (q.used / Math.max(1, q.limit)) * 100)}%` }} /></div>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{q.used} / {q.limit} this month</span>
              </div>
            ))}
          </div>
          {!stripeReady && sub?.plan !== 'FREE' && (
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button className="btn small" disabled={busy} onClick={() => demo('PRO')}>Demo: switch to Pro</button>
              <button className="btn small" disabled={busy} onClick={() => demo('MAX')}>Demo: switch to Max</button>
              <button className="btn small" disabled={busy} onClick={() => demo('FREE')}>Demo: back to Free</button>
            </div>
          )}
        </section>

        <section className="card">
          <h3>AI providers</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            Keys are stored server-side on your account and used only by this app's API routes.
            NVIDIA free keys: build.nvidia.com → any llama / stable-diffusion NIM.
          </p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            {['heuristic', 'openai', 'nvidia'].map((pid) => (
              <button key={pid} className={`filter-chip${selProvider === pid ? ' on' : ''}`} onClick={() => setSelProvider(pid)}>
                {pid === 'heuristic' ? 'Offline' : pid === 'openai' ? 'OpenAI' : 'NVIDIA NIM'}
                {(pid === 'openai' && hasOpenAI) || (pid === 'nvidia' && hasNVIDIA) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <input className="input" style={{ width: '100%', marginTop: 10 }} type="password" placeholder={hasOpenAI ? 'OpenAI key saved — type to replace' : 'OpenAI key (sk-…)'} value={openai} onChange={(e) => setOpenai(e.target.value)} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small" disabled={busy || !hasOpenAI} onClick={() => clearKey('openaiKey')}>Clear OpenAI key</button>
          </div>
          <input className="input" style={{ width: '100%', marginTop: 8 }} type="password" placeholder={hasNVIDIA ? 'NVIDIA key saved — type to replace' : 'NVIDIA NIM key (nvapi-…)'} value={nvidia} onChange={(e) => setNvidia(e.target.value)} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small" disabled={busy || !hasNVIDIA} onClick={() => clearKey('nvidiaKey')}>Clear NVIDIA key</button>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={busy} onClick={save}>Save settings</button>
            {out && <span style={{ fontSize: 13 }}>{out}</span>}
          </div>
        </section>

        <section className="card">
          <h3>Instance status</h3>
          <ul className="status-list">
            <li>Editor engine: Fabric.js (client-side)</li>
            <li>Storage: Prisma + SQLite on this server</li>
            <li>Billing: {stripeReady ? 'Stripe live' : 'demo mode — add STRIPE_SECRET_KEY for real checkout'}</li>
            <li>AI: {provider === 'heuristic' ? 'offline heuristics' : `${provider} selected`}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
