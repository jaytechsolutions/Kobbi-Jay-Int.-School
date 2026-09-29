import React, { useState } from 'react';
import { BookMarked, Calendar, CheckCircle2, Clock, PlusCircle, Search } from 'lucide-react';

export const AssignmentsModule: React.FC = () => {
  const [assignments] = useState([
    { id: '1', title: 'Algebra Practice Set 1', subject: 'Mathematics', class: 'Basic 6', dueDate: '2026-09-30', status: 'Published', submissions: '24/30' },
    { id: '2', title: 'The Industrial Revolution Essay', subject: 'Social Studies', class: 'JHS 1', dueDate: '2026-10-05', status: 'Draft', submissions: '0/25' },
    { id: '3', title: 'Plant Cell Diagram', subject: 'Science', class: 'Basic 5', dueDate: '2026-09-28', status: 'Published', submissions: '18/28' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Assignments</h1>
          <p className="text-sm text-slate-500 font-medium">Track homework, projects, and classroom tasks</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95">
          <PlusCircle className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments or subjects..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <select className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden">
          <option>All Classes</option>
          <option>Basic 1</option>
          <option>Basic 2</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookMarked className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  assignment.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {assignment.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{assignment.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                  <span>{assignment.subject}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{assignment.class}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Due: {assignment.dueDate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{assignment.submissions} Submissions</span>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all border-t border-slate-100">
              Manage Submissions
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
