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
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);

  if (path === '/admin')     return <AdminPage />;
  if (path === '/hr')        return <HRRoute />;
  if (path === '/dashboard' || path === '/login') return <DashboardRoute />;

  return (
    <>
      <Navbar />
      {path === '/faqs' ? (
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
