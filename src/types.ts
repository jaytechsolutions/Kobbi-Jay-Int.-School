/**
 * Kobbi Jay International School Management System (SDMS)
 * Core Types & Entity Definitions
 */

export type UserRole =
  | 'School Administrator'
  | 'Headteacher'
  | 'Academic Coordinator'
  | 'Teacher'
  | 'Accountant'
  | 'Admissions Officer'
  | 'Librarian'
  | 'Parent/Guardian'
  | 'Student'
  | string;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  modules: string[];
  responsibilities: string[];
  isSystem: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface RoleCredential {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  temporaryPassword?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  temporaryPassword?: string;
  lastLogin?: string;
  associatedId?: string; // staffId, teacherId, parentId, or studentId
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
}

export type StudentStatus =
  | 'Active'
  | 'Inactive'
  | 'Graduated'
  | 'Transferred'
  | 'Withdrawn'
  | 'Suspended';

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality: string;
  religion?: string;
  photoUrl?: string;
  previousSchool?: string;
  admissionDate: string;
  currentClassId: string;
  currentClassName: string;
  academicYearId: string;
  status: StudentStatus;
  parentIds: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalInfo?: string;
  allergies?: string;
  bloodGroup?: string;
  nhisNumber?: string;
  address: string;
  notes?: string;
  documents?: { title: string; url: string; uploadDate: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Uncle' | 'Auntie' | 'Other';
  address: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  emergencyContact: string;
  studentIds: string[];
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  position:
    | 'Headteacher'
    | 'Teacher'
    | 'Accountant'
    | 'Administrator'
    | 'Secretary'
    | 'Librarian'
    | 'Academic Coordinator'
    | 'Admissions Officer'
    | 'Support staff'
    | 'Other';
  department: string;
  qualification: string;
  employmentDate: string;
  employmentStatus: 'Full-time' | 'Part-time' | 'Contract' | 'On Leave' | 'Terminated';
  photoUrl?: string;
  userId?: string;
  createdAt: string;
}

export interface Teacher extends Staff {
  assignedClassIds: string[];
  assignedSubjectIds: string[];
  specialization?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2026/2027"
  startDate: string;
  endDate: string;
  isActive: boolean;
  terms: Term[];
  createdAt: string;
}

export interface Term {
  id: string;
  academicYearId: string;
  name: 'Term 1' | 'Term 2' | 'Term 3';
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'Upcoming' | 'In Progress' | 'Closed';
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Basic 5", "JHS 2", "Creche"
  levelCategory: 'Early Childhood' | 'Primary' | 'Junior High';
  section?: string; // "A", "Gold", etc.
  classTeacherId?: string;
  classTeacherName?: string;
  capacity: number;
  classroom: string;
  academicYearId: string;
  termId?: string;
  subjectIds: string[];
  studentCount?: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Elective' | 'Activity';
  description?: string;
  applicableLevels: string[]; // Class IDs or level tags
  passMark: number;
}

export interface EnrollmentHistory {
  id: string;
  studentId: string;
  academicYearId: string;
  academicYearName: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  status: 'Promoted' | 'Repeated' | 'Transferred' | 'Active' | 'Completed';
  date: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  recordedBy: string;
  academicYearId: string;
  termId: string;
}

export type AssessmentType =
  | 'Class Exercise'
  | 'Assignment'
  | 'Project'
  | 'Mid-Term Test'
  | 'End-of-Term Examination'
  | 'Mock Examination';

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  classId: string;
  subjectId: string;
  academicYearId: string;
  termId: string;
  maxScore: number;
  weightPercentage: number;
  date: string;
  createdBy: string;
}

export type ResultApprovalStatus = 'Draft' | 'Submitted' | 'Approved' | 'Locked';

export interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  academicYearId: string;
  termId: string;
  classScore: number; // e.g. out of 40 or 50
  maxClassScore: number;
  examScore: number; // e.g. out of 60 or 50
  maxExamScore: number;
  totalScore: number; // 0 - 100
  grade: string;
  remarks: string;
  status: ResultApprovalStatus;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  studentPhoto?: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
  attendanceDaysPresent: number;
  attendanceDaysTotal: number;
  subjectResults: {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
  }[];
  overallAverage: number;
  overallTotal: number;
  positionInClass?: string;
  classSize: number;
  teacherRemarks: string;
  teacherName: string;
  headteacherRemarks: string;
  conductRemarks: string;
  interestRemarks: string;
  promotionStatus: 'Promoted to Next Class' | 'Promoted on Trial' | 'Repeat' | 'In Progress' | 'Graduated';
  nextTermBegins?: string;
  issuedDate: string;
}

