import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { api, LoginRequest, OnlineUser, PresenceOverview, SignupRequest, SignupResponse, UserRole } from '../services/api';

type AuthSession = {
  token: string;
  username: string;
  role: UserRole;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticating: boolean;
  errorMessage: string | null;
  onlineUsers: OnlineUser[];
  presenceOverview: PresenceOverview | null;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshOnlineUsers: () => Promise<void>;
  refreshPresenceOverview: () => Promise<void>;
  signup: (payload: SignupRequest) => Promise<SignupResponse>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'admin-presence-session';

function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed.token && parsed.username && parsed.role) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse session cache', error);
  }

  return null;
}

function usePresencePolling(
  session: AuthSession | null,
  refreshOnlineUsers: () => Promise<void>
) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    refreshOnlineUsers();

    intervalRef.current = window.setInterval(() => {
      refreshOnlineUsers().catch(() => {
        /* silent refresh failure */
      });
    }, 5000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session, refreshOnlineUsers]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      return readStoredSession();
    } catch {
      return null;
    }
  });
  const [isAuthenticating, setAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [presenceOverview, setPresenceOverview] = useState<PresenceOverview | null>(null);

  useEffect(() => {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      setOnlineUsers([]);
      setPresenceOverview(null);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const refreshOnlineUsers = useCallback(async () => {
    if (!session || session.role !== 'admin') {
      setOnlineUsers([]);
      return;
    }

    const response = await api.fetchOnlineUsers(session.token);
    setOnlineUsers(response.users);
  }, [session]);

  const refreshPresenceOverview = useCallback(async () => {
    if (!session) {
      setPresenceOverview(null);
      return;
    }

    const response = await api.fetchPresenceOverview(session.token);
    setPresenceOverview(response);
  }, [session]);

  usePresencePolling(session, refreshOnlineUsers);

  useEffect(() => {
    if (!session) {
      return;
    }

    refreshPresenceOverview().catch(() => {
      /* silent refresh failure */
    });
    const timer = window.setInterval(() => {
      refreshPresenceOverview().catch(() => {
        /* silent refresh failure */
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [session, refreshPresenceOverview]);

  const login = useCallback(async (payload: LoginRequest) => {
    setAuthenticating(true);
    setErrorMessage(null);
    try {
      const response = await api.login(payload);
      const nextSession: AuthSession = {
        token: response.token,
        username: response.username,
        role: response.role
      };
      setSession(nextSession);
      if (response.role === 'admin') {
        await refreshOnlineUsers();
      }
      await refreshPresenceOverview();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unknown authentication error');
      }
      throw error;
    } finally {
      setAuthenticating(false);
    }
  }, [refreshOnlineUsers]);

  const logout = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      await api.logout(session.token);
    } catch (error) {
      console.warn('Logout failed', error);
    } finally {
      setSession(null);
      setOnlineUsers([]);
      setPresenceOverview(null);
      setErrorMessage(null);
    }
  }, [session]);

  const signup = useCallback(async (payload: SignupRequest) => {
    try {
      return await api.signup(payload);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown sign-up error');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticating,
      errorMessage,
      onlineUsers,
      presenceOverview,
      login,
      logout,
      refreshOnlineUsers,
      refreshPresenceOverview,
      signup
    }),
    [session, isAuthenticating, errorMessage, onlineUsers, presenceOverview, login, logout, refreshOnlineUsers, refreshPresenceOverview, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
