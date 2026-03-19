import { API_BASE } from '../config/backends';

export interface SignUpData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  review_type: string;
  target_exam_date?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthUser {
  id?: number;
  username: string;
  role: 'user' | 'admin';
  fullName?: string;
  email?: string;
  reviewType?: string;
  targetExamDate?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  requiresCodeVerification?: boolean;
  tempToken?: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { detail?: string }).detail || 'Sign up failed');
    }

    const result: AuthResponse = await response.json();

    if (result.success && result.token && result.user) {
      this.setToken(result.token);
      this.setUser(result.user);
    }

    return result;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { detail?: string }).detail || 'Login failed');
    }

    const result: AuthResponse = await response.json();

    if (result.success && result.token && result.user) {
      this.setToken(result.token);
      this.setUser(result.user);
    }

    return result;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored user
   */
  getUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Set token in local storage
   */
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Set user in local storage
   */
  private setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Verify code sent to email
   */
  async verifyCode(code: string, tempToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        tempToken
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { detail?: string }).detail || 'Code verification failed');
    }

    const result: AuthResponse = await response.json();

    if (result.success && result.token && result.user) {
      this.setToken(result.token);
      this.setUser(result.user);
    }

    return result;
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      this.clearAuth();
      throw new Error('Token refresh failed');
    }

    return await response.json();
  }

  /**
   * Request password reset code
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; exists: boolean }> {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { detail?: string }).detail || 'Failed to send reset code');
    }

    return await response.json();
  }

  /**
   * Reset password with verification code
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { detail?: string }).detail || 'Password reset failed');
    }

    return await response.json();
  }
}

export const authService = new AuthService();
