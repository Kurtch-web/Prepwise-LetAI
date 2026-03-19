import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (full_name: string, username: string, email: string, password: string, password_confirm: string, review_type: string, target_exam_date?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      if (response.success && response.user) {
        setUser(response.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (
      full_name: string,
      username: string,
      email: string,
      password: string,
      password_confirm: string,
      review_type: string,
      target_exam_date?: string
    ) => {
      setIsLoading(true);
      try {
        const response = await authService.signup({
          full_name,
          username,
          email,
          password,
          password_confirm,
          review_type,
          target_exam_date
        });
        if (response.success && response.user) {
          setUser(response.user);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
