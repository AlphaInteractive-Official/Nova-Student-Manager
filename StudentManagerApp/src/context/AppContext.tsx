import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Student, Subject, AttendanceRecord, MarkRecord, ScheduleClass, AppSettings, NavView } from '../types';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';

const STORAGE_KEY = 'nova_student_manager_rn_v1';

const defaultSettings: AppSettings = {
  theme: 'dark',
  appName: 'Student Manager Hub',
  defaultClass: 'Arbi Awwal',
  academicYear: '2025-2026',
  academies: [
    'AL Momina Online Islamic Academy',
    'Dare Arqam Online Islamic Academy',
  ],
  classList: [
    'Arbi Awwal',
    'Arbi Duwwam',
    'Arbi Chahrum',
    'Arabic Grammar (Morning Batch)',
    'Arabic Grammar (Evening Batch)',
  ],
  grades: [
    { min: 90, grade: 'A+' },
    { min: 80, grade: 'A' },
    { min: 70, grade: 'B' },
    { min: 60, grade: 'C' },
    { min: 50, grade: 'D' },
    { min: 40, grade: 'E' },
    { min: 0, grade: 'F' },
  ],
  notifications: false,
  defaultReminder: 5,
  sound: true,
  attendanceRule: {
    threshold: 50,
    bonusMarks: 20,
    penaltyMarks: 0,
  },
};

const defaultSubjects: Subject[] = [
  { id: 'sub_arb_gram', name: 'عربی گرامر (Arabic Grammar)', maxMarks: 100, passMarks: 40, color: '#4f46e5' },
  { id: 'sub_arb_awwal', name: 'عربی اول (Arbi Awwal)', maxMarks: 100, passMarks: 40, color: '#0f9d6e' },
  { id: 'sub_tajweed', name: 'تجوید القرآن (Tajweed)', maxMarks: 50, passMarks: 20, color: '#e0405a' },
  { id: 'sub_tarjuma', name: 'ترجمۃ القرآن (Translation)', maxMarks: 100, passMarks: 40, color: '#d98a06' },
];

const initialState: AppState = {
  students: [
    {
      id: 'STU-0001',
      name: 'Fatima Zahra',
      roll: '101',
      academy: 'AL Momina Online Islamic Academy',
      classes: ['Arbi Awwal', 'Arabic Grammar (Morning Batch)'],
      phone: '+91 98765 43210',
      email: 'fatima@example.com',
      color: '#4f46e5',
    },
    {
      id: 'STU-0002',
      name: 'Aisha Siddiqua',
      roll: '102',
      academy: 'Dare Arqam Online Islamic Academy',
      classes: ['Arbi Duwwam'],
      phone: '+91 98765 43211',
      email: 'aisha@example.com',
      color: '#0f9d6e',
    },
  ],
  subjects: defaultSubjects,
  attendance: [],
  marks: [],
  classes: [],
  settings: defaultSettings,
};

