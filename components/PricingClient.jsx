'use client';
import { PLANS } from '@/lib/pricing';

export default function PricingClient({ plan, stripeReady, isDemo }) {
  const choose = async (id) => {
    if (id === plan) return;
    const url = stripeReady && id !== 'FREE' ? '/api/billing/checkout' : '/api/billing/demo';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: id }),
    });
    const d = await res.json();
    if (d.url) { location.href = d.url; return; }
    if (res.ok) location.reload();
    else alert(d.error || 'Something went wrong');
  };

  return (
    <div className="page-wrap">
      <header className="page-head">
        <a className="btn small" href="/"> ← Back</a>
        <span className="spacer" />
        <a className="btn small" href="/account">Account</a>
      </header>

      <div className="pricing-hero">
        <h1>Plans &amp; pricing</h1>
        <p>
          {stripeReady
            ? 'Paid plans run through Stripe Checkout — subscriptions managed by Stripe.'
            : <><b>Demo billing mode:</b> no Stripe keys configured, so plan changes are simulated instantly. Add <code>STRIPE_SECRET_KEY</code> to enable real checkout.</>}
          {isDemo ? <> Current plan is a <b>demo activation</b>.</> : null}
        </p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan;
          return (
            <div key={p.id} className={`price-card${p.highlight ? ' featured' : ''}${isCurrent ? ' current' : ''}`}>
              {p.highlight && <div className="badge">Most popular</div>}
              <h3>{p.name}</h3>
              <div className="price">${p.price}<span>/mo</span></div>
              <p className="tag">{p.tagline}</p>
              <ul>
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button
                className={`btn ${p.highlight ? 'primary' : ''}`}
                style={{ width: '100%' }}
                disabled={isCurrent}
                onClick={() => choose(p.id)}
              >
                {isCurrent ? 'Current plan' : p.id === 'FREE' ? 'Downgrade to Free' : `Get ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="muted" style={{ textAlign: 'center', fontSize: 12.5 }}>
        Quotas are enforced server-side per calendar month. Offline heuristic tools (Design/Palette/local Write) don't count.
      </p>
    </div>
  );
}
