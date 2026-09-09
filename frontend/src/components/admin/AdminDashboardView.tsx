import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Server, 
  RefreshCw, 
  History, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Sliders,
  Check,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  Card, 
  SectionCard, 
  StatCard, 
  StatusBadge, 
  DataTable, 
  Modal, 
  FormField, 
  Column 
} from '../ui';

export const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<any>({
    total_patients: 0,
    total_encounters: 0,
    waiting_encounters: 0,
    completed_encounters: 0,
    emergency_encounters: 0,
    total_fhir_bundles: 0,
    total_users: 0,
    active_users: 0,
    opd_throughput_rate: "98.4%",
    average_wait_time_minutes: 14
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'settings' | 'health'>('users');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search/Filters
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Create User Modal
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('DOCTOR');
  const [newFullName, setNewFullName] = useState('');

  // Settings form states
  const [facilityName, setFacilityName] = useState('');
  const [opdPrefix, setOpdPrefix] = useState('MED');
  const [abdmGateway, setAbdmGateway] = useState('ABDM Sandbox Gateway (NRCES FHIR R4)');
  const [sessionTimeout, setSessionTimeout] = useState('60');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const statsData = await api.getAdminStats();
      if (statsData) setStats(statsData);

      const usersData = await api.getAdminUsers();
      if (usersData) setUsersList(usersData);

      const logsData = await api.getAuditLogs();
      if (logsData) setAuditLogs(logsData);

      const settingsData = await api.getSystemSettings();
      if (settingsData) {
        setSystemSettings(settingsData);
        setFacilityName(settingsData.facility_name || 'MediKiosk Integrated Outpatient Healthcare Facility');
        setOpdPrefix(settingsData.opd_prefix || 'MED');
        setAbdmGateway(settingsData.abdm_environment || 'ABDM Sandbox Gateway (NRCES FHIR R4)');
        setSessionTimeout(settingsData.session_timeout_minutes || '60');
      }
    } catch (err: any) {
      showNotice(err.message || 'Failed to retrieve administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const targetStatus = !user.is_active;
    try {
      await api.updateUserStatus(user.id, targetStatus);
      showNotice(`User ${user.email} is now ${targetStatus ? 'active' : 'deactivated'}.`);
      loadAllAdminData();
    } catch (err: any) {
      showNotice(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove user ${email}?`)) return;
    try {
      await api.deleteUser(userId);
      showNotice(`User ${email} removed successfully.`);
      loadAllAdminData();
    } catch (err: any) {
      showNotice(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword || !newFullName.trim()) return;
    try {
      await api.createAdminUser({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        full_name: newFullName.trim(),
      });
      showNotice(`User ${newEmail} created successfully.`);
      setIsCreateUserOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      loadAllAdminData();
    } catch (err: any) {
      showNotice(err.message || 'Failed to create user', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSystemSettings({
        facility_name: facilityName.trim(),
        opd_prefix: opdPrefix.trim(),
        abdm_environment: abdmGateway.trim(),
        session_timeout_minutes: sessionTimeout.trim(),
      });
      showNotice('System settings updated and persisted successfully.');
      loadAllAdminData();
    } catch (err: any) {
      showNotice(err.message || 'Failed to save system settings', 'error');
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter((l) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      l.user_email.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q)
    );
  });

  // User columns for DataTable
  const userColumns: Column<any>[] = [
    {
      key: 'full_name',
      header: 'Full Name',
      render: (u) => (
        <div>
          <span className="font-semibold text-[#0F172A] block">{u.full_name}</span>
          <span className="font-mono text-[11px] text-[#64748B]">{u.id}</span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (u) => <span className="font-mono text-xs text-[#475569]">{u.email}</span>
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
          u.role === 'ADMIN'
            ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1]'
            : u.role === 'DOCTOR'
            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
            : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
        }`}>
          {u.role}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (u) => (
        <StatusBadge 
          status={u.is_active ? 'Active' : 'Deactivated'} 
          variant={u.is_active ? 'success' : 'danger'}
        />
      )
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (u) => <span className="text-[#64748B] text-[11px]">{u.created_at?.slice(0, 10)}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleToggleUserStatus(u)}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
              u.is_active
                ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
                : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
            }`}
          >
            {u.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleDeleteUser(u.id, u.email)}
            className="p-1 rounded-[6px] text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Audit columns for DataTable
  const auditColumns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      render: (l) => <span className="font-mono text-[#64748B] text-[11px]">{l.timestamp?.replace('T', ' ').slice(0, 19)}</span>
    },
    {
      key: 'user_email',
      header: 'Actor',
      render: (l) => (
        <div>
          <span className="font-medium text-[#0F172A] block">{l.user_email}</span>
          <span className="text-[10px] text-[#64748B]">{l.role}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Security Action',
      render: (l) => <span className="font-mono font-semibold text-[#2563EB] text-xs">{l.action}</span>
    },
    {
      key: 'resource_type',
      header: 'Resource',
      render: (l) => <span className="text-[#475569]">{l.resource_type}</span>
    },
    {
      key: 'details',
      header: 'Audit Details',
      render: (l) => <span className="text-[#64748B] text-xs max-w-xs truncate block">{l.details}</span>
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`p-3 rounded-[8px] border text-xs font-medium flex items-center justify-between animate-in fade-in ${
          actionNotice.type === 'error'
            ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
            : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
        }`}>
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs font-bold px-2 py-0.5 cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Administrative Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-[10px] bg-[#0F172A] text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#0F172A]">Administrative Governance & Security Portal</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage system users, role authorizations, electronic audit logs, and clinical parameters.
            </p>
          </div>
        </div>

        <button
          onClick={loadAllAdminData}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Patients"
          value={stats.total_patients}
          subtitle="Records in database"
          icon={Users}
        />
        <StatCard
          label="Active In Waiting Queue"
          value={stats.waiting_encounters}
          subtitle={`Avg ${stats.average_wait_time_minutes}m wait time`}
          icon={Activity}
        />
        <StatCard
          label="Total Clinical Encounters"
          value={stats.total_encounters}
          subtitle={`${stats.completed_encounters} completed consultations`}
          icon={History}
        />
        <StatCard
          label="Active Users"
          value={`${stats.active_users || stats.total_users} / ${stats.total_users}`}
          subtitle="Authorized accounts"
          icon={ShieldCheck}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'health'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Infrastructure Status</span>
        </button>
      </div>

      {/* ================= TAB 1: USERS MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">User Accounts & Role Permissions</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Manage authentication, activation status, and role scope</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter users..."
                  className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
              </div>

              <button
                onClick={() => setIsCreateUserOpen(true)}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New User</span>
              </button>
            </div>
          </div>

          <DataTable
            columns={userColumns}
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            isLoading={loading}
            emptyText="No user accounts match current search criteria."
          />
        </Card>
      )}

      {/* ================= TAB 2: AUDIT LOGS ================= */}
      {activeTab === 'audit' && (
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Security Audit Trail & Access Events</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Chronological record of authentication, data access, and clinical updates</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit actions, emails..."
                className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
            </div>
          </div>

          <DataTable
            columns={auditColumns}
            data={filteredLogs}
            keyExtractor={(l) => l.id}
            isLoading={loading}
            emptyText="No audit entries found matching search query."
          />
        </Card>
      )}

      {/* ================= TAB 3: SYSTEM SETTINGS ================= */}
      {activeTab === 'settings' && (
        <Card padding="lg" className="space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">System Parameters & Facility Settings</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Configure facility metadata, OPD identifiers, and gateway integrations (persisted to database)</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <FormField label="Healthcare Facility Name" required>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g. City General Hospital / MediKiosk Clinic"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="OPD Token Prefix" required>
                <input
                  type="text"
                  required
                  value={opdPrefix}
                  onChange={(e) => setOpdPrefix(e.target.value)}
                  placeholder="e.g. MED"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                />
              </FormField>

              <FormField label="Session Inactivity Timeout (Minutes)" required>
                <input
                  type="number"
                  required
                  min={5}
                  max={480}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
                />
              </FormField>
            </div>

            <FormField label="ABDM Gateway Environment" required>
              <input
                type="text"
                required
                value={abdmGateway}
                onChange={(e) => setAbdmGateway(e.target.value)}
                placeholder="e.g. ABDM Sandbox Gateway (NRCES FHIR R4)"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
              />
            </FormField>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-xs cursor-pointer"
              >
                Save Configuration to Database
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= TAB 4: INFRASTRUCTURE HEALTH ================= */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#0F172A]">FastAPI Application Server</span>
              <StatusBadge status="Operational" variant="success" />
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <p>Endpoint: <span className="font-mono text-[#0F172A]">http://127.0.0.1:8000</span></p>
              <p>Interactive Docs: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline">/docs</a></p>
              <p>OpenAPI Spec: <a href="http://127.0.0.1:8000/openapi.json" target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline">/openapi.json</a></p>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#0F172A]">Relational Database Engine</span>
              <StatusBadge status="Connected" variant="success" />
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <p>PostgreSQL / SQLite Dual Connectivity</p>
              <p>Tables: <span className="font-mono text-[#0F172A]">patients, encounters, users, audit_logs, prescriptions</span></p>
              <p>Connection Pool: Active</p>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#0F172A]">ABDM & FHIR R4 Interface</span>
              <StatusBadge status="Online" variant="info" />
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <p>Profile: NRCES FHIR R4 India Core Release 1.0</p>
              <p>Supported Bundles: Encounter, Condition, Observation, MedicationRequest</p>
              <p>Encryption: ECDH Curve25519 with AES-GCM 128/256</p>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#0F172A]">Ayush CDS & Clinical NLP</span>
              <StatusBadge status="Active" variant="success" />
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <p>Tridosha Prakriti & Vikriti Calculator</p>
              <p>Homeopathic Repertorization: Kent & Boericke Data</p>
              <p>Terminology: NAMASTE Portal Morbidity Coding to ICD-11</p>
            </div>
          </Card>
        </div>
      )}

      {/* ================= MODAL: CREATE USER ================= */}
      <Modal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Provision New User Account"
        subtitle="Create an authorized Doctor, Patient, or Administrative account"
        footer={
          <>
            <button
              onClick={() => setIsCreateUserOpen(false)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] rounded-[8px] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Create User
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Dr. Priya Sharma"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@hospital.gov.in"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>

          <FormField label="Role Assignment" required>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            >
              <option value="DOCTOR">DOCTOR (Clinical Workspace, Rx, FHIR)</option>
              <option value="PATIENT">PATIENT (Kiosk Intake & Personal Records)</option>
              <option value="ADMIN">ADMIN (Full Governance, Users, Audit)</option>
            </select>
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A]"
            />
          </FormField>
        </form>
      </Modal>

    </div>
  );
};
