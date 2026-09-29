import React, { useState } from 'react';
import { Library, Book, User as UserIcon, Calendar, CheckCircle2, Search, PlusCircle, Bookmark, BarChart3, Download, Tags, Bell, Clock, Mail, AlertTriangle, Heart, QrCode, ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

interface LibraryModuleProps {
  userRole?: string;
}

const MOST_BORROWED_DATA = [
  { name: 'Core Maths', count: 45, color: '#2563eb' },
  { name: 'Gatsby', count: 38, color: '#3b82f6' },
  { name: 'Science Explorer', count: 32, color: '#60a5fa' },
  { name: 'Social Studies', count: 28, color: '#93c5fd' },
  { name: 'Things Fall Apart', count: 24, color: '#bfdbfe' },
];

export const LibraryModule: React.FC<LibraryModuleProps> = ({ userRole }) => {
  const isLibrarian = userRole === 'Librarian';
  const isReadOnly = userRole === 'Headteacher' || userRole === 'Administrator';
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState<{ type: 'success' | 'info' | 'warning', message: string } | null>(null);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showDigitalIDModal, setShowDigitalIDModal] = useState(false);
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistAuthor, setWishlistAuthor] = useState('');
  const [activeTab, setActiveTab] = useState<'loans' | 'wishlist' | 'history'>('loans');

  const [loanHistory, setLoanHistory] = useState([
    { id: 'h-1', book: 'A Tale of Two Cities', author: 'Charles Dickens', student: 'Kelvin Mensah', class: 'JHS 1', borrowedDate: '2026-08-01', returnedDate: '2026-08-15', status: 'Returned' },
    { id: 'h-2', book: 'Biology for JHS', author: 'G. Amoah', student: 'Sarah Osei', class: 'Basic 6', borrowedDate: '2026-07-20', returnedDate: '2026-08-05', status: 'Returned' },
    { id: 'h-3', book: 'Introduction to Computing', author: 'NaCCA', student: 'Joseph Boateng', class: 'Basic 5', borrowedDate: '2026-08-10', returnedDate: '2026-08-25', status: 'Returned' },
  ]);

  const [wishlist, setWishlist] = useState([
    { id: 'w-1', title: 'Advanced Physics for JHS', author: 'Dr. Kwame Boateng', requester: 'Kelvin Mensah', status: 'Pending', date: '2026-09-21' },
    { id: 'w-2', title: 'The Art of Programming', author: 'Donald Knuth', requester: 'Mr. Kwame Asante', status: 'Approved', date: '2026-09-18' }
  ]);

  const [loans, setLoans] = useState([
    { 
      id: '1', 
      book: 'The Great Gatsby', 
      author: 'F. Scott Fitzgerald',
      isbn: '978-0743273565',
      category: 'Fiction',
      student: 'Kelvin Mensah', 
      class: 'JHS 1', 
      borrowedDate: '2026-09-15', 
      dueDate: '2026-09-22', 
      status: 'Borrowed',
      isReserved: false
    },
    { 
      id: '2', 
      book: 'Core Mathematics Basic 6', 
      author: 'NaCCA Ghana',
      isbn: '978-9988123456',
      category: 'Science',
      student: 'Sarah Osei', 
      class: 'Basic 6', 
      borrowedDate: '2026-09-10', 
      dueDate: '2026-09-17', 
      status: 'Overdue',
      isReserved: true
    },
    { 
      id: '3', 
      book: 'Things Fall Apart', 
      author: 'Chinua Achebe',
      isbn: '978-0385474542',
      category: 'History',
      student: 'Joseph Boateng', 
      class: 'Basic 5', 
      borrowedDate: '2026-09-18', 
      dueDate: '2026-09-25', 
      status: 'Borrowed',
      isReserved: false
    },
  ]);

  const [reservations, setReservations] = useState([
    { id: 'res-1', bookTitle: 'Core Mathematics Basic 6', reservedBy: 'Aba Mensah', date: '2026-09-20' }
  ]);

  const handleSendReminders = () => {
    const overdueCount = loans.filter(l => l.status === 'Overdue').length;
    setShowNotification({
      type: 'success',
      message: `Automated email alerts sent to ${overdueCount} students with overdue books and 5 students with upcoming returns.`
    });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleMarkReturned = (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (loan && loan.isReserved) {
      const reservation = reservations.find(r => r.bookTitle === loan.book);
      setShowNotification({
        type: 'info',
        message: `Book "${loan.book}" returned. Notification sent to ${reservation?.reservedBy || 'reserved user'}!`
      });
    } else {
      setShowNotification({
        type: 'success',
        message: `Book "${loan?.book}" marked as returned.`
      });
    }
    setLoans(prev => prev.filter(l => l.id !== id));
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleReserve = (bookTitle: string) => {
    const newRes = { id: `res-${Date.now()}`, bookTitle, reservedBy: 'Current User', date: new Date().toISOString().split('T')[0] };
    setReservations(prev => [...prev, newRes]);
    setLoans(prev => prev.map(l => l.book === bookTitle ? { ...l, isReserved: true } : l));
    setShowNotification({
      type: 'success',
      message: `Reservation placed for "${bookTitle}". You will be notified when it is returned.`
    });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleSubmitWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = {
      id: `w-${Date.now()}`,
      title: wishlistTitle,
      author: wishlistAuthor,
      requester: userRole === 'Student' ? 'Kelvin Mensah' : 'Current User',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    setWishlist(prev => [...prev, newReq]);
    setShowWishlistModal(false);
    setWishlistTitle('');
    setWishlistAuthor('');
    setShowNotification({ type: 'success', message: 'Book wishlist request submitted successfully!' });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleApproveWishlist = (id: string) => {
    setWishlist(prev => prev.map(w => w.id === id ? { ...w, status: 'Approved' } : w));
    setShowNotification({ type: 'success', message: 'Wishlist request approved for procurement.' });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const categoryCounts = loans.reduce((acc: Record<string, number>, loan) => {
    acc[loan.category] = (acc[loan.category] || 0) + 1;
    return acc;
  }, {});

  const handleDownloadCSV = () => {
    const headers = ['Book Title', 'Author', 'ISBN', 'Category', 'Student', 'Class', 'Borrowed Date', 'Due Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredLoans.map(loan => [
        `"${loan.book}"`,
        `"${loan.author}"`,
        `"${loan.isbn}"`,
        `"${loan.category}"`,
        `"${loan.student}"`,
        `"${loan.class}"`,
        loan.borrowedDate,
        loan.dueDate,
        loan.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `library_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLoans = loans.filter((loan) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loan.book.toLowerCase().includes(searchLower) ||
      loan.author.toLowerCase().includes(searchLower) ||
      loan.isbn.toLowerCase().includes(searchLower) ||
      loan.category.toLowerCase().includes(searchLower) ||
      loan.student.toLowerCase().includes(searchLower) ||
      loan.class.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Library & Book Loans</h1>
          <p className="text-sm text-slate-500 font-medium">Manage book inventory, circulation, and student lending records</p>
        </div>
        {isLibrarian && !isReadOnly && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDigitalIDModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Digital ID</span>
            </button>
            <button 
              onClick={handleSendReminders}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl shadow-xs transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Send Alerts</span>
            </button>
            <button 
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all">
              <Book className="w-4 h-4" />
              <span>Add Books</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95">
              <PlusCircle className="w-4 h-4" />
              <span>New Loan</span>
            </button>
          </div>
        )}
        {!isLibrarian && !isReadOnly && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDigitalIDModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>My Digital ID</span>
            </button>
            <button 
              onClick={() => setShowWishlistModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist Request</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Books', value: '1,240', color: 'blue', icon: Library },
          { label: 'Currently Loaned', value: '86', color: 'amber', icon: Bookmark },
          { label: 'Overdue Returns', value: '12', color: 'rose', icon: AlertTriangle },
          { 
            label: 'Active Reservations', 
            value: reservations.length.toString(), 
            color: 'indigo', 
            icon: Bell,
            subtext: reservations.length > 0 ? `Next: ${reservations[0].bookTitle}` : 'No pending reservations'
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
              {stat.subtext && (
                <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{stat.subtext}</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {showNotification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          showNotification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
          showNotification.type === 'warning' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {showNotification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
           showNotification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          <span>{showNotification.message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Most Borrowed Books</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Top 5 titles this academic term</p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOST_BORROWED_DATA} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {MOST_BORROWED_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('loans')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'loans' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bookmark className="w-4 h-4" />
              <span>Active Loans</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'wishlist' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>Book Wishlist {isLibrarian && wishlist.filter(w => w.status === 'Pending').length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{wishlist.filter(w => w.status === 'Pending').length}</span>}</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Loan History</span>
            </div>
          </button>
        </div>

        {activeTab === 'loans' ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
            />
          </div>
          {!isReadOnly && <button className="text-xs font-bold text-blue-600 hover:underline">View History</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Book Details</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Dates</th>
                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    No books or loans match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Book className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{loan.book}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">{loan.author} • {loan.isbn}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md uppercase tracking-wider">{loan.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{loan.student}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{loan.class}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Borrowed: {loan.borrowedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Due: {loan.dueDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          loan.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {loan.status}
                        </span>
                        {loan.isReserved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-full">
                            <Bell className="w-2.5 h-2.5" /> Reserved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isReadOnly && (
                          <>
                            {!loan.isReserved && (
                              <button 
                                onClick={() => handleReserve(loan.book)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Place Reservation"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleMarkReturned(loan.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Mark Returned
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        ) : activeTab === 'history' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Book Details</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Borrowed</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Returned</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {loanHistory.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No loan history found.</td></tr>
                ) : (
                  loanHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Book className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{item.book}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.author}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{item.student}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.class}</span>
                        </div>
                      </td>
                      <td className="p-4"><span className="text-xs text-slate-500 font-medium">{item.borrowedDate}</span></td>
                      <td className="p-4"><span className="text-xs text-slate-500 font-medium">{item.returnedDate}</span></td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Requested Book</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Requester</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                  {isLibrarian && <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {wishlist.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No book requests found.</td></tr>
                ) : (
                  wishlist.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{item.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.author}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="text-sm font-bold text-slate-800">{item.requester}</span></td>
                      <td className="p-4"><span className="text-xs text-slate-500 font-medium">{item.date}</span></td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      {isLibrarian && !isReadOnly && (
                        <td className="p-4 text-right">
                          {item.status === 'Pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleApproveWishlist(item.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Approve Request"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Reject Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showWishlistModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowWishlistModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-slate-900">Book Wishlist Request</h2>
              <button onClick={() => setShowWishlistModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">Request a new title for the school library to acquire.</p>
            <form onSubmit={handleSubmitWishlist} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Book Title *</label>
                <input 
                  required
                  type="text"
                  value={wishlistTitle}
                  onChange={(e) => setWishlistTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
                  placeholder="e.g. Modern Physics Concepts"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Author Name</label>
                <input 
                  type="text"
                  value={wishlistAuthor}
                  onChange={(e) => setWishlistAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
                  placeholder="e.g. Dr. Stephen Hawking"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowWishlistModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDigitalIDModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          onClick={() => setShowDigitalIDModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 text-center cursor-default max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <Library className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Digital Library ID</h2>
            <p className="text-xs text-slate-500 mb-8 font-medium">Scan this code at the library desk to borrow or return books instantly.</p>
            
            <div className="bg-white p-4 rounded-3xl border-4 border-slate-100 inline-block mb-8">
              <QRCodeSVG 
                value={`LIB-ID-${userRole === 'Student' ? 'STU-001' : 'STF-001'}`} 
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked User</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{userRole === 'Student' ? 'Kelvin Mensah' : 'Librarian Admin'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{userRole === 'Student' ? 'ID: STU-2026-001' : 'ID: STF-LIB-001'}</p>
            </div>

            <button 
              onClick={() => setShowDigitalIDModal(false)}
              className="w-full py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-sm transition-all active:scale-95"
            >
              Close ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
