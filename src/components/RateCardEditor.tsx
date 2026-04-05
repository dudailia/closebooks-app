'use client'

import { useState, useEffect } from 'react'
import type { RateCard } from '@/types/billing'
import { getPricingInsight } from '@/lib/invoiceGenerator'

interface Props {
  value: RateCard
  onChange: (rc: RateCard) => void
}

const PREVIEW_TX = 47

function RangeRow({
  label,
  field,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  label: string
  field: keyof RateCard
  value: number
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  onChange: (field: keyof RateCard, val: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: '#1a1714' }}>
          {label}
        </label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm" style={{ color: '#6b6560' }}>{prefix}</span>}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
            className="w-20 text-right text-sm rounded-lg border px-2 py-1 font-mono"
            style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
          />
          {suffix && <span className="text-sm" style={{ color: '#6b6560' }}>{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(field, parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#2d5a27' }}
      />
      <div className="flex justify-between text-xs" style={{ color: '#6b6560' }}>
        <span>{prefix}{min}{suffix}</span>
        <span>{prefix}{max}{suffix}</span>
      </div>
    </div>
  )
}

export default function RateCardEditor({ value, onChange }: Props) {
  const [rc, setRc] = useState<RateCard>(value)

  useEffect(() => {
    setRc(value)
  }, [value])

  function update(field: keyof RateCard, val: number) {
    const next = { ...rc, [field]: val }
    setRc(next)
    onChange(next)
  }

  // Preview calculation for 47 tx
  const previewSubtotal = Math.max(
    PREVIEW_TX * rc.perTransaction + rc.reportFee,
    rc.minimumEngagement
  )
  const previewTotal = previewSubtotal * (1 + rc.taxRate)
  const insight = getPricingInsight(rc, PREVIEW_TX)

  return (
    <div className="space-y-8">
      {/* Rate inputs */}
      <div
        className="rounded-2xl border p-6 space-y-6"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <h3
          className="text-base font-semibold"
          style={{ color: '#1a1714', fontFamily: 'var(--font-dm-serif)' }}
        >
          Rate Configuration
        </h3>

        <RangeRow
          label="Per Transaction"
          field="perTransaction"
          value={rc.perTransaction}
          min={5}
          max={50}
          step={1}
          prefix="$"
          onChange={update}
        />

        <RangeRow
          label="Report Fee"
          field="reportFee"
          value={rc.reportFee}
          min={0}
          max={200}
          step={5}
          prefix="$"
          onChange={update}
        />

        <RangeRow
          label="Advisory Hourly"
          field="advisoryHourly"
          value={rc.advisoryHourly}
          min={50}
          max={500}
          step={10}
          prefix="$"
          onChange={update}
        />

        <RangeRow
          label="Minimum Engagement"
          field="minimumEngagement"
          value={rc.minimumEngagement}
          min={0}
          max={1000}
          step={25}
          prefix="$"
          onChange={update}
        />

        <RangeRow
          label="Tax Rate"
          field="taxRate"
          value={rc.taxRate * 100}
          min={0}
          max={20}
          step={0.25}
          suffix="%"
          onChange={(field, val) => update('taxRate', val / 100)}
        />
      </div>

      {/* Live preview */}
      <div
        className="rounded-2xl border p-6 space-y-3"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#f5f2ed' }}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: '#6b6560' }}
        >
          Live Preview
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold" style={{ color: '#1a1714' }}>
            ${previewTotal.toFixed(2)}
          </span>
          <span className="text-sm" style={{ color: '#6b6560' }}>
            for a {PREVIEW_TX}-transaction close
          </span>
        </div>

        <div className="text-xs space-y-1" style={{ color: '#6b6560' }}>
          <div className="flex justify-between">
            <span>{PREVIEW_TX} transactions × ${rc.perTransaction}</span>
            <span className="font-mono">${(PREVIEW_TX * rc.perTransaction).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Report fee</span>
            <span className="font-mono">${rc.reportFee.toFixed(2)}</span>
          </div>
          {PREVIEW_TX * rc.perTransaction + rc.reportFee < rc.minimumEngagement && (
            <div className="flex justify-between" style={{ color: '#b8734a' }}>
              <span>Minimum engagement applied</span>
              <span className="font-mono">${rc.minimumEngagement.toFixed(2)}</span>
            </div>
          )}
          {rc.taxRate > 0 && (
            <div className="flex justify-between">
              <span>Tax ({(rc.taxRate * 100).toFixed(2)}%)</span>
              <span className="font-mono">${(previewSubtotal * rc.taxRate).toFixed(2)}</span>
            </div>
          )}
        </div>

        {insight && (
          <div
            className="mt-3 pt-3 border-t text-xs rounded-lg"
            style={{ borderColor: '#e8e0d4', color: '#2d5a27' }}
          >
            <span className="font-medium">Network insight: </span>
            {insight}
          </div>
        )}
      </div>
    </div>
  )
}
