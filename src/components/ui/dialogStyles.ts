import type { CSSProperties } from 'react'

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl'
export type DrawerSide = 'left' | 'right' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg'

export const DIALOG_PANEL_CLASS = 'cb-modal-panel'
export const DRAWER_PANEL_CLASS = 'cb-drawer-panel'

export const dialogSizeStyles: Record<DialogSize, CSSProperties> = {
  sm: { width: '100%', maxWidth: '400px' },
  md: { width: '100%', maxWidth: '480px' },
  lg: { width: '100%', maxWidth: '640px' },
  xl: { width: '100%', maxWidth: '800px' },
}

export const drawerSizeStyles: Record<DrawerSide, Record<DrawerSize, CSSProperties>> = {
  left: {
    sm: { width: 'min(320px, 92vw)' },
    md: { width: 'min(400px, 92vw)' },
    lg: { width: 'min(480px, 92vw)' },
  },
  right: {
    sm: { width: 'min(320px, 92vw)' },
    md: { width: 'min(400px, 92vw)' },
    lg: { width: 'min(480px, 92vw)' },
  },
  bottom: {
    sm: { maxHeight: '40vh' },
    md: { maxHeight: '60vh' },
    lg: { maxHeight: '80vh' },
  },
}

export function panelShellStyle(): CSSProperties {
  return {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-overlay)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    outline: 'none',
  }
}

export function drawerShellStyle(side: DrawerSide): CSSProperties {
  const base: CSSProperties = {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-overlay)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
  }

  if (side === 'bottom') {
    return {
      ...base,
      width: '100%',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 'var(--radius-lg)',
      borderTopRightRadius: 'var(--radius-lg)',
    }
  }

  return {
    ...base,
    height: '100%',
    maxHeight: '100vh',
    borderRadius: 0,
    ...(side === 'left'
      ? { borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }
      : { borderRight: 'none', borderTop: 'none', borderBottom: 'none' }),
  }
}
