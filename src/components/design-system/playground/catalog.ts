export type CatalogGroup = 'foundation' | 'components'

export type CatalogEntry = {
  id: string
  label: string
  group: CatalogGroup
  description: string
}

export const CATALOG_SECTIONS: CatalogEntry[] = [
  {
    id: 'colors',
    label: 'Colors',
    group: 'foundation',
    description: 'Semantic color tokens, brand palette, and status fills.',
  },
  {
    id: 'typography',
    label: 'Typography',
    group: 'foundation',
    description: 'Font families, size scale, weights, and line heights.',
  },
  {
    id: 'spacing',
    label: 'Spacing',
    group: 'foundation',
    description: '4px grid spacing scale from --space-1 through --space-16.',
  },
  {
    id: 'radius',
    label: 'Radius',
    group: 'foundation',
    description: 'Corner radii for controls, surfaces, and pills.',
  },
  {
    id: 'elevation',
    label: 'Elevation',
    group: 'foundation',
    description: 'Shadow tokens and z-index stacking contract.',
  },
  {
    id: 'motion',
    label: 'Motion',
    group: 'foundation',
    description: 'Duration, easing, and entrance animation utilities.',
  },
  {
    id: 'icons',
    label: 'Icons',
    group: 'foundation',
    description: 'Inline SVG sizing, stroke weight, and decorative usage.',
  },
  {
    id: 'buttons',
    label: 'Buttons',
    group: 'components',
    description: 'Primary interactive control — variants, sizes, and loading.',
  },
  {
    id: 'inputs',
    label: 'Inputs',
    group: 'components',
    description: 'Input, Textarea, Select, Field, Label, and validation.',
  },
  {
    id: 'cards',
    label: 'Cards',
    group: 'components',
    description: 'Card surfaces, stat cards, and section containers.',
  },
  {
    id: 'dialogs',
    label: 'Dialogs',
    group: 'components',
    description: 'Modal, drawer, confirmation, focus trap, and overlay.',
  },
  {
    id: 'badges',
    label: 'Badges',
    group: 'components',
    description: 'Status chips with semantic tones and compact mode.',
  },
  {
    id: 'tables',
    label: 'Tables',
    group: 'components',
    description: 'Reference table patterns using design tokens (no primitive yet).',
  },
  {
    id: 'loading',
    label: 'Loading',
    group: 'components',
    description: 'Skeleton shimmer, button spinners, and input busy states.',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    group: 'components',
    description: 'Focus rings, reduced motion, landmarks, and contrast.',
  },
]

export const FOUNDATION_SECTIONS = CATALOG_SECTIONS.filter((s) => s.group === 'foundation')
export const COMPONENT_SECTIONS = CATALOG_SECTIONS.filter((s) => s.group === 'components')
