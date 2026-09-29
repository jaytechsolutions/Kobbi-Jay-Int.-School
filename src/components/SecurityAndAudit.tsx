import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Shield,
  Search,
  Filter,
  Download,
  Lock,
  Clock,
  User,
  Database,
  CheckCircle2,
  RefreshCw,
  Archive,
  Trash2,
  Calendar,
  AlertTriangle,
  Play,
  FileText,
  Eye,
  X,
  Layers,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import type { AuditLog, AuditArchiveBatch, UserRole } from '../types';

interface SecurityAndAuditProps {
  userRole: UserRole;
  onNavigateTab?: (tab: string) => void;
}

export const SecurityAndAudit: React.FC<SecurityAndAuditProps> = ({ userRole, onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archives' | 'policy'>('active');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [archivedBatches, setArchivedBatches] = useState<AuditArchiveBatch[]>([]);
  const [stats, setStats] = useState<{
    totalActive: number;
    totalArchived: number;
    archivedBatchesCount: number;
    pendingCleanupCount: number;
    retentionPolicyMonths: number;
    cutoffDate: string;
    lastCleanupRun: string;
    nextScheduledRun: string;
    complianceStandard: string;
    automatedTaskActive: boolean;
  }>({
    totalActive: 0,
    totalArchived: 0,
    archivedBatchesCount: 0,
    pendingCleanupCount: 0,
    retentionPolicyMonths: 12,
    cutoffDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastCleanupRun: 'Scheduled background task active',
    nextScheduledRun: 'Every 12-24 hours',
    complianceStandard: 'Ghana Data Protection Act 2012 (Act 843) & MoE Standards',
    automatedTaskActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [seedingHistoric, setSeedingHistoric] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedBatchForInspection, setSelectedBatchForInspection] = useState<AuditArchiveBatch | null>(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState(false);

  useEffect(() => {
    loadAllAuditData();
  }, []);

  const loadAllAuditData = async () => {
    try {
      setLoading(true);
      const [logsRes, archivesRes] = await Promise.all([
        api.getAuditLogs(),
        api.getArchivedBatches(),
      ]);

      if (logsRes.auditLogs) setLogs(logsRes.auditLogs);
      if (logsRes.stats) setStats(logsRes.stats);
      if (archivesRes.batches) setArchivedBatches(archivesRes.batches);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleanupNow = async () => {
    try {
      setRunningCleanup(true);
      setCleanupMessage(null);
      const res = await api.runAuditLogCleanup('Administrator Manual Trigger (12-Month Compliance Task)', 12);
      setCleanupMessage(res.message);
      await loadAllAuditData();
    } catch (err) {
      console.error('Cleanup execution failed:', err);
      setCleanupMessage('Cleanup task encountered an error.');
    } finally {
      setRunningCleanup(false);
    }
  };

  const handleSeedHistoricLogs = async () => {
    try {
      setSeedingHistoric(true);
      setCleanupMessage(null);
      const res = await api.seedHistoricAuditLogs();
      setCleanupMessage(`Injected ${res.count} historic test audit logs (>12 months old). Click "Run Automated Cleanup Task" to archive them!`);
      await loadAllAuditData();
    } catch (err) {
      console.error('Failed to seed historic logs:', err);
    } finally {
      setSeedingHistoric(false);
    }
  };

  const handleInspectBatch = async (batchId: string) => {
    try {
      setLoadingBatchDetail(true);
      const res = await api.getArchivedBatchById(batchId);
      if (res.batch) {
        setSelectedBatchForInspection(res.batch);
      }
    } catch (err) {
      console.error('Failed to load batch inspection:', err);
    } finally {
      setLoadingBatchDetail(false);
    }
  };

  const handleExportActiveLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kobbi_jay_active_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportBatch = (batch: AuditArchiveBatch) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(batch, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${batch.batchNumber}_compliance_archive.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      l.recordAffected.toLowerCase().includes(search.toLowerCase());
    const matchesAction = selectedAction ? l.action === selectedAction : true;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Audit Trails, Regulatory Compliance & Automated Archival
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Immutable tracking of admissions, fee payments, exam approvals, and role-based actions. Features an automated 12-month retention engine that archives legacy logs into compliant historical batches for top-tier database performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportActiveLogs}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Active Logs</span>
          </button>
          <button
            onClick={loadAllAuditData}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Automated Cleanup & Retention Status Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-xl shadow-md border border-blue-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Automated 12-Month Cleanup Task Active
              </span>
              <span className="text-[10px] bg-blue-800/80 text-blue-200 px-2 py-0.5 rounded-full border border-blue-700 font-mono">
                Ghana Act 843 Compliant
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              Database Retention Policy: 12 Months Operational Window
            </h2>
            <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
              Records older than 12 months ({new Date(stats.cutoffDate).toLocaleDateString()}) are automatically moved from active tables into compressed compliance archive batches, keeping queries lightning-fast while preserving full auditability.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunCleanupNow}
              disabled={runningCleanup}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {runningCleanup ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Archiving Logs...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Cleanup Task Now</span>
                </>
              )}
            </button>

            <button
              onClick={handleSeedHistoricLogs}
              disabled={seedingHistoric}
              className="px-3.5 py-2.5 bg-blue-800/80 hover:bg-blue-700 text-blue-100 font-semibold text-xs rounded-lg border border-blue-700 transition-colors flex items-center gap-1.5"
              title="Add historic logs (>12m) to test the automated cleanup workflow"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{seedingHistoric ? 'Injecting...' : 'Test: Inject >12m Logs'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-800/70 text-xs">
          <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/50">
            <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Active Logs (≤12m)</span>
            <div className="text-lg font-black text-white mt-0.5">{stats.totalActive}</div>
            <span className="text-[10px] text-blue-300">Fast indexed memory</span>
          </div>

          <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/50">
            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Archived Records</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{stats.totalArchived}</div>
            <span className="text-[10px] text-emerald-300">In compliance store</span>
          </div>

          <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/50">
            <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Compliance Batches</span>
            <div className="text-lg font-black text-amber-300 mt-0.5">{stats.archivedBatchesCount}</div>
            <span className="text-[10px] text-amber-200">Immutable archives</span>
          </div>

          <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/50">
            <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Pending Archival</span>
            <div className="text-lg font-black text-purple-300 mt-0.5">{stats.pendingCleanupCount}</div>
            <span className="text-[10px] text-purple-200">Older than 12m</span>
          </div>
        </div>
      </div>

      {cleanupMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{cleanupMessage}</span>
          </div>
          <button
            onClick={() => setCleanupMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Operational Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archives')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'archives'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Compliance Archive Batches ({archivedBatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'policy'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Retention Engine & Security Policies</span>
        </button>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('roles-permissions')}
            className="pb-2.5 px-3 font-bold border-b-2 border-transparent text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1.5 ml-auto"
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Manage Roles & Logins →</span>
          </button>
        )}
      </div>

      {/* TAB 1: ACTIVE AUDIT TRAIL */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, module, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="">All Action Types</option>
              <option value="AUDIT_CLEANUP_EXECUTED">Audit Cleanups</option>
              <option value="PAYMENT_RECORDED">Fee Payments</option>
              <option value="ATTENDANCE_MARKED">Attendance Submissions</option>
              <option value="SCORES_ENTERED">Scores & Assessment</option>
              <option value="RESULTS_APPROVED">Results Approvals</option>
              <option value="ADMISSION_SUBMITTED">Admissions</option>
              <option value="STUDENT_ENROLLED">Enrollments</option>
              <option value="ASSIGNMENT_CREATED">Assignments</option>
              <option value="ANNOUNCEMENT_CREATED">Announcements</option>
              <option value="SETTINGS_UPDATED">System Settings</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Module & Record</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        Loading security audit logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No matching audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isLegacy = new Date(log.timestamp).getTime() < new Date(stats.cutoffDate).getTime();
                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isLegacy ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                              {isLegacy && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-sans font-semibold">
                                  &gt;12m
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 font-sans">
                            {log.userName}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                              {log.userRole}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                                log.action.includes('CLEANUP')
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : log.action.includes('PAYMENT')
                                  ? 'bg-purple-100 text-purple-800'
                                  : log.action.includes('APPROVE')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.action.includes('ADMISSION') || log.action.includes('ENROLL')
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-sans">
                            <span className="font-semibold text-slate-700">{log.module}</span>
                            {log.recordAffected ? ` (${log.recordAffected})` : ''}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-sans max-w-sm truncate">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLIANCE ARCHIVE BATCHES */}
      {activeTab === 'archives' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-5 h-5 text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Compliant Historical Audit Batches (Archived &gt;12 Months)
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              When the automated cleanup task runs, logs older than 12 months are removed from the operational database to preserve sub-second response times, and packaged into immutable batches. Each batch preserves user identity, IP address, exact action, and state snapshots in accordance with the Ghana Data Protection Act 2012.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedBatches.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200">
                <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Archive Batches Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  All active audit logs currently fall within the 12-month operational window. You can click "Test: Inject &gt;12m Logs" and run the cleanup task to see an archive batch created.
                </p>
                <button
                  onClick={handleSeedHistoricLogs}
                  className="px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Inject Test Historic Logs &gt;12 Months
                </button>
              </div>
            ) : (
              archivedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {batch.batchNumber}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Verified Compliant</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-2">
                        {batch.recordCount} Audit Records Archived
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">{batch.fileSize}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-mono text-[11px] mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Archived At:</span>
                      <span className="font-sans text-slate-800">{new Date(batch.archivedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Retention Cutoff:</span>
                      <span className="font-sans text-slate-800">{new Date(batch.cutoffDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Log Date Range:</span>
                      <span className="font-sans text-slate-800">{batch.dateRange.oldest} → {batch.dateRange.newest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Triggered By:</span>
                      <span className="font-sans text-slate-800 truncate max-w-[180px]">{batch.triggeredBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInspectBatch(batch.id)}
                      className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Records</span>
                    </button>
                    <button
                      onClick={() => handleExportBatch(batch)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Export archive JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RETENTION ENGINE & SECURITY POLICIES */}
      {activeTab === 'policy' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase mb-2">
                <Lock className="w-4 h-4" />
                <span>RBAC & Password Policy</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                PBKDF2/SHA-256 salted hashes enforced. Role permissions are verified server-side on every REST mutation before committing database changes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase mb-2">
                <Database className="w-4 h-4" />
                <span>Data Protection & Integrity</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immutable write-locks on financial records and grade approvals. Educational history is protected against unauthorized overwrite or deletion.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase mb-2">
                <Archive className="w-4 h-4" />
                <span>12-Month Archival Retention</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scheduled automated cron task periodically packages logs older than 12 months into archival batches, fulfilling compliance under Ghana Data Protection Act 2012.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Automated Archival Task Specifications & Compliance Checklist</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">12-Month Performance Boundary:</strong>
                  <p className="mt-0.5">
                    Active audit tables store records generated within the last 365 days. This maintains immediate lookup performance and UI responsiveness during heavy school operations (e.g., end-of-term results approvals, fee drives).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Automated Background Execution:</strong>
                  <p className="mt-0.5">
                    The archival runner executes automatically upon server startup and re-runs on a recurrent 12-to-24-hour cycle. Administrators can also trigger it manually at any time via the "Run Cleanup Task Now" action.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Immutable Audit Archive Batches:</strong>
                  <p className="mt-0.5">
                    Archived logs are not permanently discarded; they are isolated into timestamped batches (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">ARCH-YYYY-XXXX</code>) with full metadata, available for download or inspection during statutory compliance reviews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT ARCHIVE BATCH MODAL */}
      {selectedBatchForInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                    {selectedBatchForInspection.batchNumber}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Compliance Archive Record
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Archived Logs: {selectedBatchForInspection.recordCount} Records ({selectedBatchForInspection.dateRange.oldest} to {selectedBatchForInspection.dateRange.newest})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportBatch(selectedBatchForInspection)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => setSelectedBatchForInspection(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cutoff Date</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {new Date(selectedBatchForInspection.cutoffDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Archived At</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {new Date(selectedBatchForInspection.archivedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Records</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {selectedBatchForInspection.recordCount}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Archive Size</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {selectedBatchForInspection.fileSize}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Historic Timestamp</th>
                        <th className="py-2.5 px-3">User & Role</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-3">Historical Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedBatchForInspection.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className="font-bold text-slate-800">{log.userName}</span>
                            <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-600">
                            {log.module}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-700 max-w-xs truncate">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Preserved under Ghana Data Protection Act 2012 compliance standards.
              </span>
              <button
                onClick={() => setSelectedBatchForInspection(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
