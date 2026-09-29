import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  PlusCircle,
  Mail,
  Phone,
  BookOpen,
  Award,
  Calendar,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';
import type { Teacher, Staff } from '../types';

interface StaffManagementProps {
  userRole?: string;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ userRole }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newStaff, setNewStaff] = useState({
    fullName: '',
    role: 'Teacher',
    gender: 'Male' as const,
    department: 'Academics',
    phone: '+233 24 000 0000',
    email: '',
    address: 'Accra, Ghana',
    qualification: 'B.Ed Mathematics',
    specialization: 'Mathematics & Science',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const [tchRes, stfRes] = await Promise.all([
        api.getTeachers(),
        api.getStaff(),
      ]);
      if (tchRes.teachers) setTeachers(tchRes.teachers);
      if (stfRes.staff) setStaff(stfRes.staff);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newStaff.role === 'Teacher') {
        await api.createTeacher({
          fullName: newStaff.fullName,
          gender: newStaff.gender,
          phone: newStaff.phone,
          email: newStaff.email,
          address: newStaff.address,
          position: 'Teacher',
          department: 'Academics',
          qualification: newStaff.qualification,
          specialization: newStaff.specialization,
          assignedClassIds: ['class-basic-5'],
          assignedSubjectIds: ['subj-math'],
          employmentDate: new Date().toISOString().split('T')[0],
          employmentStatus: 'Full-time',
          dateOfBirth: '1988-05-12',
        });
      } else {
        await api.createStaff({
          fullName: newStaff.fullName,
          gender: newStaff.gender,
          phone: newStaff.phone,
          email: newStaff.email,
          address: newStaff.address,
          position: newStaff.role as any,
          department: newStaff.department,
          qualification: newStaff.qualification,
          employmentDate: new Date().toISOString().split('T')[0],
          employmentStatus: 'Full-time',
          dateOfBirth: '1990-01-01',
        });
      }
      setShowAddModal(false);
      loadStaff();
    } catch (err) {
      console.error(err);
    }
  };

  // Combine for unified faculty display
  const allFaculty = [
    ...teachers.map((t) => ({
      id: t.id,
      name: t.fullName,
      role: 'Class / Subject Teacher',
      department: t.department || 'Academics',
      phone: t.phone,
      email: t.email,
      qualification: t.qualification,
      details: `Specialization: ${t.specialization || 'General Basic'} • Classes: ${t.assignedClassIds?.length || 1} Assigned`,
      status: t.employmentStatus,
    })),
    ...staff.map((s) => ({
      id: s.id,
      name: s.fullName,
      role: s.position,
      department: s.department,
      phone: s.phone,
      email: s.email,
      qualification: s.qualification,
      details: `Department: ${s.department}`,
      status: s.employmentStatus,
    })),
  ];

  const filtered = allFaculty.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole ? s.role.toLowerCase().includes(selectedRole.toLowerCase()) : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">Faculty & Staff Register</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage certified teachers, administrative executives, subject leads, bursars, and school support team.
          </p>
        </div>

        {isSchoolAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, role or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="">All Departments & Roles</option>
          <option value="Teacher">Teaching Faculty</option>
          <option value="Administrator">School Administration</option>
          <option value="Accountant">Accountant / Bursar</option>
          <option value="Librarian">Librarian</option>
          <option value="Support">Support Staff</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{item.name}</h3>
                  <span className="text-[11px] font-bold text-indigo-700 block mt-0.5">{item.role}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {item.details}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">{item.qualification}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px]">
                <Phone className="w-3 h-3 text-slate-400" />
                {item.phone}
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Mail className="w-3 h-3 text-slate-400" />
                {item.email}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">Add Faculty / Staff Member</h2>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Kwame Asante"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newStaff.gender}
                    onChange={(e) => setNewStaff({ ...newStaff, gender: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role / Position</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Accountant">Accountant / Bursar</option>
                    <option value="Librarian">Librarian</option>
                    <option value="Support staff">Support staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  placeholder="e.g. B.Ed Mathematics, M.Phil..."
                  value={newStaff.qualification}
                  onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
