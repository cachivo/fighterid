import { Navigate } from 'react-router-dom';

/**
 * Legacy route - redirects to unified onboarding flow
 * Keeping this file for backwards compatibility with any existing links
 */
export default function RequestFighterLicense() {
  return <Navigate to="/license/onboarding" replace />;
}
