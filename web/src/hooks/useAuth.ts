import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/auth-context';

/** Access the logged-in user and login/register/logout from any component. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
