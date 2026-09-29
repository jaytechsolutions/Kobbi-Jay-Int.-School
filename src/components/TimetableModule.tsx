import React, { useState } from 'react';
import { Clock, Calendar, Users, BookOpen, Download, PlusCircle } from 'lucide-react';

export const TimetableModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'class' | 'teacher'>('class');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timetable Schedules</h1>
          <p className="text-sm text-slate-500 font-medium">Coordinate class timings, subject distribution, and teacher assignments</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95">
            <PlusCircle className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('class')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Class View
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Teacher View
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 border-b border-slate-200 text-left w-24">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  TIME
                </div>
              </th>
              {days.map(day => (
                <th key={day} className="p-4 border-b border-slate-200 text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {day}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time, idx) => (
              <tr key={time} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 border-b border-slate-100 text-sm font-bold text-slate-500 bg-slate-50/30">
                  {time}
                </td>
                {days.map(day => (
                  <td key={`${day}-${time}`} className="p-2 border-b border-slate-100 min-h-[80px]">
                    {idx % 3 === 0 ? (
                      <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 space-y-1">
                        <div className="text-[10px] font-black text-blue-600 uppercase">Mathematics</div>
                        <div className="text-xs font-bold text-slate-800">Basic 4 Alpha</div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                          <Users className="w-2.5 h-2.5" />
                          Mr. Asante
                        </div>
                      </div>
                    ) : idx % 3 === 1 ? (
                      <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-1">
                        <div className="text-[10px] font-black text-emerald-600 uppercase">English Language</div>
                        <div className="text-xs font-bold text-slate-800">Basic 4 Alpha</div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                          <Users className="w-2.5 h-2.5" />
                          Mrs. Osei
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/20 flex items-center justify-center min-h-[60px]">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Break / Free</span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
