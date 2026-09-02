'use client'

import type { CSSProperties, ReactNode } from 'react'
import Card from '@/components/ui/Card'
import CardBody from '@/components/ui/CardBody'
import CardFooter from '@/components/ui/CardFooter'
import CardHeader from '@/components/ui/CardHeader'
import type { CardVariant } from '@/components/ui/cardStyles'

export interface SectionCardProps {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  variant?: CardVariant
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SectionCard({
  title,
  description,
  eyebrow,
  icon,
  action,
  footer,
  variant = 'default',
  children,
  className,
  style,
}: SectionCardProps) {
  return (
    <Card variant={variant} padding="none" className={className} style={style}>
      <CardHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        icon={icon}
        action={action}
        divider={Boolean(children)}
      />
      {children ? <CardBody compact={Boolean(footer)}>{children}</CardBody> : null}
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}

export default SectionCard
