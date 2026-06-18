const FAQS = [
  {
    q: 'How does the trial work?',
    a: 'Every new firm can start with a 14-day trial. No card is required at signup; choose a plan when you are ready to keep using CloseBooks.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Paid subscriptions are managed through the Stripe customer portal when billing is active.',
  },
  {
    q: 'What counts as a client?',
    a: 'A client is a business entity you manage inside your CloseBooks firm workspace.',
  },
  {
    q: 'Do you support QuickBooks?',
    a: 'CloseBooks exports categorized transactions as QuickBooks-compatible CSV from the review workflow.',
  },
  {
    q: 'How is AI output controlled?',
    a: 'AI suggestions include confidence scores and must pass chart-of-accounts validation before export. Your firm keeps final review control.',
  },
  {
    q: 'What should larger firms do?',
    a: 'Enterprise is for API access, white-label portal needs, and larger rollout requirements. Contact us so we can route procurement and security questions correctly.',
  },
] as const

export default function PricingFAQ() {
  return (
    <section style={{ marginTop: 72 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
          Firm buyer FAQ
        </p>
        <h2 style={{ margin: '10px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, letterSpacing: '-0.04em' }}>
          Procurement basics, answered.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {FAQS.map((faq) => (
          <div
            key={faq.q}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: 20,
              backgroundColor: 'rgba(255,255,255,0.025)',
            }}
          >
            <h3 style={{ margin: 0, color: '#FAFAFA', fontSize: 16, letterSpacing: '-0.02em' }}>{faq.q}</h3>
            <p style={{ margin: '8px 0 0', color: '#8D8D8D', fontSize: 13, lineHeight: 1.65 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
