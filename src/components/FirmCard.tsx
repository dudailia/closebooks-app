'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Firm } from '@/lib/directoryData'
import VerifiedBadge from './VerifiedBadge'

interface FirmCardProps {
  firm: Firm
}

export default function FirmCard({ firm }: FirmCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: hovered
          ? '0 8px 32px rgba(26,23,20,0.10)'
          : '0 1px 4px rgba(26,23,20,0.05)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '18px',
              letterSpacing: '-0.02em',
              color: '#1a1714',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {firm.name}
          </h3>
          <p style={{ fontSize: '13px', color: '#6b6560', marginTop: 3 }}>
            {firm.city}, {firm.state}
          </p>
        </div>
        {firm.verified && <VerifiedBadge size="sm" showLabel={false} />}
      </div>

      {/* Tagline */}
      <p style={{ fontSize: '13px', color: '#6b6560', margin: 0, lineHeight: 1.5 }}>
        {firm.tagline}
      </p>

      {/* Specialty tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {firm.specialties.slice(0, 3).map((s) => (
          <span
            key={s}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 9px',
              borderRadius: 20,
              backgroundColor: '#f5f0ea',
              color: '#6b6560',
              border: '1px solid #e8e0d4',
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          borderTop: '1px solid #f0ece4',
          paddingTop: 14,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#2d5a27',
              margin: 0,
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              letterSpacing: '-0.02em',
            }}
          >
            {firm.accuracyRate}%
          </p>
          <p style={{ fontSize: '10px', color: '#a09a94', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Accuracy
          </p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #f0ece4', borderRight: '1px solid #f0ece4' }}>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1714',
              margin: 0,
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              letterSpacing: '-0.02em',
            }}
          >
            {firm.avgCloseTimeMin}m
          </p>
          <p style={{ fontSize: '10px', color: '#a09a94', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Avg Close
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1714',
              margin: 0,
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              letterSpacing: '-0.02em',
            }}
          >
            {firm.clientSatisfaction}
          </p>
          <p style={{ fontSize: '10px', color: '#a09a94', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Rating
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/directory/${firm.slug}`}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '10px 16px',
          borderRadius: 10,
          backgroundColor: hovered ? '#2d5a27' : '#f0f5ef',
          color: hovered ? '#ffffff' : '#2d5a27',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'background-color 0.2s ease, color 0.2s ease',
          border: '1px solid #c4d9c0',
        }}
      >
        View Profile
      </Link>
    </div>
  )
}
