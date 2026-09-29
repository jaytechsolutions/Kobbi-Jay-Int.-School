import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Sidebar, type NavTab } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentManagement } from './components/StudentManagement';
import { AdmissionsModule } from './components/AdmissionsModule';
import { AttendanceModule } from './components/AttendanceModule';
import { ExaminationsAndResults } from './components/ExaminationsAndResults';
import { ReportCardModule } from './components/ReportCardModule';
import { FeesAndFinance } from './components/FeesAndFinance';
import { ClassesAndSubjects } from './components/ClassesAndSubjects';
import { StaffManagement } from './components/StaffManagement';
import { ParentsDirectory } from './components/ParentsDirectory';
import { AnnouncementsModule } from './components/AnnouncementsModule';
import { SecurityAndAudit } from './components/SecurityAndAudit';
import { RolesAndPermissions } from './components/RolesAndPermissions';
import { AcademicYearModule } from './components/AcademicYearModule';
import { TimetableModule } from './components/TimetableModule';
import { AssignmentsModule } from './components/AssignmentsModule';
import { LibraryModule } from './components/LibraryModule';
import { DocumentsModule } from './components/DocumentsModule';
import type { UserRole, User } from './types';

export default function App() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('School Administrator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | undefined>(undefined);
  const [selectedReceiptForFinance, setSelectedReceiptForFinance] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setSessionUser(user);
        setAuthLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Inactivity Timer (10 minutes)
  useEffect(() => {
    if (!sessionUser) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSignOut();
      }, INACTIVITY_LIMIT);
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Start timer initially

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [sessionUser]);

  // Construct current simulated user based on active role and auth state
  const currentUser: User = {
    id: sessionUser?.uid || 'user-active',
    username: sessionUser?.email?.split('@')[0] || userRole.toLowerCase().replace(/[^a-z]/g, '_'),
    fullName:
      userRole === 'School Administrator'
        ? 'Mr. Joseph Amponsah'
        : userRole === 'Headteacher'
        ? 'Mr. Emmanuel Mensah'
        : userRole === 'Teacher'
        ? 'Mr. Kwame Asante'
        : userRole === 'Accountant'
        ? 'Mrs. Grace Osei'
        : userRole === 'Academic Coordinator'
        ? 'Mrs. Beatrice Osei'
        : userRole === 'Parent/Guardian'
        ? 'Dr. Kwame Mensah'
        : userRole === 'Student'
        ? 'Kelvin Mensah'
        : 'Staff User',
    email: sessionUser?.email || 'admin@kobbijay.edu.gh',
    role: userRole,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  };

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'Accountant') {
      setCurrentTab('fees');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleNavigate = (tab: string, entityId?: string) => {
    const navTab = tab as NavTab;
    if (navTab === 'report-cards' && entityId) {
      setSelectedStudentForReport(entityId);
    }
    if ((navTab === 'fees' || navTab === 'payments') && entityId) {
      setSelectedReceiptForFinance(entityId);
    }
    setCurrentTab(navTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReceipt = (receiptNumber: string) => {
    setSelectedReceiptForFinance(receiptNumber);
    setCurrentTab('payments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500">Initializing School Portal...</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return <Login onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-amber-100 selection:text-amber-900 transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenMobileMenu={() => setIsSidebarOpen((prev) => !prev)}
        onSwitchRole={handleRoleChange}
        onSignOut={handleSignOut}
        onQuickActionClick={() => setCurrentTab('admissions')}
        onNavigateTab={(tab, entityId) => handleNavigate(tab as NavTab, entityId)}
        onSearch={(query) => {
          if (query.trim().length > 0) {
            setCurrentTab('students');
          }
        }}
        academicYearName="2026/2027"
        currentTermName="Term 1 (First Term)"
      />

      <div className="flex">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsSidebarOpen(false);
          }}
          userRole={userRole}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {currentTab === 'dashboard' && (
            <AdminDashboard
              userRole={userRole}
              onNavigate={handleNavigate}
              onOpenReceipt={handleOpenReceipt}
              onOpenNewPayment={() => setCurrentTab('payments')}
              onOpenNewStudent={() => setCurrentTab('admissions')}
            />
          )}

          {currentTab === 'students' && (
            <StudentManagement userRole={userRole} onOpenReceipt={handleOpenReceipt} />
          )}

          {currentTab === 'admissions' && <AdmissionsModule userRole={userRole} />}

          {currentTab === 'parents' && (
            <ParentsDirectory 
              userRole={userRole}
              onNavigateToStudent={(id) => handleNavigate('students', id)} 
            />
          )}

          {currentTab === 'attendance' && <AttendanceModule userRole={userRole} />}

          {currentTab === 'examinations' && (
            <ExaminationsAndResults userRole={userRole} />
          )}

          {currentTab === 'announcements' && (
            <AnnouncementsModule userRole={userRole} />
          )}

          {(currentTab === 'report-cards' || currentTab === 'reports') && (
            <ReportCardModule userRole={userRole} initialStudentId={selectedStudentForReport} />
          )}

          {(currentTab === 'fees' || currentTab === 'payments' || currentTab === 'expenses') && (
            <FeesAndFinance userRole={userRole} initialReceiptNumber={selectedReceiptForFinance} />
          )}

          {(currentTab === 'classes' || currentTab === 'subjects') && <ClassesAndSubjects userRole={userRole} />}

          {(currentTab === 'staff' || currentTab === 'teachers') && <StaffManagement userRole={userRole} />}

          {currentTab === 'academic-calendar' && <AcademicYearModule />}

          {currentTab === 'timetable' && <TimetableModule />}

          {currentTab === 'assignments' && <AssignmentsModule />}

          {currentTab === 'library' && <LibraryModule userRole={userRole} />}

          {currentTab === 'documents' && <DocumentsModule userRole={userRole} />}

          {currentTab === 'roles-permissions' && (
            <RolesAndPermissions
              userRole={userRole}
              onNavigateTab={handleNavigate}
              onSwitchToAdmin={() => handleRoleChange('School Administrator')}
            />
          )}

          {(currentTab === 'audit-logs' || currentTab === 'settings') && (
            <SecurityAndAudit userRole={userRole} onNavigateTab={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}
