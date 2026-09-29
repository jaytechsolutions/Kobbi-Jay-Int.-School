import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  Sparkles,
  Calendar,
  CheckCircle,
  GraduationCap,
  Award,
  User,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { api } from '../services/api';
import type { Student, SchoolClass, ReportCard } from '../types';

interface ReportCardModuleProps {
  userRole?: string;
  initialStudentId?: string;
}

export const ReportCardModule: React.FC<ReportCardModuleProps> = ({ userRole, initialStudentId }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStudentsAndClasses();
  }, []);

  const loadStudentsAndClasses = async () => {
    try {
      const [studRes, clsRes] = await Promise.all([
        api.getStudents({ status: 'Active' }),
        api.getClasses(),
      ]);
      if (studRes.students && studRes.students.length > 0) {
        setStudents(studRes.students);
        if (!selectedStudentId) {
          setSelectedStudentId(studRes.students[0].id);
        }
      }
      if (clsRes.classes) setClasses(clsRes.classes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchReportCard(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchReportCard = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await api.getReportCards({ studentId });
      if (res.reportCards && res.reportCards.length > 0) {
        setReportCard(res.reportCards[0]);
      } else {
        // Auto generate if none
        handleGenerate(studentId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (studentId = selectedStudentId) => {
    if (!studentId) return;
    try {
      setGenerating(true);
      const res = await api.generateReportCard(studentId);
      if (res.success) {
        setReportCard(res.reportCard);
      }
    } catch (err) {
      console.error('Error generating report card:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-700" />
            <h1 className="text-lg font-bold text-slate-900">Terminal Academic Report Cards</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official terminal assessment dossier with continuous scores, teacher remarks, position in class, and headteacher endorsement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="px-3.5 py-2 text-xs font-bold text-cyan-900 bg-cyan-100 hover:bg-cyan-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-cyan-700" />
            <span>{generating ? 'Re-Calculating...' : 'Recalculate Grades'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Student Selector Bar (hidden during print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
            Select Pupil / Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.admissionNumber} - {s.currentClassName})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex-1">
            <span>Class: <strong className="text-slate-900">{selectedStudent.currentClassName}</strong></span>
            <span>Gender: <strong className="text-slate-900">{selectedStudent.gender}</strong></span>
            <span>DOB: <strong className="text-slate-900">{selectedStudent.dateOfBirth}</strong></span>
            <span>Blood Group: <strong className="text-rose-600">{selectedStudent.bloodGroup}</strong></span>
          </div>
        )}
      </div>

      {/* PRINTABLE OFFICIAL REPORT CARD DOCUMENT */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-xl border">
          Generating digital report card...
        </div>
      ) : reportCard ? (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* School Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <SchoolLogo size="lg" />
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-serif">
                  Kobbi Jay International School
                </h2>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  Basic School (Creche • Nursery • Kindergarten • Primary • JHS)
                </p>
                <p className="text-[11px] text-slate-600">
                  P.O. Box KD 104, Accra - Ghana • Tel: +233 (0) 24 412 3456 • Email: info@kobbijay.edu.gh
                </p>
              </div>
            </div>

            <div className="inline-block px-6 py-1 bg-slate-950 text-white font-extrabold uppercase tracking-wider text-xs rounded-full mt-2">
              Official Terminal Academic Performance Report
            </div>
          </div>

          {/* Student & Term Identification Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pupil's Full Name</span>
              <strong className="text-slate-950 text-sm">{reportCard.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission No.</span>
              <strong className="text-blue-800 font-mono text-sm">{reportCard.admissionNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class / Grade</span>
              <strong className="text-slate-950 text-sm">{reportCard.className}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Session</span>
              <strong className="text-slate-950 text-sm">{reportCard.academicYearName} • {reportCard.termName}</strong>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Term Attendance</span>
              <strong className="text-emerald-800">
                {reportCard.attendanceDaysPresent} days out of {reportCard.attendanceDaysTotal}
              </strong>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
              <strong className="text-slate-950">{reportCard.overallTotal} / {reportCard.subjectResults.length * 100}</strong>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Terminal Average</span>
              <strong className="text-blue-700 text-sm">{reportCard.overallAverage}%</strong>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class Standing</span>
              <strong className="text-amber-800 text-sm">{reportCard.positionInClass}</strong>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3 text-center">Class Score (40%)</th>
                  <th className="py-2.5 px-3 text-center">Exam Score (60%)</th>
                  <th className="py-2.5 px-3 text-center">Total (100%)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3">Subject Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportCard.subjectResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No assessment results recorded for this term yet.
                    </td>
                  </tr>
                ) : (
                  reportCard.subjectResults.map((subj, sIdx) => (
                    <tr key={sIdx} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{subj.subjectName}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">{subj.classScore}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">{subj.examScore}</td>
                      <td className="py-2.5 px-3 text-center font-black text-blue-900 text-sm">{subj.totalScore}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-extrabold text-amber-900 px-2 py-0.5 bg-amber-100 rounded text-[11px]">
                          Grade {subj.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{subj.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Qualitative Evaluation & Signatures */}
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Conduct & Deportment
              </span>
              <p className="text-slate-800 font-medium italic">
                "{reportCard.conductRemarks}"
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Class Teacher's Appraisal & Recommendation
              </span>
              <p className="text-slate-800 font-medium italic">
                "{reportCard.teacherRemarks}"
              </p>
              <div className="mt-2 text-right text-[11px] font-bold text-slate-600">
                Class Teacher: {reportCard.teacherName}
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-900 block mb-1">
                Headteacher's Final Endorsement & Assessment
              </span>
              <p className="text-slate-900 font-medium italic">
                "{reportCard.headteacherRemarks}"
              </p>
              <div className="mt-4 flex items-end justify-between text-[11px]">
                <div>
                  <span className="block text-slate-500">Next Term Commences:</span>
                  <strong className="text-slate-900 text-xs">{reportCard.nextTermBegins}</strong>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 pb-1 mb-1 font-serif italic text-slate-900">
                    Emmanuel Mensah
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    Headteacher's Signature & Stamp
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Motto */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>Kobbi Jay International School • SDMS Official Certified Transcript</span>
            <span>Date Issued: {reportCard.issuedDate}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
