import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Receipt,
  TrendingDown,
  PlusCircle,
  Search,
  Filter,
  Printer,
  X,
  CreditCard,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { api } from '../services/api';
import type { Payment, PaymentReceipt, FeeCategory, Expense, Student } from '../types';

interface FeesAndFinanceProps {
  userRole?: string;
  initialReceiptNumber?: string;
}

export const FeesAndFinance: React.FC<FeesAndFinanceProps> = ({ userRole, initialReceiptNumber }) => {
  const isSchoolAdmin = userRole === 'School Administrator';
  const [activeTab, setActiveTab] = useState<'payments' | 'categories' | 'expenses'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // New Payment Form
  const [payFormData, setPayFormData] = useState({
    studentId: '',
    feeCategoryId: 'fee-cat-tuition',
    amount: 1500,
    paymentMethod: 'Mobile Money',
    transactionReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: 'First Term Tuition Fee installment',
  });
  const [paymentError, setPaymentError] = useState('');

  // New Category Form
  const [catFormData, setCatFormData] = useState({
    name: '',
    description: '',
    defaultAmount: 200,
    frequency: 'Termly' as const,
  });

  // New Expense Form
  const [expFormData, setExpFormData] = useState({
    title: '',
    category: 'Supplies' as const,
    amount: 450,
    paidTo: '',
    paymentMethod: 'Cheque',
    approvedBy: 'Mr. Emmanuel Mensah',
    notes: '',
  });

  useEffect(() => {
    loadAllFinancials();
  }, []);

  useEffect(() => {
    if (initialReceiptNumber && receipts.length > 0) {
      const target = receipts.find((r) => r.receiptNumber === initialReceiptNumber);
      if (target) setSelectedReceipt(target);
    }
  }, [initialReceiptNumber, receipts]);

  const loadAllFinancials = async () => {
    try {
      setLoading(true);
      const [payRes, catRes, expRes, studRes] = await Promise.all([
        api.getPayments(),
        api.getFeeCategories(),
        api.getExpenses(),
        api.getStudents({ status: 'Active' }),
      ]);

      if (payRes.payments) setPayments(payRes.payments);
      if (payRes.receipts) setReceipts(payRes.receipts);
      if (catRes.feeCategories) setFeeCategories(catRes.feeCategories);
      if (expRes.expenses) setExpenses(expRes.expenses);
      if (studRes.students) {
        setStudents(studRes.students);
        if (!payFormData.studentId && studRes.students.length > 0) {
          setPayFormData((prev) => ({ ...prev, studentId: studRes.students[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    try {
      const student = students.find((s) => s.id === payFormData.studentId);
      const cat = feeCategories.find((c) => c.id === payFormData.feeCategoryId);

      const res = await api.recordPayment({
        ...payFormData,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        admissionNumber: student ? student.admissionNumber : '',
        feeCategoryName: cat ? cat.name : 'Tuition Fee',
        totalBilled: 2800,
      });

      if (res.success) {
        setShowPaymentModal(false);
        setSelectedReceipt(res.receipt);
        loadAllFinancials();
      } else {
        setPaymentError(res.message || 'Payment recording failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFeeCategory(catFormData);
      setShowCategoryModal(false);
      loadAllFinancials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordExpense(expFormData);
      setShowExpenseModal(false);
      loadAllFinancials();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const totalCollections = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netSurplus = totalCollections - totalExpenses;

  const filteredPayments = payments.filter((p) => {
    return (
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.admissionNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-700" />
            <h1 className="text-lg font-bold text-slate-900">Bursary & Financial Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect school fees, issue transactional payment receipts, track arrears, and maintain institutional ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPayFormData((prev) => ({
                ...prev,
                transactionReference: `TXN-${Date.now().toString(36).toUpperCase()}`,
              }));
              setShowPaymentModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue Collected
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            GH₵ {totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {payments.length} verified transactions
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total School Expenses
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            GH₵ {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Salaries, utilities & supplies
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Net Operating Surplus
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            GH₵ {netSurplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Positive liquidity balance
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 transition-colors ${
            activeTab === 'payments'
              ? 'border-b-2 border-purple-700 text-purple-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Fee Payments & Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 transition-colors ${
            activeTab === 'categories'
              ? 'border-b-2 border-purple-700 text-purple-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Fee Structure & Schedules ({feeCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 transition-colors ${
            activeTab === 'expenses'
              ? 'border-b-2 border-purple-700 text-purple-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt no, pupil name, admission no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Session 2026/2027 • Term 1
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Pupil Details</th>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {p.studentName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {p.admissionNumber} • Paid by: {p.parentName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.feeCategoryName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {p.transactionReference}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                      GH₵ {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          const r = receipts.find((rec) => rec.paymentId === p.id || rec.receiptNumber === p.receiptNumber);
                          if (r) setSelectedReceipt(r);
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FEE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Fee Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeCategories.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold">
                    {c.frequency}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{c.description || 'Standard institutional levy'}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Default Rate</span>
                  <span className="text-base font-black text-slate-900">
                    GH₵ {Number(c.defaultAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4 text-right">Amount (GH₵)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{e.date}</td>
                    <td className="py-3 px-4 text-slate-700">{e.paidTo}</td>
                    <td className="py-3 px-4 text-slate-600">{e.approvedBy}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-700 text-sm">
                      GH₵ {Number(e.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Record Fee Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Pupil *</label>
                <select
                  required
                  value={payFormData.studentId}
                  onChange={(e) => setPayFormData({ ...payFormData, studentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber} - {s.currentClassName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee Category *</label>
                  <select
                    value={payFormData.feeCategoryId}
                    onChange={(e) => setPayFormData({ ...payFormData, feeCategoryId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {feeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paid (GH₵) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-emerald-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Mobile Money">Mobile Money (MTN / Telecel)</option>
                    <option value="Cash">Cash (Bursar Office)</option>
                    <option value="Bank Transfer">Bank Transfer / Direct Deposit</option>
                    <option value="Bank Cheque">Bank Cheque</option>
                    <option value="Card">POS Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Ref *</label>
                  <input
                    type="text"
                    required
                    value={payFormData.transactionReference}
                    onChange={(e) => setPayFormData({ ...payFormData, transactionReference: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes / Description</label>
                <input
                  type="text"
                  value={payFormData.description}
                  onChange={(e) => setPayFormData({ ...payFormData, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs"
                >
                  Record Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150 text-xs">
            {/* Action Bar (hidden in print) */}
            <div className="print:hidden flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-slate-500">Official Payment Voucher</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="border border-slate-300 rounded-xl p-6 sm:p-8 bg-slate-50/30">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <SchoolLogo size="md" />
                  <div className="text-left">
                    <h3 className="font-black text-slate-950 text-base uppercase">
                      Kobbi Jay International School
                    </h3>
                    <p className="text-[10px] text-amber-700 font-bold uppercase">
                      Basic School • Excellence, Integrity, Leadership
                    </p>
                  </div>
                </div>
                <div className="mt-2 inline-block px-4 py-0.5 bg-slate-900 text-white rounded-full font-mono text-[11px] font-bold">
                  OFFICIAL PAYMENT RECEIPT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div>
                  <span className="text-slate-400 text-[10px] block">Receipt Number:</span>
                  <strong className="font-mono text-purple-800 text-sm">{selectedReceipt.receiptNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Payment Date:</span>
                  <strong>{selectedReceipt.paymentDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pupil Name:</span>
                  <strong className="text-slate-900">{selectedReceipt.studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Admission Number:</span>
                  <strong className="font-mono text-blue-700">{selectedReceipt.admissionNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Class / Stream:</span>
                  <strong>{selectedReceipt.className}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Payer / Guardian:</span>
                  <strong>{selectedReceipt.parentName}</strong>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 my-3 space-y-2">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Fee Category:</span>
                  <span>{selectedReceipt.feeCategory}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Payment Method & Ref:</span>
                  <span>{selectedReceipt.paymentMethod} ({selectedReceipt.transactionReference})</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Previous Term Balance:</span>
                  <span>GH₵ {Number(selectedReceipt.previousBalance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-950 text-sm pt-2 border-t border-slate-200">
                  <span>AMOUNT PAID:</span>
                  <span className="text-emerald-700 font-mono">
                    GH₵ {Number(selectedReceipt.amountPaid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-700 pt-1">
                  <span>Remaining Outstanding Balance:</span>
                  <span className="font-mono">
                    GH₵ {Number(selectedReceipt.newBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between pt-3 text-[10px] text-slate-400">
                <div>
                  <span>Authorized Signature:</span>
                  <div className="font-serif italic font-bold text-slate-800 text-xs mt-1">
                    {selectedReceipt.authorizedBy}
                  </div>
                </div>
                <div className="text-right font-mono">
                  [OFFICIAL BURSARY STAMP]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">Record School Operating Expense</h2>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Reagents, Electricity Bill..."
                  value={expFormData.title}
                  onChange={(e) => setExpFormData({ ...expFormData, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expFormData.category}
                    onChange={(e) => setExpFormData({ ...expFormData, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Supplies">Supplies & Stationery</option>
                    <option value="Utilities">Utilities & Fuel</option>
                    <option value="Maintenance">Campus Maintenance</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Books & Stationery">Books & Curriculum</option>
                    <option value="Activities">Activities & Sports</option>
                    <option value="Other">Other Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (GH₵) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expFormData.amount}
                    onChange={(e) => setExpFormData({ ...expFormData, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-rose-700"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paid To (Payee / Vendor) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECG Accra, Science Depot Ltd..."
                  value={expFormData.paidTo}
                  onChange={(e) => setExpFormData({ ...expFormData, paidTo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
