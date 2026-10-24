import { lazy, Suspense, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, useTheme } from 'next-themes';
import { MotionConfig } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import AdminRoute from '@/components/AdminRoute';
import LanguageTransition from '@/components/LanguageTransition';
import Layout from '@/components/Layout';
import PageLoading from '@/components/PageLoading';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireLogin from '@/components/RequireLogin';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollProgress from '@/components/ScrollProgress';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CreditProvider } from '@/lib/CreditContext';
import { LanguageProvider } from '@/lib/i18n';
import PageNotFound from '@/lib/PageNotFound';
import { queryClientInstance } from '@/lib/query-client';
import { SiteSettingsProvider, useSiteSettings, saveSiteThemePreference } from '@/lib/SiteSettingsContext';
import { pruneExpiredAnalysisFrames } from '@/lib/videoFrames';
import Home from '@/pages/Home';

const Analyze = lazy(() => import('@/pages/Analyze'));
const Progress = lazy(() => import('@/pages/Progress'));
const Results = lazy(() => import('@/pages/Results'));
const History = lazy(() => import('@/pages/History'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Admin = lazy(() => import('@/pages/Admin'));
const Info = lazy(() => import('@/pages/Info'));

function lazyPage(element) {
  return <Suspense fallback={<PageLoading />}>{element}</Suspense>;
}

function LocalFrameCleanup() {
  useEffect(() => {
    const cleanup = () => {
      pruneExpiredAnalysisFrames().catch((error) => {
        console.warn('Could not clear expired temporary video frames:', error);
      });
    };
    cleanup();
    const timer = window.setInterval(cleanup, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}

function SiteAppearanceSync() {
  const { settings, loading } = useSiteSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (loading) return;
    const theme = settings.texts?.__appearance?.theme === 'light' ? 'light' : 'dark';
    saveSiteThemePreference(theme);
    try {
      if (!window.localStorage.getItem('theme')) setTheme(theme);
    } catch {
      setTheme(theme);
    }
  }, [loading, settings.texts, setTheme]);

  return null;
}

function AuthenticatedApp() {
  const { authError } = useAuth();

  if (authError) {
    return (
      <div
        role="alert"
        className="mx-auto mt-20 max-w-xl rounded-2xl border border-destructive/30 bg-card p-6 text-sm text-foreground"
      >
        {authError}
      </div>
    );
  }

  return (
    <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={lazyPage(<Home />)} />
          <Route path="/privacy" element={lazyPage(<Info kind="privacy" />)} />
          <Route path="/terms" element={lazyPage(<Info kind="terms" />)} />
          <Route path="/help" element={lazyPage(<Info kind="help" />)} />
          <Route element={<ProtectedRoute unauthenticatedElement={<RequireLogin />} />}>
            <Route path="/analyze" element={lazyPage(<Analyze />)} />
            <Route path="/progress/:id" element={lazyPage(<Progress />)} />
            <Route path="/results/:id" element={lazyPage(<Results />)} />
            <Route path="/history" element={lazyPage(<History />)} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={lazyPage(<Admin />)} />
            </Route>
          </Route>
        </Route>
        <Route path="/login" element={lazyPage(<Login />)} />
        <Route path="/register" element={lazyPage(<Register />)} />
        <Route path="/forgot-password" element={lazyPage(<ForgotPassword />)} />
        <Route path="/reset-password" element={lazyPage(<ResetPassword />)} />
        <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MotionConfig reducedMotion="user">
        <SiteSettingsProvider>
          <SiteAppearanceSync />
          <LanguageProvider>
            <LanguageTransition />
            <AuthProvider>
              <CreditProvider>
                <QueryClientProvider client={queryClientInstance}>
                  <BrowserRouter>
                    <LocalFrameCleanup />
                    <ScrollToTop />
                    <ScrollProgress />
                    <AuthenticatedApp />
                  </BrowserRouter>
                  <Toaster />
                </QueryClientProvider>
              </CreditProvider>
            </AuthProvider>
          </LanguageProvider>
        </SiteSettingsProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
