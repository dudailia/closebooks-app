'use client'

export interface ChecklistItem {
  name: string
  status: 'available' | 'missing' | 'uploading'
  url?: string
  description?: string
}

interface DocumentChecklistProps {
  items: ChecklistItem[]
  onUpload?: (itemName: string) => void
}

export default function DocumentChecklist({ items, onUpload }: DocumentChecklistProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: item.status === 'available' ? '#d1fae5' : item.status === 'uploading' ? '#fef9c3' : '#fee2e2',
            backgroundColor: item.status === 'available' ? '#f0fdf4' : item.status === 'uploading' ? '#fffbeb' : '#fef2f2',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: item.status === 'available' ? '#dcfce7' : item.status === 'uploading' ? '#fef9c3' : '#fee2e2',
            }}
          >
            {item.status === 'available' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : item.status === 'uploading' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1714' }}>{item.name}</div>
            {item.description && (
              <div style={{ fontSize: '12px', color: '#6b6560', marginTop: '2px' }}>{item.description}</div>
            )}
          </div>

          {/* Action */}
          <div style={{ flexShrink: 0 }}>
            {item.status === 'available' && item.url ? (
              <a
                href={item.url}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2d5a27',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  border: '1px solid #2d5a27',
                  borderRadius: '6px',
                  display: 'inline-block',
                }}
              >
                Download
              </a>
            ) : item.status === 'missing' ? (
              <button
                onClick={() => onUpload?.(item.name)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#b8734a',
                  padding: '4px 10px',
                  border: '1px solid #b8734a',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Upload
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: '#92400e' }}>Pending</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
