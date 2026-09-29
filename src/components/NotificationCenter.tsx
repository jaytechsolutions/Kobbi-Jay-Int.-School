import React, { useState, useEffect } from 'react';
import {
  Bell,
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
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import type { User, NotificationItem } from '../types';

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

type FilterCategory = 'all' | 'unread' | 'admission' | 'fee' | 'announcement' | 'other';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<string | null>(null);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications(currentUser?.role, currentUser?.id, false);
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser?.role, currentUser?.id]);

  // Periodic background refresh while open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, [isOpen, currentUser?.role, currentUser?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      onClose();
    }
  };

  const handleTriggerSimulatedEvent = async (eventType: string) => {
    try {
      setSimulatorStatus(`Triggering ${eventType} event...`);
      const res = await api.triggerNotificationEvent({
        eventType,
        targetRole: currentUser?.role,
      });
      if (res.success) {
        setSimulatorStatus(`✓ ${res.message}`);
        await loadNotifications();
        setTimeout(() => setSimulatorStatus(null), 3000);
      }
    } catch (err) {
      console.error('Failed to trigger notification event:', err);
      setSimulatorStatus('Error triggering event');
      setTimeout(() => setSimulatorStatus(null), 3000);
    }
  };

  // Filter notifications
  const admissionsCount = notifications.filter((n) => n.type === 'admission').length;
  const feesCount = notifications.filter((n) => n.type === 'fee' || n.type === 'fee_overdue').length;
  const announcementsCount = notifications.filter((n) => n.type === 'announcement').length;

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'unread') return !n.isRead;
    if (selectedFilter === 'admission') return n.type === 'admission';
    if (selectedFilter === 'fee') return n.type === 'fee' || n.type === 'fee_overdue';
    if (selectedFilter === 'announcement') return n.type === 'announcement';
    if (selectedFilter === 'other') {
      return n.type !== 'admission' && n.type !== 'fee' && n.type !== 'fee_overdue' && n.type !== 'announcement';
    }
    return true;
  });

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'admission':
        return <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'fee':
        return <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'fee_overdue':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'result':
        return <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'attendance':
        return <CalendarX className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getNotifBadgeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'admission':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'fee':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'fee_overdue':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'announcement':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'result':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800';
      case 'assignment':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'attendance':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Notification Center
                  </h2>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Admissions, fee alerts & institutional announcements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={loadNotifications}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="Refresh alerts"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close notification panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{showSimulator ? 'Hide Test Triggers' : 'Test Event Triggers'}</span>
            </button>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium flex items-center gap-1 hover:underline ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Event Trigger Simulator Drawer */}
          {showSimulator && (
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/60 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Simulate Institutional Alerts
                </span>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                  Target: {currentUser?.role || 'All Staff'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5 leading-relaxed">
                Click any core event to simulate immediate generation and role dispatch:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Admissions */}
                <button
                  onClick={() => handleTriggerSimulatedEvent('admission')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-lg text-left shadow-2xs transition-colors flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Admissions</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">New applicant</div>
                  </div>
                </button>

                {/* 2. Fee Payments */}
                <button
                  onClick={() => handleTriggerSimulatedEvent('fee')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-lg text-left shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Fee Payment</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Receipt issued</div>
                  </div>
                </button>

                {/* 3. Announcements */}
                <button
                  onClick={() => handleTriggerSimulatedEvent('announcement')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-left shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Announcement</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">School notice</div>
                  </div>
                </button>
              </div>

              {simulatorStatus && (
                <div className="mt-2.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-md animate-in fade-in">
                  {simulatorStatus}
                </div>
              )}
            </div>
          )}

          {/* Filter Pills with Specific Highlight for Admissions, Fee Payments & Announcements */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-50/40 dark:bg-slate-900/50">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] opacity-80">({notifications.length})</span>
            </button>

            <button
              onClick={() => setSelectedFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'unread'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && <span className="text-[10px]">({unreadCount})</span>}
            </button>

            <button
              onClick={() => setSelectedFilter('admission')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'admission'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Admissions</span>
              {admissionsCount > 0 && <span className="text-[10px]">({admissionsCount})</span>}
            </button>

            <button
              onClick={() => setSelectedFilter('fee')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'fee'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Fee Payments</span>
              {feesCount > 0 && <span className="text-[10px]">({feesCount})</span>}
            </button>

            <button
              onClick={() => setSelectedFilter('announcement')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'announcement'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Announcements</span>
              {announcementsCount > 0 && <span className="text-[10px]">({announcementsCount})</span>}
            </button>

            <button
              onClick={() => setSelectedFilter('other')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                selectedFilter === 'other'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Other</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                <span>Loading latest notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No {selectedFilter !== 'all' ? selectedFilter : ''} alerts found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  You are completely caught up! Use the "Test Event Triggers" button above to simulate admissions, payments, or announcements.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group relative ${
                    !notif.isRead
                      ? 'bg-amber-50/30 dark:bg-amber-950/20'
                      : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs">
                      {getNotifIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                        </span>

                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getNotifBadgeColor(
                            notif.type
                          )}`}
                        >
                          {notif.type.replace('_', ' ')}
                        </span>

                        {notif.linkTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5 ml-auto"
                          >
                            <span>Open in {notif.linkTab}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Item Hover / Touch Actions */}
                    <div className="absolute right-3 top-3.5 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDismiss(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} alerts
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 font-bold text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
