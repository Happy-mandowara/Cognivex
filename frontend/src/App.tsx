import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/kiosk/KioskView';
import { DoctorDashboardView } from './components/doctor/DoctorDashboardView';
import { DocumentsView } from './components/documents/DocumentsView';
import { AyushView } from './components/ayush/AyushView';
import { AbdmView } from './components/abdm/AbdmView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { api } from './services/api';
import { ShieldAlert, Wifi, WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // Default tab based on user role
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('medikiosk_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'PATIENT') return 'kiosk';
        if (parsed.role === 'ADMIN') return 'admin';
        return 'doctor';
      }
    } catch {}
    return 'kiosk';
  });

  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Check Backend Health
  useEffect(() => {
    api.getHealth().then((res) => {
      if (res && res.status === 'HEALTHY') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    }).catch(() => {
      setBackendStatus('offline');
    });
  }, []);

  // Strict Dual-Level RBAC Route Guards: redirect unauthorized users immediately
  useEffect(() => {
    if (!user) return;

    if (user.role === 'PATIENT') {
      // Patients are strictly confined to Kiosk Intake and Personal Medical Documents
      if (!['kiosk', 'documents'].includes(activeTab)) {
        setUnauthorizedNotice('Access Restricted: Patient accounts cannot access Doctor or Administrative workspaces.');
        setActiveTab('kiosk');
        setTimeout(() => setUnauthorizedNotice(''), 4500);
      }
    } else if (user.role === 'DOCTOR') {
      // Doctors cannot access Administrative governance views
      if (activeTab === 'admin') {
        setUnauthorizedNotice('Access Restricted: Doctor accounts do not have Administrative privileges.');
        setActiveTab('doctor');
        setTimeout(() => setUnauthorizedNotice(''), 4500);
      }
    }
  }, [user?.role, activeTab]);

  // If user is not authenticated, render dedicated Login / Registration screen
  if (!user) {
    return (
      <AuthPage 
        initialMode="login"
        onSuccess={(role: UserRole) => {
          if (role === 'PATIENT') {
            setActiveTab('kiosk');
          } else if (role === 'ADMIN') {
            setActiveTab('admin');
          } else {
            setActiveTab('doctor');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#2563EB] selection:text-white">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={(tab: string) => {
          // Double check permissions before switching
          if (user.role === 'PATIENT' && !['kiosk', 'documents'].includes(tab)) {
            setUnauthorizedNotice('Access Restricted: Patient accounts cannot access Doctor or Administrative workspaces.');
            setTimeout(() => setUnauthorizedNotice(''), 4500);
            return;
          }
          if (user.role === 'DOCTOR' && tab === 'admin') {
            setUnauthorizedNotice('Access Restricted: Doctor accounts do not have Administrative privileges.');
            setTimeout(() => setUnauthorizedNotice(''), 4500);
            return;
          }
          setActiveTab(tab);
        }}
        language={language}
        setLanguage={setLanguage}
      />

      {/* RBAC Violation Notice Banner */}
      {unauthorizedNotice && (
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2.5 text-xs text-[#B91C1C] flex items-center justify-center space-x-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-[#B91C1C] shrink-0" />
          <span className="font-semibold">{unauthorizedNotice}</span>
        </div>
      )}

      {/* Main Clinical & Administrative Workspaces (Protected by RBAC) */}
      <main className="flex-1 pb-12">
        {activeTab === 'kiosk' && (
          <KioskView 
            language={language}
            onNavigateToDoctor={() => {
              if (user.role !== 'PATIENT') {
                setActiveTab('doctor');
              }
            }}
          />
        )}

        {activeTab === 'doctor' && user.role !== 'PATIENT' && (
          <DoctorDashboardView 
            onNavigateToAbdm={() => setActiveTab('abdm')}
            onNavigateToAyush={() => setActiveTab('ayush')}
            onNavigateToDocuments={() => setActiveTab('documents')}
          />
        )}

        {activeTab === 'admin' && user.role === 'ADMIN' && (
          <AdminDashboardView />
        )}

        {activeTab === 'documents' && (
          <DocumentsView />
        )}

        {activeTab === 'ayush' && user.role !== 'PATIENT' && (
          <AyushView />
        )}

        {activeTab === 'abdm' && user.role !== 'PATIENT' && (
          <AbdmView />
        )}
      </main>

      {/* Production Clinical Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#0F172A]">MediKiosk EHR</span>
            <span>—</span>
            <span>Clinical Case-Taking & Ayush Decision Support</span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5">
              {backendStatus === 'online' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block"></span>
                  <span className="text-[#15803D] font-medium">API Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#B91C1C] inline-block"></span>
                  <span className="text-[#B91C1C] font-medium">API Offline</span>
                </>
              )}
            </div>
            <span>•</span>
            <span>User: <strong className="text-[#0F172A] font-semibold">{user.full_name}</strong> ({user.role})</span>
            <span>•</span>
            <span>ABDM & FHIR R4 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
