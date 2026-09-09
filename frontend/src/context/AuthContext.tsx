import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  patient_id?: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export const DEFAULT_DEMO_USER: UserProfile = {
  id: "USR-DOCTOR-01",
  email: "doctor@medikiosk.demo",
  role: "DOCTOR",
  full_name: "Dr. V. K. Sharma (MD)",
  patient_id: "P-ANANYA-DEMO"
};

export const DEMO_PATIENT_USER: UserProfile = {
  id: "USR-PATIENT-01",
  email: "patient@medikiosk.demo",
  role: "PATIENT",
  full_name: "Ananya Sharma",
  patient_id: "P-ANANYA-DEMO"
};

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string, role: string) => Promise<AuthResult>;
  enterDemoUser: (role?: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage, defaulting to DEMO DOCTOR so the full UI is instantly accessible
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('medikiosk_user');
      if (savedUser) return JSON.parse(savedUser);
      // Default to demo Doctor so the white-bg clinical UI is immediately visible
      localStorage.setItem('medikiosk_user', JSON.stringify(DEFAULT_DEMO_USER));
      return DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('medikiosk_token') || 'demo_token_doctor_2026';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync /me on load if token exists
  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const profile = await api.getMe();
      if (profile && profile.email) {
        setUser(profile);
        localStorage.setItem('medikiosk_user', JSON.stringify(profile));
      }
    } catch (err) {
      console.warn("Failed to refresh user profile, clearing session:", err);
      logout();
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      if (res.access_token && res.user) {
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('medikiosk_token', res.access_token);
        localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: 'Incorrect email or password.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid credentials or connection error.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await api.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });
      if (res.access_token && res.user) {
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('medikiosk_token', res.access_token);
        localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: 'Unable to complete registration.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create account.' };
    } finally {
      setIsLoading(false);
    }
  };

  const enterDemoUser = (role: UserRole = 'DOCTOR') => {
    const demoUser = role === 'PATIENT' ? DEMO_PATIENT_USER : DEFAULT_DEMO_USER;
    setUser(demoUser);
    const mockToken = `demo_token_${role.toLowerCase()}_2026`;
    setToken(mockToken);
    localStorage.setItem('medikiosk_token', mockToken);
    localStorage.setItem('medikiosk_user', JSON.stringify(demoUser));
  };

  const logout = () => {
    try {
      api.logout().catch(() => {});
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('medikiosk_token');
    localStorage.removeItem('medikiosk_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, enterDemoUser, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
