'use client'

import PlaygroundShell from '@/components/design-system/playground/PlaygroundShell'
import AccessibilitySection from '@/components/design-system/playground/sections/AccessibilitySection'
import BadgesSection from '@/components/design-system/playground/sections/BadgesSection'
import ButtonsSection from '@/components/design-system/playground/sections/ButtonsSection'
import CardsSection from '@/components/design-system/playground/sections/CardsSection'
import ColorsSection from '@/components/design-system/playground/sections/ColorsSection'
import DialogsSection from '@/components/design-system/playground/sections/DialogsSection'
import ElevationSection from '@/components/design-system/playground/sections/ElevationSection'
import IconsSection from '@/components/design-system/playground/sections/IconsSection'
import InputsSection from '@/components/design-system/playground/sections/InputsSection'
import LoadingSection from '@/components/design-system/playground/sections/LoadingSection'
import MotionSection from '@/components/design-system/playground/sections/MotionSection'
import RadiusSection from '@/components/design-system/playground/sections/RadiusSection'
import SpacingSection from '@/components/design-system/playground/sections/SpacingSection'
import TablesSection from '@/components/design-system/playground/sections/TablesSection'
import TypographySection from '@/components/design-system/playground/sections/TypographySection'

export default function DesignSystemPlayground() {
  return (
    <PlaygroundShell>
      <ColorsSection />
      <TypographySection />
      <SpacingSection />
      <RadiusSection />
      <ElevationSection />
      <MotionSection />
      <IconsSection />
      <ButtonsSection />
      <InputsSection />
      <CardsSection />
      <DialogsSection />
      <BadgesSection />
      <TablesSection />
      <LoadingSection />
      <AccessibilitySection />
    </PlaygroundShell>
  )
}
