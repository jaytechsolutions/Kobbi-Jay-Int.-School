import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Building,
  UserCheck,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import type { AdmissionApplication, SchoolClass } from '../types';

interface AdmissionsModuleProps {
  userRole?: string;
}

export const AdmissionsModule: React.FC<AdmissionsModuleProps> = ({ userRole }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review Form
  const [reviewStatus, setReviewStatus] = useState('Accepted');
  const [interviewDate, setInterviewDate] = useState('2026-09-28');
  const [interviewScore, setInterviewScore] = useState(85);
  const [interviewNotes, setInterviewNotes] = useState('Candidate demonstrated strong literacy and numeration skills.');

  // New App Form
  const [newApp, setNewApp] = useState<Partial<AdmissionApplication>>({
    applicantFirstName: '',
    applicantMiddleName: '',
    applicantLastName: '',
    gender: 'Male',
    dateOfBirth: '2021-08-10',
    desiredClassId: 'class-kg-1',
    desiredClassName: 'KG 1',
    previousSchool: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    address: 'East Legon, Accra',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, classRes] = await Promise.all([
        api.getAdmissions(),
        api.getClasses(),
      ]);
      if (appRes.applications) setApplications(appRes.applications);
      if (classRes.classes) setClasses(classRes.classes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cls = classes.find((c) => c.id === newApp.desiredClassId);
      await api.createAdmission({
        ...newApp,
        desiredClassName: cls ? cls.name : 'KG 1',
      });
      setShowNewModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    try {
      await api.updateAdmissionStatus(selectedApp.id, {
        status: reviewStatus,
        interviewDate,
        interviewScore,
        interviewNotes,
      });
      setShowReviewModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToStudent = async (appItem: AdmissionApplication) => {
    if (!window.confirm(`Convert application ${appItem.applicationNumber} (${appItem.applicantFirstName} ${appItem.applicantLastName}) to an active enrolled student?`)) {
      return;
    }
    try {
      const res = await api.convertAdmissionToStudent(appItem.id);
      if (res.success) {
        alert(`Successfully enrolled! Assigned official Admission Number: ${res.admissionNumber}`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.applicantFirstName.toLowerCase().includes(search.toLowerCase()) ||
      a.applicantLastName.toLowerCase().includes(search.toLowerCase()) ||
      a.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.parentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus ? a.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">Student Admissions & Enrollment Pipeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Process prospective student applications, schedule entrance interviews, and convert accepted candidates to active students.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Admission Application</span>
        </button>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Applicants</span>
          <div className="text-xl font-black text-slate-900 mt-1">{applications.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Pending Review</span>
          <div className="text-xl font-black text-amber-600 mt-1">
            {applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">Accepted</span>
          <div className="text-xl font-black text-blue-600 mt-1">
            {applications.filter((a) => a.status === 'Accepted').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Enrolled Students</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {applications.filter((a) => a.status === 'Enrolled').length}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, application no, or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="">All Pipeline Stages</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Accepted">Accepted</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Application No</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Target Class</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Interview</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((appItem) => (
                <tr key={appItem.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {appItem.applicationNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {appItem.applicantFirstName} {appItem.applicantLastName}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      DOB: {appItem.dateOfBirth} ({appItem.gender})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100">
                      {appItem.desiredClassName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <strong>{appItem.parentName}</strong>
                    <span className="block text-[10px] text-slate-400">
                      {appItem.parentPhone} • {appItem.parentEmail}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {appItem.interviewScore ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Score: {appItem.interviewScore}%
                      </span>
                    ) : appItem.interviewDate ? (
                      <span className="text-amber-700 text-[11px]">
                        Date: {appItem.interviewDate}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not scheduled</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        appItem.status === 'Enrolled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appItem.status === 'Accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : appItem.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {appItem.status}
                    </span>
                    {appItem.assignedAdmissionNumber && (
                      <span className="block text-[9px] font-mono text-emerald-700 mt-0.5">
                        {appItem.assignedAdmissionNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedApp(appItem);
                          setReviewStatus(appItem.status === 'Pending' ? 'Accepted' : appItem.status);
                          if (appItem.interviewScore) setInterviewScore(appItem.interviewScore);
                          if (appItem.interviewDate) setInterviewDate(appItem.interviewDate);
                          setShowReviewModal(true);
                        }}
                        className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px]"
                      >
                        Review
                      </button>

                      {appItem.status === 'Accepted' && (
                        <button
                          onClick={() => handleConvertToStudent(appItem)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Enroll</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW APPLICATION MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">New Admission Application</h2>
            <p className="text-slate-500 mb-4">Register an applicant for the 2026/2027 academic session.</p>

            <form onSubmit={handleCreateApplication} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidate First Name *</label>
                  <input
                    type="text"
                    required
                    value={newApp.applicantFirstName}
                    onChange={(e) => setNewApp({ ...newApp, applicantFirstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidate Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newApp.applicantLastName}
                    onChange={(e) => setNewApp({ ...newApp, applicantLastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={newApp.gender}
                    onChange={(e) => setNewApp({ ...newApp, gender: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={newApp.dateOfBirth}
                    onChange={(e) => setNewApp({ ...newApp, dateOfBirth: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desired Class *</label>
                  <select
                    value={newApp.desiredClassId}
                    onChange={(e) => setNewApp({ ...newApp, desiredClassId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={newApp.parentName}
                    onChange={(e) => setNewApp({ ...newApp, parentName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Phone *</label>
                  <input
                    type="text"
                    required
                    value={newApp.parentPhone}
                    onChange={(e) => setNewApp({ ...newApp, parentPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Email *</label>
                  <input
                    type="email"
                    required
                    value={newApp.parentEmail}
                    onChange={(e) => setNewApp({ ...newApp, parentEmail: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">National Health Insurance (NHIS) No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 12345678"
                    value={newApp.nhisNumber || ''}
                    onChange={(e) => setNewApp({ ...newApp, nhisNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Previous School (if any)</label>
                <input
                  type="text"
                  value={newApp.previousSchool}
                  onChange={(e) => setNewApp({ ...newApp, previousSchool: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & INTERVIEW MODAL */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Admission Review & Interview
            </h2>
            <p className="text-slate-500 mb-4">
              Applicant: <strong>{selectedApp.applicantFirstName} {selectedApp.applicantLastName}</strong> ({selectedApp.desiredClassName})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Accepted">Accepted for Admission</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={interviewScore}
                    onChange={(e) => setInterviewScore(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Examiner Assessment Remarks</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
