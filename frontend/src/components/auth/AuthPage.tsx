import React, { useState } from 'react';
import { 
  Activity, 
  Stethoscope, 
  User, 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Server,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { FormField } from '../ui/FormField';
import { getApiBaseUrl, setApiBaseUrl, api } from '../../services/api';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: (role: UserRole) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  initialMode = 'login',
  onSuccess 
}) => {
  const { login, signup, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // API URL Configuration & Health State
  const [currentApiUrl, setCurrentApiUrl] = useState<string>(() => getApiBaseUrl());
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customApiUrlInput, setCustomApiUrlInput] = useState<string>(() => getApiBaseUrl());
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'healthy' | 'failed'>('idle');

  const checkConnection = async (urlToCheck?: string) => {
    setConnectionStatus('checking');
    if (urlToCheck) {
      setApiBaseUrl(urlToCheck);
      setCurrentApiUrl(getApiBaseUrl());
    }
    try {
      const res = await api.getHealth();
      if (res && res.status === 'HEALTHY') {
        setConnectionStatus('healthy');
      } else {
        setConnectionStatus('failed');
      }
    } catch {
      setConnectionStatus('failed');
    }
  };

  const formatAuthError = (rawError?: string): string => {
    if (!rawError) return 'Authentication failed. Please verify your credentials.';
    if (rawError.toLowerCase().includes('failed to fetch') || rawError.toLowerCase().includes('networkerror')) {
      return 'Unable to reach backend API. If deployed on Render free tier, the backend server spins down when idle and takes ~30–50 seconds to wake up. You can also verify or update the backend URL below.';
    }
    return rawError;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    const res = await login(loginEmail, loginPassword);
    if (res.success) {
      try {
        const userObj = JSON.parse(localStorage.getItem('medikiosk_user') || '{}');
        if (onSuccess) onSuccess(userObj.role || 'DOCTOR');
      } catch {
        if (onSuccess) onSuccess('DOCTOR');
      }
    } else {
      const formatted = formatAuthError(res.error);
      setErrorMsg(formatted);
      if (formatted.includes('Render free tier')) {
        setShowConfigModal(true);
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    const res = await signup(signupName, signupEmail, signupPassword, signupRole);
    if (res.success) {
      setSuccessMsg('Account registered successfully. Redirecting to workspace...');
      if (onSuccess) onSuccess(signupRole);
    } else {
      setErrorMsg(res.error || 'Registration failed. An account with this email may already exist.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#2563EB] selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#0F172A] text-white shadow-sm mb-3">
          <Activity className="w-6 h-6 text-[#2563EB]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
          Medi<span className="text-[#2563EB]">Kiosk</span>
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Clinical Case-Taking & Integrated Healthcare Record System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E2E8F0] rounded-[12px] shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] relative">
          
          {/* Toggle: Login vs Signup */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-[8px] mb-6 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <FormField label="Email Address" required>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </FormField>

              <FormField label="Password" required>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </FormField>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Gupta or Sunita Sharma"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </FormField>

              <FormField label="Email Address" required>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. user@hospital.org"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </FormField>

              <FormField label="Account Type (Role)" required helperText="Administrative accounts are provisioned by hospital security only.">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSignupRole('PATIENT')}
                    className={`py-2 px-3 rounded-[8px] border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      signupRole === 'PATIENT'
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                        : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('DOCTOR')}
                    className={`py-2 px-3 rounded-[8px] border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      signupRole === 'DOCTOR'
                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                        : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Practitioner</span>
                  </button>
                </div>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Password" required>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </FormField>

                <FormField label="Confirm Password" required>
                  <input
                    type="password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </FormField>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Registering...' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Backend Connection & Configuration */}
          <div className="mt-6 pt-4 border-t border-[#F1F5F9] text-xs">
            <div className="flex items-center justify-between text-[#64748B]">
              <div className="flex items-center space-x-1.5 truncate max-w-[240px]">
                <Server className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
                <span className="truncate font-mono text-[11px]">{currentApiUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(!showConfigModal);
                  setCustomApiUrlInput(currentApiUrl);
                }}
                className="inline-flex items-center space-x-1 text-[#2563EB] hover:text-[#1D4ED8] font-semibold cursor-pointer shrink-0 ml-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showConfigModal ? 'Close' : 'Configure'}</span>
              </button>
            </div>

            {showConfigModal && (
              <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-2.5 animate-in fade-in">
                <label className="block text-[11px] font-semibold text-[#334155]">
                  Backend API Endpoint (Render / Custom)
                </label>
                <input
                  type="text"
                  value={customApiUrlInput}
                  onChange={(e) => setCustomApiUrlInput(e.target.value)}
                  placeholder="https://medikiosk-backend.onrender.com/api"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-[6px] text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      checkConnection(customApiUrlInput);
                    }}
                    disabled={connectionStatus === 'checking'}
                    className="py-1 px-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[6px] text-[11px] font-semibold flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
                    <span>{connectionStatus === 'checking' ? 'Testing...' : 'Save & Test'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApiBaseUrl('');
                      const def = getApiBaseUrl();
                      setCustomApiUrlInput(def);
                      setCurrentApiUrl(def);
                      checkConnection(def);
                    }}
                    className="py-1 px-2.5 text-[#64748B] hover:text-[#0F172A] text-[11px] font-medium cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>

                {connectionStatus === 'healthy' && (
                  <div className="text-[11px] text-[#15803D] font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Backend is connected and healthy!</span>
                  </div>
                )}
                {connectionStatus === 'failed' && (
                  <div className="text-[11px] text-[#B91C1C] font-semibold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Could not reach endpoint. Please ensure the backend is active on Render.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-[#64748B] flex items-center justify-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-[#15803D]" />
          <span>Protected with cryptographic authentication & Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
