/**
 * DataProtectionManager
 * Provides zero-data-loss protection, pre-migration snapshots, integrity verification,
 * and safeguards against accidental replacement of populated student data with empty states.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256 } from '../updates/sha256';

export const CANONICAL_STORAGE_KEY = '@smh_permanent_storage_v1';
export const MIGRATION_BACKUP_KEY = '@smh_migration_backup_v1';
export const ROLLBACK_COPY_KEY = '@smh_rollback_copy_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export interface DataIntegrityStats {
  studentCount: number;
  subjectCount: number;
  attendanceCount: number;
  marksCount: number;
  classesCount: number;
  checksum: string;
}

export interface MigrationSnapshot {
  backupFormatVersion: number;
  schemaVersion: number;
  appVersion: string;
  timestamp: string;
  reason: string;
  stats: DataIntegrityStats;
  data: any;
}

export interface VerificationResult {
  valid: boolean;
  errors: string[];
  stats: DataIntegrityStats;
}

export class DataProtectionManager {
  /**
   * Computes summary stats and SHA-256 checksum for a state object.
   */
  static computeStats(state: any): DataIntegrityStats {
    if (!state || typeof state !== 'object') {
      return {
        studentCount: 0,
        subjectCount: 0,
        attendanceCount: 0,
        marksCount: 0,
        classesCount: 0,
        checksum: sha256(''),
      };
    }

    const students = Array.isArray(state.students) ? state.students : [];
    const subjects = Array.isArray(state.subjects) ? state.subjects : [];
    const attendance = Array.isArray(state.attendance) ? state.attendance : [];
    const marks = Array.isArray(state.marks) ? state.marks : [];
    const classes = Array.isArray(state.classes) ? state.classes : [];

    const serialized = JSON.stringify({
      students,
      subjects,
      attendance,
      marks,
      classes,
      settings: state.settings || {},
    });

    return {
      studentCount: students.length,
      subjectCount: subjects.length,
      attendanceCount: attendance.length,
      marksCount: marks.length,
      classesCount: classes.length,
      checksum: sha256(serialized),
    };
  }

  /**
   * Validates state data structure and internal relationships.
   */
  static validateState(state: any): VerificationResult {
    const errors: string[] = [];

    if (!state || typeof state !== 'object') {
      errors.push('State payload must be a non-null object.');
      return {
        valid: false,
        errors,
        stats: this.computeStats(null),
      };
    }

    if (!Array.isArray(state.students)) errors.push('state.students must be an array.');
    if (!Array.isArray(state.subjects)) errors.push('state.subjects must be an array.');
    if (!Array.isArray(state.attendance)) errors.push('state.attendance must be an array.');
    if (!Array.isArray(state.marks)) errors.push('state.marks must be an array.');
    if (!Array.isArray(state.classes)) errors.push('state.classes must be an array.');
    if (!state.settings || typeof state.settings !== 'object') errors.push('state.settings must be an object.');

    // Check student IDs uniqueness
    if (Array.isArray(state.students)) {
      const idSet = new Set<string>();
      state.students.forEach((s: any, idx: number) => {
        if (!s || !s.id) {
          errors.push(`Student at index ${idx} is missing a valid ID.`);
        } else if (idSet.has(s.id)) {
          errors.push(`Duplicate student ID detected: ${s.id}`);
        } else {
          idSet.add(s.id);
        }
      });
    }

    const stats = this.computeStats(state);
    return {
      valid: errors.length === 0,
      errors,
      stats,
    };
  }

  /**
   * CRITICAL REQUIREMENT: Never replace existing populated data with empty data.
   * Returns true if safe, or false if incoming data would cause accidental data loss.
   */
  static isSafeToOverwrite(currentState: any, incomingState: any): { safe: boolean; reason?: string } {
    if (!currentState) return { safe: true };

    const currentStats = this.computeStats(currentState);
    const incomingStats = this.computeStats(incomingState);

    // If current storage has students, but incoming has zero students:
    if (currentStats.studentCount > 0 && incomingStats.studentCount === 0) {
      return {
        safe: false,
        reason: `Refusing sync: Incoming state has 0 students, but current device storage has ${currentStats.studentCount} students.`,
      };
    }

    // If current storage has attendance, but incoming has zero attendance:
    if (currentStats.attendanceCount > 0 && incomingStats.attendanceCount === 0 && currentStats.studentCount > 0) {
      return {
        safe: false,
        reason: `Refusing sync: Incoming state has 0 attendance records, but current device storage has ${currentStats.attendanceCount} records.`,
      };
    }

    // If current storage has marks, but incoming has zero marks:
    if (currentStats.marksCount > 0 && incomingStats.marksCount === 0 && currentStats.studentCount > 0) {
      return {
        safe: false,
        reason: `Refusing sync: Incoming state has 0 marks records, but current device storage has ${currentStats.marksCount} marks.`,
      };
    }

    return { safe: true };
  }

  /**
   * Creates an immutable pre-migration snapshot in AsyncStorage before major updates.
   */
  static async createMigrationBackup(appVersion: string, reason: string): Promise<MigrationSnapshot | null> {
    try {
      const rawCurrent = await AsyncStorage.getItem(CANONICAL_STORAGE_KEY);
      if (!rawCurrent) return null;

      const parsed = JSON.parse(rawCurrent);
      const stats = this.computeStats(parsed);

      const snapshot: MigrationSnapshot = {
        backupFormatVersion: 1,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        appVersion: appVersion || '1.1.04',
        timestamp: new Date().toISOString(),
        reason,
        stats,
        data: parsed,
      };

      const snapshotStr = JSON.stringify(snapshot);
      await AsyncStorage.setItem(MIGRATION_BACKUP_KEY, snapshotStr);
      await AsyncStorage.setItem(ROLLBACK_COPY_KEY, snapshotStr);
      console.log(`[DataProtection] Created migration backup: ${stats.studentCount} students, ${stats.attendanceCount} att, ${stats.marksCount} marks.`);
      return snapshot;
    } catch (err) {
      console.error('[DataProtection] Failed to create migration backup:', err);
      return null;
    }
  }

  /**
   * Restores the migration backup if something went wrong during an update.
   */
  static async restoreMigrationBackup(): Promise<any | null> {
    try {
      const rawBackup = await AsyncStorage.getItem(MIGRATION_BACKUP_KEY);
      if (!rawBackup) return null;

      const snapshot: MigrationSnapshot = JSON.parse(rawBackup);
      if (!snapshot || !snapshot.data) return null;

      const validation = this.validateState(snapshot.data);
      if (!validation.valid) {
        throw new Error('Backup data failed validation: ' + validation.errors.join('; '));
      }

      await AsyncStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(snapshot.data));
      console.log('[DataProtection] Restored migration backup successfully.');
      return snapshot.data;
    } catch (err) {
      console.error('[DataProtection] Failed to restore migration backup:', err);
      return null;
    }
  }

  /**
   * Merges incoming state into current state preserving existing records
   * without dropping unknown fields or overwriting populated data.
   */
  static reconcileState(current: any, incoming: any): any {
    if (!current) return incoming;
    if (!incoming) return current;

    // Preserve existing student records and append new ones by ID
    const studentMap = new Map<string, any>();
    (current.students || []).forEach((s: any) => { if (s && s.id) studentMap.set(s.id, s); });
    (incoming.students || []).forEach((s: any) => {
      if (s && s.id) {
        const existing = studentMap.get(s.id);
        studentMap.set(s.id, existing ? { ...existing, ...s } : s);
      }
    });

    // Merge subjects
    const subjectMap = new Map<string, any>();
    (current.subjects || []).forEach((sb: any) => { if (sb && sb.id) subjectMap.set(sb.id, sb); });
    (incoming.subjects || []).forEach((sb: any) => {
      if (sb && sb.id) {
        const existing = subjectMap.get(sb.id);
        subjectMap.set(sb.id, existing ? { ...existing, ...sb } : sb);
      }
    });

    // Merge attendance (composite key: studentId + date)
    const attMap = new Map<string, any>();
    (current.attendance || []).forEach((a: any) => {
      if (a && a.studentId && a.date) attMap.set(`${a.studentId}_${a.date}`, a);
    });
    (incoming.attendance || []).forEach((a: any) => {
      if (a && a.studentId && a.date) {
        attMap.set(`${a.studentId}_${a.date}`, a);
      }
    });

    // Merge marks (composite key: studentId + subjectId + exam)
    const markMap = new Map<string, any>();
    (current.marks || []).forEach((m: any) => {
      if (m && m.studentId && m.subjectId) markMap.set(`${m.studentId}_${m.subjectId}_${m.exam || ''}`, m);
    });
    (incoming.marks || []).forEach((m: any) => {
      if (m && m.studentId && m.subjectId) {
        markMap.set(`${m.studentId}_${m.subjectId}_${m.exam || ''}`, m);
      }
    });

    // Merge classes / schedule
    const classMap = new Map<string, any>();
    (current.classes || []).forEach((c: any) => { if (c && c.id) classMap.set(c.id, c); });
    (incoming.classes || []).forEach((c: any) => { if (c && c.id) classMap.set(c.id, c); });

    return {
      ...current,
      ...incoming,
      students: Array.from(studentMap.values()),
      subjects: Array.from(subjectMap.values()),
      attendance: Array.from(attMap.values()),
      marks: Array.from(markMap.values()),
      classes: Array.from(classMap.values()),
      settings: {
        ...(current.settings || {}),
        ...(incoming.settings || {}),
      },
    };
  }
}
