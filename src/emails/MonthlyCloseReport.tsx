import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Img,
  Button,
  Hr,
} from '@react-email/components'

export interface MonthlyCloseReportProps {
  firmName: string
  firmLogoUrl?: string
  primaryColor: string
  accentColor: string
  clientName: string
  periodLabel: string
  narrativeHtml: string
  forwardLookingLine: string
  pnl: {
    revenue: number
    expenses: number
    netIncome: number
    revenueDeltaPct?: number
  }
  topExpenseCategories: Array<{ category: string; amount: number; pct: number }>
  portalUrl: string
  preparedBy?: string
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const statLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8a847d',
  margin: 0,
  marginBottom: 4,
}
const statValue: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 28,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  color: '#1a1714',
  margin: 0,
  lineHeight: 1,
}
const statDelta: React.CSSProperties = {
  fontSize: 12,
  margin: '4px 0 0',
  fontWeight: 600,
}

export default function MonthlyCloseReport(props: MonthlyCloseReportProps) {
  const p = props.primaryColor
  const a = props.accentColor
  const bars = props.topExpenseCategories
  const maxBar = Math.max(...bars.map((b) => b.amount), 1)

  return (
    <Html>
      <Head />
      <Preview>Your books are closed for {props.periodLabel} — summary inside</Preview>
      <Body
        style={{
          backgroundColor: '#f5f1ea',
          fontFamily: 'Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            maxWidth: 600,
            margin: '24px auto',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e4ddd0',
          }}
        >
          <Section style={{ padding: '28px 32px 16px', textAlign: 'center' as const }}>
            {props.firmLogoUrl ? (
              <Img
                src={props.firmLogoUrl}
                alt={props.firmName}
                height={40}
                style={{ margin: '0 auto', maxWidth: 200 }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 26,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  color: '#1a1714',
                  margin: 0,
                }}
              >
                {props.firmName}
              </Text>
            )}
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <Hr style={{ borderColor: '#e4ddd0', margin: '0 0 24px' }} />
            <Text
              style={{
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#8a847d',
                margin: 0,
                marginBottom: 8,
              }}
            >
              {props.periodLabel}
            </Text>
            <Heading
              as="h1"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 30,
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: p,
                margin: 0,
                marginBottom: 6,
              }}
            >
              Your books are closed ✓
            </Heading>
            <Text style={{ fontSize: 15, color: '#55514c', margin: 0, marginBottom: 24 }}>
              Hi {props.clientName}, here&apos;s a summary of the month.
            </Text>
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <Row>
              <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Revenue</Text>
                <Text style={statValue}>${fmt(props.pnl.revenue)}</Text>
                {typeof props.pnl.revenueDeltaPct === 'number' && (
                  <Text
                    style={{
                      ...statDelta,
                      color: props.pnl.revenueDeltaPct >= 0 ? '#0a7a3f' : '#b13939',
                    }}
                  >
                    {props.pnl.revenueDeltaPct >= 0 ? '+' : ''}
                    {props.pnl.revenueDeltaPct.toFixed(1)}% vs last
                  </Text>
                )}
              </Column>
              <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Expenses</Text>
                <Text style={statValue}>${fmt(props.pnl.expenses)}</Text>
              </Column>
              <Column style={{ width: '34%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Net income</Text>
                <Text
                  style={{
                    ...statValue,
                    color: props.pnl.netIncome >= 0 ? p : '#b13939',
                  }}
                >
                  ${fmt(props.pnl.netIncome)}
                </Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: '#eee5d5', margin: '28px 0' }} />
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <div
              style={{ fontSize: 15, lineHeight: '1.65', color: '#2b2925' }}
              dangerouslySetInnerHTML={{ __html: props.narrativeHtml }}
            />
          </Section>

          {props.forwardLookingLine && (
            <Section style={{ padding: '4px 32px 24px' }}>
              <div
                style={{
                  borderLeft: `3px solid ${p}`,
                  padding: '10px 14px',
                  backgroundColor: `${p}0d`,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: p,
                    margin: 0,
                    fontStyle: 'italic' as const,
                  }}
                >
                  ➜ {props.forwardLookingLine}
                </Text>
              </div>
            </Section>
          )}

          {bars.length > 0 && (
            <Section style={{ padding: '0 32px' }}>
              <Text style={statLabel}>Top expense categories</Text>
              {bars.map((b, i) => (
                <Row key={i} style={{ marginBottom: 10 }}>
                  <Column
                    style={{ width: '40%', paddingRight: 8, verticalAlign: 'middle' as const }}
                  >
                    <Text style={{ fontSize: 13, color: '#2b2925', margin: 0 }}>{b.category}</Text>
                  </Column>
                  <Column style={{ width: '44%', verticalAlign: 'middle' as const }}>
                    <div
                      style={{
                        height: 8,
                        backgroundColor: '#f0ebe3',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(4, (b.amount / maxBar) * 100)}%`,
                          height: '100%',
                          backgroundColor: a,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </Column>
                  <Column
                    style={{
                      width: '16%',
                      verticalAlign: 'middle' as const,
                      textAlign: 'right' as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#55514c',
                        fontFamily: 'Menlo, monospace',
                        margin: 0,
                      }}
                    >
                      ${fmt(b.amount)}
                    </Text>
                  </Column>
                </Row>
              ))}
              <Hr style={{ borderColor: '#eee5d5', margin: '28px 0' }} />
            </Section>
          )}

          <Section style={{ padding: '0 32px 32px', textAlign: 'center' as const }}>
            <Button
              href={props.portalUrl}
              style={{
                backgroundColor: p,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View full report in portal →
            </Button>
          </Section>

          <Section
            style={{
              padding: '18px 32px 24px',
              backgroundColor: '#faf7f1',
              borderTop: '1px solid #e4ddd0',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#8a847d',
                margin: 0,
                textAlign: 'center' as const,
                lineHeight: 1.55,
              }}
            >
              Prepared by {props.preparedBy ?? 'your accounting team'} at {props.firmName}.
              <br />
              Reply to this email with any questions.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
