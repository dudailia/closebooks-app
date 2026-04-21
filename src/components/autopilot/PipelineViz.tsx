'use client'

import { useState } from 'react'
import type { StageResult, StageId } from '@/lib/autopilot/pipelineTypes'

const STAGE_ICONS: Record<StageId, string> = {
  data_collection:   '⬇',
  ai_categorization: '🧠',
  reconciliation:    '⚖',
  journal_entries:   '≡',
  anomaly_scan:      '⚠',
  trial_balance:     '▤',
  reporting:         '📄',
  human_review:      '👤',
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  pending:      { bg: '#f9f7f4', border: '#e8e0d4', text: '#a09a94', dot: '#d4cec8' },
  running:      { bg: '#fffbeb', border: '#fbbf24', text: '#92400e', dot: '#fbbf24' },
  complete:     { bg: '#f0fdf4', border: '#a3c99e', text: '#2d5a27', dot: '#2d5a27' },
  failed:       { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
  needs_review: { bg: '#fff7ed', border: '#fdba74', text: '#7c2d12', dot: '#f97316' },
  skipped:      { bg: '#f9f7f4', border: '#e8e0d4', text: '#a09a94', dot: '#d4cec8' },
}

const STATUS_LABELS: Record<string, string> = {
  pending:      'Pending',
  running:      'Running…',
  complete:     'Complete',
  failed:       'Failed',
  needs_review: 'Needs Review',
  skipped:      'Skipped',
}

interface PipelineVizProps {
  stages: StageResult[]
  activeStageId?: string
  onStageClick?: (stage: StageResult) => void
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        backgroundColor: color, opacity: 0.35,
        animation: 'pipeline-pulse 1.5s ease-out infinite',
      }} />
      <span style={{
        position: 'relative', width: 10, height: 10,
        borderRadius: '50%', backgroundColor: color,
        display: 'inline-block',
      }} />
    </span>
  )
}

function StageNode({
  stage,
  index,
  isActive,
  onClick,
}: {
  stage: StageResult
  index: number
  isActive: boolean
  onClick: () => void
}) {
  const colors = STATUS_COLORS[stage.status] ?? STATUS_COLORS.pending
  const isRunning = stage.status === 'running'
  const isDone = stage.status === 'complete' || stage.status === 'needs_review'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 2px',
        flex: '0 0 auto',
      }}
    >
      {/* Node circle */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        backgroundColor: colors.bg,
        border: `2px solid ${isActive ? '#1a1714' : colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        position: 'relative',
        boxShadow: isActive ? '0 0 0 3px rgba(26,23,20,0.12)' : isDone ? '0 2px 8px rgba(45,90,39,0.15)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}>
        {isRunning ? (
          <div style={{
            width: 20,
            height: 20,
            border: `2.5px solid ${colors.border}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'stage-spin 0.8s linear infinite',
          }} />
        ) : (
          <span style={{ lineHeight: 1 }}>
            {STAGE_ICONS[stage.id as StageId] ?? `${index + 1}`}
          </span>
        )}

        {/* Status dot */}
        <span style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: colors.dot,
          border: '2px solid #faf8f4',
        }} />
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center', maxWidth: 72 }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#1a1714',
          margin: 0,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 72,
        }}>
          {stage.label}
        </p>
        <p style={{
          fontSize: '9px',
          color: colors.text,
          margin: '2px 0 0 0',
          fontWeight: isRunning ? 700 : 400,
        }}>
          {STATUS_LABELS[stage.status] ?? stage.status}
        </p>
      </div>
    </button>
  )
}

function Connector({ fromStatus }: { fromStatus: string }) {
  const done = fromStatus === 'complete' || fromStatus === 'needs_review'
  return (
    <div style={{
      flex: 1,
      height: 2,
      margin: '0 4px',
      marginBottom: 28,
      backgroundColor: done ? '#a3c99e' : '#e8e0d4',
      transition: 'background-color 0.4s',
      borderRadius: 1,
    }} />
  )
}

