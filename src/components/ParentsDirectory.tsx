import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Link as LinkIcon,
  ChevronRight,
  GraduationCap,
  X,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { Parent, Student } from '../types';

interface ParentsDirectoryProps {
  userRole?: string;
  onNavigateToStudent: (studentId: string) => void;
}

export const ParentsDirectory: React.FC<ParentsDirectoryProps> = ({ userRole, onNavigateToStudent }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Linking Ward state
  const [selectedParentForLink, setSelectedParentForLink] = useState<Parent | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [linking, setLinking] = useState(false);
  
  // Add New Parent state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParent, setNewParent] = useState<{
    fullName: string;
    relationship: 'Father' | 'Mother' | 'Guardian' | 'Uncle' | 'Auntie' | 'Other';
    phone: string;
    email: string;
    address: string;
    occupation: string;
    fatherName: string;
    motherName: string;
    fatherPhone: string;
    motherPhone: string;
    fatherOccupation: string;
    motherOccupation: string;
  }>({
    fullName: '',
    relationship: 'Guardian',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    fatherOccupation: '',
    motherOccupation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        api.getParents(),
        api.getStudents(),
      ]);
      if (pRes.parents) setParents(pRes.parents);
      if (sRes.students) setStudents(sRes.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Derive full name and phone for the main parent record if not explicitly set
      const derivedData = { ...newParent };
      if (!derivedData.fullName) {
        derivedData.fullName = derivedData.fatherName || derivedData.motherName || 'Unnamed Parent';
      }
      if (!derivedData.phone) {
        derivedData.phone = derivedData.fatherPhone || derivedData.motherPhone || '';
      }
      if (!derivedData.occupation) {
        derivedData.occupation = derivedData.fatherOccupation || derivedData.motherOccupation || '';
      }

      const res = await api.createParent(derivedData);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Parent added successfully!' });
        await loadData();
        setTimeout(() => {
          setShowAddModal(false);
          setNewParent({
            fullName: '',
            relationship: 'Guardian',
            phone: '',
            email: '',
            address: '',
            occupation: '',
            fatherName: '',
            motherName: '',
            fatherPhone: '',
            motherPhone: '',
            fatherOccupation: '',
            motherOccupation: '',
          });
          setFeedback(null);
        }, 1500);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to add parent.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkWard = async (studentId: string) => {
    if (!selectedParentForLink) return;
    
    try {
      setLinking(true);
      const res = await api.linkWard(selectedParentForLink.id, studentId);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Ward linked successfully!' });
        await loadData();
        setTimeout(() => {
          setSelectedParentForLink(null);
          setFeedback(null);
        }, 1500);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to link ward.' });
    } finally {
      setLinking(false);
    }
  };

  const filteredParents = parents.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const availableStudents = students.filter(s => {
    const isAlreadyLinked = selectedParentForLink?.studentIds.includes(s.id);
    const matchesSearch = 
      s.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(studentSearchQuery.toLowerCase());
    return !isAlreadyLinked && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Parents & Guardians Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage parent information and linked wards.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Parent</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading directory...</div>
        ) : filteredParents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No parents found.</div>
        ) : (
          filteredParents.map((parent) => (
            <div key={parent.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {parent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{parent.fullName}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{parent.relationship}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{parent.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{parent.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{parent.address}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Wards</span>
                  <button 
                    onClick={() => setSelectedParentForLink(parent)}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" /> Link Another Ward
                  </button>
                </div>
                <div className="space-y-2">
                  {parent.studentIds.map(sid => {
                    const student = students.find(s => s.id === sid);
                    if (!student) return null;
                    return (
                      <button 
                        key={sid}
                        onClick={() => onNavigateToStudent(sid)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{student.firstName} {student.lastName}</div>
                            <div className="text-[10px] text-slate-500">{student.currentClassName} • {student.admissionNumber}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Add New Parent / Guardian</h2>
                <p className="text-xs text-slate-500 font-medium">Create a new parent profile and contact details.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddParent} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {feedback && (
                  <div className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${
                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {feedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Father's Name</label>
                    <input
                      type="text"
                      value={newParent.fatherName}
                      onChange={(e) => setNewParent({ ...newParent, fatherName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="Father's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Mother's Name</label>
                    <input
                      type="text"
                      value={newParent.motherName}
                      onChange={(e) => setNewParent({ ...newParent, motherName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="Mother's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Father's Phone</label>
                    <input
                      type="tel"
                      value={newParent.fatherPhone}
                      onChange={(e) => setNewParent({ ...newParent, fatherPhone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="Father's contact"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Mother's Phone</label>
                    <input
                      type="tel"
                      value={newParent.motherPhone}
                      onChange={(e) => setNewParent({ ...newParent, motherPhone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="Mother's contact"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Home Address</label>
                    <textarea
                      required
                      rows={3}
                      value={newParent.address}
                      onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden resize-none"
                      placeholder="Complete residential address..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Father's Occupation</label>
                    <input
                      type="text"
                      value={newParent.fatherOccupation}
                      onChange={(e) => setNewParent({ ...newParent, fatherOccupation: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="e.g. Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Mother's Occupation</label>
                    <input
                      type="text"
                      value={newParent.motherOccupation}
                      onChange={(e) => setNewParent({ ...newParent, motherOccupation: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="e.g. Teacher"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Relationship to Student</label>
                    <select
                      value={newParent.relationship}
                      onChange={(e) => setNewParent({ ...newParent, relationship: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Auntie">Auntie</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Parent's Email Address (Official)</label>
                    <input
                      required
                      type="email"
                      value={newParent.email}
                      onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Hidden redundant field for backward compatibility if needed, using father or mother name */}
                  <input type="hidden" value={newParent.fullName} />

                </div>
              </div>

              <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                >
                  {submitting ? 'Saving Details...' : 'Save Parent Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Ward Modal */}
      {selectedParentForLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Link Student to Parent</h2>
                <p className="text-[10px] text-slate-500">Parent: {selectedParentForLink.fullName}</p>
              </div>
              <button onClick={() => setSelectedParentForLink(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {feedback && (
                <div className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or ID..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {availableStudents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No matching students found.</div>
                ) : (
                  availableStudents.map(student => (
                    <div
                      key={student.id}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-[10px] text-slate-500">{student.currentClassName} • {student.admissionNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedParentForLink(null)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleLinkWard(student.id)}
                          disabled={linking}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Link Ward</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedParentForLink(null)}
                className="px-4 py-2 text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
