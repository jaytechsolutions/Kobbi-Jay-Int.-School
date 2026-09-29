import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Plus,
  Trash2,
  Send,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { Announcement, UserRole } from '../types';

interface AnnouncementsModuleProps {
  userRole: UserRole;
}

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({ userRole }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTarget, setNewTarget] = useState<string[]>(['All']);
  const [isUrgent, setIsUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canCreate = !['Student', 'Parent/Guardian', 'Teacher'].includes(userRole);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements();
      if (res.announcements) setAnnouncements(res.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setSaving(true);
      const res = await api.createAnnouncement({
        title: newTitle,
        content: newContent,
        targetRoles: newTarget,
        isUrgent,
        authorName: 'Mr. Emmanuel Mensah',
        authorRole: userRole,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'Announcement broadcasted successfully!' });
        setShowAddModal(false);
        setNewTitle('');
        setNewContent('');
        setNewTarget(['All']);
        setIsUrgent(false);
        loadAnnouncements();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to post announcement.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const roles = ['All', 'Teacher', 'Parent/Guardian', 'Student', 'Academic Coordinator', 'Accountant', 'Librarian'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">School Announcements</h1>
          <p className="text-xs text-slate-500 mt-1">Official notices and broadcasts for the Kobbi Jay community.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No active announcements.</div>
        ) : (
          announcements.map((anc) => (
            <div key={anc.id} className={`bg-white p-6 rounded-2xl border ${anc.isUrgent ? 'border-rose-200 shadow-rose-50' : 'border-slate-200'} shadow-2xs relative`}>
              <div className="flex items-center gap-2 mb-3">
                {anc.isUrgent && (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">Urgent</span>
                )}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                  Target: {(anc.targetRoles || []).join(', ')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-auto flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(anc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{anc.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{anc.content}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500">Posted by {anc.authorName} ({anc.authorRole})</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">New School Announcement</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Mid-Term Break Notice"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content / Message *</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Type your official broadcast message here..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    multiple
                    value={newTarget}
                    onChange={(e) => setNewTarget(Array.from(e.target.selectedOptions, (o) => o.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl h-24"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl to select multiple.</p>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-rose-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Mark as Urgent Priority</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Plus className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Broadcast Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
