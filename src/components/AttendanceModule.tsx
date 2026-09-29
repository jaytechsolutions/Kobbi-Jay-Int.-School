import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  CheckCheck,
  Download,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import type { SchoolClass, Student, AttendanceRecord } from '../types';

interface AttendanceModuleProps {
  userRole?: string;
  initialClassId?: string;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ userRole, initialClassId }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedDate, setSelectedDate] = useState('2026-09-22');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{
    [studentId: string]: { status: 'Present' | 'Absent' | 'Late' | 'Excused'; remarks: string };
  }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await api.getClasses();
      if (res.classes && res.classes.length > 0) {
        setClasses(res.classes);
        if (!selectedClassId) {
          setSelectedClassId(res.classes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadStudentsAndAttendance();
    }
  }, [selectedClassId, selectedDate]);

  const loadStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      const [studRes, attRes] = await Promise.all([
        api.getStudents({ classId: selectedClassId, status: 'Active' }),
        api.getAttendance({ classId: selectedClassId, date: selectedDate }),
      ]);

      const studentList = studRes.students || [];
      setStudents(studentList);

      const existingRecords: { [id: string]: any } = {};
      if (attRes.attendance) {
        attRes.attendance.forEach((r) => {
          existingRecords[r.studentId] = {
            status: r.status,
            remarks: r.remarks || '',
          };
        });
      }

      // Populate default attendance map: if no record, default to 'Present'
      const newMap: any = {};
      studentList.forEach((s) => {
        if (existingRecords[s.id]) {
          newMap[s.id] = existingRecords[s.id];
        } else {
          newMap[s.id] = { status: 'Present', remarks: '' };
        }
      });

      setAttendanceMap(newMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: any = {};
    students.forEach((s) => {
      updated[s.id] = {
        ...attendanceMap[s.id],
        status,
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const records = students.map((s) => ({
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        status: attendanceMap[s.id]?.status || 'Present',
        remarks: attendanceMap[s.id]?.remarks || '',
      }));

      await api.saveBatchAttendance({
        classId: selectedClassId,
        date: selectedDate,
        recordedBy: 'Class Teacher',
        records,
      });

      setSuccessMessage(`Attendance saved successfully for ${records.length} pupils.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(
    (a) => a.status === 'Present' || a.status === 'Late'
  ).length;
  const absentCount = Object.values(attendanceMap).filter((a) => a.status === 'Absent').length;
  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900">Daily Attendance Register</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mark morning register, track absenteeism, late-coming, and excused medical leaves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMarkAll('Present')}
            className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Records...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Selectors & Metrics Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
            Class Level
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.levelCategory})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
            School Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
          >
          </input>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
          <div className="flex-1 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">Present / Late</span>
            <span className="text-base font-extrabold text-emerald-900">{presentCount} pupils</span>
          </div>
          <div className="flex-1 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 block uppercase">Absent</span>
            <span className="text-base font-extrabold text-rose-900">{absentCount} pupils</span>
          </div>
          <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Rate</span>
            <span className="text-base font-extrabold text-slate-800">
              {students.length ? Math.round((presentCount / students.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            {currentClass?.name} Register ({students.length} Pupils)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Date: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Pupil Name</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Teacher Remark / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading class register...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No active students enrolled in {currentClass?.name} yet.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const state = attendanceMap[student.id] || { status: 'Present', remarks: '' };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {student.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {student.firstName} {student.lastName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {student.gender} • Emergency: {student.emergencyContactPhone || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['Present', 'Late', 'Absent', 'Excused'] as const).map((opt) => {
                            const isSelected = state.status === opt;
                            let colorClasses = '';
                            if (opt === 'Present') {
                              colorClasses = isSelected
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50';
                            } else if (opt === 'Late') {
                              colorClasses = isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50';
                            } else if (opt === 'Absent') {
                              colorClasses = isSelected
                                ? 'bg-rose-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50';
                            } else {
                              colorClasses = isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleStatusChange(student.id, opt)}
                                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${colorClasses}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional notes (e.g. sick with flu, traffic)..."
                          value={state.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
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
  );
};
