'use client'

interface Props { label: string }

export default function ToolCallIndicator({ label }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f5f3ef', borderRadius: 8, fontSize: 13, color: '#6b6560', width: 'fit-content' }}>
      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid #2d5a27', borderTopColor: 'transparent', animation: 'copilot-spin 0.7s linear infinite' }} />
      {label}
      <style>{`@keyframes copilot-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
