/**
 * Standard disclosure for surfaces backed by illustrative rather than real data.
 *
 * Use this anywhere the UI would otherwise present fabricated values as if they
 * were measured, aggregated, or returned by an external system. Matches the
 * existing pale-yellow pattern used on the vault and integrations pages.
 */
export default function DemoDataNotice({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      role="note"
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        backgroundColor: '#fefce8',
        border: '1px solid #fef08a',
        ...style,
      }}
    >
      <p style={{ fontSize: 13, color: '#a16207', margin: 0, lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  )
}
