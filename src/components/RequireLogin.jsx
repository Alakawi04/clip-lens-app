import { Navigate, useLocation } from 'react-router-dom';

// Sends unauthenticated users to login with their current location as
// returnTo, so after signing in they land back where they started
// (e.g. the analyze screen) instead of on the homepage.
export default function RequireLogin() {
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
}