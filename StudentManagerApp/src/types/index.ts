export type AcademyName = string;

export interface Student {
  id: string;
  name: string;
  roll?: string;
  academy?: string;
  classes?: string[];
  klass?: string;
  division?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  color?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  maxMarks: number;
  passMarks?: number;
  color?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface MarkRecord {
  id: string;
  studentId: string;
  subjectId: string;
  exam: string;
  date: string;
  obtained: number | string;
  maxMarks: number;
  grade?: string;
  remarks?: string;
}

export interface ScheduleClass {
  id: string;
  title: string;
  subjectId?: string;
  classGroup?: string;
  academy?: string;
  date?: string;
  recurring?: 'once' | 'weekly';
  start?: string; // HH:MM
  end?: string;   // HH:MM
  room?: string;
  meetLink?: string;
}

export interface GradeBand {
  min: number;
  grade: string;
}

export interface AttendanceRule {
  threshold: number;   // e.g. 50
  bonusMarks: number;  // e.g. 20
  penaltyMarks: number;// e.g. 0
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  appName: string;
  defaultClass: string;
  academicYear: string;
  academies: string[];
  classList: string[];
  grades: GradeBand[];
  notifications: boolean;
  defaultReminder: number;
  sound: boolean;
  attendanceRule: AttendanceRule;
}

export interface AppState {
  students: Student[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  marks: MarkRecord[];
  classes: ScheduleClass[];
  settings: AppSettings;
}

export type NavView =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'marks'
  | 'schedule'
  | 'percentage'
  | 'reports'
  | 'settings';
