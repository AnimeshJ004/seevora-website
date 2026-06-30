import React, { useEffect, useState } from 'react';
import Navbar from './components/landing-page/Navbar';
import ServicesPage from './components/landing-page/ServicesPage';
import ModulesPage from './components/landing-page/ModulesPage';
import ImpactPage from './components/landing-page/ImpactPage';
import HomePage from './components/landing-page/HomePage';
import AboutPage from './components/landing-page/AboutPage';
import Contact from './components/landing-page/Contact';
import AuthPage from './components/landing-page/AuthPage';
import Footer from './components/landing-page/Footer';
import FAQ from './components/landing-page/FAQ';
import PrivacyPolicy from './components/landing-page/PrivacyPolicy';
import TermsConditions from './components/landing-page/TermsConditions';
import AdminPage from './components/admin/AdminPage';

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
    if (window.location.hash && window.location.hash !== '#faq') {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      window.scrollTo(0, 0);
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

  const isAdminPage = window.location.pathname === '/admin';
  const isFaqPage = window.location.pathname === '/faqs';
  const isPrivacyPage = window.location.pathname === '/privacy-policy';
  const isTermsPage = window.location.pathname === '/terms-and-conditions';
  const isAboutPage = window.location.pathname === '/about';
  const isServicesPage = window.location.pathname === '/services';
  const isModulesPage = window.location.pathname === '/modules';
  const isImpactPage = window.location.pathname === '/impact';
  const isBookCallPage = window.location.pathname === '/book-a-call';
  const isLoginPage = window.location.pathname === '/login';
  const isAdminPage = window.location.pathname === '/admin';
  const isAuthenticated = Boolean(localStorage.getItem('seevoraAuthToken'));
  const isAdminShell = isAdminPage && isAuthenticated;

  useEffect(() => {
    if (window.location.pathname === '/signup') {
      window.history.replaceState(null, '', '/login');
      setLocationKey('/login');
      return;
    }
    if (isAdminPage && !isAuthenticated) {
      window.history.replaceState(null, '', '/login');
      setLocationKey('/login');
    }
  }, [isAdminPage, isAuthenticated, locationKey]);

  if (isAdminPage) return <AdminPage />;

  return (
    <>
      {!isAdminShell && <Navbar />}
      {isAdminPage ? (
        isAuthenticated ? <AdminPage /> : <AuthPage mode="login" />
      ) : isFaqPage ? (
        <FAQ isPage />
      ) : isPrivacyPage ? (
        <PrivacyPolicy />
      ) : isTermsPage ? (
        <TermsConditions />
      ) : isAboutPage ? (
        <AboutPage />
      ) : isServicesPage ? (
        <ServicesPage />
      ) : isModulesPage ? (
        <ModulesPage />
      ) : isImpactPage ? (
        <ImpactPage />
      ) : isBookCallPage ? (
        <Contact />
      ) : isLoginPage ? (
        <AuthPage mode="login" />
      ) : (
        <HomePage />
      )}
      {!isAdminShell && <Footer />}
    </>
  );
}