function StageDetailPanel({ stage, onClose }: { stage: StageResult; onClose: () => void }) {
  const colors = STATUS_COLORS[stage.status] ?? STATUS_COLORS.pending

  return (
    <div style={{
      marginTop: 16,
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      animation: 'detail-slide-in 0.2s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '18px' }}>{STAGE_ICONS[stage.id as StageId]}</span>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1a1714', margin: 0 }}>{stage.label}</h4>
            <p style={{ fontSize: '11px', color: colors.text, margin: '2px 0 0 0', fontWeight: 600 }}>
              {STATUS_LABELS[stage.status]}
              {stage.durationMs > 0 && ` · ${(stage.durationMs / 1000).toFixed(1)}s`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94', fontSize: '18px', lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>

      {stage.summary && (
        <p style={{ fontSize: '12px', color: '#6b6560', margin: '0 0 12px 0', padding: '8px 12px', backgroundColor: '#faf8f4', borderRadius: '8px' }}>
          {stage.summary}
        </p>
      )}

      {stage.logs.length > 0 && (
        <div style={{
          backgroundColor: '#0f0e0d',
          borderRadius: '8px',
          padding: '10px 14px',
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          maxHeight: 140,
          overflowY: 'auto',
        }}>
          {stage.logs.map((log, i) => (
            <div key={i} style={{
              fontSize: '11px',
              lineHeight: '1.6',
              color: log.startsWith('✓') ? '#4ade80' : log.startsWith('⚠') ? '#fbbf24' : log.startsWith('✗') ? '#ef4444' : '#e8e0d4',
            }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {(stage.outputCount > 0 || stage.exceptionCount > 0) && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {stage.outputCount > 0 && (
            <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #a3c99e' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#2d5a27', margin: 0 }}>{stage.outputCount.toLocaleString()}</p>
              <p style={{ fontSize: '10px', color: '#6b6560', margin: '1px 0 0 0' }}>processed</p>
            </div>
          )}
          {stage.exceptionCount > 0 && (
            <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fdba74' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#c2410c', margin: 0 }}>{stage.exceptionCount}</p>
              <p style={{ fontSize: '10px', color: '#6b6560', margin: '1px 0 0 0' }}>exceptions</p>
            </div>
          )}
        </div>
      )}

      {stage.error && (
        <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <p style={{ fontSize: '11px', color: '#991b1b', margin: 0, fontFamily: 'monospace' }}>{stage.error}</p>
        </div>
      )}
    </div>
  )
}

export default function PipelineViz({ stages, activeStageId, onStageClick }: PipelineVizProps) {
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null)

  const completeCount = stages.filter(s => s.status === 'complete' || s.status === 'needs_review').length
  const pctComplete = Math.round((completeCount / stages.length) * 100)

  const runningStage = stages.find(s => s.status === 'running')
  const needsReviewCount = stages.reduce((s, st) => s + st.exceptionCount, 0)

  function handleStageClick(stage: StageResult) {
    setExpandedStageId(prev => prev === stage.id ? null : stage.id)
    onStageClick?.(stage)
  }

  const expandedStage = stages.find(s => s.id === expandedStageId)

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: '16px',
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '15px',
            color: '#1a1714',
            margin: 0,
          }}>
            Close Pipeline
          </h3>
          {runningStage && (
            <p style={{ fontSize: '11px', color: '#6b6560', margin: '2px 0 0 0' }}>
              Running: <span style={{ color: '#b8734a', fontWeight: 600 }}>{runningStage.label}</span>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {needsReviewCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fdba74',
            }}>
              {needsReviewCount} items need review
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 80, height: 4, backgroundColor: '#f0ebe3', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${pctComplete}%`,
                height: '100%',
                backgroundColor: '#2d5a27',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '11px', color: '#6b6560', fontWeight: 600 }}>{pctComplete}%</span>
          </div>
        </div>
      </div>

      {/* Stage nodes */}
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: i < stages.length - 1 ? '1 1 auto' : '0 0 auto' }}>
            <StageNode
              stage={stage}
              index={i}
              isActive={stage.id === (activeStageId ?? expandedStageId)}
              onClick={() => handleStageClick(stage)}
            />
            {i < stages.length - 1 && <Connector fromStatus={stage.status} />}
          </div>
        ))}
      </div>

      {/* Stage detail panel */}
      {expandedStage && (
        <StageDetailPanel
          stage={expandedStage}
          onClose={() => setExpandedStageId(null)}
        />
      )}

      <style>{`
        @keyframes pipeline-pulse {
          0%   { transform: scale(1);   opacity: 0.35; }
          70%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes stage-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes detail-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
