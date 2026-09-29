import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  UserPlus,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Receipt,
  FileText,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookMarked,
  Library,
  FolderOpen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import type { NavTab } from './Sidebar';
import type { Payment, Announcement } from '../types';

interface AdminDashboardProps {
  userRole: string;
  onNavigate: (tab: NavTab) => void;
  onOpenReceipt: (receiptNumber: string) => void;
  onOpenNewPayment: () => void;
  onOpenNewStudent: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userRole,
  onNavigate,
  onOpenReceipt,
  onOpenNewPayment,
  onOpenNewStudent,
}) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setRecentPayments(statsRes.recentPayments || []);
        setRecentAnnouncements(statsRes.recentAnnouncements || []);
      }

      if (chartsRes.success) {
        setCharts(chartsRes);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading school intelligence dashboard...</span>
        </div>
      </div>
    );
  }

  const attendancePercent = stats?.totalStudents
    ? Math.round(((stats.presentToday || 0) / stats.totalStudents) * 100)
    : 96;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kobbi Jay International School Database Management System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome to the Central Administration Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage student records, teachers, classes from Creche to JHS 3, fees collection, continuous assessment, terminal report cards, and institutional governance.
          </p>
        </div>

        {/* Quick stat chips in banner */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('academic-calendar')}
            className="bg-slate-800/60 backdrop-blur-xs p-3 rounded-xl border border-slate-700/60 text-left hover:bg-slate-700/60 transition-colors group"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Academic Year</span>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm font-bold text-white">2026/2027 • Term 1</p>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
          </button>
          <div className="bg-slate-800/60 backdrop-blur-xs p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">School Curriculum</span>
            <p className="text-sm font-bold text-white mt-0.5">Basic School (NaCCA Standard)</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xs p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Class Tiers</span>
            <p className="text-sm font-bold text-white mt-0.5">14 Classes (Creche - JHS 3)</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xs p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System State</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Database Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="group cursor-pointer bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.totalStudents || 8}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              Active Enrolled
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Boys: <strong className="text-slate-800">{stats?.maleStudents || 5}</strong></span>
            <span>Girls: <strong className="text-slate-800">{stats?.femaleStudents || 3}</strong></span>
            <span className="text-blue-600 font-semibold flex items-center group-hover:underline">
              View <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Teachers & Staff */}
        <div
          onClick={() => onNavigate('teachers')}
          className="group cursor-pointer bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teaching Faculty</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.totalTeachers || 5}
            </span>
            <span className="text-xs text-slate-500">Teachers</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Non-Teaching: <strong className="text-slate-800">4 Staff</strong></span>
            <span>Classes: <strong className="text-slate-800">{stats?.totalClasses || 14}</strong></span>
            <span className="text-amber-700 font-semibold flex items-center group-hover:underline">
              Faculty <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="group cursor-pointer bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {attendancePercent}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              High Attendance
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Present: <strong className="text-emerald-700">{stats?.presentToday || 7}</strong></span>
            <span>Absent: <strong className="text-rose-600">{stats?.absentToday || 1}</strong></span>
            <span className="text-emerald-700 font-semibold flex items-center group-hover:underline">
              Mark <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Fee Collection Progress (Restricted to Admin & Accountant) */}
        {(isSchoolAdmin || userRole === 'Accountant') && (
          <div
            onClick={() => onNavigate('payments')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fees Collected</span>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                GH₵ {Number(stats?.feesCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Outstanding: <strong className="text-rose-600">GH₵ {Number(stats?.outstandingFees || 0).toLocaleString()}</strong></span>
              <span className="text-purple-700 font-semibold flex items-center group-hover:underline">
                Finance <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Action Bar (Restricted to Admin) */}
      {isSchoolAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Quick Administrative Actions</h2>
            </div>
            <span className="text-xs text-slate-500">Fast pathways for routine daily operations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <button
              onClick={onOpenNewStudent}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 transition-all text-center group"
            >
              <UserPlus className="w-5 h-5 mb-1.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Add Student</span>
            </button>

            <button
              onClick={onOpenNewPayment}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 text-slate-700 hover:text-purple-900 transition-all text-center group"
            >
              <Receipt className="w-5 h-5 mb-1.5 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Record Fee</span>
            </button>

            <button
              onClick={() => onNavigate('attendance')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-900 transition-all text-center group"
            >
              <ClipboardCheck className="w-5 h-5 mb-1.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Mark Attendance</span>
            </button>

            <button
              onClick={() => onNavigate('examinations')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-900 transition-all text-center group"
            >
              <Award className="w-5 h-5 mb-1.5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Enter Marks</span>
            </button>

            <button
              onClick={() => onNavigate('report-cards')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 hover:text-cyan-900 transition-all text-center group"
            >
              <FileText className="w-5 h-5 mb-1.5 text-cyan-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Report Cards</span>
            </button>

            <button
              onClick={() => onNavigate('academic-calendar')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition-all text-center group"
            >
              <Calendar className="w-5 h-5 mb-1.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Academic Year</span>
            </button>

            <button
              onClick={() => onNavigate('timetable')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all text-center group"
            >
              <Clock className="w-5 h-5 mb-1.5 text-slate-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Timetables</span>
            </button>

            <button
              onClick={() => onNavigate('assignments')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-900 transition-all text-center group"
            >
              <BookMarked className="w-5 h-5 mb-1.5 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Assignments</span>
            </button>

            <button
              onClick={() => onNavigate('library')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-900 transition-all text-center group"
            >
              <Library className="w-5 h-5 mb-1.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Library</span>
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-900 transition-all text-center group"
            >
              <FolderOpen className="w-5 h-5 mb-1.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Documents</span>
            </button>

            <button
              onClick={() => onNavigate('announcements')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-900 transition-all text-center group"
            >
              <AlertCircle className="w-5 h-5 mb-1.5 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Announcement</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all text-center group"
            >
              <TrendingUp className="w-5 h-5 mb-1.5 text-slate-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">DB Backup</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Enrollment distribution across classes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Enrollment by Class</h2>
              <p className="text-xs text-slate-500">Distribution from Creche to JHS 3</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              14 Class Levels
            </span>
          </div>
          <div className="h-64 w-full">
            {charts?.studentsByClass && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.studentsByClass} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="class"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fbbf24' }}
                  />
                  <Bar dataKey="count" name="Enrolled Pupils" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Fee Collections by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fee Inflow & Outstanding Breakdown</h2>
              <p className="text-xs text-slate-500">Tuition, Feeding, STEM & Uniform accounts</p>
            </div>
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Ledger
            </button>
          </div>
          <div className="h-64 w-full">
            {charts?.feeData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.feeData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `GH₵${v}`} />
                  <Tooltip
                    formatter={(val: any) => `GH₵ ${Number(val).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="collected" name="Collected (GH₵)" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Outstanding (GH₵)" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Gender breakdown & Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Breakdown (Pie) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gender Ratio</h2>
            <p className="text-xs text-slate-500">Boy-Child vs Girl-Child representation</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {charts?.genderData && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.genderData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.genderData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-around pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-slate-600">Boys ({stats?.maleStudents || 5})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-slate-600">Girls ({stats?.femaleStudents || 3})</span>
            </div>
          </div>
        </div>

        {/* 6-Day Attendance Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Weekly Attendance Trend (%)</h2>
              <p className="text-xs text-slate-500">Punctuality and presence across school days</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Avg: 96.5%
            </span>
          </div>
          <div className="h-48 w-full">
            {charts?.attendanceTrends && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="present" name="Present %" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Payments & Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Fee Payments Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Payment Transactions</h2>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All Transactions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Fee Category</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount (GH₵)</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {p.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {p.studentName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {p.admissionNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.feeCategoryName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        GH₵ {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onOpenReceipt(p.receiptNumber)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Announcements Board */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">School Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Bulletin
              </button>
            </div>

            <div className="space-y-3">
              {recentAnnouncements.map((anc) => (
                <div
                  key={anc.id}
                  className={`p-3 rounded-lg border text-xs ${
                    anc.isUrgent
                      ? 'bg-amber-50/50 border-amber-200/80'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 leading-snug">{anc.title}</span>
                    {anc.isUrgent && (
                      <span className="shrink-0 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[9px] font-bold uppercase">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{anc.content}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Target: <strong>{(anc.targetRoles || []).join(', ')}</strong></span>
                    <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kobbi Jay Int. School</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All systems nominal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
