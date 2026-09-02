type PlaygroundA11yProps = {
  notes: string | string[]
}

export default function PlaygroundA11y({ notes }: PlaygroundA11yProps) {
  const items = Array.isArray(notes) ? notes : [notes]

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--accent-soft)',
        backgroundColor: 'var(--accent-soft)',
        padding: 'var(--space-4)',
      }}
    >
      <p
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-bold)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-brand-product)',
        }}
      >
        Accessibility
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'grid',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        {items.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}
