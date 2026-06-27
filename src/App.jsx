import React, { useEffect, useState } from 'react';
import Navbar from './components/landing-page/Navbar';
import Hero from './components/landing-page/Hero';
import Problems from './components/landing-page/Problems';
import Modules from './components/landing-page/Modules';
import Workflow from './components/landing-page/Workflow';
import Industries from './components/landing-page/Industries';
import DashboardPreview from './components/landing-page/DashboardPreview';
import TrustSecurity from './components/landing-page/TrustSecurity';
import Stats from './components/landing-page/Stats';
import Testimonials from './components/landing-page/Testimonials';
import About from './components/landing-page/About';
import Contact from './components/landing-page/Contact';
import FinalCTA from './components/landing-page/FinalCTA';
import Footer from './components/landing-page/Footer';
import FAQ from './components/landing-page/FAQ';

export default function App() {
  const [locationKey, setLocationKey] = useState(() => `${window.location.pathname}${window.location.hash}`);

  useEffect(() => {
    const syncLocation = () => setLocationKey(`${window.location.pathname}${window.location.hash}`);
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash === '#faq') {
      window.history.replaceState(null, '', '/faqs');
      setLocationKey('/faqs');
    }
  }, [locationKey]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [locationKey]);

  const isFaqPage = window.location.pathname === '/faqs';

  return (
    <>
      <Navbar />
      {isFaqPage ? (
        <FAQ isPage />
      ) : (
        <>
          <Hero />
          <Problems />
          <Modules />
          <Workflow />
          <Industries />
          <DashboardPreview />
          <TrustSecurity />
          <Stats />
          <Testimonials />
          <About />
          <Contact />
          <FinalCTA />
        </>
      )}
      <Footer />
    </>
  );
}