export interface FeeCategory {
  id: string;
  name: string; // Tuition, Admission, Books, Uniform, Feeding, Transportation, Examination, Activity, Other
  description?: string;
  defaultAmount: number;
  frequency: 'Once' | 'Termly' | 'Yearly' | 'Monthly';
}

export interface FeeAssignment {
  id: string;
  feeCategoryId: string;
  feeCategoryName: string;
  classId: string;
  className: string;
  academicYearId: string;
  termId?: string;
  amountBilled: number;
  dueDate: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  parentName: string;
  parentPhone?: string;
  className: string;
  amountPaid: number;
  totalBilled: number;
  previousBalance: number;
  newBalance: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Card' | 'Online';
  transactionReference: string;
  feeCategory: string;
  description: string;
  authorizedBy: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  parentId?: string;
  parentName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Card' | 'Online';
  transactionReference: string;
  feeCategoryId: string;
  feeCategoryName: string;
  description: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overpaid';
  academicYearId: string;
  termId: string;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Salaries' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Books & Stationery' | 'Activities' | 'Other';
  amount: number;
  date: string;
  paymentMethod: string;
  paidTo: string;
  approvedBy: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number; // 1 to 8
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classroom: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  instructions: string;
  deadline: string;
  resources?: { name: string; url: string }[];
  status: 'Active' | 'Closed';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isUrgent: boolean;
  authorName: string;
  authorRole: string;
  createdAt: string;
  attachmentName?: string;
}

export type NotificationType =
  | 'admission'
  | 'fee'
  | 'fee_overdue'
  | 'announcement'
  | 'result'
  | 'assignment'
  | 'attendance'
  | 'system';

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRoles: (UserRole | 'All')[];
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  isDismissed?: boolean;
  linkTab?: string;
  linkEntityId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface AuditArchiveBatch {
  id: string;
  batchNumber: string;
  archivedAt: string;
  cutoffDate: string;
  recordCount: number;
  triggeredBy: string;
  dateRange: {
    oldest: string;
    newest: string;
  };
  fileSize: string;
  logs: AuditLog[];
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  publishYear?: number;
}

export interface LibraryLoan {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerType: 'Student' | 'Staff';
  borrowerId: string;
  borrowerName: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  fineAmount: number;
  fineStatus: 'None' | 'Pending' | 'Paid';
}

export interface SchoolDocument {
  id: string;
  title: string;
  category: 'Student Document' | 'Staff Document' | 'Certificate' | 'Admission Policy' | 'Curriculum' | 'School Policies' | 'Other';
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  accessibleRoles: UserRole[];
  downloadUrl?: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordAffected: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemSettings {
  schoolName: string;
  schoolType: string;
  motto: string;
  address: string;
  phone: string;
  altPhone?: string;
  email: string;
  website: string;
  logoUrl?: string;
  activeAcademicYearId: string;
  currentTermId: string;
  gradingScale: {
    grade: string;
    minScore: number;
    maxScore: number;
    remarks: string;
    gradePoint: number;
  }[];
  assessmentWeights: {
    classScoreWeight: number; // e.g. 40
    examScoreWeight: number; // e.g. 60
  };
  currency: string;
  enableStudentRanking: boolean;
  backupLastInitiated?: string;
}

export type ApplicationStatus =
  | 'Pending'
  | 'Under Review'
  | 'Accepted'
  | 'Rejected'
  | 'Enrolled';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  applicantFirstName: string;
  applicantMiddleName?: string;
  applicantLastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  desiredClassId: string;
  desiredClassName: string;
  previousSchool?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation: string;
  nhisNumber?: string;
  address: string;
  status: ApplicationStatus;
  interviewDate?: string;
  interviewScore?: number;
  interviewNotes?: string;
  assignedAdmissionNumber?: string;
  submittedAt: string;
  reviewedBy?: string;
}
