import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import StatBand from '@/components/landing/StatBand'
import AutomationTheater from '@/components/landing/AutomationTheater'
import AgentOrchestra from '@/components/landing/AgentOrchestra'
import BentoGrid from '@/components/landing/BentoGrid'
import HowItWorks from '@/components/landing/HowItWorks'
import Testimonials from '@/components/landing/Testimonials'
import PricingSection from '@/components/landing/PricingSection'
import CtaBand from '@/components/landing/CtaBand'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#080808',
        color: '#FAFAFA',
        overflowX: 'clip',
      }}
    >
      <Nav />
      <main>
        <Hero />
        <StatBand />
        <AutomationTheater />
        <AgentOrchestra />
        <BentoGrid />
        <HowItWorks />
        <Testimonials />
        <PricingSection />
        <CtaBand />
      </main>
      <Footer />
    </div>
  )
}
