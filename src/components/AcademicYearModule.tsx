import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import { api } from '../services/api';

export const AcademicYearModule: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('2027/2028 Academic Session');
  const [startDate, setStartDate] = useState('2027-09-01');
  const [endDate, setEndDate] = useState('2028-07-31');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getAcademicYears();
      if (res.academicYears) {
        setSessions(res.academicYears);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createAcademicYear(newName, startDate, endDate);
      setShowModal(false);
      loadSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.setActiveAcademicYear(id);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCurrentTerm = async (id: string) => {
    try {
      await api.setCurrentTerm(id);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Year & Terms</h1>
          <p className="text-sm text-slate-500 font-medium">Manage school sessions, term dates, and academic cycles</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Setup New Session</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold">Loading academic sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold">No academic sessions found.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-5 py-4 flex items-center justify-between border-b ${session.status === 'Active' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${session.status === 'Active' ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{session.name}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${session.status === 'Active' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {session.status}
                    </span>
                  </div>
                </div>
                {session.status !== 'Active' && (
                  <button 
                    onClick={() => handleSetActive(session.id)}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Set as Active
                  </button>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Start Date</span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {session.startDate}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">End Date</span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {session.endDate}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Academic Terms</span>
                  <div className="space-y-2">
                    {(session.terms || ['Term 1', 'Term 2', 'Term 3']).map((term: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <span className="text-sm font-bold text-slate-700">{typeof term === 'string' ? term : term.name}</span>
                        {session.status === 'Active' && (typeof term === 'string' ? idx === 0 : term.status === 'Current') ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            CURRENT
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {session.status === 'Completed' ? 'Closed' : 'Upcoming'}
                            </span>
                            {session.status === 'Active' && typeof term !== 'string' && term.status !== 'Current' && (
                              <button 
                                onClick={() => handleSetCurrentTerm(term.id)}
                                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tighter"
                              >
                                Set Current
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Setup New Academic Session</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Session Name</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2027/2028 Academic Session"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                * Three terms will be automatically created for the new session.
              </p>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Session Management Notice</h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Changing the active session or term affects all reports, attendance records, and financial statements across the entire portal. Ensure all records for the current term are finalized before initiating a term transition.
          </p>
        </div>
      </div>
    </div>
  );
};
