import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  PlusCircle,
  Users,
  Clock,
  Search,
  Filter,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';
import type { SchoolClass, Subject, Teacher } from '../types';

interface ClassesAndSubjectsProps {
  userRole?: string;
}

export const ClassesAndSubjects: React.FC<ClassesAndSubjectsProps> = ({ userRole }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);

  // New Class Form
  const [classForm, setClassForm] = useState({
    name: '',
    levelCategory: 'Primary' as const,
    capacity: 35,
    classTeacherId: '',
    classTeacherName: '',
    classroom: 'Block C, Room 2',
    subjectIds: [] as string[],
  });

  // New Subject Form
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    category: 'Core' as const,
    description: 'Core basic school syllabus',
    passMark: 50,
    applicableLevels: ['Primary', 'Junior High'],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clsRes, subRes, tchRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTeachers(),
      ]);
      if (clsRes.classes) setClasses(clsRes.classes);
      if (subRes.subjects) setSubjects(subRes.subjects);
      if (tchRes.teachers) setTeachers(tchRes.teachers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teacher = teachers.find((t) => t.id === classForm.classTeacherId);
      await api.createClass({
        ...classForm,
        classTeacherName: teacher ? teacher.fullName : 'Unassigned',
      });
      setShowAddClass(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject(subjectForm);
      setShowAddSubject(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">Academic Structure: Classes & Curriculum</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Basic School streams (Creche, Nursery, KG, Basic 1-6, JHS 1-3), assign class teachers, and manage subject syllabi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddClass(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Class Stream</span>
          </button>
          <button
            onClick={() => setShowAddSubject(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 transition-colors ${
            activeTab === 'classes'
              ? 'border-b-2 border-indigo-600 text-indigo-700'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Classes & Streams ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 transition-colors ${
            activeTab === 'subjects'
              ? 'border-b-2 border-indigo-600 text-indigo-700'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Subject Curriculum ({subjects.length})
        </button>
      </div>

      {/* TAB 1: CLASSES */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const enrolled = cls.studentCount || 0;
            return (
              <div
                key={cls.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{cls.name}</h3>
                    <span className="text-[11px] text-slate-500">{cls.classroom}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cls.levelCategory === 'Junior High'
                        ? 'bg-purple-100 text-purple-800'
                        : cls.levelCategory === 'Primary'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {cls.levelCategory}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Class Teacher:</span>
                    <strong className="text-slate-900">{cls.classTeacherName || 'Unassigned'}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Enrollment Status:</span>
                    <strong className="text-indigo-600">
                      {enrolled} / {cls.capacity} Pupils
                    </strong>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (enrolled / cls.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Core Curriculum Subjects ({cls.subjectIds?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(cls.subjectIds || []).map((sId, idx) => {
                      const subjectObj = subjects.find((sub) => sub.id === sId);
                      return (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-[10px] font-medium border border-slate-200"
                        >
                          {subjectObj ? subjectObj.name : sId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pass Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{sub.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{sub.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {sub.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-bold">{sub.passMark}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">Add New Class Stream</h2>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic 4 (B), Nursery 2 (A)..."
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={classForm.levelCategory}
                    onChange={(e) => setClassForm({ ...classForm, levelCategory: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Early Childhood">Early Childhood</option>
                    <option value="Primary">Primary</option>
                    <option value="Junior High">Junior High</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Teacher</label>
                <select
                  value={classForm.classTeacherId}
                  onChange={(e) => setClassForm({ ...classForm, classTeacherId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="">Select assigned teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Classroom Location</label>
                <input
                  type="text"
                  value={classForm.classroom}
                  onChange={(e) => setClassForm({ ...classForm, classroom: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">Add Curriculum Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. French, Ghanaian Language (Twi/Ga)..."
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FRN, GHL"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Activity">Activity</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
