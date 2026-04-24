import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import StatBand from '@/components/landing/StatBand'
import BentoGrid from '@/components/landing/BentoGrid'
import HowItWorks from '@/components/landing/HowItWorks'
import Testimonials from '@/components/landing/Testimonials'
import PricingTeaser from '@/components/landing/PricingTeaser'
import CtaBand from '@/components/landing/CtaBand'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        color: '#F0F0F5',
        overflowX: 'hidden',
      }}
    >
      <Nav />
      <main>
        <Hero />
        <StatBand />
        <BentoGrid />
        <HowItWorks />
        <Testimonials />
        <PricingTeaser />
        <CtaBand />
      </main>
      <Footer />
    </div>
  )
}
