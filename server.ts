import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, calculateGrade } from './server/db.js';
import type {
  UserRole,
  Student,
  Parent,
  Staff,
  Teacher,
  Payment,
  PaymentReceipt,
  AuditLog,
  AdmissionApplication,
  Announcement,
} from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request IP & basic logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Basic CORS and headers
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // ==========================================
  // AUTHENTICATION & SESSIONS
  // ==========================================
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const raw = db.getRawData();
    // Default logged in user: School Administrator or whichever is requested
    const role = (req.query.role as UserRole) || 'School Administrator';
    const user = raw.users.find((u) => u.role === role) || raw.users[1];
    res.json({ success: true, user, availableUsers: raw.users });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, role } = req.body;
    const raw = db.getRawData();
    let user = raw.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user && role) {
      user = raw.users.find((u) => u.role === role);
    }
    if (!user) {
      user = raw.users[0]; // fallback
    }

    user.lastLogin = new Date().toISOString();
    db.logAudit(user.fullName, user.role, 'LOGIN', 'Authentication', user.email, 'User logged into the portal.');
    res.json({ success: true, user });
  });

  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    const { role } = req.body;
    const raw = db.getRawData();
    const user = raw.users.find((u) => u.role === role);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    db.logAudit(user.fullName, user.role, 'ROLE_SWITCH', 'Authentication', role, `Switched active role to ${role}`);
    res.json({ success: true, user });
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  app.get('/api/dashboard/stats', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const students = raw.students;
    const today = '2026-09-22';

    const maleStudents = students.filter((s) => s.gender === 'Male').length;
    const femaleStudents = students.filter((s) => s.gender === 'Female').length;
    const totalTeachers = raw.teachers.length;
    const totalStaff = raw.staff.length + totalTeachers;
    const totalClasses = raw.classes.length;

    const todayAtt = raw.attendance.filter((a) => a.date === today);
    const presentToday = todayAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const absentToday = todayAtt.filter((a) => a.status === 'Absent').length;

    // Fees calculation
    const feesCollected = raw.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    // Estimated billed fees (e.g. students * avg term fee)
    const totalBilled = raw.students.length * 2800;
    const outstandingFees = Math.max(0, totalBilled - feesCollected);

    const pendingAdmissions = raw.applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length;
    const newAdmissions = raw.applications.filter((a) => a.status === 'Accepted' || a.status === 'Enrolled').length;

    // Recent activities
    const recentPayments = raw.payments.slice(0, 5);
    const recentAnnouncements = raw.announcements.slice(0, 4);

    res.json({
      success: true,
      stats: {
        totalStudents: students.length,
        maleStudents,
        femaleStudents,
        totalTeachers,
        totalStaff,
        totalClasses,
        presentToday: presentToday || 7,
        absentToday: absentToday || 1,
        feesCollected,
        outstandingFees,
        newAdmissions,
        pendingAdmissions,
        upcomingExams: 3,
      },
      recentPayments,
      recentAnnouncements,
    });
  });

  app.get('/api/dashboard/charts', (req: Request, res: Response) => {
    const raw = db.getRawData();

    // Students by class
    const studentsByClass = raw.classes.map((c) => ({
      class: c.name,
      count: raw.students.filter((s) => s.currentClassId === c.id).length,
    }));

    // Gender breakdown
    const male = raw.students.filter((s) => s.gender === 'Male').length;
    const female = raw.students.filter((s) => s.gender === 'Female').length;
    const genderData = [
      { name: 'Boys / Male', value: male, color: '#2563eb' },
      { name: 'Girls / Female', value: female, color: '#ec4899' },
    ];

    // Attendance trends (Last 5 school days)
    const attendanceTrends = [
      { day: 'Mon 15th', present: 96, absent: 4 },
      { day: 'Tue 16th', present: 98, absent: 2 },
      { day: 'Wed 17th', present: 94, absent: 6 },
      { day: 'Thu 18th', present: 97, absent: 3 },
      { day: 'Fri 19th', present: 95, absent: 5 },
      { day: 'Today', present: 98, absent: 2 },
    ];

    // Fee collection progress
    const feesCollected = raw.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const target = raw.students.length * 2800;
    const feeData = [
      { category: 'Tuition', collected: feesCollected * 0.65, pending: (target - feesCollected) * 0.6 },
      { category: 'Feeding & Lunch', collected: feesCollected * 0.2, pending: (target - feesCollected) * 0.25 },
      { category: 'ICT & STEM Labs', collected: feesCollected * 0.1, pending: (target - feesCollected) * 0.1 },
      { category: 'Others & Clubs', collected: feesCollected * 0.05, pending: (target - feesCollected) * 0.05 },
    ];

    // Academic performance distribution
    const academicPerformance = [
      { grade: 'Grade 1 (A)', count: 42 },
      { grade: 'Grade 2 (B+)', count: 28 },
      { grade: 'Grade 3 (B)', count: 18 },
      { grade: 'Grade 4 (C+)', count: 12 },
      { grade: 'Grade 5 (C)', count: 6 },
      { grade: 'Grade 6-9 (Pass/Fail)', count: 3 },
    ];

    res.json({
      success: true,
      studentsByClass,
      genderData,
      attendanceTrends,
      feeData,
      academicPerformance,
    });
  });

  // ==========================================
  // STUDENTS MODULE
  // ==========================================
  app.get('/api/students', (req: Request, res: Response) => {
    const raw = db.getRawData();
    let list = [...raw.students];
    const { search, classId, status, gender } = req.query;

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          (s.middleName && s.middleName.toLowerCase().includes(q))
      );
    }
    if (classId) {
      list = list.filter((s) => s.currentClassId === classId);
    }
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    if (gender) {
      list = list.filter((s) => s.gender === gender);
    }

    res.json({ success: true, count: list.length, students: list });
  });

  app.get('/api/students/:id', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const student = raw.students.find((s) => s.id === req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const parents = raw.parents.filter((p) => student.parentIds?.includes(p.id) || p.studentIds?.includes(student.id));
    const results = raw.results.filter((r) => r.studentId === student.id);
    const payments = raw.payments.filter((p) => p.studentId === student.id);
    const attendance = raw.attendance.filter((a) => a.studentId === student.id);

    res.json({
      success: true,
      student,
      parents,
      results,
      payments,
      attendance,
    });
  });

  app.post('/api/students', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;

    // Generate unique admission number if not provided
    const year = new Date().getFullYear();
    const count = raw.students.length + 1;
    const admissionNumber = data.admissionNumber || `KJIS-${year}-${String(count).padStart(4, '0')}`;

    const parentIds: string[] = data.parentIds || [];

    // Process Father
    if (data.fatherName) {
      let father = raw.parents.find(p => p.phone === data.fatherPhone || p.fullName === data.fatherName);
      if (!father) {
        const newFather: Parent = {
          id: `parent-${Date.now()}-1`,
          fullName: data.fatherName,
          phone: data.fatherPhone || '',
          email: '',
          occupation: data.fatherOccupation || '',
          relationship: 'Father',
          address: data.address || '',
          emergencyContact: data.emergencyContactPhone || '',
          studentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        raw.parents.push(newFather);
        father = newFather;
      }
      if (father && !parentIds.includes(father.id)) parentIds.push(father.id);
    }

    // Process Mother
    if (data.motherName) {
      let mother = raw.parents.find(p => p.phone === data.motherPhone || p.fullName === data.motherName);
      if (!mother) {
        const newMother: Parent = {
          id: `parent-${Date.now()}-2`,
          fullName: data.motherName,
          phone: data.motherPhone || '',
          email: '',
          occupation: data.motherOccupation || '',
          relationship: 'Mother',
          address: data.address || '',
          emergencyContact: data.emergencyContactPhone || '',
          studentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        raw.parents.push(newMother);
        mother = newMother;
      }
      if (mother && !parentIds.includes(mother.id)) parentIds.push(mother.id);
    }

    const newStudent: Student = {
      id: `stud-${Date.now()}`,
      admissionNumber,
      firstName: data.firstName || '',
      middleName: data.middleName || '',
      lastName: data.lastName || '',
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth || '2016-01-01',
      placeOfBirth: data.placeOfBirth || 'Accra',
      nationality: data.nationality || 'Ghanaian',
      religion: data.religion || 'Christian',
      admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
      currentClassId: data.currentClassId || 'class-basic-1',
      currentClassName: data.currentClassName || 'Basic 1',
      academicYearId: data.academicYearId || raw.settings.activeAcademicYearId,
      status: data.status || 'Active',
      parentIds: parentIds,
      emergencyContactName: data.emergencyContactName || data.fatherName || data.motherName || '',
      emergencyContactPhone: data.emergencyContactPhone || data.fatherPhone || data.motherPhone || '',
      medicalInfo: data.medicalInfo || 'None reported',
      bloodGroup: data.bloodGroup || 'O+',
      nhisNumber: data.nhisNumber || '',
      photoUrl: data.photoUrl || '',
      address: data.address || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    raw.students.unshift(newStudent);

    // Link parents to student
    parentIds.forEach(pid => {
      const parent = raw.parents.find(p => p.id === pid);
      if (parent && !parent.studentIds.includes(newStudent.id)) {
        parent.studentIds.push(newStudent.id);
      }
    });

    // Update class student count
    const targetClass = raw.classes.find((c) => c.id === newStudent.currentClassId);
    if (targetClass) {
      targetClass.studentCount = (targetClass.studentCount || 0) + 1;
    }

    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'STUDENT_CREATED', 'Students', newStudent.admissionNumber, `Registered student ${newStudent.firstName} ${newStudent.lastName}`);
    res.status(201).json({ success: true, student: newStudent });
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const index = raw.students.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const current = raw.students[index];
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    raw.students[index] = updated;
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'STUDENT_UPDATED', 'Students', updated.admissionNumber, `Updated details for ${updated.firstName} ${updated.lastName}`);
    res.json({ success: true, student: updated });
  });

  app.post('/api/students/:id/promote', (req: Request, res: Response) => {
    const { targetClassId, targetClassName } = req.body;
    const raw = db.getRawData();
    const student = raw.students.find((s) => s.id === req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const oldClass = student.currentClassName;
    student.currentClassId = targetClassId;
    student.currentClassName = targetClassName;
    student.updatedAt = new Date().toISOString();

    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'STUDENT_PROMOTED', 'Students', student.admissionNumber, `Promoted ${student.firstName} ${student.lastName} from ${oldClass} to ${targetClassName}`);
    res.json({ success: true, student, message: `Successfully promoted to ${targetClassName}` });
  });

  // ==========================================
  // ADMISSIONS MODULE
  // ==========================================
  app.get('/api/admissions', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, applications: raw.applications });
  });

  app.post('/api/admissions', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const count = raw.applications.length + 101;
    const year = new Date().getFullYear();

    const newApp: AdmissionApplication = {
      id: `app-${Date.now()}`,
      applicationNumber: `APP-KJIS-${year}-${count}`,
      applicantFirstName: data.applicantFirstName,
      applicantMiddleName: data.applicantMiddleName || '',
      applicantLastName: data.applicantLastName,
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth,
      desiredClassId: data.desiredClassId,
      desiredClassName: data.desiredClassName,
      previousSchool: data.previousSchool || '',
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      parentEmail: data.parentEmail,
      parentOccupation: data.parentOccupation || '',
      address: data.address || '',
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };

    raw.applications.unshift(newApp);
    db.saveData(raw);
    db.logAudit('Public Applicant', 'Admissions Officer', 'APPLICATION_SUBMITTED', 'Admissions', newApp.applicationNumber, `Received application for ${newApp.applicantFirstName} ${newApp.applicantLastName}`);

    db.addNotification({
      title: `New Admission Application: ${newApp.applicantFirstName} ${newApp.applicantLastName}`,
      message: `New application (${newApp.applicationNumber}) submitted for ${newApp.desiredClassName}. Readiness review pending.`,
      type: 'admission',
      targetRoles: ['Super Administrator', 'School Administrator', 'Headteacher', 'Admissions Officer'],
      linkTab: 'admissions',
      linkEntityId: newApp.id,
    });

    res.status(201).json({ success: true, application: newApp });
  });

  app.put('/api/admissions/:id/status', (req: Request, res: Response) => {
    const { status, interviewDate, interviewScore, interviewNotes } = req.body;
    const raw = db.getRawData();
    const appItem = raw.applications.find((a) => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    appItem.status = status;
    if (interviewDate) appItem.interviewDate = interviewDate;
    if (interviewScore !== undefined) appItem.interviewScore = interviewScore;
    if (interviewNotes) appItem.interviewNotes = interviewNotes;
    appItem.reviewedBy = 'Ms. Grace Owusu (Admissions Officer)';

    db.saveData(raw);
    db.logAudit('Admissions Officer', 'Admissions Officer', 'APPLICATION_STATUS_UPDATED', 'Admissions', appItem.applicationNumber, `Updated status to ${status}`);

    db.addNotification({
      title: `Admission Status Updated: ${appItem.applicantFirstName} ${appItem.applicantLastName}`,
      message: `Application ${appItem.applicationNumber} status has been updated to "${status}".`,
      type: 'admission',
      targetRoles: ['Super Administrator', 'School Administrator', 'Headteacher', 'Admissions Officer', 'Parent/Guardian'],
      linkTab: 'admissions',
      linkEntityId: appItem.id,
    });

    res.json({ success: true, application: appItem });
  });

  app.post('/api/admissions/:id/convert-to-student', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const appItem = raw.applications.find((a) => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const year = new Date().getFullYear();
    const count = raw.students.length + 1;
    const admissionNumber = `KJIS-${year}-${String(count).padStart(4, '0')}`;

    // Create student
    const newStudent: Student = {
      id: `stud-${Date.now()}`,
      admissionNumber,
      firstName: appItem.applicantFirstName,
      middleName: appItem.applicantMiddleName || '',
      lastName: appItem.applicantLastName,
      gender: appItem.gender,
      dateOfBirth: appItem.dateOfBirth,
      placeOfBirth: 'Accra',
      nationality: 'Ghanaian',
      religion: 'Christian',
      admissionDate: new Date().toISOString().split('T')[0],
      currentClassId: appItem.desiredClassId,
      currentClassName: appItem.desiredClassName,
      academicYearId: raw.settings.activeAcademicYearId,
      status: 'Active',
      parentIds: [],
      emergencyContactName: appItem.parentName,
      emergencyContactPhone: appItem.parentPhone,
      medicalInfo: 'Admissions health certificate on file',
      bloodGroup: 'O+',
      nhisNumber: appItem.nhisNumber || '',
      address: appItem.address,
      notes: `Admitted from Application ${appItem.applicationNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create or link parent
    let parent = raw.parents.find((p) => p.email.toLowerCase() === appItem.parentEmail.toLowerCase());
    if (!parent) {
      const createdParent: Parent = {
        id: `parent-${Date.now()}`,
        fullName: appItem.parentName,
        phone: appItem.parentPhone,
        email: appItem.parentEmail,
        occupation: appItem.parentOccupation,
        relationship: 'Guardian',
        address: appItem.address,
        emergencyContact: `${appItem.parentName} (${appItem.parentPhone})`,
        studentIds: [newStudent.id],
        createdAt: new Date().toISOString(),
      };
      raw.parents.unshift(createdParent);
      parent = createdParent;
    } else {
      parent.studentIds.push(newStudent.id);
    }
    if (parent) {
      newStudent.parentIds.push(parent.id);
    }

    appItem.status = 'Enrolled';
    appItem.assignedAdmissionNumber = admissionNumber;

    raw.students.unshift(newStudent);
    db.saveData(raw);

    db.logAudit('Admissions Officer', 'Admissions Officer', 'STUDENT_ENROLLED', 'Admissions', admissionNumber, `Converted application ${appItem.applicationNumber} to active student ${newStudent.firstName} ${newStudent.lastName}`);
    res.json({ success: true, student: newStudent, admissionNumber });
  });

  // ==========================================
  // PARENTS MODULE
  // ==========================================
  app.get('/api/parents', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, parents: raw.parents });
  });

  app.post('/api/parents', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newParent: Parent = {
      id: `parent-${Date.now()}`,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      occupation: data.occupation || '',
      relationship: data.relationship || 'Guardian',
      address: data.address || '',
      fatherName: data.fatherName || '',
      motherName: data.motherName || '',
      fatherPhone: data.fatherPhone || '',
      motherPhone: data.motherPhone || '',
      fatherOccupation: data.fatherOccupation || '',
      motherOccupation: data.motherOccupation || '',
      emergencyContact: data.emergencyContact || data.phone,
      studentIds: data.studentIds || [],
      createdAt: new Date().toISOString(),
    };
    raw.parents.unshift(newParent);
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'PARENT_CREATED', 'Parents', newParent.fullName, `Created parent profile with ${newParent.studentIds.length} linked child(ren)`);
    res.status(201).json({ success: true, parent: newParent });
  });

  app.post('/api/parents/:id/link-ward', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const parent = raw.parents.find(p => p.id === req.params.id);
    const { studentId } = req.body;

    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });

    const student = raw.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (!parent.studentIds.includes(studentId)) {
      parent.studentIds.push(studentId);
    }

    if (!student.parentIds.includes(parent.id)) {
      student.parentIds.push(parent.id);
    }

    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'PARENT_LINKED_WARD', 'Parents', parent.fullName, `Linked ward ${student.firstName} ${student.lastName} to parent`);
    res.json({ success: true, message: 'Ward linked successfully' });
  });

  // ==========================================
  // STAFF & TEACHERS MODULE
  // ==========================================
  app.get('/api/staff', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, staff: raw.staff });
  });

  app.post('/api/staff', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      fullName: data.fullName,
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth || '1985-01-01',
      phone: data.phone,
      email: data.email,
      address: data.address || '',
      position: data.position || 'Teacher',
      department: data.department || 'Academics',
      qualification: data.qualification || '',
      employmentDate: data.employmentDate || new Date().toISOString().split('T')[0],
      employmentStatus: 'Full-time',
      createdAt: new Date().toISOString(),
    };
    raw.staff.unshift(newStaff);
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'STAFF_REGISTERED', 'Staff', newStaff.fullName, `Registered new staff member (${newStaff.position})`);
    res.status(201).json({ success: true, staff: newStaff });
  });

  app.get('/api/teachers', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, teachers: raw.teachers });
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newTeacher: Teacher = {
      id: `teach-${Date.now()}`,
      fullName: data.fullName,
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth || '1988-01-01',
      phone: data.phone,
      email: data.email,
      address: data.address || '',
      position: 'Teacher',
      department: data.department || 'Academics',
      qualification: data.qualification || 'B.Ed',
      employmentDate: data.employmentDate || new Date().toISOString().split('T')[0],
      employmentStatus: 'Full-time',
      assignedClassIds: data.assignedClassIds || [],
      assignedSubjectIds: data.assignedSubjectIds || [],
      specialization: data.specialization || '',
      createdAt: new Date().toISOString(),
    };
    raw.teachers.unshift(newTeacher);
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'TEACHER_REGISTERED', 'Teachers', newTeacher.fullName, `Registered teacher with ${newTeacher.assignedClassIds.length} assigned classes`);
    res.status(201).json({ success: true, teacher: newTeacher });
  });

  // ==========================================
  // CLASSES & SUBJECTS MODULE
  // ==========================================
  app.get('/api/classes', (req: Request, res: Response) => {
    const raw = db.getRawData();
    // Update student counts dynamically
    raw.classes.forEach((c) => {
      c.studentCount = raw.students.filter((s) => s.currentClassId === c.id).length;
    });
    res.json({ success: true, classes: raw.classes });
  });

  app.post('/api/classes', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newClass: any = {
      id: `class-${data.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: data.name,
      levelCategory: data.levelCategory || 'Primary',
      section: data.section || 'A',
      classroom: data.classroom || 'Block B',
      capacity: Number(data.capacity) || 35,
      academicYearId: raw.settings.activeAcademicYearId,
      termId: raw.settings.currentTermId,
      subjectIds: data.subjectIds || raw.subjects.map((s) => s.id),
      classTeacherId: data.classTeacherId,
      classTeacherName: data.classTeacherName,
      studentCount: 0,
    };
    raw.classes.push(newClass);
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'CLASS_CREATED', 'Classes', newClass.name, `Created class ${newClass.name}`);
    res.status(201).json({ success: true, class: newClass });
  });

  app.get('/api/subjects', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, subjects: raw.subjects });
  });

  app.post('/api/subjects', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newSubject = {
      id: `subj-${Date.now()}`,
      code: data.code,
      name: data.name,
      category: data.category || 'Core',
      passMark: Number(data.passMark) || 50,
      applicableLevels: data.applicableLevels || ['all'],
    };
    raw.subjects.push(newSubject);
    db.saveData(raw);
    db.logAudit('Administrator', 'Academic Coordinator', 'SUBJECT_CREATED', 'Subjects', newSubject.name, `Created subject ${newSubject.name} (${newSubject.code})`);
    res.status(201).json({ success: true, subject: newSubject });
  });

  // ==========================================
  // ACADEMIC YEARS & TERMS MODULE
  // ==========================================
  app.get('/api/academic-years', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, academicYears: raw.academicYears, terms: raw.terms });
  });

  app.post('/api/academic-years', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { name, startDate, endDate } = req.body;
    const ayId = `ay-${name.replace('/', '-')}`;
    const newAY = {
      id: ayId,
      name,
      startDate,
      endDate,
      isActive: false,
      terms: [
        { id: `term-1-${ayId}`, academicYearId: ayId, name: 'Term 1' as const, startDate, endDate: '', isCurrent: false, status: 'Upcoming' as const },
        { id: `term-2-${ayId}`, academicYearId: ayId, name: 'Term 2' as const, startDate: '', endDate: '', isCurrent: false, status: 'Upcoming' as const },
        { id: `term-3-${ayId}`, academicYearId: ayId, name: 'Term 3' as const, startDate: '', endDate, isCurrent: false, status: 'Upcoming' as const },
      ],
      createdAt: new Date().toISOString(),
    };
    raw.academicYears.push(newAY);
    raw.terms.push(...newAY.terms);
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'ACADEMIC_YEAR_CREATED', 'Academic Calendar', name, `Added academic year ${name}`);
    res.status(201).json({ success: true, academicYear: newAY });
  });

  app.put('/api/academic-years/:id/set-active', (req: Request, res: Response) => {
    const raw = db.getRawData();
    raw.academicYears.forEach((ay) => {
      ay.isActive = ay.id === req.params.id;
    });
    raw.settings.activeAcademicYearId = req.params.id;
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'ACTIVE_ACADEMIC_YEAR_SET', 'Academic Calendar', req.params.id, 'Set active academic year');
    res.json({ success: true, message: 'Active academic year updated' });
  });

  app.put('/api/terms/:id/set-current', (req: Request, res: Response) => {
    const raw = db.getRawData();
    raw.terms.forEach((t) => {
      t.isCurrent = t.id === req.params.id;
      if (t.id === req.params.id) t.status = 'In Progress';
    });
    raw.settings.currentTermId = req.params.id;
    db.saveData(raw);
    db.logAudit('Administrator', 'School Administrator', 'CURRENT_TERM_SET', 'Academic Calendar', req.params.id, 'Set current school term');
    res.json({ success: true, message: 'Current term updated' });
  });

  // ==========================================
  // ATTENDANCE MODULE
  // ==========================================
  app.get('/api/attendance', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { classId, date, studentId } = req.query;
    let list = raw.attendance;
    if (classId) list = list.filter((a) => a.classId === classId);
    if (date) list = list.filter((a) => a.date === date);
    if (studentId) list = list.filter((a) => a.studentId === studentId);
    res.json({ success: true, attendance: list });
  });

  app.post('/api/attendance/batch', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { classId, date, records, recordedBy } = req.body; // records: { studentId, studentName, status, remarks }[]

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid records format' });
    }

    // Remove existing records for this class & date to prevent duplicates
    raw.attendance = raw.attendance.filter((a) => !(a.classId === classId && a.date === date));

    for (const item of records) {
      raw.attendance.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: item.studentId,
        studentName: item.studentName,
        classId,
        date,
        status: item.status || 'Present',
        remarks: item.remarks || '',
        recordedBy: recordedBy || 'Class Teacher',
        academicYearId: raw.settings.activeAcademicYearId,
        termId: raw.settings.currentTermId,
      });
    }

    db.saveData(raw);
    db.logAudit(recordedBy || 'Teacher', 'Teacher', 'ATTENDANCE_MARKED', 'Attendance', `${classId} - ${date}`, `Marked attendance for ${records.length} students`);

    const absentRecords = records.filter((r) => r.status === 'Absent');
    if (absentRecords.length > 0) {
      const sampleNames = absentRecords.slice(0, 3).map((r) => r.studentName).join(', ');
      const overflow = absentRecords.length > 3 ? ` and ${absentRecords.length - 3} others` : '';
      db.addNotification({
        title: `Attendance Alert: ${absentRecords.length} Student(s) Absent (${date})`,
        message: `Pupils marked absent: ${sampleNames}${overflow}. Immediate parent contact recommended.`,
        type: 'attendance',
        targetRoles: ['Teacher', 'Headteacher', 'School Administrator', 'Parent/Guardian'],
        linkTab: 'attendance',
      });
    }

    res.json({ success: true, message: 'Attendance recorded successfully' });
  });

  // ==========================================
  // EXAMINATION & RESULTS MODULE
  // ==========================================
  app.get('/api/assessments', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, assessments: raw.assessments });
  });

  app.get('/api/results', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { classId, subjectId, studentId, termId } = req.query;
    let list = raw.results;
    if (classId) list = list.filter((r) => r.classId === classId);
    if (subjectId) list = list.filter((r) => r.subjectId === subjectId);
    if (studentId) list = list.filter((r) => r.studentId === studentId);
    if (termId) list = list.filter((r) => r.termId === termId);
    res.json({ success: true, results: list });
  });

  app.post('/api/results/batch-save', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { results, updatedBy } = req.body;

    for (const item of results) {
      const totalScore = Number(item.classScore || 0) + Number(item.examScore || 0);
      const gradeInfo = calculateGrade(totalScore, raw.settings.gradingScale);

      const existingIndex = raw.results.findIndex(
        (r) =>
          r.studentId === item.studentId &&
          r.subjectId === item.subjectId &&
          r.termId === (item.termId || raw.settings.currentTermId)
      );

      const resultObj = {
        id: existingIndex !== -1 ? raw.results[existingIndex].id : `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: item.studentId,
        studentName: item.studentName,
        admissionNumber: item.admissionNumber,
        classId: item.classId,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        academicYearId: item.academicYearId || raw.settings.activeAcademicYearId,
        termId: item.termId || raw.settings.currentTermId,
        classScore: Number(item.classScore || 0),
        maxClassScore: 40,
        examScore: Number(item.examScore || 0),
        maxExamScore: 60,
        totalScore,
        grade: gradeInfo.grade,
        remarks: item.remarks || gradeInfo.remarks,
        status: item.status || 'Draft',
        submittedBy: updatedBy,
        submittedAt: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        raw.results[existingIndex] = { ...raw.results[existingIndex], ...resultObj };
      } else {
        raw.results.push(resultObj as any);
      }
    }

    db.saveData(raw);
    db.logAudit(updatedBy || 'Teacher', 'Teacher', 'SCORES_ENTERED', 'Examinations', `${results.length} records`, 'Saved/updated assessment marks');
    res.json({ success: true, message: 'Scores saved successfully' });
  });

  app.post('/api/results/approve', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { resultIds, approvedBy } = req.body;

    raw.results.forEach((r) => {
      if (resultIds.includes(r.id)) {
        r.status = 'Approved';
        r.approvedBy = approvedBy || 'Mr. Emmanuel Mensah (Headteacher)';
        r.approvedAt = new Date().toISOString();
      }
    });

    db.saveData(raw);
    db.logAudit(approvedBy || 'Headteacher', 'Headteacher', 'RESULTS_APPROVED', 'Examinations', `${resultIds.length} records`, 'Approved and locked official result batch');

    db.addNotification({
      title: `Examination Results Released (${resultIds.length} Records)`,
      message: `Headteacher ${approvedBy || 'Emmanuel Mensah'} has formally approved and released student scores. Report cards are now accessible.`,
      type: 'result',
      targetRoles: ['Parent/Guardian', 'Student', 'Teacher', 'Headteacher', 'Academic Coordinator'],
      linkTab: 'report-cards',
    });

    res.json({ success: true, message: 'Results approved successfully' });
  });

  // ==========================================
  // REPORT CARDS MODULE
  // ==========================================
  app.get('/api/report-cards', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { studentId, classId, termId } = req.query;
    let list = raw.reportCards;
    if (studentId) list = list.filter((r) => r.studentId === studentId);
    if (classId) list = list.filter((r) => r.classId === classId);
    if (termId) list = list.filter((r) => r.termId === termId);
    res.json({ success: true, reportCards: list });
  });

  app.post('/api/report-cards/generate', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { studentId, termId } = req.body;

    const student = raw.students.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const studentResults = raw.results.filter((r) => r.studentId === studentId);
    const subjectResults = studentResults.map((r) => ({
      subjectName: r.subjectName,
      classScore: r.classScore,
      examScore: r.examScore,
      totalScore: r.totalScore,
      grade: r.grade,
      remarks: r.remarks,
    }));

    const totalScoreSum = subjectResults.reduce((acc, s) => acc + s.totalScore, 0);
    const average = subjectResults.length ? Math.round((totalScoreSum / subjectResults.length) * 100) / 100 : 0;

    const newReportCard = {
      id: `rep-${Date.now()}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
      admissionNumber: student.admissionNumber,
      classId: student.currentClassId,
      className: student.currentClassName,
      academicYearId: raw.settings.activeAcademicYearId,
      academicYearName: '2026/2027',
      termId: termId || raw.settings.currentTermId,
      termName: 'Term 1',
      attendanceDaysPresent: 14,
      attendanceDaysTotal: 15,
      subjectResults,
      overallAverage: average,
      overallTotal: totalScoreSum,
      positionInClass: '1st out of 35',
      classSize: 35,
      teacherRemarks: 'A very dedicated and hardworking pupil with steady academic leadership.',
      teacherName: 'Class Teacher',
      headteacherRemarks: 'Exceptional academic progress. Commended for exemplary comportment and scholarship.',
      conductRemarks: 'Respectful, punctual, and highly cooperative.',
      interestRemarks: 'Shows keen aptitude in STEM and creative expression.',
      promotionStatus: 'In Progress' as const,
      nextTermBegins: '2027-01-12',
      issuedDate: new Date().toISOString().split('T')[0],
    };

    // Replace if exists
    raw.reportCards = raw.reportCards.filter((r) => !(r.studentId === studentId && r.termId === newReportCard.termId));
    raw.reportCards.unshift(newReportCard);
    db.saveData(raw);

    db.logAudit('Administrator', 'Academic Coordinator', 'REPORT_CARD_GENERATED', 'Report Cards', student.admissionNumber, `Generated digital report card for ${student.firstName} ${student.lastName}`);
    res.json({ success: true, reportCard: newReportCard });
  });

  // ==========================================
  // FEES, PAYMENTS & FINANCE MODULE
  // ==========================================
  app.get('/api/fees/categories', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, feeCategories: raw.feeCategories });
  });

  app.post('/api/fees/categories', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newCat = {
      id: `fee-cat-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      defaultAmount: Number(data.defaultAmount) || 0,
      frequency: data.frequency || 'Termly',
    };
    raw.feeCategories.push(newCat);
    db.saveData(raw);
    db.logAudit('Accountant', 'Accountant', 'FEE_CATEGORY_CREATED', 'Fees & Finance', newCat.name, `Created fee category ${newCat.name}`);
    res.status(201).json({ success: true, feeCategory: newCat });
  });

  app.get('/api/payments', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, payments: raw.payments, receipts: raw.receipts });
  });

  // Transactional payment recording
  app.post('/api/payments', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;

    // Check duplicate payment reference
    if (data.transactionReference) {
      const duplicate = raw.payments.find((p) => p.transactionReference === data.transactionReference);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Transaction reference '${data.transactionReference}' has already been processed previously on receipt ${duplicate.receiptNumber}.`,
        });
      }
    }

    const year = new Date().getFullYear();
    const count = raw.payments.length + 1;
    const receiptNumber = `REC-KJIS-${year}-${String(count).padStart(4, '0')}`;

    const student = raw.students.find((s) => s.id === data.studentId);
    const parent = raw.parents.find((p) => p.id === data.parentId || (student && student.parentIds?.includes(p.id)));

    const amountPaid = Number(data.amount || 0);
    const totalBilled = Number(data.totalBilled || 2800);

    // Calculate previous payments for this student
    const existingPaid = raw.payments
      .filter((p) => p.studentId === data.studentId)
      .reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const previousBalance = Math.max(0, totalBilled - existingPaid);
    const newBalance = Math.max(0, previousBalance - amountPaid);

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      studentId: data.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : data.studentName || 'Student',
      admissionNumber: student ? student.admissionNumber : data.admissionNumber || '',
      parentId: parent ? parent.id : data.parentId,
      parentName: parent ? parent.fullName : data.parentName || 'Parent/Guardian',
      amount: amountPaid,
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Cash',
      transactionReference: data.transactionReference || `TXN-${Date.now().toString(36).toUpperCase()}`,
      feeCategoryId: data.feeCategoryId || 'fee-cat-tuition',
      feeCategoryName: data.feeCategoryName || 'Tuition Fee',
      description: data.description || 'School fees payment',
      status: newBalance === 0 ? 'Paid' : 'Partially Paid',
      academicYearId: raw.settings.activeAcademicYearId,
      termId: raw.settings.currentTermId,
      recordedBy: data.recordedBy || 'Mr. David Antwi (Accountant)',
      createdAt: new Date().toISOString(),
    };

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      paymentId: newPayment.id,
      studentId: newPayment.studentId,
      studentName: newPayment.studentName,
      admissionNumber: newPayment.admissionNumber,
      parentName: newPayment.parentName || 'Parent/Guardian',
      parentPhone: parent ? parent.phone : '',
      className: student ? student.currentClassName : 'Basic School',
      amountPaid,
      totalBilled,
      previousBalance,
      newBalance,
      paymentDate: newPayment.paymentDate,
      paymentMethod: newPayment.paymentMethod,
      transactionReference: newPayment.transactionReference,
      feeCategory: newPayment.feeCategoryName,
      description: newPayment.description,
      authorizedBy: 'Mr. David Antwi (Bursar / Accountant)',
    };

    raw.payments.unshift(newPayment);
    raw.receipts.unshift(newReceipt);
    db.saveData(raw);

    db.logAudit(
      newPayment.recordedBy,
      'Accountant',
      'PAYMENT_RECORDED',
      'Fees & Finance',
      receiptNumber,
      `Received GH₵ ${amountPaid.toFixed(2)} via ${newPayment.paymentMethod} for student ${newPayment.studentName}. Remaining balance: GH₵ ${newBalance.toFixed(2)}`
    );

    db.addNotification({
      title: `Fee Payment Received: GH₵ ${amountPaid.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
      message: `Receipt ${receiptNumber} generated for ${newPayment.studentName}. Remaining balance: GH₵ ${newBalance.toLocaleString('en-GH', { minimumFractionDigits: 2 })}.`,
      type: 'fee',
      targetRoles: ['Parent/Guardian', 'Accountant', 'School Administrator', 'Super Administrator'],
      linkTab: 'payments',
      linkEntityId: newPayment.id,
    });

    res.status(201).json({ success: true, payment: newPayment, receipt: newReceipt });
  });

  app.get('/api/receipts/:id', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const receipt = raw.receipts.find((r) => r.id === req.params.id || r.receiptNumber === req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, receipt });
  });

  app.get('/api/expenses', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, expenses: raw.expenses });
  });

  app.post('/api/expenses', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newExpense = {
      id: `exp-${Date.now()}`,
      title: data.title,
      category: data.category || 'Supplies',
      amount: Number(data.amount || 0),
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Cheque',
      paidTo: data.paidTo || '',
      approvedBy: data.approvedBy || 'Mr. Emmanuel Mensah',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    raw.expenses.unshift(newExpense);
    db.saveData(raw);
    db.logAudit('Accountant', 'Accountant', 'EXPENSE_RECORDED', 'Accounting', data.title, `Recorded expense of GH₵ ${newExpense.amount.toFixed(2)} to ${newExpense.paidTo}`);
    res.status(201).json({ success: true, expense: newExpense });
  });

  // ==========================================
  // TIMETABLES, ASSIGNMENTS & ANNOUNCEMENTS
  // ==========================================
  app.get('/api/timetables', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { classId, teacherId } = req.query;
    let list = raw.timetables;
    if (classId) list = list.filter((t) => t.classId === classId);
    if (teacherId) list = list.filter((t) => t.teacherId === teacherId);
    res.json({ success: true, timetables: list });
  });

  app.post('/api/timetables', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;

    // Conflict detection: Teacher or Room already booked at this day & period
    const conflict = raw.timetables.find(
      (t) =>
        t.dayOfWeek === data.dayOfWeek &&
        t.period === Number(data.period) &&
        (t.teacherId === data.teacherId || t.classroom === data.classroom)
    );

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Timetable conflict detected: ${conflict.teacherName} or ${conflict.classroom} is already scheduled for ${conflict.subjectName} in ${conflict.className} at this time period.`,
      });
    }

    const newEntry = {
      id: `tt-${Date.now()}`,
      classId: data.classId,
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      period: Number(data.period),
      startTime: data.startTime,
      endTime: data.endTime,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      classroom: data.classroom,
    };
    raw.timetables.push(newEntry);
    db.saveData(raw);
    db.logAudit('Academic Coordinator', 'Academic Coordinator', 'TIMETABLE_CREATED', 'Timetable', `${data.className} ${data.dayOfWeek}`, `Added schedule entry`);
    res.status(201).json({ success: true, timetable: newEntry });
  });

  app.get('/api/assignments', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { classId } = req.query;
    let list = raw.assignments;
    if (classId) list = list.filter((a) => a.classId === classId);
    res.json({ success: true, assignments: list });
  });

  app.post('/api/assignments', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newAsn = {
      id: `asn-${Date.now()}`,
      title: data.title,
      classId: data.classId,
      className: data.className,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      instructions: data.instructions,
      deadline: data.deadline,
      status: 'Active' as const,
      createdAt: new Date().toISOString(),
    };
    raw.assignments.unshift(newAsn);
    db.saveData(raw);
    db.logAudit(data.teacherName, 'Teacher', 'ASSIGNMENT_CREATED', 'Assignments', data.title, `Published assignment for ${data.className}`);

    db.addNotification({
      title: `New Assignment: ${newAsn.title}`,
      message: `${newAsn.teacherName} assigned coursework for ${newAsn.className} in ${newAsn.subjectName}. Due by: ${newAsn.deadline}.`,
      type: 'assignment',
      targetRoles: ['Student', 'Parent/Guardian', 'Teacher', 'Headteacher'],
      linkTab: 'assignments',
      linkEntityId: newAsn.id,
    });

    res.status(201).json({ success: true, assignment: newAsn });
  });

  app.get('/api/announcements', (req: Request, res: Response) => {
    const raw = db.getRawData();
    // Normalize existing data for backward compatibility
    const normalizedAnnouncements = (raw.announcements || []).map((anc: any) => ({
      ...anc,
      content: anc.content || anc.message || '',
      targetRoles: anc.targetRoles || (anc.targetAudience ? [anc.targetAudience] : ['All']),
      isUrgent: anc.isUrgent ?? anc.isPinned ?? false,
      createdAt: anc.createdAt || (anc.date ? new Date(anc.date).toISOString() : new Date().toISOString())
    }));
    res.json({ success: true, announcements: normalizedAnnouncements });
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const { title, content, message, targetRoles, targetAudience, authorName, authorRole, isUrgent, isPinned } = req.body;
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      title: title,
      content: content || message,
      targetRoles: targetRoles || (targetAudience ? [targetAudience] : ['All']),
      authorName: authorName || 'School Management',
      authorRole: authorRole || 'Administrator',
      isUrgent: Boolean(isUrgent || isPinned),
      createdAt: new Date().toISOString(),
    };
    raw.announcements.unshift(newAnc);
    db.saveData(raw);
    db.logAudit(newAnc.authorName, 'School Administrator', 'ANNOUNCEMENT_CREATED', 'Announcements', newAnc.title, `Published notice to ${newAnc.targetRoles.join(', ')}`);

    db.addNotification({
      title: `New Announcement: ${newAnc.title}`,
      message: newAnc.content.length > 130 ? newAnc.content.substring(0, 127) + '...' : newAnc.content,
      type: 'announcement',
      targetRoles: newAnc.targetRoles.includes('All') ? ['All'] : newAnc.targetRoles as any[],
      linkTab: 'announcements',
      linkEntityId: newAnc.id,
    });

    res.status(201).json({ success: true, announcement: newAnc });
  });

  // ==========================================
  // LIBRARY MODULE
  // ==========================================
  app.get('/api/library/books', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, books: raw.libraryBooks });
  });

  app.post('/api/library/books', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newBook = {
      id: `book-${Date.now()}`,
      title: data.title,
      author: data.author,
      category: data.category || 'General',
      isbn: data.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      totalCopies: Number(data.totalCopies || 1),
      availableCopies: Number(data.totalCopies || 1),
      shelfLocation: data.shelfLocation || 'Shelf A',
      publishYear: Number(data.publishYear || 2024),
    };
    raw.libraryBooks.push(newBook);
    db.saveData(raw);
    db.logAudit('Librarian', 'Librarian', 'BOOK_CATALOGED', 'Library', newBook.title, `Added book ${newBook.title} by ${newBook.author}`);
    res.status(201).json({ success: true, book: newBook });
  });

  app.get('/api/library/loans', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, loans: raw.libraryLoans });
  });

  app.post('/api/library/borrow', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { bookId, borrowerId, borrowerName, borrowerType, dueDate } = req.body;

    const book = raw.libraryBooks.find((b) => b.id === bookId);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No available copies of this book' });
    }

    book.availableCopies -= 1;
    const loan = {
      id: `loan-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      borrowerType: borrowerType || 'Student',
      borrowerId,
      borrowerName,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || '2026-10-06',
      status: 'Borrowed' as const,
      fineAmount: 0,
      fineStatus: 'None' as const,
    };

    raw.libraryLoans.unshift(loan);
    db.saveData(raw);
    db.logAudit('Librarian', 'Librarian', 'BOOK_BORROWED', 'Library', book.title, `Loaned to ${borrowerName}`);
    res.json({ success: true, loan, message: 'Book issued successfully' });
  });

  app.post('/api/library/return', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const { loanId } = req.body;

    const loan = raw.libraryLoans.find((l) => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan record not found' });
    }

    loan.status = 'Returned';
    loan.returnDate = new Date().toISOString().split('T')[0];

    const book = raw.libraryBooks.find((b) => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    db.saveData(raw);
    db.logAudit('Librarian', 'Librarian', 'BOOK_RETURNED', 'Library', loan.bookTitle, `Returned by ${loan.borrowerName}`);
    res.json({ success: true, message: 'Book marked as returned' });
  });

  // ==========================================
  // DOCUMENTS & AUDIT LOGS
  // ==========================================
  app.get('/api/documents', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, documents: raw.documents });
  });

  app.post('/api/documents', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const data = req.body;
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: data.title,
      category: data.category || 'General',
      fileSize: data.fileSize || '1.2 MB',
      fileType: data.fileType || 'PDF',
      uploadedBy: data.uploadedBy || 'Administrator',
      uploadedAt: new Date().toISOString(),
      accessibleRoles: data.accessibleRoles || ['Super Administrator', 'School Administrator', 'Headteacher', 'Teacher'],
    };
    raw.documents.unshift(newDoc);
    db.saveData(raw);
    db.logAudit(newDoc.uploadedBy, 'School Administrator', 'DOCUMENT_UPLOADED', 'Documents', newDoc.title, 'Uploaded official document');
    res.status(201).json({ success: true, document: newDoc });
  });

  // ==========================================
  // AUDIT LOGS & AUTOMATED ARCHIVAL CLEANUP
  // ==========================================
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const raw = db.getRawData();
    const batches = db.getArchivedBatches();
    const totalArchivedRecords = batches.reduce((sum, b) => sum + (b.recordCount || 0), 0);
    const cutoffMonths = 12;
    const cutoffDate = new Date(Date.now() - cutoffMonths * 30.4375 * 24 * 60 * 60 * 1000).toISOString();

    const olderThan12MonthsCount = raw.auditLogs.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      return !isNaN(t) && t < new Date(cutoffDate).getTime();
    }).length;

    res.json({
      success: true,
      auditLogs: raw.auditLogs,
      stats: {
        totalActive: raw.auditLogs.length,
        totalArchived: totalArchivedRecords,
        archivedBatchesCount: batches.length,
        pendingCleanupCount: olderThan12MonthsCount,
        retentionPolicyMonths: cutoffMonths,
        cutoffDate,
        lastCleanupRun: batches.length > 0 ? batches[0].archivedAt : 'Initial baseline',
        nextScheduledRun: 'Every 24 hours (Automated Retention Task)',
        complianceStandard: 'Ghana Data Protection Act 2012 (Act 843) & MoE Standards',
        automatedTaskActive: true,
      },
      archivedBatches: batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        archivedAt: b.archivedAt,
        cutoffDate: b.cutoffDate,
        recordCount: b.recordCount,
        triggeredBy: b.triggeredBy,
        dateRange: b.dateRange,
        fileSize: b.fileSize,
      })),
    });
  });

  // Automated Cleanup Task execution endpoint
  app.post('/api/audit-logs/archive-cleanup', (req: Request, res: Response) => {
    const { triggeredBy = 'Automated Maintenance Task', cutoffMonths = 12 } = req.body;
    const result = db.runAuditLogCleanup(triggeredBy, Number(cutoffMonths));
    res.json(result);
  });

  // Seed historic logs (>12 months) for testing automated cleanup
  app.post('/api/audit-logs/seed-historic', (req: Request, res: Response) => {
    const result = db.seedHistoricAuditLogs();
    res.json(result);
  });

  // Get archived batches
  app.get('/api/audit-logs/archives', (req: Request, res: Response) => {
    const batches = db.getArchivedBatches();
    res.json({ success: true, batches });
  });

  // Get specific archived batch with full logs
  app.get('/api/audit-logs/archives/:id', (req: Request, res: Response) => {
    const batch = db.getArchivedBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Archived batch not found' });
    }
    res.json({ success: true, batch });
  });

  // ==========================================
  // IN-APP NOTIFICATIONS MODULE
  // ==========================================
  app.get('/api/notifications', (req: Request, res: Response) => {
    const { role, userId, includeDismissed } = req.query;
    const notifications = db.getNotifications(
      role as string | undefined,
      userId as string | undefined,
      includeDismissed === 'true'
    );
    const unreadCount = notifications.filter((n) => !n.isRead && !n.isDismissed).length;
    res.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  });

  app.post('/api/notifications', (req: Request, res: Response) => {
    const data = req.body;
    const notif = db.addNotification({
      title: data.title,
      message: data.message,
      type: data.type || 'announcement',
      targetRoles: data.targetRoles || ['All'],
      userId: data.userId,
      linkTab: data.linkTab,
      linkEntityId: data.linkEntityId,
    });
    res.status(201).json({ success: true, notification: notif });
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const success = db.markNotificationRead(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read' });
  });

  app.patch('/api/notifications/:id/dismiss', (req: Request, res: Response) => {
    const success = db.dismissNotification(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification dismissed' });
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const { role, userId } = req.body;
    const count = db.markAllNotificationsRead(role, userId);
    res.json({ success: true, markedCount: count });
  });

  app.post('/api/notifications/dismiss-all', (req: Request, res: Response) => {
    const { role, userId } = req.body;
    const count = db.dismissAllNotifications(role, userId);
    res.json({ success: true, dismissedCount: count });
  });

  // Programmatic event trigger endpoint for the 7 key events
  app.post('/api/notifications/trigger-event', (req: Request, res: Response) => {
    const { eventType, customTitle, customMessage, targetRole, studentName, amount } = req.body;

    let title = customTitle || '';
    let message = customMessage || '';
    let type = eventType || 'announcement';
    let targetRoles: any[] = targetRole ? [targetRole] : ['All'];
    let linkTab: string | undefined = undefined;

    switch (eventType) {
      case 'admission':
        type = 'admission';
        title = title || `New Admission Application: ${studentName || 'Kofi Asare'}`;
        message = message || `New application received for Basic 1. Entrance assessment scheduled for next Monday.`;
        targetRoles = ['Super Administrator', 'School Administrator', 'Headteacher', 'Admissions Officer'];
        linkTab = 'admissions';
        break;

      case 'fee':
        type = 'fee';
        title = title || `Fee Payment Received: GH₵ ${Number(amount || 1500).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
        message = message || `Receipt REC-KJIS-${new Date().getFullYear()}-0089 issued for ${studentName || 'Kwame Darko'}. Bank transfer verified.`;
        targetRoles = ['Parent/Guardian', 'Accountant', 'School Administrator', 'Super Administrator'];
        linkTab = 'payments';
        break;

      case 'fee_overdue':
        type = 'fee_overdue';
        title = title || `Overdue Fee Advisory: Term 1 Arrears`;
        message = message || `Fee balance of GH₵ ${Number(amount || 850).toLocaleString('en-GH', { minimumFractionDigits: 2 })} for ${studentName || 'Kwame Darko'} is 14 days overdue. Please settle promptly.`;
        targetRoles = ['Parent/Guardian', 'Accountant', 'School Administrator'];
        linkTab = 'fees';
        break;

      case 'announcement':
        type = 'announcement';
        title = title || `New Announcement: Inter-School Cultural & Drama Festival`;
        message = message || `The 2026/2027 Greater Accra Private Schools Cultural Festival will be hosted on our campus on Oct 28.`;
        targetRoles = ['All'];
        linkTab = 'announcements';
        break;

      case 'result':
        type = 'result';
        title = title || `Examination Results Released: Basic 5 & 6`;
        message = message || `Term 1 continuous assessment and terminal examination results have been verified by the Headteacher and published.`;
        targetRoles = ['Parent/Guardian', 'Student', 'Teacher', 'Headteacher', 'Academic Coordinator'];
        linkTab = 'report-cards';
        break;

      case 'assignment':
        type = 'assignment';
        title = title || `Assignment Submission: Computing & Coding Project`;
        message = message || `Pupil ${studentName || 'Kwame Darko'} submitted project "Scratch Animation" for Basic 5. Ready for review.`;
        targetRoles = ['Teacher', 'Headteacher', 'Parent/Guardian'];
        linkTab = 'assignments';
        break;

      case 'attendance':
        type = 'attendance';
        title = title || `Attendance Alert: Unexcused Absence`;
        message = message || `Pupil ${studentName || 'Kelvin Mensah'} was marked Absent today without prior notice from parent/guardian.`;
        targetRoles = ['Parent/Guardian', 'Teacher', 'Headteacher', 'School Administrator'];
        linkTab = 'attendance';
        break;
    }

    const notif = db.addNotification({
      title,
      message,
      type,
      targetRoles,
      linkTab,
    });

    res.status(201).json({ success: true, notification: notif, message: `Notification generated for event '${eventType}'` });
  });

  // ==========================================
  // SYSTEM SETTINGS & BACKUP
  // ==========================================
  app.get('/api/settings', (req: Request, res: Response) => {
    const raw = db.getRawData();
    res.json({ success: true, settings: raw.settings });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const raw = db.getRawData();
    raw.settings = { ...raw.settings, ...req.body };
    db.saveData(raw);
    db.logAudit('School Administrator', 'School Administrator', 'SETTINGS_UPDATED', 'System Settings', 'School Configuration', 'Modified institutional parameters');
    res.json({ success: true, settings: raw.settings });
  });

  app.get('/api/database/schema-sql', (req: Request, res: Response) => {
    const sql = db.generateSqlDump();
    res.setHeader('Content-Type', 'text/plain');
    res.send(sql);
  });

  app.post('/api/backup/download', (req: Request, res: Response) => {
    const raw = db.getRawData();
    raw.settings.backupLastInitiated = new Date().toISOString();
    db.saveData(raw);
    db.logAudit('School Administrator', 'School Administrator', 'DATABASE_BACKUP', 'System Settings', 'Full Database', 'Initiated snapshot export');
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      school: 'KOBBI JAY INTERNATIONAL SCHOOL',
      data: raw,
    });
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const { backupData } = req.body;
    if (!backupData || !backupData.students || !backupData.classes) {
      return res.status(400).json({ success: false, message: 'Invalid backup file structure' });
    }
    db.saveData(backupData);
    db.logAudit('School Administrator', 'School Administrator', 'DATABASE_RESTORED', 'System Settings', 'Full Database', 'Restored data from external backup');
    res.json({ success: true, message: 'Database restored successfully' });
  });

  app.post('/api/backup/reset-demo', (req: Request, res: Response) => {
    db.resetToDemo();
    db.logAudit('School Administrator', 'School Administrator', 'DATABASE_RESET', 'System Settings', 'Full Database', 'Re-seeded database with original sample data');
    res.json({ success: true, message: 'Database reset to demo state successfully' });
  });

  // ==========================================
  // ROLES & LOGIN CREDENTIALS MANAGEMENT
  // Exclusive Authority: School Administrator (Mr. Joseph Amponsah)
  // ==========================================
  app.get('/api/roles-management', (req: Request, res: Response) => {
    const roles = db.getRoles();
    const users = db.getUsersWithCredentials();
    res.json({
      success: true,
      roles,
      users,
      authorizedAdministrator: 'Mr. Joseph Amponsah',
    });
  });

  app.post('/api/roles-management/roles', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.body.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Under institutional policy, only the School Administrator or Super Administrator is authorized to add roles.',
      });
    }

    const { name, description, modules, responsibilities } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }

    const result = db.addRole({ name, description, modules, responsibilities });
    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'ROLE_CREATED',
      'Roles & Access Control',
      name.trim(),
      `Created role "${name.trim()}" with modules: ${(modules || []).join(', ')}`
    );

    res.json({ success: true, role: result.role, message: result.message });
  });

  app.delete('/api/roles-management/roles/:roleName', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.query.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Under institutional policy, only the School Administrator or Super Administrator is authorized to remove roles.',
      });
    }

    const { roleName } = req.params;
    const result = db.removeRole(decodeURIComponent(roleName));
    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'ROLE_REMOVED',
      'Roles & Access Control',
      decodeURIComponent(roleName),
      `Removed role "${decodeURIComponent(roleName)}" from system directory`
    );

    res.json(result);
  });

  app.post('/api/roles-management/users', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.body.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Under institutional policy, only the School Administrator or Super Administrator is authorized to create login details for roles.',
      });
    }

    const { fullName, username, email, role, password, phone, associatedId } = req.body;
    if (!fullName || !username || !email || !role) {
      return res.status(400).json({ success: false, message: 'Full name, username, email, and role are required.' });
    }

    const result = db.createUserLogin({
      fullName,
      username,
      email,
      role,
      password,
      phone,
      associatedId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'LOGIN_CREDENTIALS_PROVISIONED',
      'Roles & Access Control',
      username.toLowerCase().trim(),
      `Provisioned login credentials for ${fullName} with role "${role}"`
    );

    res.json(result);
  });

  app.delete('/api/roles-management/users/:id', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.query.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only the School Administrator or Super Administrator is authorized to revoke user login accounts.',
      });
    }

    const { id } = req.params;
    const result = db.removeUserLogin(id);
    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'LOGIN_CREDENTIALS_REVOKED',
      'Roles & Access Control',
      id,
      `Revoked user login credentials for account ID ${id}`
    );

    res.json(result);
  });

  app.put('/api/roles-management/users/:id', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.body.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only the School Administrator or Super Administrator is authorized to modify login credentials.',
      });
    }

    const { id } = req.params;
    const result = db.updateUserLogin(id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'LOGIN_CREDENTIALS_MODIFIED',
      'Roles & Access Control',
      id,
      `Updated login credentials for user account ID ${id}`
    );

    res.json(result);
  });

  app.post('/api/roles-management/users/:id/reset-password', (req: Request, res: Response) => {
    const requestingRole = req.headers['x-user-role'] || req.body.requestingRole;
    if (requestingRole !== 'School Administrator' && requestingRole !== 'Super Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only the School Administrator or Super Administrator is authorized to reset role passwords.',
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const result = db.resetUserPassword(id, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }

    db.logAudit(
      'Mr. Joseph Amponsah',
      'School Administrator',
      'PASSWORD_RESET_PROVISIONED',
      'Roles & Access Control',
      id,
      `Generated new password credentials for account ID ${id}`
    );

    res.json(result);
  });

  // ==========================================
  // VITE OR STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // AUTOMATED AUDIT LOG CLEANUP TASK RUNNER
  // Archives logs older than 12 months for compliance
  // ==========================================
  try {
    const startupCleanup = db.runAuditLogCleanup('Automated Task (Startup Verification)', 12);
    if (startupCleanup.archivedCount > 0) {
      console.log(`[Audit Cleanup Task] ${startupCleanup.message}`);
    }
  } catch (err) {
    console.error('[Audit Cleanup Task] Startup cleanup error:', err);
  }

  // Schedule automated cleanup task to run periodically (every 12 hours)
  setInterval(() => {
    try {
      const scheduledResult = db.runAuditLogCleanup('Automated Task (Scheduled 12h Cron)', 12);
      if (scheduledResult.archivedCount > 0) {
        console.log(`[Audit Cleanup Task] ${scheduledResult.message}`);
      }
    } catch (err) {
      console.error('[Audit Cleanup Task] Periodic cleanup error:', err);
    }
  }, 12 * 60 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kobbi Jay International School SDMS running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
