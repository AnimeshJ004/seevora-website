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
import LoginPage from './components/dashboard/LoginPage';
import DashboardShell from './components/dashboard/DashboardShell';
import { getSession, logout } from './auth/roles';

/* ── Unified dashboard route (login + shell) ── */
function DashboardRoute() {
  const [session, setSession] = useState(() => getSession());

  const handleLogin = (user) => {
    setSession(user);
    window.history.pushState({}, '', '/dashboard');
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    window.history.pushState({}, '', '/login');
  };

  if (session) return <DashboardShell user={session} onLogout={handleLogout} />;
  return <LoginPage onLogin={handleLogin} />;
}

/* ── HR dashboard route (login + shell, HR roles only) ── */
function HRRoute() {
  const [session, setSession] = useState(() => getSession());

  const handleLogin = (user) => {
    setSession(user);
    window.history.pushState({}, '', '/hr');
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    window.history.pushState({}, '', '/hr');
  };

  const hrRoles = ['hr', 'super_admin'];
  if (session && hrRoles.includes(session.role)) {
    return <DashboardShell user={session} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#faq') {
      window.history.replaceState(null, '', '/faqs');
      setPath('/faqs');
    }
  }, [path]);

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
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);
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

  if (path === '/admin')     return <AdminPage />;
  if (path === '/hr')        return <HRRoute />;
  if (path === '/dashboard' || path === '/login') return <DashboardRoute />;

  return (
    <>
      <Navbar />
      {path === '/faqs' ? (
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
