'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ─── Module 3 Content (Tax Strategy with AI) ─────────────────────────────────

const MODULE_3_SECTIONS = [
  {
    id: 'overview',
    type: 'text' as const,
    title: 'Section 1: TaxDraft AI Capabilities Overview',
    content: `CloseBooks TaxDraft uses a specialized fine-tuned language model trained on over 2.3 million tax returns across 14 entity types. Unlike general-purpose AI, TaxDraft understands the specific relationships between line items in the IRS 1120S, 1065, 1040 Schedule C, and other common forms.

**How TaxDraft Works:**

The system ingests your client's categorized transactions from the CloseBooks month-end close and maps them to the appropriate form lines using a three-stage process:

1. **Income Recognition** — TaxDraft identifies gross receipts, adjustments to income, and distinguishes between ordinary business income and separately stated items that flow to shareholders.

2. **Deduction Validation** — Each deduction category is cross-referenced against the transaction description and amount. TaxDraft flags deductions that appear personal, unusually large relative to revenue, or that may trigger audit risk under the Cohan rule.

3. **Opportunity Identification** — After drafting the base return, TaxDraft runs a second pass specifically looking for missed elections, planning opportunities, and IRC sections that may apply to the client's situation.

**Confidence Scores:**

Every line item carries a confidence score (High / Medium / Low) based on:
- Clarity of the source transactions
- Whether the amount is consistent with prior years
- Whether the categorization is unambiguous

As the reviewing CPA, you should pay particular attention to Medium and Low confidence items — these are where your professional judgment adds the most value.`,
  },
  {
    id: 'annotations',
    type: 'illustrated' as const,
    title: 'Section 2: Reading AI Annotations',
    content: `When you open a TaxDraft return, every line with AI input shows an annotation icon. Clicking any line opens the AI reasoning panel on the right side of the screen.`,
    examples: [
      {
        lineNum: '1a',
        description: 'Gross receipts or sales',
        value: '$2,847,429',
        confidence: 'High',
        reasoning: 'Summed from 847 categorized income transactions across 12 months. Revenue is consistent with prior year ($2.71M) with 5.1% YoY growth. No unusual items detected.',
        irc: 'IRC §61',
        tag: 'No action needed',
        tagColor: '#2d5a27',
        tagBg: '#dcfce7',
      },
      {
        lineNum: '8',
        description: 'Salaries and wages',
        value: '$412,000',
        confidence: 'Medium',
        reasoning: 'Total payroll per QuickBooks payroll export. Note: officer compensation of $280,000 is included. Consider whether this meets the \'reasonable compensation\' standard for S-Corp shareholders. Industry median for this role is $145,000-$175,000.',
        irc: 'IRC §3121',
        tag: 'Review opportunity',
        tagColor: '#92400e',
        tagBg: '#fef3c7',
        opportunity: 'Reducing officer salary to $155,000 could save ~$28,000/year in SE taxes while maintaining reasonable compensation status.',
      },
      {
        lineNum: '14',
        description: 'Depreciation',
        value: '$47,200',
        confidence: 'Low',
        reasoning: 'Calculated from asset additions in current year using MACRS defaults. However, client placed $840,000 of equipment in service in 2024. Bonus depreciation at 60% rate may apply. A cost segregation study on the 2021 building acquisition was not reflected.',
        irc: 'IRC §168(k)',
        tag: 'Large opportunity',
        tagColor: '#7c3aed',
        tagBg: '#f5f3ff',
        opportunity: 'Applying bonus depreciation and prior-year cost segregation could accelerate $118,000 in additional depreciation to 2024.',
      },
    ],
  },
  {
    id: 'quiz',
    type: 'quiz' as const,
    title: 'Section 3: Knowledge Check',
    questions: [
      {
        id: 'q1',
        text: 'A TaxDraft annotation shows "Low" confidence on the meals & entertainment deduction of $84,000. What is the most appropriate next step?',
        options: [
          'Accept the deduction as-is since TaxDraft calculated it',
          'Request original receipts from the client and verify the business purpose documentation meets IRC §274 requirements',
          'Reduce the deduction by 50% automatically',
          'Delete the deduction entirely to avoid audit risk',
        ],
        correct: 1,
        explanation: 'Low confidence means TaxDraft had insufficient information to be certain. For a deduction this size, you should request supporting documentation. IRC §274 requires substantiation of the business purpose, amount, date, and parties for meals. Simply accepting or deleting without review would be inappropriate.',
      },
      {
        id: 'q2',
        text: 'Your client\'s TaxDraft 1120S shows officer compensation of $320,000 for an S-Corp with net income of $180,000. Which strategy opportunity would you flag?',
        options: [
          'No issue — higher compensation is always better for the employee',
          'The officer may be over-compensated; consider reducing salary to increase distributions and reduce FICA',
          'The S-Corp should convert to a C-Corp immediately',
          'File an amended prior-year return to claim the excess as a distribution',
        ],
        correct: 1,
        explanation: 'When officer compensation exceeds net income, it often means all profits are being paid as W-2 wages subject to FICA taxes. Proper S-Corp planning involves setting a "reasonable" W-2 salary (typically industry median) and taking remaining profits as distributions, which are not subject to self-employment tax.',
      },
      {
        id: 'q3',
        text: 'A client\'s TaxDraft shows an opportunity annotation: "QBI deduction may be limited by W-2 wage limitation." The client is a construction S-Corp with $400,000 of qualified business income. What should you investigate?',
        options: [
          'Nothing — the QBI deduction is always 20% of QBI',
          'Whether the client\'s W-2 wages are at least $80,000, as the deduction is limited to 50% of W-2 wages for taxpayers above the income threshold',
          'Whether the client should switch from a calendar to a fiscal year',
          'The deduction is not available for S-Corps',
        ],
        correct: 1,
        explanation: 'Above the income threshold ($383,900 MFJ for 2024), the QBI deduction is limited to the greater of 50% of W-2 wages or 25% of W-2 wages plus 2.5% of qualified property. For a client with $400,000 QBI and a $80,000 deduction goal, you need at least $160,000 in W-2 wages paid. This is a real planning lever — officers can increase W-2 to unlock the full QBI deduction.',
      },
    ],
  },
  {
    id: 'exercise',
    type: 'exercise' as const,
    title: 'Section 4: Hands-On Exercise',
    instructions: `Review the following 1120S draft for Smith Construction LLC and identify the 3 most significant tax planning opportunities. For each opportunity, note the IRC section and estimated savings.`,
    returnLines: [
      { num: '1a', desc: 'Gross receipts', value: '$2,847,429', flag: false },
      { num: '2', desc: 'Returns and allowances', value: '-$12,400', flag: false },
      { num: '7', desc: 'Compensation of officers', value: '$285,000', flag: true, note: 'Industry median: $145K-$175K' },
      { num: '8', desc: 'Salaries and wages (other)', value: '$127,000', flag: false },
      { num: '14', desc: 'Depreciation (Form 4562)', value: '$47,200', flag: true, note: '$840K new equipment placed in service — bonus depreciation not applied' },
      { num: '17', desc: 'Pension/profit-sharing plans', value: '$26,500', flag: true, note: 'Solo 401(k) only — defined benefit plan not in place' },
      { num: '19', desc: 'Other deductions', value: '$89,600', flag: false },
      { num: '21', desc: 'Ordinary business income', value: '$382,900', flag: false },
    ],
    opportunities: [
      { title: 'Officer Compensation Adjustment', savings: 28000, irc: 'IRC §3121', hint: 'Flag line 7' },
      { title: 'Bonus Depreciation on Equipment', savings: 62000, irc: 'IRC §168(k)', hint: 'Flag line 14' },
      { title: 'Defined Benefit Plan Addition', savings: 38000, irc: 'IRC §412', hint: 'Flag line 17' },
    ],
  },
]

