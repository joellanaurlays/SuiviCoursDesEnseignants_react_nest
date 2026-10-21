import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getSession, saveSession } from '../services/auth.service';
import { getAuthHeaders } from '../services/auth.service';
import { defaultSessionUser, profileToSession } from './identities';
import { RoleProfile, UserSession } from '../types/enseignement';

interface AuthContextValue {
  session: UserSession;
  profile: RoleProfile | undefined;
  headers: Record<string, string>;
  changeProfile: (profile: RoleProfile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_EVENT = 'suivi-auth-changed';

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = getSession();
  const [session, setSession] = useState<UserSession>(
    stored ?? profileToSession(defaultSessionUser()),
  );
  const [profile, setProfile] = useState<RoleProfile | undefined>(
    stored ? undefined : defaultSessionUser(),
  );

  useEffect(() => {
    const onStorage = () => {
      const s = getSession();
      if (s) setSession(s);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_EVENT, onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_EVENT, onStorage);
    };
  }, []);

  const changeProfile = useCallback((p: RoleProfile) => {
    const next = profileToSession(p);
    saveSession(next);
    setSession(next);
    setProfile(p);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  const headers = useMemo(() => getAuthHeaders(session), [session]);

  const value = useMemo(
    () => ({ session, profile, headers, changeProfile }),
    [session, profile, headers, changeProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}