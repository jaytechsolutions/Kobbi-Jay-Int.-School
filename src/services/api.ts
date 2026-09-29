import type {
  User,
  UserRole,
  Student,
  Parent,
  Staff,
  Teacher,
  SchoolClass,
  Subject,
  AcademicYear,
  AttendanceRecord,
  Assessment,
  StudentResult,
  ReportCard,
  FeeCategory,
  Payment,
  PaymentReceipt,
  Expense,
  TimetableEntry,
  AssignmentItem,
  Announcement,
  NotificationItem,
  LibraryBook,
  LibraryLoan,
  SchoolDocument,
  AuditLog,
  AuditArchiveBatch,
  SystemSettings,
  AdmissionApplication,
  RoleDefinition,
} from '../types';

export const api = {
  // Auth
  async getCurrentUser(role?: UserRole): Promise<{ user: User; availableUsers: User[] }> {
    const url = role ? `/api/auth/me?role=${encodeURIComponent(role)}` : '/api/auth/me';
    const res = await fetch(url);
    const data = await res.json();
    return { user: data.user, availableUsers: data.availableUsers || [] };
  },

  async switchRole(role: UserRole): Promise<User> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    return data.user;
  },

  // Dashboard
  async getDashboardStats() {
    const res = await fetch('/api/dashboard/stats');
    return res.json();
  },

  async getDashboardCharts() {
    const res = await fetch('/api/dashboard/charts');
    return res.json();
  },

  // Students
  async getStudents(params?: { search?: string; classId?: string; status?: string; gender?: string; parentId?: string }): Promise<{ students: Student[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/students?${query}`);
    return res.json();
  },

  async getStudent(id: string): Promise<{ student: Student; parents: Parent[]; results: StudentResult[]; payments: Payment[]; attendance: AttendanceRecord[] }> {
    const res = await fetch(`/api/students/${id}`);
    return res.json();
  },

  async createStudent(student: Partial<Student>): Promise<{ success: boolean; student: Student }> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    return res.json();
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async promoteStudent(id: string, targetClassId: string, targetClassName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/students/${id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetClassId, targetClassName }),
    });
    return res.json();
  },

  // Admissions
  async getAdmissions(): Promise<{ applications: AdmissionApplication[] }> {
    const res = await fetch('/api/admissions');
    return res.json();
  },

  async createAdmission(data: Partial<AdmissionApplication>): Promise<{ success: boolean; application: AdmissionApplication }> {
    const res = await fetch('/api/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateAdmissionStatus(id: string, update: { status: string; interviewDate?: string; interviewScore?: number; interviewNotes?: string }) {
    const res = await fetch(`/api/admissions/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    return res.json();
  },

  async convertAdmissionToStudent(id: string): Promise<{ success: boolean; student: Student; admissionNumber: string }> {
    const res = await fetch(`/api/admissions/${id}/convert-to-student`, {
      method: 'POST',
    });
    return res.json();
  },

  // Parents
  async getParents(): Promise<{ parents: Parent[] }> {
    const res = await fetch('/api/parents');
    return res.json();
  },

  async createParent(parent: Partial<Parent>): Promise<{ success: boolean; parent: Parent }> {
    const res = await fetch('/api/parents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parent),
    });
    return res.json();
  },

  async linkWard(parentId: string, studentId: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/parents/${parentId}/link-ward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    return res.json();
  },

  // Staff & Teachers
  async getStaff(): Promise<{ staff: Staff[] }> {
    const res = await fetch('/api/staff');
    return res.json();
  },

  async createStaff(staffMember: Partial<Staff>): Promise<{ success: boolean; staff: Staff }> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffMember),
    });
    return res.json();
  },

  async getTeachers(): Promise<{ teachers: Teacher[] }> {
    const res = await fetch('/api/teachers');
    return res.json();
  },

  async createTeacher(teacher: Partial<Teacher>): Promise<{ success: boolean; teacher: Teacher }> {
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher),
    });
    return res.json();
  },

  // Classes & Subjects
  async getClasses(): Promise<{ classes: SchoolClass[] }> {
    const res = await fetch('/api/classes');
    return res.json();
  },

  async createClass(newClass: Partial<SchoolClass>): Promise<{ success: boolean; class: SchoolClass }> {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    });
    return res.json();
  },

  async getSubjects(): Promise<{ subjects: Subject[] }> {
    const res = await fetch('/api/subjects');
    return res.json();
  },

  async createSubject(subject: Partial<Subject>): Promise<{ success: boolean; subject: Subject }> {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subject),
    });
    return res.json();
  },

  // Academic Calendar
  async getAcademicYears(): Promise<{ academicYears: AcademicYear[]; terms: any[] }> {
    const res = await fetch('/api/academic-years');
    return res.json();
  },

  async createAcademicYear(name: string, startDate: string, endDate: string) {
    const res = await fetch('/api/academic-years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    });
    return res.json();
  },

  async setActiveAcademicYear(id: string) {
    const res = await fetch(`/api/academic-years/${id}/set-active`, { method: 'PUT' });
    return res.json();
  },

  async setCurrentTerm(id: string) {
    const res = await fetch(`/api/terms/${id}/set-current`, { method: 'PUT' });
    return res.json();
  },

  // Attendance
  async getAttendance(params?: { classId?: string; date?: string; studentId?: string }): Promise<{ attendance: AttendanceRecord[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/attendance?${query}`);
    return res.json();
  },

  async saveBatchAttendance(payload: { classId: string; date: string; recordedBy: string; records: { studentId: string; studentName: string; status: string; remarks?: string }[] }) {
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Results & Examinations
  async getAssessments(): Promise<{ assessments: Assessment[] }> {
    const res = await fetch('/api/assessments');
    return res.json();
  },

  async getResults(params?: { classId?: string; subjectId?: string; studentId?: string; termId?: string }): Promise<{ results: StudentResult[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/results?${query}`);
    return res.json();
  },

  async saveBatchResults(results: any[], updatedBy: string) {
    const res = await fetch('/api/results/batch-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results, updatedBy }),
    });
    return res.json();
  },

  async approveResults(resultIds: string[], approvedBy: string) {
    const res = await fetch('/api/results/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultIds, approvedBy }),
    });
    return res.json();
  },

  // Report Cards
  async getReportCards(params?: { studentId?: string; classId?: string; termId?: string }): Promise<{ reportCards: ReportCard[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/report-cards?${query}`);
    return res.json();
  },

  async generateReportCard(studentId: string, termId?: string): Promise<{ success: boolean; reportCard: ReportCard }> {
    const res = await fetch('/api/report-cards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, termId }),
    });
    return res.json();
  },

  // Finance
  async getFeeCategories(): Promise<{ feeCategories: FeeCategory[] }> {
    const res = await fetch('/api/fees/categories');
    return res.json();
  },

  async createFeeCategory(category: Partial<FeeCategory>): Promise<{ success: boolean; feeCategory: FeeCategory }> {
    const res = await fetch('/api/fees/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  async getPayments(params?: { studentId?: string }): Promise<{ payments: Payment[]; receipts: PaymentReceipt[] }> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const res = await fetch(`/api/payments${query}`);
    return res.json();
  },

  async recordPayment(paymentData: any): Promise<{ success: boolean; payment: Payment; receipt: PaymentReceipt; message?: string }> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return res.json();
  },

  async getReceipt(idOrNumber: string): Promise<{ success: boolean; receipt: PaymentReceipt }> {
    const res = await fetch(`/api/receipts/${idOrNumber}`);
    return res.json();
  },

  async getExpenses(): Promise<{ expenses: Expense[] }> {
    const res = await fetch('/api/expenses');
    return res.json();
  },

  async recordExpense(expenseData: Partial<Expense>): Promise<{ success: boolean; expense: Expense }> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    return res.json();
  },

  // Timetables & Assignments & Announcements
  async getTimetables(params?: { classId?: string; teacherId?: string }): Promise<{ timetables: TimetableEntry[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/timetables?${query}`);
    return res.json();
  },

  async createTimetableEntry(entry: Partial<TimetableEntry>): Promise<{ success: boolean; timetable: TimetableEntry; message?: string }> {
    const res = await fetch('/api/timetables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return res.json();
  },

  async getAssignments(classId?: string): Promise<{ assignments: AssignmentItem[] }> {
    const url = classId ? `/api/assignments?classId=${classId}` : '/api/assignments';
    const res = await fetch(url);
    return res.json();
  },

  async createAssignment(asn: Partial<AssignmentItem>): Promise<{ success: boolean; assignment: AssignmentItem }> {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asn),
    });
    return res.json();
  },

  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    const res = await fetch('/api/announcements');
    return res.json();
  },

  async createAnnouncement(anc: Partial<Announcement>): Promise<{ success: boolean; announcement: Announcement }> {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anc),
    });
    return res.json();
  },

  // Library
  async getLibraryBooks(): Promise<{ books: LibraryBook[] }> {
    const res = await fetch('/api/library/books');
    return res.json();
  },

  async createLibraryBook(book: Partial<LibraryBook>): Promise<{ success: boolean; book: LibraryBook }> {
    const res = await fetch('/api/library/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    return res.json();
  },

  async getLibraryLoans(): Promise<{ loans: LibraryLoan[] }> {
    const res = await fetch('/api/library/loans');
    return res.json();
  },

  async borrowBook(payload: { bookId: string; borrowerId: string; borrowerName: string; borrowerType: string; dueDate: string }) {
    const res = await fetch('/api/library/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async returnBook(loanId: string) {
    const res = await fetch('/api/library/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId }),
    });
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<{ documents: SchoolDocument[] }> {
    const res = await fetch('/api/documents');
    return res.json();
  },

  async uploadDocument(doc: Partial<SchoolDocument>): Promise<{ success: boolean; document: SchoolDocument }> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.json();
  },

  // Audit Logs & Compliance Archival
  async getAuditLogs(): Promise<{
    auditLogs: AuditLog[];
    stats: {
      totalActive: number;
      totalArchived: number;
      archivedBatchesCount: number;
      pendingCleanupCount: number;
      retentionPolicyMonths: number;
      cutoffDate: string;
      lastCleanupRun: string;
      nextScheduledRun: string;
      complianceStandard: string;
      automatedTaskActive: boolean;
    };
    archivedBatches: Partial<AuditArchiveBatch>[];
  }> {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  async runAuditLogCleanup(triggeredBy = 'Manual Administrator Execution', cutoffMonths = 12): Promise<{
    success: boolean;
    archivedCount: number;
    batch?: AuditArchiveBatch;
    message: string;
  }> {
    const res = await fetch('/api/audit-logs/archive-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggeredBy, cutoffMonths }),
    });
    return res.json();
  },

  async seedHistoricAuditLogs(): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/audit-logs/seed-historic', { method: 'POST' });
    return res.json();
  },

  async getArchivedBatches(): Promise<{ success: boolean; batches: AuditArchiveBatch[] }> {
    const res = await fetch('/api/audit-logs/archives');
    return res.json();
  },

  async getArchivedBatchById(id: string): Promise<{ success: boolean; batch: AuditArchiveBatch }> {
    const res = await fetch(`/api/audit-logs/archives/${id}`);
    return res.json();
  },

  // In-App Notifications
  async getNotifications(
    role?: string,
    userId?: string,
    includeDismissed = false
  ): Promise<{
    success: boolean;
    notifications: NotificationItem[];
    unreadCount: number;
    totalCount: number;
  }> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (userId) params.set('userId', userId);
    if (includeDismissed) params.set('includeDismissed', 'true');
    const res = await fetch(`/api/notifications?${params.toString()}`);
    return res.json();
  },

  async createNotification(notif: Partial<NotificationItem>): Promise<{ success: boolean; notification: NotificationItem }> {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif),
    });
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },

  async dismissNotification(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/notifications/${id}/dismiss`, { method: 'PATCH' });
    return res.json();
  },

  async markAllNotificationsRead(role?: string, userId?: string): Promise<{ success: boolean; markedCount: number }> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId }),
    });
    return res.json();
  },

  async dismissAllNotifications(role?: string, userId?: string): Promise<{ success: boolean; dismissedCount: number }> {
    const res = await fetch('/api/notifications/dismiss-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId }),
    });
    return res.json();
  },

  async triggerNotificationEvent(payload: {
    eventType: string;
    customTitle?: string;
    customMessage?: string;
    targetRole?: string;
    studentName?: string;
    amount?: number;
  }): Promise<{ success: boolean; notification: NotificationItem; message: string }> {
    const res = await fetch('/api/notifications/trigger-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Settings & Database Backup
  async getSettings(): Promise<{ settings: SystemSettings }> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async downloadBackup(): Promise<any> {
    const res = await fetch('/api/backup/download', { method: 'POST' });
    return res.json();
  },

  async restoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData }),
    });
    return res.json();
  },

  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/reset-demo', { method: 'POST' });
    return res.json();
  },

  async getSchemaSql(): Promise<string> {
    const res = await fetch('/api/database/schema-sql');
    return res.text();
  },

  // Roles & Login Details Management (School Administrator: Mr. Joseph Amponsah)
  async getRolesManagement(): Promise<{
    success: boolean;
    roles: RoleDefinition[];
    users: User[];
    authorizedAdministrator: string;
  }> {
    const res = await fetch('/api/roles-management');
    return res.json();
  },

  async addRole(
    roleData: { name: string; description: string; modules: string[]; responsibilities?: string[] },
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; role?: RoleDefinition; message: string }> {
    const res = await fetch('/api/roles-management/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': requestingRole,
      },
      body: JSON.stringify({ ...roleData, requestingRole }),
    });
    return res.json();
  },

  async removeRole(
    roleName: string,
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/roles-management/roles/${encodeURIComponent(roleName)}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': requestingRole,
      },
    });
    return res.json();
  },

  async createUserLogin(
    userData: {
      fullName: string;
      username: string;
      email: string;
      role: string;
      password?: string;
      phone?: string;
      associatedId?: string;
    },
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; user?: User; message: string }> {
    const res = await fetch('/api/roles-management/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': requestingRole,
      },
      body: JSON.stringify({ ...userData, requestingRole }),
    });
    return res.json();
  },

  async updateUserLogin(
    userId: string,
    userData: Partial<User & { password?: string }>,
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; user?: User; message: string }> {
    const res = await fetch(`/api/roles-management/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': requestingRole,
      },
      body: JSON.stringify({ ...userData, requestingRole }),
    });
    return res.json();
  },

  async removeUserLogin(
    userId: string,
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/roles-management/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': requestingRole,
      },
    });
    return res.json();
  },

  async resetUserPassword(
    userId: string,
    newPassword?: string,
    requestingRole: string = 'School Administrator'
  ): Promise<{ success: boolean; message: string; temporaryPassword?: string }> {
    const res = await fetch(`/api/roles-management/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': requestingRole,
      },
      body: JSON.stringify({ newPassword, requestingRole }),
    });
    return res.json();
  },
};
