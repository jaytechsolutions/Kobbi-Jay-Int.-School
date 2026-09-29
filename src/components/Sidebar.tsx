import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  Users,
  Briefcase,
  Layers,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Award,
  FileText,
  DollarSign,
  Receipt,
  TrendingDown,
  Clock,
  BookMarked,
  Bell,
  Library,
  FolderOpen,
  BarChart3,
  Shield,
  History,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import type { UserRole } from '../types';

export type NavTab =
  | 'dashboard'
  | 'admissions'
  | 'students'
  | 'parents'
  | 'staff'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'academic-calendar'
  | 'attendance'
  | 'examinations'
  | 'report-cards'
  | 'fees'
  | 'payments'
  | 'expenses'
  | 'timetable'
  | 'assignments'
  | 'announcements'
  | 'library'
  | 'documents'
  | 'reports'
  | 'roles-permissions'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isOpen,
  onCloseMobile,
}) => {
  // Navigation groupings
  const isSuperOrSchoolAdmin =
    userRole === 'School Administrator' ||
    userRole === 'Headteacher';

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    roles?: UserRole[]; // If specified, only these roles can see
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      title: 'Core Administration',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'admissions', label: 'Admissions Pipeline', icon: UserPlus, badge: 'New' },
        { id: 'students', label: 'Student Records', icon: GraduationCap },
        { id: 'parents', label: 'Parents / Guardians', icon: Users },
        { id: 'staff', label: 'Staff Directory', icon: Briefcase },
        { id: 'classes', label: 'Classes & Streams', icon: Layers },
        { id: 'subjects', label: 'Subjects Catalog', icon: BookOpen },
      ],
    },
    {
      title: 'Academics & Records',
      items: [
        { id: 'academic-calendar', label: 'Academic Years & Terms', icon: Calendar },
        { id: 'attendance', label: 'Student Attendance', icon: ClipboardCheck },
        { id: 'examinations', label: 'Examinations & Marks', icon: Award },
        { id: 'report-cards', label: 'Terminal Report Cards', icon: FileText },
        { id: 'timetable', label: 'Timetable Schedules', icon: Clock },
        { id: 'assignments', label: 'Class Assignments', icon: BookMarked },
      ],
    },
    {
      title: 'Fees & Accounting',
      items: [
        { id: 'fees', label: 'School Fee Structure', icon: DollarSign },
        { id: 'payments', label: 'Payments & Receipts', icon: Receipt },
        { id: 'expenses', label: 'Operating Expenses', icon: TrendingDown },
      ],
    },
    {
      title: 'Communication & Resources',
      items: [
        { id: 'announcements', label: 'School Announcements', icon: Bell },
        { id: 'library', label: 'Library & Book Loans', icon: Library },
        { id: 'documents', label: 'School Documents', icon: FolderOpen },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        { id: 'reports', label: 'Reports Center', icon: BarChart3 },
        { id: 'roles-permissions', label: 'Roles & Access Control', icon: Shield },
        { id: 'audit-logs', label: 'Security Audit Logs', icon: History },
        { id: 'settings', label: 'Settings & DB Backup', icon: Settings },
      ],
    },
  ];

  const isSchoolAdmin = userRole === 'School Administrator';

  const isTabVisible = (tabId: NavTab): boolean => {
    if (isSchoolAdmin) return true;

    switch (userRole) {
      case 'Headteacher':
        return [
          'dashboard',
          'students',
          'staff',
          'teachers',
          'attendance',
          'examinations',
          'report-cards',
          'announcements',
          'documents',
          'academic-calendar',
          'timetable',
          'library',
        ].includes(tabId);
      case 'Academic Coordinator':
        return [
          'dashboard',
          'classes',
          'subjects',
          'academic-calendar',
          'examinations',
          'timetable',
          'reports',
          'announcements',
          'assignments',
        ].includes(tabId);
      case 'Teacher':
        return [
          'attendance',
          'examinations',
          'assignments',
          'timetable',
          'announcements',
        ].includes(tabId);
      case 'Accountant':
        return ['dashboard', 'fees', 'payments', 'expenses', 'reports', 'announcements'].includes(tabId);
      case 'Admissions Officer':
        return ['dashboard', 'admissions', 'students', 'parents', 'announcements'].includes(tabId);
      case 'Librarian':
        return ['dashboard', 'library', 'announcements'].includes(tabId);
      case 'Parent/Guardian':
        return [
          'report-cards',
          'payments',
          'assignments',
          'timetable',
          'announcements',
        ].includes(tabId);
      case 'Student':
        return [
          'report-cards',
          'assignments',
          'timetable',
          'announcements',
        ].includes(tabId);
      default:
        return false;
    }
  };

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isTabVisible(item.id)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 text-slate-200 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-20 px-5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <SchoolLogo size="md" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                Kobbi Jay Int. School
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                Basic School (Creche - JHS 3)
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 rounded-md hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Banner */}
        <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-900/90 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Signed in as
            </span>
            <span className="text-xs font-bold text-amber-300 truncate max-w-[170px]">
              {userRole}
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/50">
            Active
          </span>
        </div>

        {/* Navigation Links Scrollable List */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          isActive
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Excellence • Integrity • Leadership</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Academic Session 2026/2027 • Term 1
          </div>
        </div>
      </aside>
    </>
  );
};
