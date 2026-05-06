'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  as?: 'div' | 'article' | 'figure' | 'section'
}

export function GlowCard({ children, className, style, onClick, as = 'div' }: GlowCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        'transition-all duration-300',
        className
      )}
      style={{
        background: '#0f0f0f',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,200,83,0.4)'
        el.style.boxShadow = '0 0 30px rgba(0,200,83,0.1), 0 0 0 1px rgba(0,200,83,0.1) inset'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = '#1f1f1f'
        el.style.boxShadow = 'none'
      }}
    >
      {children}
    </motion.div>
  )
}
