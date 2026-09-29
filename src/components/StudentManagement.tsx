import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  Eye,
  Edit,
  ArrowRightCircle,
  Download,
  Phone,
  Mail,
  HeartPulse,
  Calendar,
  Building,
  UserCheck,
  X,
  Printer,
  CheckCircle,
  FileText,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import type { Student, SchoolClass, Parent } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentManagementProps {
  userRole: string;
  onOpenReceipt?: (receiptNumber: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  userRole,
  onOpenReceipt,
}) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteTargetClassId, setPromoteTargetClassId] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '2016-05-15',
    placeOfBirth: 'Accra',
    nationality: 'Ghanaian',
    religion: 'Christian',
    currentClassId: 'class-basic-1',
    currentClassName: 'Basic 1',
    bloodGroup: 'O+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    studentPhone: '',
    address: '',
    notes: '',
    status: 'Active',
    photoUrl: '',
    nhisNumber: '',
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [searchQuery, selectedClassId, selectedStatus, selectedGender]);

  const loadClasses = async () => {
    try {
      const res = await api.getClasses();
      if (res.classes) setClasses(res.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        search: searchQuery || undefined,
        classId: selectedClassId || undefined,
        status: selectedStatus || undefined,
        gender: selectedGender || undefined,
      });
      if (res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const details = await api.getStudent(student.id);
      setStudentDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({ ...student });
    setShowEditModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const targetClass = classes.find((c) => c.id === formData.currentClassId);
      const payload = {
        ...formData,
        currentClassName: targetClass ? targetClass.name : formData.currentClassName,
      };

      if (showEditModal && selectedStudent) {
        await api.updateStudent(selectedStudent.id, payload);
      } else {
        await api.createStudent(payload);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      loadStudents();
    } catch (err) {
      console.error('Error saving student:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePromoteStudent = async () => {
    if (!selectedStudent || !promoteTargetClassId) return;
    const targetClass = classes.find((c) => c.id === promoteTargetClassId);
    if (!targetClass) return;

    try {
      await api.promoteStudent(selectedStudent.id, targetClass.id, targetClass.name);
      setShowPromoteModal(false);
      loadStudents();
      if (selectedStudent) {
        handleViewStudent({
          ...selectedStudent,
          currentClassId: targetClass.id,
          currentClassName: targetClass.name,
        });
      }
    } catch (err) {
      console.error('Error promoting student:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Admission No', 'Full Name', 'Gender', 'Class', 'Date of Birth', 'Status', 'Emergency Phone'];
    const rows = students.map((s) => [
      s.admissionNumber,
      `"${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}"`,
      s.gender,
      s.currentClassName,
      s.dateOfBirth,
      s.status,
      s.emergencyContactPhone || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KJIS_Students_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Admission No", "Full Name", "Gender", "Class", "DOB", "Status"];
    const tableRows = students.map(s => [
      s.admissionNumber,
      `${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}`,
      s.gender,
      s.currentClassName,
      s.dateOfBirth,
      s.status
    ]);

    doc.setFontSize(18);
    doc.text("Kobbi Jay Institutional Software", 14, 20);
    doc.setFontSize(12);
    doc.text("Official Student Register", 14, 30);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] }, // Dark blue
    });

    doc.save(`KJIS_Students_Register_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">Student Information Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized register of all enrolled pupils from Creche to JHS 3 with biometric and academic tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-2xs rounded-md transition-all"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-2xs rounded-md transition-all border-l border-slate-200"
              title="Export to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>PDF</span>
            </button>
          </div>
          {isSchoolAdmin && (
            <button
              onClick={() => {
                setFormData({
                  firstName: '',
                  middleName: '',
                  lastName: '',
                  gender: 'Male',
                  dateOfBirth: '2016-05-15',
                  placeOfBirth: 'Accra',
                  nationality: 'Ghanaian',
                  religion: 'Christian',
                  currentClassId: classes[0]?.id || 'class-basic-1',
                  currentClassName: classes[0]?.name || 'Basic 1',
                  bloodGroup: 'O+',
                  medicalInfo: 'None reported',
                  emergencyContactName: '',
                  emergencyContactPhone: '',
                  address: '',
                  notes: '',
                  status: 'Active',
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, admission no (e.g. KJIS-2026-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
          >
            <option value="">All 14 Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.levelCategory})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
          >
            <option value="">All Genders</option>
            <option value="Male">Boys / Male</option>
            <option value="Female">Girls / Female</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Graduated">Graduated</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            Enrolled Students Register ({students.length} found)
          </div>
          <span className="text-[11px] text-slate-500">
            Academic Session 2026/2027
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Current Class</th>
                <th className="py-3 px-4">Date of Birth / Age</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No student records matched your search filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const birthYear = new Date(student.dateOfBirth).getFullYear();
                  const age = new Date().getFullYear() - birthYear;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {student.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <span>
                              {student.firstName} {student.middleName ? student.middleName + ' ' : ''}
                              {student.lastName}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Emergency: {student.emergencyContactPhone || 'Not set'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.gender === 'Male'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {student.currentClassName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {student.dateOfBirth} ({age} yrs)
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : student.status === 'Suspended'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewStudent(student)}
                            title="View Full Profile"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isSchoolAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(student)}
                                title="Edit Details"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setPromoteTargetClassId(classes[0]?.id || '');
                                  setShowPromoteModal(true);
                                }}
                                title="Promote Class"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <ArrowRightCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT PROFILE DRAWER / MODAL */}
      {selectedStudent && studentDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white min-h-screen shadow-2xl p-6 sm:p-8 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-700 text-amber-300 font-black text-lg flex items-center justify-center shadow-md">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {selectedStudent.firstName} {selectedStudent.middleName ? selectedStudent.middleName + ' ' : ''}
                      {selectedStudent.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold text-blue-700">
                        {selectedStudent.admissionNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-600">
                        {selectedStudent.currentClassName}
                      </span>
                      <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        {selectedStudent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bio Details Grid */}
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Biological & Personal Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gender</span>
                      <strong className="text-slate-800">{selectedStudent.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                      <strong className="text-slate-800">{selectedStudent.dateOfBirth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nationality</span>
                      <strong className="text-slate-800">{selectedStudent.nationality}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Blood Group</span>
                      <strong className="text-rose-600">{selectedStudent.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Place of Birth</span>
                      <strong className="text-slate-800">{selectedStudent.placeOfBirth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Admission Date</span>
                      <strong className="text-slate-800">{selectedStudent.admissionDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Medical & Health Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    <span>Medical Conditions & Allergies</span>
                  </h3>
                  <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-xs text-rose-900">
                    {selectedStudent.medicalInfo || 'No known allergies or chronic conditions reported.'}
                  </div>
                </div>

                {/* Linked Parents */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Parent / Legal Guardian
                  </h3>
                  {studentDetails.parents && studentDetails.parents.length > 0 ? (
                    studentDetails.parents.map((p: Parent) => (
                      <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm font-bold text-slate-900">{p.fullName}</strong>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                            {p.relationship}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Occupation: {p.occupation || 'Self-Employed'} • Address: {p.address}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                      Emergency Contact: {selectedStudent.emergencyContactName} ({selectedStudent.emergencyContactPhone})
                    </div>
                  )}
                </div>

                {/* Recent Academic Scores Summary */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Current Term Assessment Marks
                  </h3>
                  {studentDetails.results && studentDetails.results.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="py-2 px-3 text-left">Subject</th>
                            <th className="py-2 px-3 text-center">Class (40%)</th>
                            <th className="py-2 px-3 text-center">Exam (60%)</th>
                            <th className="py-2 px-3 text-center">Total (100%)</th>
                            <th className="py-2 px-3 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentDetails.results.map((r: any) => (
                            <tr key={r.id}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{r.subjectName}</td>
                              <td className="py-2 px-3 text-center">{r.classScore}</td>
                              <td className="py-2 px-3 text-center">{r.examScore}</td>
                              <td className="py-2 px-3 text-center font-bold text-blue-700">{r.totalScore}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="font-bold text-amber-700 px-1.5 py-0.5 bg-amber-50 rounded">
                                  {r.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No examination marks registered for this term yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Student Card</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedStudent);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-lg"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-8">
              <h2 className="text-base font-bold text-slate-900">
                {showEditModal ? 'Edit Student Details' : 'Register New Student'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <form onSubmit={handleSaveStudent} className="space-y-6 text-xs pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName || ''}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
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
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Class *</label>
                  <select
                    value={formData.currentClassId || ''}
                    onChange={(e) => setFormData({ ...formData, currentClassId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup || 'O+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NHIS Number</label>
                  <input
                    type="text"
                    value={formData.nhisNumber || ''}
                    onChange={(e) => setFormData({ ...formData, nhisNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="National Health Insurance No."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold text-slate-700">Student Passport Photo (35mm x 45mm)</label>
                <div className="flex items-center gap-6">
                  <div 
                    className="relative bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner group"
                    style={{ width: '132px', height: '170px' }}
                  >
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400">No Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white rounded-full text-slate-700 hover:bg-slate-100 shadow-lg"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] border border-slate-300 flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4 rotate-180" />
                        Upload Student Photo
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        Recommended size: 35mm width x 45mm height.<br/>
                        Allowed formats: JPG, PNG, WEBP (Max 2MB).
                      </p>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-400 mb-1 text-[10px] uppercase">Or enter Photo URL</label>
                      <input
                        type="text"
                        placeholder="https://example.com/photo.jpg"
                        value={formData.photoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Parent / Guardian Information
                </h3>
                <div className="space-y-6">
                  {/* Father's Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-600 mb-3 uppercase">Father's Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.fatherName || ''}
                          onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={formData.fatherPhone || ''}
                          onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={formData.fatherOccupation || ''}
                          onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mother's Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-600 mb-3 uppercase">Mother's Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.motherName || ''}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={formData.motherPhone || ''}
                          onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={formData.motherOccupation || ''}
                          onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Residential Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Phone Number (If any)</label>
                    <input
                      type="text"
                      value={formData.studentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="Student's personal contact"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{showEditModal ? 'Update Record' : 'Complete Registration'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROMOTION MODAL */}
      {showPromoteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Academic Promotion</h2>
            <p className="text-slate-500 mb-4">
              Promote <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> from{' '}
              <strong>{selectedStudent.currentClassName}</strong> to the next class tier.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Class *</label>
                <select
                  value={promoteTargetClassId}
                  onChange={(e) => setPromoteTargetClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.levelCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Audit Trail Retention</span>
                </div>
                <span>Previous academic scores and attendance will be safely preserved in student history.</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteStudent}
                className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
