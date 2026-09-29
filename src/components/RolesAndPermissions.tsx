import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  UserCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  Layers,
  ChevronRight,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { api } from '../services/api';
import type { RoleDefinition, User, UserRole } from '../types';

interface RolesAndPermissionsProps {
  userRole: UserRole;
  onNavigateTab?: (tab: string, entityId?: string) => void;
  onSwitchToAdmin?: () => void;
}

export const RolesAndPermissions: React.FC<RolesAndPermissionsProps> = ({
  userRole,
  onNavigateTab,
  onSwitchToAdmin,
}) => {
  const isSchoolAdmin = userRole === 'School Administrator' || userRole === 'Super Administrator';

  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'logins'>('roles');
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [usersWithLogins, setUsersWithLogins] = useState<User[]>([]);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<string>('Mr. Joseph Amponsah');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isLoading: false,
  });

  // Add Role Modal
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleResponsibilities, setNewRoleResponsibilities] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'Admissions',
    'Student Records',
    'Attendance',
  ]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Create Login Details Modal
  const [showCreateLoginModal, setShowCreateLoginModal] = useState(false);
  const [loginFullName, setLoginFullName] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginRole, setLoginRole] = useState<string>('Teacher');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [newlyCreatedCreds, setNewlyCreatedCreds] = useState<{ username: string; password?: string } | null>(null);

  // Edit User Login Modal
  const [showEditLoginModal, setShowEditLoginModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const availableSystemModules = [
    'Admissions & Enrollment',
    'Student Information Management',
    'Parents & Guardians Directory',
    'Staff & Teacher Profiles',
    'Classes & Curriculum Subjects',
    'Attendance Recording & Tracking',
    'Examinations & Gradebook',
    'Report Card Generation',
    'Fees & Tuition Billing',
    'Fee Payments & Official Receipts',
    'School Operating Expenses',
    'Library Books & Loans',
    'Announcements & Broadcasts',
    'Audit Trail & System Archives',
    'Roles & User Account Provisioning',
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getRolesManagement();
      if (res.roles) setRoles(res.roles);
      if (res.users) setUsersWithLogins(res.users);
      if (res.authorizedAdministrator) setAuthorizedAdmin(res.authorizedAdministrator);
    } catch (err) {
      console.error('Failed to load roles and logins:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to load roles & credentials from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can add roles.',
      });
      return;
    }

    if (!newRoleName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid role name.' });
      return;
    }

    try {
      setIsSubmittingRole(true);
      const res = await api.addRole(
        {
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || 'Custom institutional role with configured permissions.',
          responsibilities: newRoleResponsibilities.split('\n').filter(r => r.trim()),
          modules: selectedModules,
        },
        userRole
      );

      if (res.success) {
        setFeedbackMessage({ type: 'success', text: `Role "${newRoleName}" successfully created!` });
        setShowAddRoleModal(false);
        setNewRoleName('');
        setNewRoleDesc('');
        setNewRoleResponsibilities('');
        setSelectedModules(['Admissions', 'Student Records']);
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Failed to create role.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Server error while creating role.' });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can remove roles.',
      });
      return;
    }

    setShowConfirmModal({
      show: true,
      title: 'Confirm Role Removal',
      message: `Are you sure you want to permanently remove the role "${roleName}"? This will also revoke access for all users currently assigned to this role.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setShowConfirmModal(prev => ({ ...prev, isLoading: true }));
          const res = await api.removeRole(roleName, userRole);
          if (res.success) {
            setFeedbackMessage({ type: 'success', text: res.message });
            await loadData();
            setShowConfirmModal({ show: false, title: '', message: '', onConfirm: () => {}, isLoading: false });
          } else {
            setFeedbackMessage({ type: 'error', text: res.message });
            setShowConfirmModal(prev => ({ ...prev, isLoading: false }));
          }
        } catch (err) {
          setFeedbackMessage({ type: 'error', text: 'Error communicating with server.' });
          setShowConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can create login details.',
      });
      return;
    }

    if (!loginFullName.trim() || !loginUsername.trim() || !loginEmail.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please provide full name, username, and email.' });
      return;
    }

    try {
      setIsSubmittingLogin(true);
      const res = await api.createUserLogin(
        {
          fullName: loginFullName.trim(),
          username: loginUsername.trim().toLowerCase(),
          email: loginEmail.trim().toLowerCase(),
          role: loginRole,
          phone: loginPhone.trim(),
          password: loginPassword.trim() || undefined,
        },
        userRole
      );

      if (res.success && res.user) {
        setFeedbackMessage({
          type: 'success',
          text: `Login credentials successfully provisioned for ${res.user.fullName}!`,
        });
        setNewlyCreatedCreds({
          username: res.user.username,
          password: res.user.temporaryPassword || loginPassword || 'Password123!',
        });
        setLoginFullName('');
        setLoginUsername('');
        setLoginEmail('');
        setLoginPhone('');
        setLoginPassword('');
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Failed to create login details.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Server error while creating login credentials.' });
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRemoveLogin = async (userId: string, username: string) => {
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can revoke logins.',
      });
      return;
    }

    setShowConfirmModal({
      show: true,
      title: 'Revoke Login Access',
      message: `Are you sure you want to revoke login access for "${username}"? They will no longer be able to log into the school system.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setShowConfirmModal(prev => ({ ...prev, isLoading: true }));
          const res = await api.removeUserLogin(userId, userRole);
          if (res.success) {
            setFeedbackMessage({ type: 'success', text: `Login access revoked for ${username}.` });
            await loadData();
            setShowConfirmModal({ show: false, title: '', message: '', onConfirm: () => {}, isLoading: false });
          } else {
            setFeedbackMessage({ type: 'error', text: res.message });
            setShowConfirmModal(prev => ({ ...prev, isLoading: false }));
          }
        } catch (err) {
          setFeedbackMessage({ type: 'error', text: 'Error communicating with server.' });
          setShowConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleResetPassword = async (userId: string, username: string) => {
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can reset passwords.',
      });
      return;
    }

    try {
      const res = await api.resetUserPassword(userId, undefined, userRole);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Password reset for ${username}: New Temporary Password: ${res.temporaryPassword}`,
        });
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Error communicating with server.' });
    }
  };

  const openEditUserModal = (user: User) => {
    if (!isSchoolAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Mr. Joseph Amponsah (School Administrator) can modify credentials.',
      });
      return;
    }
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditPassword(user.temporaryPassword || '');
    setShowEditLoginModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isSchoolAdmin) return;

    try {
      setIsSubmittingEdit(true);
      const res = await api.updateUserLogin(
        editingUser.id,
        {
          fullName: editFullName.trim(),
          username: editUsername.trim().toLowerCase(),
          email: editEmail.trim().toLowerCase(),
          role: editRole,
          phone: editPhone.trim(),
          password: editPassword.trim(),
        },
        userRole
      );

      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Credentials for ${editFullName} updated successfully!`,
        });
        setShowEditLoginModal(false);
        setEditingUser(null);
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Failed to update credentials.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Server error while updating credentials.' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = 'KJ-';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLoginPassword(pwd);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = usersWithLogins.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Administrator Policy */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Shield className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Roles & Login Credentials Management
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                RBAC Access Control Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Define institutional roles, configure permitted functional modules, and provision official login accounts with secure temporary passwords.
            </p>
          </div>

          {/* Exclusive Administrator Tag */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                JA
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Exclusive Authority
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {authorizedAdmin}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold text-[10px] ml-auto">
              School Administrator
            </span>
          </div>
        </div>

        {/* Policy Enforcement Alert (When active role is not School Administrator) */}
        {!isSchoolAdmin && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-sm mb-0.5">
                Restricted Administrative Policy Notice
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                You are currently viewing the system as <strong>{userRole}</strong>. In accordance with institutional security guidelines, <strong>only the School Administrator ({authorizedAdmin})</strong> is authorized to add or remove roles and provision login credentials. Administrative creation and deletion controls are locked in this view.
              </p>
              {onSwitchToAdmin && (
                <button
                  onClick={onSwitchToAdmin}
                  className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Switch Role to {authorizedAdmin} (School Administrator)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Primary Action Controls & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'roles'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Configured Roles ({roles.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logins')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'logins'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Provisioned Logins ({usersWithLogins.length})</span>
          </button>
        </div>

        {/* Action Buttons for School Administrator */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'roles' ? (
            <button
              onClick={() => setShowAddRoleModal(true)}
              disabled={!isSchoolAdmin}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                isSchoolAdmin
                  ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={
                isSchoolAdmin
                  ? 'Add a new institutional role'
                  : 'Action locked: Only School Administrator can add roles'
              }
            >
              {isSchoolAdmin ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>+ Add New Role</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateLoginModal(true)}
              disabled={!isSchoolAdmin}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                isSchoolAdmin
                  ? 'bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={
                isSchoolAdmin
                  ? 'Provision login credentials for a staff member, teacher, or user'
                  : 'Action locked: Only School Administrator can create login credentials'
              }
            >
              {isSchoolAdmin ? <Key className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>+ Create Login Details for Role</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={
            activeSubTab === 'roles'
              ? 'Filter roles by title or description...'
              : 'Search login accounts by user name, username, email, or assigned role...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:focus:ring-amber-500 transition-colors"
        />
      </div>

      {/* SUB-TAB 1: ROLES DIRECTORY */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                      <Shield className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {role.name}
                    </h3>
                  </div>
                  {role.isSystem ? (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      System Core
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Custom Role
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  {role.description}
                </p>

                {/* Responsibilities list */}
                {role.responsibilities && role.responsibilities.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Assigned Responsibilities ({role.responsibilities.length})
                    </span>
                    <ul className="list-disc list-inside text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                      {role.responsibilities.slice(0, 3).map((resp, idx) => (
                        <li key={idx} className="truncate">{resp}</li>
                      ))}
                      {role.responsibilities.length > 3 && (
                        <li className="list-none text-blue-500 font-bold">+{role.responsibilities.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Modules list */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Permitted Functional Modules ({role.modules.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.modules.slice(0, 4).map((mod, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                      >
                        {mod}
                      </span>
                    ))}
                    {role.modules.length > 4 && (
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        +{role.modules.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {usersWithLogins.filter((u) => u.role === role.name).length} Accounts
                  </span>
                </span>

                <button
                  onClick={() => handleRemoveRole(role.name)}
                  disabled={!isSchoolAdmin}
                  className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    isSchoolAdmin
                      ? 'text-rose-600 hover:text-rose-700'
                      : 'text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    isSchoolAdmin
                      ? `Permanently delete ${role.name}`
                      : 'Only Mr. Joseph Amponsah can remove roles'
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Role</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: PROVISIONED USER LOGINS */}
      {activeSubTab === 'logins' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Official User Login Credentials
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accounts provisioned for staff, teachers, and role holders by {authorizedAdmin}.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Showing {filteredUsers.length} of {usersWithLogins.length} accounts
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Staff / User</th>
                  <th className="py-3 px-4">Username & Role</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Assigned Credentials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No user accounts match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {user.fullName}
                            </span>
                            {user.phone && (
                              <span className="text-[10px] text-slate-400">{user.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          @{user.username}
                        </span>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {user.email}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          {visiblePasswords[user.id] ? (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-900 dark:text-white font-bold">
                              {user.temporaryPassword || 'Password123!'}
                            </span>
                          ) : (
                            <span className="text-slate-400 tracking-wider">••••••••••</span>
                          )}

                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={visiblePasswords[user.id] ? 'Hide password' : 'Show temporary password'}
                          >
                            {visiblePasswords[user.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              copyToClipboard(
                                `Username: ${user.username}\nPassword: ${
                                  user.temporaryPassword || 'Password123!'
                                }`,
                                user.id
                              )
                            }
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="Copy username & password"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditUserModal(user)}
                            disabled={!isSchoolAdmin}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              isSchoolAdmin
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50'
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed border-transparent'
                            }`}
                            title={
                              isSchoolAdmin
                                ? `Modify credentials for ${user.username}`
                                : 'Only Mr. Joseph Amponsah can modify credentials'
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(user.id, user.username)}
                            disabled={!isSchoolAdmin}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              isSchoolAdmin
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed border-transparent'
                            }`}
                            title={
                              isSchoolAdmin
                                ? `Generate new temporary password for ${user.username}`
                                : 'Only Mr. Joseph Amponsah can reset passwords'
                            }
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveLogin(user.id, user.username)}
                            disabled={!isSchoolAdmin}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              isSchoolAdmin
                                ? 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50'
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 cursor-not-allowed border-transparent'
                            }`}
                            title={
                              isSchoolAdmin
                                ? `Revoke access for ${user.username}`
                                : 'Only Mr. Joseph Amponsah can revoke user logins'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW ROLE (Exclusive to School Administrator) */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add New Institutional Role
                </h3>
              </div>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guidance Counselor, Sports Master, Lab Technician"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Institutional Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the responsibilities and permissions for this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Record daily attendance&#10;Upload term results&#10;Manage library loans"
                  value={newRoleResponsibilities}
                  onChange={(e) => setNewRoleResponsibilities(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Permitted Functional Modules
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
                  {availableSystemModules.map((mod) => (
                    <label
                      key={mod}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(mod)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, mod]);
                          } else {
                            setSelectedModules(selectedModules.filter((m) => m !== mod));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Authorizing Officer: <strong>{authorizedAdmin}</strong> (School Administrator)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="px-4 py-2 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingRole ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Role...</span>
                    </>
                  ) : (
                    <span>Create Role</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE LOGIN DETAILS (Exclusive to School Administrator) */}
      {showCreateLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Login Details for Role
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateLoginModal(false);
                  setNewlyCreatedCreds(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {newlyCreatedCreds ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Credentials Successfully Generated!</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Share these initial login details with the staff member. They will be prompted to update their password on first sign-in:
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 font-mono text-xs space-y-1 text-slate-900 dark:text-slate-100">
                    <div>
                      Username: <strong>{newlyCreatedCreds.username}</strong>
                    </div>
                    <div>
                      Temporary Password: <strong>{newlyCreatedCreds.password}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Kobbi Jay SDMS Login\nUsername: ${newlyCreatedCreds.username}\nPassword: ${newlyCreatedCreds.password}`,
                        'newlyCreated'
                      )
                    }
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {copiedId === 'newlyCreated' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Login Credentials</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateLoginModal(false);
                      setNewlyCreatedCreds(null);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateLogin} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Staff / User Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Adjei, Dr. Isaac Mensah"
                    value={loginFullName}
                    onChange={(e) => {
                      setLoginFullName(e.target.value);
                      if (!loginUsername) {
                        setLoginUsername(e.target.value.toLowerCase().replace(/[^a-z]/g, '.'));
                      }
                    }}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Role *
                    </label>
                    <select
                      value={loginRole}
                      onChange={(e) => setLoginRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-semibold"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unique Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. s.adjei"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value.toLowerCase())}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official / Contact Email *
                    </label>
                    <input
                      type="email"
                      placeholder="user@kobbijay.edu.gh"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+233 24 000 0000"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Temporary Password (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate Secure Password</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate default"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Provisioning Authority: <strong>{authorizedAdmin}</strong> (School Administrator)
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateLoginModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isSubmittingLogin ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <span>Save & Provision Login</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: MODIFY LOGIN DETAILS (Exclusive to School Administrator) */}
      {showEditLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Modify Login Credentials
                </h3>
              </div>
              <button
                onClick={() => setShowEditLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Change Password
                </label>
                <div className="relative">
                  <input
                    type={visiblePasswords['edit'] ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords(prev => ({ ...prev, edit: !prev.edit }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {visiblePasswords['edit'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Admin Override: You are modifying the credentials for this account.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLoginModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRMATION MODAL */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold">{showConfirmModal.title}</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {showConfirmModal.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal({ show: false, title: '', message: '', onConfirm: () => {}, isLoading: false })}
                disabled={showConfirmModal.isLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                disabled={showConfirmModal.isLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                {showConfirmModal.isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Yes, Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
