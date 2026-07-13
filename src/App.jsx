import React, { useEffect, useState, Suspense, lazy } from 'react';
import Navbar from './components/landing-page/Navbar';
import Footer from './components/landing-page/Footer';
import ChatWidget from './components/SalesAgent/ChatWidget';
import { apiFetch, logoutSession, restoreAuthSession } from './auth/api';
import logoIcon from './assets/logo-icon.png';

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
  if (role === 'admin' || role === 'super_admin') return '/admin';
  if (role === 'hr') return '/hr';
  if (role === 'manager' || role === 'employee') return '/dashboard';
  return '/dashboard';
}

async function finalizeAttendanceSession() {
  try {
    await apiFetch('/api/attendance/clock-out', {
      method: 'POST',
      redirectOnUnauthorized: false,
    });
  } catch {
    // Ignore logout telemetry failures.
  }
}

function DashboardRoute() {
  const [session, setSession] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let active = true;
    restoreAuthSession()
      .then((user) => {
        if (active) setSession(user);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsRestoringSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const expireSession = () => setSession(null);
    window.addEventListener('authsessionexpired', expireSession);
    return () => window.removeEventListener('authsessionexpired', expireSession);
  }, []);

  const handleLogin = (user) => {
    setSession(user);
    window.history.pushState({}, '', getRolePath(user?.role));
  };

  const handleLogout = async () => {
    await finalizeAttendanceSession();
    await logoutSession();
    setSession(null);
    window.history.pushState({}, '', '/login');
  };

  if (isRestoringSession) return <div className="page-loader" aria-label="Loading" />;
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
        <img 
          src={logoIcon} 
          alt="Seevora Loading" 
          style={{
            width: '64px',
            height: 'auto',
            animation: 'spin3d 2s infinite linear',
            margin: '0 auto 16px',
            transformStyle: 'preserve-3d'
          }} 
        />
      </div>
      <style>{`
        @keyframes spin3d {
          0% { transform: perspective(400px) rotateY(0deg); }
          50% { transform: perspective(400px) rotateY(180deg); }
          100% { transform: perspective(400px) rotateY(360deg); }
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
    </Suspense>
  );
}
