'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import Button from '@/components/ui/Button'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'accessibility')!

export default function AccessibilitySection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Focus visibility"
        description="Global :focus-visible uses --ring-focus. Tab through controls to verify."
        code={`/* globals.css */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.cb-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--ring-soft);
}`}
        variants={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Button variant="primary">Focus me</Button>
            <Button variant="ghost">Then me</Button>
            <a
              href="#accessibility"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Skip link pattern
            </a>
          </div>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Mouse clicks should not show focus ring (:focus-visible). Keyboard navigation should.
          </p>
        }
        a11y={[
          'Never remove outline without a replacement focus indicator.',
          'Dialog FocusTrap must include first and last tabbable elements.',
          'Skip links: visually hidden until focused for main content bypass.',
        ]}
      >
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Press Tab to move through interactive examples on this page.
        </p>
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Landmarks & semantics"
        description="Playground uses aside (nav), main, section, and heading hierarchy."
        code={`<main>
  <section aria-labelledby="reviews-heading">
    <h2 id="reviews-heading">Reviews</h2>
  </section>
</main>`}
        variants={
          <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--font-size-sm)' }}>
            <li>One h1 per route (Design System Playground)</li>
            <li>section + aria-labelledby per catalog entry</li>
            <li>nav aria-label per sidebar group</li>
          </ul>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Live regions for toasts: role=&quot;status&quot; or aria-live=&quot;polite&quot;.
          </p>
        }
        a11y={[
          'Page title in document <title> should match h1 intent.',
          'Icon-only controls need aria-label.',
          'Form errors: associate via aria-describedby + invalid.',
        ]}
      >
        <div role="status" aria-live="polite" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          Example live region — announcements appear here without stealing focus.
        </div>
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Reduced motion & contrast"
        description="Motion tokens and status pairs are designed for accessible defaults."
        code={`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`}
        variants={
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-bg)', color: 'var(--color-success-fg)', borderRadius: 'var(--radius-md)' }}>
              Success pair
            </div>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-bg)', color: 'var(--color-danger-fg)', borderRadius: 'var(--radius-md)' }}>
              Danger pair
            </div>
          </div>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Test with OS &quot;Reduce motion&quot; and browser zoom at 200%.
          </p>
        }
        a11y={[
          'Body text: --text-primary on --surface-raised (≥ 4.5:1).',
          'Large headings may use --text-secondary for de-emphasis only at xl+ sizes.',
          'Dark theme tokens flip under [data-theme="dark"] for scoped surfaces.',
        ]}
      >
        <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
