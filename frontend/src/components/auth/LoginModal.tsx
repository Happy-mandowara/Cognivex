import React, { useState } from 'react';
import { Lock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../ui/FormField';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(email, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Invalid email or password. Please verify credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-xl max-w-md w-full p-6 space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-150">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#64748B] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">Sign In to MediKiosk</h3>
          <p className="text-xs text-[#64748B]">Enter your clinical or patient credentials to access workspace</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-xs text-[#B91C1C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <FormField label="Email Address" required>
            <input 
              type="email" 
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white text-[#0F172A]"
              required
            />
          </FormField>

          <FormField label="Password" required>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white text-[#0F172A]"
              required
            />
          </FormField>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
