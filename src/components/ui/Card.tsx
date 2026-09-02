'use client'

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import {
  CARD_CLASS,
  cardShellStyle,
  interactiveHoverStyle,
  isInteractiveVariant,
  resetInteractiveStyle,
  type CardPadding,
  type CardVariant,
} from '@/components/ui/cardStyles'

type CardBaseProps = {
  variant?: CardVariant
  padding?: CardPadding
  children: ReactNode
}

export type CardProps = CardBaseProps &
  (
    | (HTMLAttributes<HTMLDivElement> & { href?: never; type?: never })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  )

type CardElement = HTMLDivElement | HTMLAnchorElement | HTMLButtonElement
type CardMouseHandler = (e: MouseEvent<CardElement>) => void
type CardFocusHandler = (e: FocusEvent<CardElement>) => void

export const Card = forwardRef<HTMLDivElement | HTMLAnchorElement | HTMLButtonElement, CardProps>(
  function Card(
    {
      variant = 'default',
      padding = 'md',
      children,
      style,
      className,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) {
    const shellStyle = {
      ...cardShellStyle(variant, padding),
      ...(isInteractiveVariant(variant) || 'href' in rest || 'onClick' in rest
        ? { cursor: 'pointer', textAlign: 'left' as const }
        : {}),
      ...style,
    }

    const dataAttrs = {
      className: [CARD_CLASS, className].filter(Boolean).join(' '),
      'data-variant': variant,
    }

    const interactiveHandlers = {
      onMouseEnter: (e: MouseEvent<HTMLDivElement | HTMLAnchorElement | HTMLButtonElement>) => {
        if (isInteractiveVariant(variant) || 'href' in rest || rest.onClick) {
          interactiveHoverStyle(e.currentTarget)
        }
        (onMouseEnter as CardMouseHandler | undefined)?.(e)
      },
      onMouseLeave: (e: MouseEvent<HTMLDivElement | HTMLAnchorElement | HTMLButtonElement>) => {
        if (isInteractiveVariant(variant) || 'href' in rest || rest.onClick) {
          resetInteractiveStyle(e.currentTarget, variant)
        }
        (onMouseLeave as CardMouseHandler | undefined)?.(e)
      },
      onFocus: (e: FocusEvent<HTMLDivElement | HTMLAnchorElement | HTMLButtonElement>) => {
        (onFocus as CardFocusHandler | undefined)?.(e)
      },
      onBlur: (e: FocusEvent<HTMLDivElement | HTMLAnchorElement | HTMLButtonElement>) => {
        (onBlur as CardFocusHandler | undefined)?.(e)
      },
    }

    if ('href' in rest && rest.href) {
      const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string
      }
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          style={{ ...shellStyle, textDecoration: 'none', color: 'inherit' }}
          {...dataAttrs}
          {...interactiveHandlers}
          {...anchorRest}
        >
          {children}
        </a>
      )
    }

    if ('onClick' in rest && rest.onClick) {
      const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type={type}
          style={shellStyle}
          {...dataAttrs}
          {...interactiveHandlers}
          {...buttonRest}
        >
          {children}
        </button>
      )
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        style={shellStyle}
        {...dataAttrs}
        {...interactiveHandlers}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      />
    )
  },
)

export default Card