interface AppContextType {
  state: AppState;
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  // Student Actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  // Attendance Actions
  markAttendance: (studentId: string, date: string, status: AttendanceRecord['status'], note?: string) => void;
  bulkMarkAttendance: (date: string, status: AttendanceRecord['status'], studentIds: string[]) => void;
  // Marks Actions
  saveMark: (studentId: string, subjectId: string, exam: string, obtained: number | string, maxMarks: number) => void;
  // Subject Actions
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  // Data actions
  loadDemoData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state from AsyncStorage
  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({
            students: Array.isArray(parsed.students) ? parsed.students : prev.students,
            subjects: Array.isArray(parsed.subjects) && parsed.subjects.length ? parsed.subjects : prev.subjects,
            attendance: Array.isArray(parsed.attendance) ? parsed.attendance : prev.attendance,
            marks: Array.isArray(parsed.marks) ? parsed.marks : prev.marks,
            classes: Array.isArray(parsed.classes) ? parsed.classes : prev.classes,
            settings: {
              ...defaultSettings,
              ...(parsed.settings || {}),
              attendanceRule: {
                ...defaultSettings.attendanceRule,
                ...((parsed.settings && parsed.settings.attendanceRule) || {}),
              },
            },
          }));
        }
      } catch (err) {
        console.error('Failed to load storage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  // Save state to AsyncStorage
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) => {
      console.error('Failed to persist state:', err);
    });
  }, [state, isLoaded]);

  const isDark = state.settings.theme === 'dark';
  const theme = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const addStudent = (st: Omit<Student, 'id'>) => {
    setState((prev) => {
      let maxNum = 0;
      prev.students.forEach((s) => {
        const match = /^STU-(\d+)$/.exec(s.id || '');
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
      });
      const newId = 'STU-' + String(maxNum + 1).padStart(4, '0');
      return {
        ...prev,
        students: [...prev.students, { ...st, id: newId }],
      };
    });
  };

  const updateStudent = (st: Student) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === st.id ? st : s)),
    }));
  };

  const deleteStudent = (id: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      attendance: prev.attendance.filter((a) => a.studentId !== id),
      marks: prev.marks.filter((m) => m.studentId !== id),
    }));
  };

  const markAttendance = (
    studentId: string,
    date: string,
    status: AttendanceRecord['status'],
    note?: string
  ) => {
    setState((prev) => {
      const filtered = prev.attendance.filter((a) => !(a.studentId === studentId && a.date === date));
      const newRecord: AttendanceRecord = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        studentId,
        date,
        status,
        note,
      };
      return {
        ...prev,
        attendance: [...filtered, newRecord],
      };
    });
  };

  const bulkMarkAttendance = (
    date: string,
    status: AttendanceRecord['status'],
    studentIds: string[]
  ) => {
    setState((prev) => {
      const idSet = new Set(studentIds);
      const filtered = prev.attendance.filter((a) => !(idSet.has(a.studentId) && a.date === date));
      const added: AttendanceRecord[] = studentIds.map((sid) => ({
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        studentId: sid,
        date,
        status,
      }));
      return {
        ...prev,
        attendance: [...filtered, ...added],
      };
    });
  };

  const saveMark = (
    studentId: string,
    subjectId: string,
    exam: string,
    obtained: number | string,
    maxMarks: number
  ) => {
    setState((prev) => {
      const filtered = prev.marks.filter(
        (m) => !(m.studentId === studentId && m.subjectId === subjectId && (m.exam || '') === exam)
      );
      if (obtained === '' || obtained === null || obtained === undefined) {
        return { ...prev, marks: filtered };
      }
      const newRecord: MarkRecord = {
        id: 'mk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        studentId,
        subjectId,
        exam,
        date: new Date().toISOString().slice(0, 10),
        obtained: Number(obtained),
        maxMarks,
      };
      return {
        ...prev,
        marks: [...filtered, newRecord],
      };
    });
  };

  const addSubject = (sb: Omit<Subject, 'id'>) => {
    setState((prev) => {
      const newId = 'sub_' + Date.now().toString(36);
      return {
        ...prev,
        subjects: [...prev.subjects, { ...sb, id: newId }],
      };
    });
  };

  const updateSubject = (sb: Subject) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === sb.id ? sb : s)),
    }));
  };

  const deleteSubject = (id: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      marks: prev.marks.filter((m) => m.subjectId !== id),
    }));
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...partial,
        attendanceRule: {
          ...prev.settings.attendanceRule,
          ...(partial.attendanceRule || {}),
        },
      },
    }));
  };

  const loadDemoData = () => {
    // Generate realistic Islamic academy demo data
    const demoStudents: Student[] = [
      {
        id: 'STU-0001',
        name: 'Fatima Zahra',
        roll: '101',
        academy: 'AL Momina Online Islamic Academy',
        classes: ['Arbi Awwal', 'Arabic Grammar (Morning Batch)'],
        phone: '+91 98765 43210',
        email: 'fatima@example.com',
        color: '#4f46e5',
      },
      {
        id: 'STU-0002',
        name: 'Aisha Siddiqua',
        roll: '102',
        academy: 'AL Momina Online Islamic Academy',
        classes: ['Arbi Duwwam'],
        phone: '+91 98765 43211',
        email: 'aisha@example.com',
        color: '#0f9d6e',
      },
      {
        id: 'STU-0003',
        name: 'Zainab Bint Ali',
        roll: '103',
        academy: 'Dare Arqam Online Islamic Academy',
        classes: ['Arbi Chahrum', 'Arabic Grammar (Evening Batch)'],
        phone: '+91 98765 43212',
        email: 'zainab@example.com',
        color: '#e0405a',
      },
      {
        id: 'STU-0004',
        name: 'Maryam Al-Batool',
        roll: '104',
        academy: 'Dare Arqam Online Islamic Academy',
        classes: ['Arbi Awwal'],
        phone: '+91 98765 43213',
        email: 'maryam@example.com',
        color: '#d98a06',
      },
      {
        id: 'STU-0005',
        name: 'Khadijah Kubra',
        roll: '105',
        academy: 'AL Momina Online Islamic Academy',
        classes: ['Arabic Grammar (Morning Batch)'],
        phone: '+91 98765 43214',
        email: 'khadijah@example.com',
        color: '#2f7fe0',
      },
    ];

    // Populate month attendance records
    const demoAtt: AttendanceRecord[] = [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMo = now.getMonth() + 1;
    for (let d = 1; d <= 20; d++) {
      const ds = `${curYear}-${curMo < 10 ? '0' + curMo : curMo}-${d < 10 ? '0' + d : d}`;
      demoStudents.forEach((st, sIdx) => {
        const statuses: AttendanceRecord['status'][] = ['present', 'present', 'present', 'leave', 'absent'];
        const chosen = statuses[(d + sIdx) % statuses.length];
        demoAtt.push({
          id: `demo_att_${d}_${st.id}`,
          studentId: st.id,
          date: ds,
          status: chosen,
        });
      });
    }

    // Populate marks
    const demoMarks: MarkRecord[] = [];
    demoStudents.forEach((st) => {
      defaultSubjects.forEach((sub, subIdx) => {
        const scores = [88, 92, 74, 85, 95, 68];
        const obt = scores[(parseInt(st.roll || '1', 10) + subIdx) % scores.length];
        demoMarks.push({
          id: `demo_mk_${st.id}_${sub.id}`,
          studentId: st.id,
          subjectId: sub.id,
          exam: 'Final Term',
          date: now.toISOString().slice(0, 10),
          obtained: Math.min(sub.maxMarks, obt),
          maxMarks: sub.maxMarks,
        });
      });
    });

    setState((prev) => ({
      ...prev,
      students: demoStudents,
      attendance: demoAtt,
      marks: demoMarks,
    }));
  };

  const clearAllData = () => {
    setState({
      students: [],
      subjects: defaultSubjects,
      attendance: [],
      marks: [],
      classes: [],
      settings: defaultSettings,
    });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        currentView,
        setCurrentView,
        theme,
        isDark,
        toggleTheme,
        addStudent,
        updateStudent,
        deleteStudent,
        markAttendance,
        bulkMarkAttendance,
        saveMark,
        addSubject,
        updateSubject,
        deleteSubject,
        updateSettings,
        loadDemoData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
