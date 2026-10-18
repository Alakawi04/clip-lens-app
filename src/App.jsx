import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/i18n';
import LanguageTransition from '@/components/LanguageTransition';
import { SiteSettingsProvider } from '@/lib/SiteSettingsContext';
import { CreditProvider } from '@/lib/CreditContext';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Analyze from '@/pages/Analyze';
import Progress from '@/pages/Progress';
import Results from '@/pages/Results';
import History from '@/pages/History';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireLogin from '@/components/RequireLogin';
import AdminRoute from '@/components/AdminRoute';
import Admin from '@/pages/Admin';
import Info from '@/pages/Info';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Info kind="privacy" />} />
        <Route path="/terms" element={<Info kind="terms" />} />
        <Route path="/help" element={<Info kind="help" />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<RequireLogin />} />}>
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/progress/:id" element={<Progress />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SiteSettingsProvider>
        <LanguageProvider>
          <LanguageTransition />
          <AuthProvider>
            <CreditProvider>
              <QueryClientProvider client={queryClientInstance}>
              <Router>
                <ScrollToTop />
                <AuthenticatedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
            </CreditProvider>
          </AuthProvider>
        </LanguageProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}

export default App