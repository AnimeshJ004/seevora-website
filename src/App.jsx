import React, { useEffect, useState, Suspense, lazy } from 'react';
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
import LoginPage from './components/dashboard/LoginPage';
import DashboardShell from './components/dashboard/DashboardShell';
import ChatWidget from './components/SalesAgent/ChatWidget';
import { getSession, logout } from './auth/roles';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./components/landing-page/HomePage'));
const ServicesPage = lazy(() => import('./components/landing-page/ServicesPage'));
const ModulesPage = lazy(() => import('./components/landing-page/ModulesPage'));
const ImpactPage = lazy(() => import('./components/landing-page/ImpactPage'));
const AboutPage = lazy(() => import('./components/landing-page/AboutPage'));
const Contact = lazy(() => import('./components/landing-page/Contact'));
const FAQ = lazy(() => import('./components/landing-page/FAQ'));
const PrivacyPolicy = lazy(() => import('./components/landing-page/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./components/landing-page/TermsConditions'));
const AuthPage = lazy(() => import('./components/landing-page/AuthPage'));
const LoginPage = lazy(() => import('./components/dashboard/LoginPage'));
const DashboardShell = lazy(() => import('./components/dashboard/DashboardShell'));
const NotFoundPage = lazy(() => import('./components/landing-page/NotFoundPage'));

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

    // 1. Observe elements currently in the DOM
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));

    // 2. Set up MutationObserver to catch lazy-loaded elements
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.hasAttribute('data-animate')) {
              observer.observe(node);
            }
            node.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [path]);

  // Loading fallback component
  const LoadingFallback = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      color: 'var(--text-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p>Loading...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (['/admin', '/hr', '/dashboard', '/login'].includes(path)) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DashboardRoute />
      </Suspense>
    );
  }

  const hideSiteChrome = ['/admin', '/dashboard', '/hr', '/login'].includes(path);

  // Define valid routes
  const validRoutes = ['/', '/faqs', '/privacy-policy', '/terms-and-conditions', '/about', '/services', '/modules', '/impact', '/book-a-call', '/login'];
  const isValidRoute = validRoutes.includes(path);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {!hideSiteChrome && <Navbar />}
      {!isValidRoute ? (
        <NotFoundPage />
      ) : path === '/faqs' ? (
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
      {!hideSiteChrome && <ChatWidget />}
    </>
    </Suspense>
  );
}
