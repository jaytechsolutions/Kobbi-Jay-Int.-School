import React, { useState } from 'react';
import { FolderOpen, FileText, Download, Search, PlusCircle, MoreVertical, FileCode, FilePieChart, Globe } from 'lucide-react';

interface DocumentsModuleProps {
  userRole?: string;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({ userRole }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents] = useState([
    { id: '1', name: 'School Prospectus 2026.pdf', category: 'General', size: '2.4 MB', updated: '2026-08-20' },
    { id: '2', name: 'Academic Calendar Term 1.pdf', category: 'Academic', size: '1.2 MB', updated: '2026-09-01' },
    { id: '3', name: 'Staff Code of Conduct.pdf', category: 'Human Resources', size: '3.1 MB', updated: '2026-01-15' },
    { id: '4', name: 'Student Handbook.pdf', category: 'Rules', size: '4.5 MB', updated: '2026-08-10' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">School Documents</h1>
          <p className="text-sm text-slate-500 font-medium">Digital repository for policies, curriculum, and administrative forms</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-900 mb-4">Upload New Document</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer group">
                <FolderOpen className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Drag and drop file here or click to browse</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX (Max 10MB)</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Document Category</label>
                <select className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option>Academic</option>
                  <option>Financial</option>
                  <option>HR & Staff</option>
                  <option>General</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  Confirm Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
            <div className="space-y-1">
              {[
                { name: 'All Files', icon: FolderOpen, count: 24, active: true },
                { name: 'Academic', icon: FileText, count: 12 },
                { name: 'Financial', icon: FilePieChart, count: 5 },
                { name: 'HR & Staff', icon: Globe, count: 4 },
                { name: 'Others', icon: FileCode, count: 3 },
              ].map((cat) => (
                <button
                  key={cat.name}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    cat.active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name or keyword..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Document Name</th>
                    <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Category</th>
                    <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Size</th>
                    <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Last Updated</th>
                    <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-slate-600">{doc.category}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-500 font-medium">{doc.size}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-500 font-medium">{doc.updated}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-blue-600">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
