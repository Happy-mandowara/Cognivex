import React from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  FileText, 
  Sparkles, 
  Share2, 
  Activity,
  ShieldCheck, 
  User, 
  LogOut
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { StatusBadge } from './ui/StatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
}) => {
  const { user, logout } = useAuth();
  const currentRole: UserRole = user?.role || 'PATIENT';

  // Strict role-specific navigation definitions
  const navDefinitions = [
    {
      id: 'kiosk',
      label: language === 'en' ? 'Patient Intake Kiosk' : 'मरीज़ कियोस्क',
      icon: HeartPulse,
      roles: ['PATIENT', 'DOCTOR'],
    },
    {
      id: 'doctor',
      label: language === 'en' ? 'Doctor Workspace' : 'डॉक्टर डैशबोर्ड',
      icon: Stethoscope,
      roles: ['DOCTOR', 'ADMIN'],
    },
    {
      id: 'documents',
      label: language === 'en' ? 'Medical Records & OCR' : 'दस्तावेज़ और OCR',
      icon: FileText,
      roles: ['PATIENT', 'DOCTOR', 'ADMIN'],
    },
    {
      id: 'ayush',
      label: language === 'en' ? 'Ayush Clinical CDS' : 'आयुष निर्णय सहायता',
      icon: Sparkles,
      roles: ['DOCTOR'],
    },
    {
      id: 'abdm',
      label: language === 'en' ? 'ABDM & FHIR R4' : 'ABDM और FHIR',
      icon: Share2,
      roles: ['DOCTOR', 'ADMIN'],
    },
    {
      id: 'admin',
      label: language === 'en' ? 'Administration' : 'प्रशासन पोर्टल',
      icon: ShieldCheck,
      roles: ['ADMIN'],
    },
  ];

  const visibleNavItems = navDefinitions.filter((item) => item.roles.includes(currentRole));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Product Name */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#0F172A] text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-[#0F172A] tracking-tight">
                  Medi<span className="text-[#2563EB]">Kiosk</span>
                </span>
                <span className="text-[11px] font-medium text-[#475569] px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0]">
                  EHR & Intake
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block">
                Clinical Case-Taking & Ayush Decision Support
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Strictly Role-Filtered) */}
          <nav className="hidden md:flex space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Language, Current User, Logout */}
          <div className="flex items-center space-x-3">
            
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 text-xs font-medium text-[#475569] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[8px] transition-colors border border-[#E2E8F0] cursor-pointer"
              title="Toggle Language"
            >
              <span className="font-semibold text-[#2563EB] mr-1">文A</span>
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Authenticated User Status */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
                <div className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center text-xs font-bold border border-[#E2E8F0]">
                  {user.role === 'DOCTOR' ? 'Dr' : user.role === 'ADMIN' ? 'Ad' : 'Pt'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-[#0F172A] leading-tight truncate max-w-[130px]">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-[8px] transition-colors cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1.5 border-t border-[#E2E8F0] no-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 whitespace-nowrap px-3 py-1.5 rounded-[8px] text-xs font-medium cursor-pointer ${
                  isActive ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]' : 'text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
