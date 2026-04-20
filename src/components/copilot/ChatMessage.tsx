'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ActionCard from './ActionCard'
import type { CopilotMessage, ActionCardType, ActionCardPayload } from '@/lib/copilot/types'

interface Props {
  message: CopilotMessage
  onApprove: (cardId: string, payload: ActionCardPayload, type: ActionCardType) => Promise<void>
  onDismiss: (cardId: string) => void
}

export default function ChatMessage({ message, onApprove, onDismiss }: Props) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: '#2d5a27', color: 'white', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', fontSize: 14, maxWidth: '75%', lineHeight: 1.5 }}>
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: '90%' }}>
      {message.text && (
        <div style={{ background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: '2px 12px 12px 12px', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, color: '#1a1714' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table>
                </div>
              ),
              th: ({ children }) => <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e8e0d4', color: '#6b6560', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</th>,
              td: ({ children }) => <td style={{ padding: '6px 10px', borderBottom: '1px solid #f0ece4', color: '#1a1714' }}>{children}</td>,
              p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: '#1a1714', fontWeight: 600 }}>{children}</strong>,
              code: ({ children }) => <code style={{ background: '#f5f3ef', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>,
              h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 6px', color: '#1a1714' }}>{children}</h3>,
            }}
          >
            {message.text}
          </ReactMarkdown>
          {message.streaming && (
            <span style={{ display: 'inline-block', width: 8, height: 14, background: '#2d5a27', borderRadius: 2, marginLeft: 2, animation: 'copilot-blink 1s step-end infinite' }} />
          )}
          <style>{`@keyframes copilot-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
        </div>
      )}

      {message.actionCards.map(card => (
        <ActionCard
          key={card.id}
          card={card}
          onApprove={(payload, type) => onApprove(card.id, payload, type)}
          onDismiss={() => onDismiss(card.id)}
        />
      ))}
    </div>
  )
}
