import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  UserCheck,
  Calendar,
  PlusCircle,
  X,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  CalendarX,
  Megaphone,
  GraduationCap,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationCenter } from './NotificationCenter';
import { useTheme } from '../context/ThemeContext';
import type { User, UserRole, NotificationItem } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onOpenMobileMenu: () => void;
  onSwitchRole: (role: UserRole) => void;
  onSignOut: () => void;
  onQuickActionClick: () => void;
  onSearch: (query: string) => void;
  onNavigateTab?: (tab: string, entityId?: string) => void;
  currentTermName?: string;
  academicYearName?: string;
}

const ALL_ROLES: UserRole[] = [
  'School Administrator',
  'Headteacher',
  'Academic Coordinator',
  'Teacher',
  'Accountant',
  'Admissions Officer',
  'Librarian',
  'Parent/Guardian',
  'Student',
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenMobileMenu,
  onSwitchRole,
  onSignOut,
  onQuickActionClick,
  onSearch,
  onNavigateTab,
  currentTermName = 'Term 1',
  academicYearName = '2026/2027',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'admission' | 'fee' | 'result' | 'assignment' | 'attendance' | 'announcement'>('all');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<string | null>(null);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Load real notifications based on current role
  const loadNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.getNotifications(currentUser?.role, currentUser?.id, false);
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 25 seconds for new notifications
    const interval = setInterval(loadNotifications, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.role, currentUser?.id]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleDismiss = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const item = notifications.find((n) => n.id === id);
        return item && !item.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser?.role, currentUser?.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleDismissAll = async () => {
    try {
      await api.dismissAllNotifications(currentUser?.role, currentUser?.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.linkTab && onNavigateTab) {
      onNavigateTab(notif.linkTab, notif.linkEntityId);
      setNotifMenuOpen(false);
    }
  };

  const handleTriggerSimulatedEvent = async (eventType: string) => {
    try {
      setSimulatorStatus(`Generating ${eventType} notification...`);
      const res = await api.triggerNotificationEvent({
        eventType,
        targetRole: currentUser?.role,
      });
      if (res.success) {
        setSimulatorStatus(`✓ ${res.message}`);
        await loadNotifications();
        setTimeout(() => setSimulatorStatus(null), 3500);
      }
    } catch (err) {
      console.error('Failed to simulate notification:', err);
      setSimulatorStatus('Error triggering event');
      setTimeout(() => setSimulatorStatus(null), 3000);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'unread') return !n.isRead;
    if (selectedFilter === 'admission') return n.type === 'admission';
    if (selectedFilter === 'fee') return n.type === 'fee' || n.type === 'fee_overdue';
    if (selectedFilter === 'result') return n.type === 'result';
    if (selectedFilter === 'assignment') return n.type === 'assignment';
    if (selectedFilter === 'attendance') return n.type === 'attendance';
    if (selectedFilter === 'announcement') return n.type === 'announcement';
    return true;
  });

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'admission':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'fee':
        return <Receipt className="w-4 h-4 text-purple-600" />;
      case 'fee_overdue':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'result':
        return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'attendance':
        return <CalendarX className="w-4 h-4 text-rose-600" />;
      case 'announcement':
      default:
        return <Megaphone className="w-4 h-4 text-amber-600" />;
    }
  };

  const getNotifBadgeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'admission':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'fee':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'fee_overdue':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'result':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'assignment':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'attendance':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Academic Session Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-full text-xs font-semibold text-amber-900 dark:text-amber-300">
          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Session: {academicYearName}</span>
          <span className="text-amber-400">•</span>
          <span className="text-amber-700 dark:text-amber-400 font-bold">{currentTermName}</span>
        </div>
      </div>

      {/* Middle Global Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, admission #, classes, staff..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
          />
        </div>
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button (Restricted to Admin) */}
        {currentUser?.role === 'School Administrator' && (
          <button
            onClick={onQuickActionClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Actions</span>
          </button>
        )}

        {/* Appearance Mode Toggle: Dark and White (White default) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
          title={isDark ? "Switch to White View (Default)" : "Switch to Dark View"}
          aria-label="Toggle theme appearance"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 hover:text-slate-900 transition-colors" />
          )}
        </button>

        {/* In-App Notifications Button: Opens Slide-Over Panel */}
        <button
          onClick={() => setIsSlideOverOpen(true)}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open notifications slide-over panel"
          title="Notification Center (Alerts & Announcements)"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>

        {/* Slide-over NotificationCenter component */}
        <NotificationCenter
          isOpen={isSlideOverOpen}
          onClose={() => {
            setIsSlideOverOpen(false);
            loadNotifications();
          }}
          currentUser={currentUser}
          onNavigateTab={onNavigateTab}
        />

        {/* Slide-over Notification Center is active */}

        {/* Role Switcher & User Profile Dropdown */}
        <div className="relative" ref={roleDropdownRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-2xs">
              {currentUser?.fullName.charAt(0) || 'A'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                {currentUser?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] font-semibold text-amber-700 leading-tight">
                {currentUser?.role || 'Super Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {currentUser?.role === 'School Administrator' ? 'Switch Active Role (RBAC Simulator)' : 'User Profile Details'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentUser?.role === 'School Administrator' 
                    ? 'Test the portal as any of the 10 authorized roles:'
                    : 'Your current access level and account details'}
                </p>
              </div>

              {currentUser?.role === 'School Administrator' ? (
                <div className="max-h-64 overflow-y-auto py-1">
                  {ALL_ROLES.map((role) => {
                    const isCurrent = currentUser?.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          onSwitchRole(role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                          isCurrent
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck
                            className={`w-3.5 h-3.5 ${
                              isCurrent ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          />
                          <span>{role}</span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 font-bold">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Permission Level: <strong>{currentUser?.role}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Current Session: <strong>{academicYearName}</strong></span>
                  </div>
                </div>
              )}

              <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    onSwitchRole('School Administrator');
                    setRoleMenuOpen(false);
                  }}
                  className="text-[10px] text-amber-700 hover:underline font-bold flex items-center gap-1"
                >
                  Simulator Reset
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setRoleMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg transition-colors border border-rose-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
