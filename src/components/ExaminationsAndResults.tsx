import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Save,
  CheckCircle,
  Lock,
  Send,
  AlertCircle,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import type { SchoolClass, Subject, Student, StudentResult, UserRole } from '../types';

interface ExaminationsAndResultsProps {
  userRole?: UserRole;
}

export const ExaminationsAndResults: React.FC<ExaminationsAndResultsProps> = ({
  userRole = 'School Administrator',
}) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('term-1-ay-2026-2027');

  const [students, setStudents] = useState<Student[]>([]);
  const [resultsMap, setResultsMap] = useState<{
    [studentId: string]: {
      id?: string;
      classScore: number;
      examScore: number;
      totalScore: number;
      grade: string;
      remarks: string;
      status: string;
    };
  }>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isReviewer = true; // Activated for all roles
  const isAcademicCoordinator = true; // Activated for all roles

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
      ]);
      if (clsRes.classes && clsRes.classes.length > 0) {
        setClasses(clsRes.classes);
        setSelectedClassId(clsRes.classes[0].id);
      }
      if (subRes.subjects && subRes.subjects.length > 0) {
        setSubjects(subRes.subjects);
        setSelectedSubjectId(subRes.subjects[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadStudentsAndScores();
    }
  }, [selectedClassId, selectedSubjectId, selectedTermId]);

  const calculateGradeInfo = (total: number) => {
    if (total >= 80) return { grade: '1', remarks: 'Highest / Excellent' };
    if (total >= 70) return { grade: '2', remarks: 'Higher / Very Good' };
    if (total >= 65) return { grade: '3', remarks: 'High / Good' };
    if (total >= 60) return { grade: '4', remarks: 'High Average / Credit' };
    if (total >= 55) return { grade: '5', remarks: 'Average / Credit' };
    if (total >= 50) return { grade: '6', remarks: 'Low Average / Pass' };
    if (total >= 45) return { grade: '7', remarks: 'Low / Pass' };
    if (total >= 40) return { grade: '8', remarks: 'Lower / Weak Pass' };
    return { grade: '9', remarks: 'Lowest / Fail' };
  };

  const loadStudentsAndScores = async () => {
    try {
      setLoading(true);
      const [studRes, resRes] = await Promise.all([
        api.getStudents({ classId: selectedClassId, status: 'Active' }),
        api.getResults({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          termId: selectedTermId,
        }),
      ]);

      const studentList = studRes.students || [];
      setStudents(studentList);

      const existingScores: { [id: string]: any } = {};
      if (resRes.results) {
        resRes.results.forEach((r) => {
          existingScores[r.studentId] = {
            id: r.id,
            classScore: r.classScore,
            examScore: r.examScore,
            totalScore: r.totalScore,
            grade: r.grade,
            remarks: r.remarks,
            status: r.status,
          };
        });
      }

      const map: any = {};
      studentList.forEach((s) => {
        if (existingScores[s.id]) {
          map[s.id] = existingScores[s.id];
        } else {
          // Default initial empty marks
          const total = 0;
          const { grade, remarks } = calculateGradeInfo(total);
          map[s.id] = {
            classScore: 0,
            examScore: 0,
            totalScore: 0,
            grade,
            remarks,
            status: 'Draft',
          };
        }
      });

      setResultsMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId: string, field: 'classScore' | 'examScore', val: number) => {
    const current = resultsMap[studentId] || { classScore: 0, examScore: 0 };
    const classScore = field === 'classScore' ? Math.min(40, Math.max(0, val)) : current.classScore;
    const examScore = field === 'examScore' ? Math.min(60, Math.max(0, val)) : current.examScore;
    const totalScore = classScore + examScore;
    const { grade, remarks } = calculateGradeInfo(totalScore);

    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        classScore,
        examScore,
        totalScore,
        grade,
        remarks: prev[studentId]?.remarks ? prev[studentId].remarks : remarks,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleSaveBatch = async (newStatus = 'Draft') => {
    try {
      setSaving(true);
      const targetClass = classes.find((c) => c.id === selectedClassId);
      const targetSubject = subjects.find((s) => s.id === selectedSubjectId);

      const payload = students.map((s) => {
        const item = resultsMap[s.id] || { classScore: 0, examScore: 0, totalScore: 0, grade: '9', remarks: '' };
        return {
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          admissionNumber: s.admissionNumber,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          subjectName: targetSubject?.name || 'Subject',
          termId: selectedTermId,
          classScore: item.classScore,
          examScore: item.examScore,
          remarks: item.remarks,
          status: newStatus,
        };
      });

      await api.saveBatchResults(payload, userRole);
      setSuccessMsg(`Marks successfully saved as ${newStatus}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStudentsAndScores();
    } catch (err) {
      console.error('Error saving batch scores:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveBatch = async () => {
    try {
      setSaving(true);
      const resultIds = Object.values(resultsMap)
        .map((r) => r.id)
        .filter(Boolean) as string[];

      if (resultIds.length === 0) {
        // First save then approve
        await handleSaveBatch('Approved');
        return;
      }

      await api.approveResults(resultIds, 'Mr. Emmanuel Mensah (Headteacher)');
      setSuccessMsg('Assessment batch has been officially Approved and Locked!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStudentsAndScores();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h1 className="text-lg font-bold text-slate-900">Examinations & Continuous Assessment Entry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record continuous assessment (40%) and terminal exams (60%) with automated grading, position calculation, and approval workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveBatch('Draft')}
            disabled={saving || students.length === 0}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSaveBatch('Submitted')}
            disabled={saving || students.length === 0}
            className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>

          {isReviewer && (
            <button
              onClick={handleApproveBatch}
              disabled={saving || students.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isAcademicCoordinator ? 'Review & Approve' : 'Final Approval & Lock'}</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Selectors Bar */}
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
            Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
            Academic Term
          </label>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
          >
            <option value="term-1-ay-2026-2027">Term 1 (2026/2027) - Current</option>
            <option value="term-2-ay-2026-2027">Term 2 (2026/2027)</option>
            <option value="term-3-ay-2026-2027">Term 3 (2026/2027)</option>
          </select>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-xs flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-amber-800">Weights Formula</span>
          <span className="font-extrabold text-amber-950 mt-0.5">
            Continuous (40%) + Exam (60%) = 100%
          </span>
        </div>
      </div>

      {/* Marks Entry Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            {currentClass?.name} • {currentSubject?.name} Marks Sheet ({students.length} Pupils)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Passing Mark: 50%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Pupil Name</th>
                <th className="py-3 px-4 text-center">Class Score (Max 40)</th>
                <th className="py-3 px-4 text-center">Exam Score (Max 60)</th>
                <th className="py-3 px-4 text-center">Total (100)</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading student marks sheet...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No active students enrolled in {currentClass?.name}.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const state = resultsMap[student.id] || {
                    classScore: 0,
                    examScore: 0,
                    totalScore: 0,
                    grade: '9',
                    remarks: '',
                    status: 'Draft',
                  };
                  const isLocked = state.status === 'Approved' || state.status === 'Locked';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {student.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          disabled={isLocked && !isReviewer}
                          value={state.classScore}
                          onChange={(e) => handleScoreChange(student.id, 'classScore', Number(e.target.value))}
                          className="w-16 p-1.5 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          disabled={isLocked && !isReviewer}
                          value={state.examScore}
                          onChange={(e) => handleScoreChange(student.id, 'examScore', Number(e.target.value))}
                          className="w-16 p-1.5 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-black text-blue-700 text-sm">
                        {state.totalScore}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-black ${
                            Number(state.grade) <= 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : Number(state.grade) <= 6
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Grade {state.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={isLocked && !isReviewer}
                          value={state.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            state.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : state.status === 'Submitted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {state.status === 'Approved' && <Lock className="w-2.5 h-2.5" />}
                          <span>{state.status}</span>
                        </span>
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
