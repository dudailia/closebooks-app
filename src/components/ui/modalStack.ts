'use client'

import { useEffect, useState } from 'react'

const openModals: symbol[] = []
const stackListeners = new Set<() => void>()
let scrollLockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function notifyStackChange() {
  stackListeners.forEach((listener) => listener())
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  )
}

export function registerModal(id: symbol) {
  if (!openModals.includes(id)) {
    openModals.push(id)
    notifyStackChange()
  }
}

export function unregisterModal(id: symbol) {
  const index = openModals.indexOf(id)
  if (index >= 0) {
    openModals.splice(index, 1)
    notifyStackChange()
  }
}

export function getModalLayer(id: symbol): number {
  const index = openModals.indexOf(id)
  return index >= 0 ? index : 0
}

export function isTopModal(id: symbol): boolean {
  return openModals.length > 0 && openModals[openModals.length - 1] === id
}

export function subscribeModalStack(listener: () => void) {
  stackListeners.add(listener)
  return () => {
    stackListeners.delete(listener)
  }
}

export function lockBodyScroll() {
  scrollLockCount += 1
  if (scrollLockCount !== 1 || typeof document === 'undefined') return

  const body = document.body
  savedOverflow = body.style.overflow
  savedPaddingRight = body.style.paddingRight

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }
}

export function unlockBodyScroll() {
  if (scrollLockCount === 0) return
  scrollLockCount -= 1
  if (scrollLockCount !== 0 || typeof document === 'undefined') return

  const body = document.body
  body.style.overflow = savedOverflow
  body.style.paddingRight = savedPaddingRight
}

export function modalZIndex(layer: number, kind: 'overlay' | 'panel'): number {
  const base = kind === 'overlay' ? 300 : 400
  return base + layer * 10
}

export function useModalRegistration(open: boolean) {
  const [modalId] = useState(() => Symbol('modal'))
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeModalStack(() => setTick((value) => value + 1)), [])

  useEffect(() => {
    if (!open) return
    registerModal(modalId)
    return () => unregisterModal(modalId)
  }, [open, modalId])

  const layer = open ? getModalLayer(modalId) : 0
  const isTop = open ? isTopModal(modalId) : false

  return { modalId, layer, isTop, tick }
}
