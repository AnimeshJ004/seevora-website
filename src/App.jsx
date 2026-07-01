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

function getRolePath(role) {
  if (role === 'super_admin' || role === 'admin') return '/admin';
  if (role === 'hr') return '/hr';
  if (role === 'manager' || role === 'employee') return '/dashboard';
  return '/dashboard';
}

async function finalizeAttendanceSession() {
  const token = localStorage.getItem('seevoraAuthToken');
  if (!token) return;

  try {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await fetch('/api/attendance/clock-out', options);
    if (response.status === 502) {
      await fetch('http://127.0.0.1:4000/api/attendance/clock-out', options);
    }
  } catch {
    // Ignore logout telemetry failures.
  }
}

function DashboardRoute() {
  const [session, setSession] = useState(() => getSession());

  const handleLogin = (user) => {
    setSession(user);
    window.history.pushState({}, '', getRolePath(user?.role));
  };

  const handleLogout = async () => {
    await finalizeAttendanceSession();
    logout();
    setSession(null);
    window.history.pushState({}, '', '/login');
  };

  if (session) return <DashboardShell user={session} onLogout={handleLogout} />;
  return (
    <>
      <Navbar />
      <LoginPage onLogin={handleLogin} />
    </>
  );
}

function HRRoute() {
  const [session, setSession] = useState(() => getSession());
  const hrRoles = ['hr', 'super_admin'];

  const handleLogin = (user) => {
    setSession(user);
    window.history.pushState({}, '', getRolePath(user?.role));
  };

  const handleLogout = async () => {
    await finalizeAttendanceSession();
    logout();
    setSession(null);
    window.history.pushState({}, '', '/hr');
  };

  if (session && hrRoles.includes(session.role)) {
    return <DashboardShell user={session} onLogout={handleLogout} />;
  }

  return (
    <>
      <Navbar />
      <LoginPage onLogin={handleLogin} />
    </>
  );
}

export default function App() {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname,
    hash: window.location.hash,
  }));

  const isAuthenticated = Boolean(localStorage.getItem('seevoraAuthToken'));
  const path = locationState.pathname;
  const hash = locationState.hash;

  useEffect(() => {
    const syncLocation = () => {
      setLocationState({
        pathname: window.location.pathname,
        hash: window.location.hash,
      });
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };

    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    window.addEventListener('locationchange', syncLocation);
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
      window.removeEventListener('locationchange', syncLocation);
    };
  }, []);

  useEffect(() => {
    if (path === '/signup') {
      window.history.replaceState(null, '', '/login');
      setLocationState({ pathname: '/login', hash: '' });
    }
  }, [path]);

  useEffect(() => {
    if (hash && hash !== '#faq') {
      const id = hash.substring(1);
      const timer = window.setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

      return () => window.clearTimeout(timer);
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [path, hash]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);

  if (path === '/admin') return isAuthenticated ? <AdminPage /> : <AuthPage />;
  if (path === '/hr') return <HRRoute />;
  if (path === '/dashboard' || path === '/login') return <DashboardRoute />;

  const hideSiteChrome = ['/admin', '/dashboard', '/hr', '/login'].includes(path);

  return (
    <>
      {!hideSiteChrome && <Navbar />}
      {path === '/faqs' ? (
        <FAQ isPage />
      ) : path === '/privacy-policy' ? (
        <PrivacyPolicy />
      ) : path === '/terms-and-conditions' ? (
        <TermsConditions />
      ) : path === '/about' ? (
        <AboutPage />
      ) : path === '/services' ? (
        <ServicesPage />
      ) : path === '/modules' ? (
        <ModulesPage />
      ) : path === '/impact' ? (
        <ImpactPage />
      ) : path === '/book-a-call' ? (
        <Contact />
      ) : path === '/login' ? (
        <AuthPage />
      ) : (
        <HomePage />
      )}
      {!hideSiteChrome && <Footer />}
    </>
  );
}