const ALL_MODULES = [
  { id: 1, title: 'AI Transaction Categorization' },
  { id: 2, title: 'Month-End Close Mastery' },
  { id: 3, title: 'Tax Strategy with AI' },
  { id: 4, title: 'Client Success Practices' },
]

export default function ModuleLearningPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const modNum = parseInt(moduleId ?? '3')
  const sections = modNum === 3 ? MODULE_3_SECTIONS : MODULE_3_SECTIONS // All modules use Module 3 content for demo

  const [currentSection, setCurrentSection] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [exerciseRevealed, setExerciseRevealed] = useState(false)
  const [completed, setCompleted] = useState(false)

  const section = sections[currentSection]
  const isLast = currentSection === sections.length - 1
  const progressPct = ((currentSection + 1) / sections.length) * 100

  function handleNext() {
    if (isLast) {
      setCompleted(true)
    } else {
      setCurrentSection(prev => prev + 1)
    }
  }

  function handlePrev() {
    if (currentSection > 0) setCurrentSection(prev => prev - 1)
  }

  if (completed) {
    return (
      <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ color: '#fff', fontSize: 48 }}>✓</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1714', marginBottom: 12 }}>Module {modNum} Complete!</h1>
          <p style={{ fontSize: 15, color: '#6b6560', lineHeight: 1.6, marginBottom: 28 }}>
            You&apos;ve earned 2.0 CPE credits for completing &quot;{ALL_MODULES[modNum - 1]?.title}&quot;.
            Your score has been recorded.
          </p>
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>2.0 CPE Credits Earned</div>
            <div style={{ fontSize: 11, color: '#6b6560', marginTop: 2 }}>NASBA Provider #148732 · Tax Technical</div>
          </div>
          <Link
            href="/dashboard/certification"
            style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
          >
            Back to Certification Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard/certification" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none' }}>← Certification</Link>
          <div style={{ width: 1, height: 20, backgroundColor: '#e8e0d4' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1714' }}>
              Module {modNum}: {ALL_MODULES[modNum - 1]?.title}
            </div>
            <div style={{ fontSize: 11, color: '#6b6560' }}>Section {currentSection + 1} of {sections.length}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 120, height: 4, backgroundColor: '#e8e0d4', borderRadius: 2 }}>
              <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#2d5a27', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, color: '#6b6560' }}>{Math.round(progressPct)}%</span>
          </div>
          <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, backgroundColor: '#dcfce7', color: '#2d5a27', fontWeight: 700 }}>
            2.0 CPE
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Section title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 8 }}>
            Section {currentSection + 1} of {sections.length}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1714', letterSpacing: '-0.01em' }}>{section.title}</h1>
        </div>

        {/* Section content */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '32px', marginBottom: 24 }}>

          {section.type === 'text' && (
            <div>
              {section.content.split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', marginBottom: 12 }}>{para.replace(/\*\*/g, '')}</h3>
                }
                if (para.startsWith('**')) {
                  const formatted = para.split('**').map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )
                  return <p key={i} style={{ fontSize: 15, color: '#1a1714', lineHeight: 1.75, marginBottom: 16 }}>{formatted}</p>
                }
                return <p key={i} style={{ fontSize: 15, color: '#1a1714', lineHeight: 1.75, marginBottom: 16 }}>{para}</p>
              })}
            </div>
          )}

          {section.type === 'illustrated' && section.examples && (
            <div>
              <p style={{ fontSize: 15, color: '#1a1714', lineHeight: 1.7, marginBottom: 24 }}>{section.content}</p>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Example Line Items:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {section.examples.map((ex, i) => (
                  <div key={i} style={{ border: '1px solid #e8e0d4', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', backgroundColor: '#faf8f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: '#a09a94' }}>Line {ex.lineNum}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>{ex.description}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#1a1714' }}>{ex.value}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, backgroundColor: ex.confidence === 'High' ? '#dcfce7' : ex.confidence === 'Medium' ? '#fef3c7' : '#fdf4ff', color: ex.confidence === 'High' ? '#2d5a27' : ex.confidence === 'Medium' ? '#92400e' : '#7c3aed', fontWeight: 700 }}>
                          {ex.confidence} Confidence
                        </span>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, backgroundColor: ex.tagBg, color: ex.tagColor, fontWeight: 600 }}>{ex.tag}</span>
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#a09a94', fontFamily: 'var(--font-dm-mono)', marginBottom: 6 }}>{ex.irc}</div>
                      <p style={{ fontSize: 13, color: '#1a1714', lineHeight: 1.6, margin: 0 }}>{ex.reasoning}</p>
                      {ex.opportunity && (
                        <div style={{ marginTop: 10, padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2d5a27', marginBottom: 4 }}>Opportunity Identified:</div>
                          <p style={{ fontSize: 13, color: '#1a1714', margin: 0, lineHeight: 1.5 }}>{ex.opportunity}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.type === 'quiz' && section.questions && (
            <div>
              <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>
                Answer all 3 questions to proceed. You need 2/3 correct to pass this section.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {section.questions.map((q, qi) => (
                  <div key={q.id}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 14, lineHeight: 1.5 }}>
                      {qi + 1}. {q.text}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const selected = quizAnswers[q.id] === oi
                        const isCorrect = quizSubmitted && oi === q.correct
                        const isWrong = quizSubmitted && selected && oi !== q.correct
                        return (
                          <button
                            key={oi}
                            onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))}
                            style={{
                              padding: '12px 16px', borderRadius: 8, textAlign: 'left', cursor: quizSubmitted ? 'default' : 'pointer',
                              border: `1px solid ${isCorrect ? '#2d5a27' : isWrong ? '#ef4444' : selected ? '#b8734a' : '#e8e0d4'}`,
                              backgroundColor: isCorrect ? '#dcfce7' : isWrong ? '#fef2f2' : selected ? '#fdf2e9' : '#faf8f4',
                              fontSize: 14, color: '#1a1714', lineHeight: 1.5,
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && (
                      <div style={{ marginTop: 10, padding: '12px 14px', backgroundColor: '#faf8f4', borderRadius: 8, border: '1px solid #e8e0d4' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: quizAnswers[q.id] === q.correct ? '#2d5a27' : '#ef4444', marginBottom: 4 }}>
                          {quizAnswers[q.id] === q.correct ? '✓ Correct!' : '✗ Incorrect'}
                        </div>
                        <p style={{ fontSize: 13, color: '#6b6560', margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < (section.questions?.length ?? 0)}
                  style={{
                    marginTop: 24, padding: '11px 24px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: Object.keys(quizAnswers).length < (section.questions?.length ?? 0) ? 'not-allowed' : 'pointer',
                    backgroundColor: Object.keys(quizAnswers).length < (section.questions?.length ?? 0) ? '#a09a94' : '#2d5a27',
                    color: '#fff',
                  }}
                >
                  Submit Answers
                </button>
              ) : (
                <div style={{ marginTop: 16, fontSize: 14, color: '#2d5a27', fontWeight: 600 }}>
                  Score: {section.questions.filter(q => quizAnswers[q.id] === q.correct).length}/{section.questions.length} — proceed to next section
                </div>
              )}
            </div>
          )}

          {section.type === 'exercise' && section.returnLines && (
            <div>
              <p style={{ fontSize: 15, color: '#1a1714', lineHeight: 1.7, marginBottom: 24 }}>{section.instructions}</p>

              {/* Mini 1120S table */}
              <div style={{ border: '1px solid #e8e0d4', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ backgroundColor: '#1a1714', padding: '10px 16px', display: 'grid', gridTemplateColumns: '60px 1fr 120px 30px', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#a09a94', fontWeight: 600 }}>Line</span>
                  <span style={{ fontSize: 11, color: '#a09a94', fontWeight: 600 }}>Description</span>
                  <span style={{ fontSize: 11, color: '#a09a94', fontWeight: 600, textAlign: 'right' }}>Amount</span>
                  <span></span>
                </div>
                {section.returnLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 16px', display: 'grid', gridTemplateColumns: '60px 1fr 120px 30px', gap: 12, alignItems: 'center',
                      backgroundColor: line.flag ? '#fffbeb' : i % 2 === 0 ? '#fff' : '#faf8f4',
                      borderTop: '1px solid #e8e0d4',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#a09a94', fontFamily: 'var(--font-dm-mono)' }}>{line.num}</span>
                    <div>
                      <span style={{ fontSize: 13, color: '#1a1714' }}>{line.desc}</span>
                      {line.flag && line.note && (
                        <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>⚠ {line.note}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-dm-mono)', color: '#1a1714' }}>{line.value}</span>
                    {line.flag ? <span style={{ color: '#f59e0b', fontSize: 14 }}>✦</span> : <span />}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1714', marginBottom: 12 }}>
                  Based on the flagged lines (✦), identify the 3 opportunities:
                </div>
                <button
                  onClick={() => setExerciseRevealed(!exerciseRevealed)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: exerciseRevealed ? '#faf8f4' : '#1a1714', color: exerciseRevealed ? '#6b6560' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {exerciseRevealed ? 'Hide Answer Key' : 'Reveal Answer Key'}
                </button>
              </div>

              {exerciseRevealed && section.opportunities && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {section.opportunities.map((opp, i) => (
                    <div key={i} style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#2d5a27', marginBottom: 4 }}>{i + 1}. {opp.title}</div>
                          <div style={{ fontSize: 12, color: '#6b6560' }}>{opp.irc} · {opp.hint}</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#2d5a27' }}>-${opp.savings.toLocaleString()}/yr</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handlePrev}
            disabled={currentSection === 0}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: currentSection === 0 ? '#a09a94' : '#1a1714', fontSize: 13, fontWeight: 600, cursor: currentSection === 0 ? 'not-allowed' : 'pointer' }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {sections.map((_, i) => (
              <div
                key={i}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === currentSection ? '#2d5a27' : i < currentSection ? '#86efac' : '#e8e0d4' }}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={handleNext}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Complete Module ✓
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#1a1714', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
