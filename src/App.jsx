import React, { useEffect, useState } from 'react';
import Navbar from './components/landing-page/Navbar';
import Hero from './components/landing-page/Hero';
import WhySeevora from './components/landing-page/WhySeevora';
import Problems from './components/landing-page/Problems';
import Modules from './components/landing-page/Modules';
import Workflow from './components/landing-page/Workflow';
import Industries from './components/landing-page/Industries';
import Stats from './components/landing-page/Stats';
import About from './components/landing-page/About';
import Contact from './components/landing-page/Contact';
import Footer from './components/landing-page/Footer';
import Outcomes from './components/landing-page/Outcomes';
import FAQ from './components/landing-page/FAQ';
import Solutions from './components/landing-page/Solutions';
import PrivacyPolicy from './components/landing-page/PrivacyPolicy';
import TermsConditions from './components/landing-page/TermsConditions';

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
    window.scrollTo(0, 0);
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
  const isPrivacyPage = window.location.pathname === '/privacy-policy';
  const isTermsPage = window.location.pathname === '/terms-and-conditions';

  return (
    <>
      <Navbar />
      {isFaqPage ? (
        <FAQ isPage />
      ) : isPrivacyPage ? (
        <PrivacyPolicy />
      ) : isTermsPage ? (
        <TermsConditions />
      ) : (
        <>
          <Hero />
          <About />
          <Problems />
          <Solutions />
          <Industries />
          <Modules />
          <WhySeevora />
          <Workflow />
          <Outcomes />
          <Stats />
          <Contact />
        </>
      )}
      <Footer />
    </>
  );
}
