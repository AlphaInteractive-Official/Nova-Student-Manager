/**
 * Nova Student Manager — Architecture & Data Protection Test Suite
 * Validates:
 * 1. SHA-256 Bit-level verification & tamper detection
 * 2. SemVer version comparison logic
 * 3. Zero-Data-Loss empty overwrite rejection guard
 * 4. Data validation and integrity checksum verification
 * 5. State reconciliation and record preservation
 */

import { sha256 } from '../updates/sha256';
import { DataProtectionManager } from '../data/DataProtectionManager';
import { compareSemVer } from '../updates/UpdateManager';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

export async function runAllTests() {
  console.log('====================================================');
  console.log('NOVA STUDENT MANAGER — TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: SHA-256 Verification & Tamper Detection
  console.log('--- TEST 1: SHA-256 Cryptographic Verification ---');
  const samplePayload = '<!DOCTYPE html><html><head><title>Nova</title></head><body>Nova App</body></html>';
  const expectedHash = sha256(samplePayload);
  assert(expectedHash.length === 64, 'SHA-256 produces a valid 64-character hexadecimal digest');

  const tamperedPayload = samplePayload + ' ';
  const tamperedHash = sha256(tamperedPayload);
  assert(expectedHash !== tamperedHash, 'Tampered or modified payload produces completely different hash');

  // TEST 2: SemVer Version Comparison
  console.log('\n--- TEST 2: SemVer Version Comparison ---');
  assert(compareSemVer('1.1.04', '1.1.03') > 0, '1.1.04 is recognized as newer than 1.1.03');
  assert(compareSemVer('1.1.03', '1.1.04') < 0, '1.1.03 is recognized as older than 1.1.04');
  assert(compareSemVer('1.1.03', '1.1.03') === 0, 'Identical versions recognized as equal');
  assert(compareSemVer('1.2.0', '1.1.99') > 0, '1.2.0 is recognized as newer than 1.1.99');
  assert(compareSemVer('2.0.0', '1.9.9') > 0, '2.0.0 is recognized as newer than 1.9.9');

  // TEST 3: Zero-Data-Loss Empty Overwrite Prevention
  console.log('\n--- TEST 3: Zero-Data-Loss Overwrite Prevention Guard ---');
  const populatedNative = {
    students: [
      { id: 'ST-001', name: 'Zaid Khan', roll: '101', klass: 'Class 10' },
      { id: 'ST-002', name: 'Fatima Noor', roll: '102', klass: 'Class 10' }
    ],
    subjects: [{ id: 'SUB-1', name: 'Mathematics' }],
    attendance: [{ id: 'ATT-1', studentId: 'ST-001', date: '2026-11-01', status: 'present' }],
    marks: [{ id: 'MRK-1', studentId: 'ST-001', subjectId: 'SUB-1', exam: 'Midterm', marks: '92' }],
    classes: ['Class 10'],
    settings: { appName: 'Nova Student Manager', autoUpdateEnabled: true }
  };

  const emptyIncoming = {
    students: [],
    subjects: [],
    attendance: [],
    marks: [],
    classes: [],
    settings: { appName: 'Nova Student Manager' }
  };

  const checkEmptyOnPopulated = DataProtectionManager.isSafeToOverwrite(populatedNative, emptyIncoming);
  assert(!checkEmptyOnPopulated.safe, 'CRITICAL: System BLOCKS empty incoming state from overwriting populated native data');
  assert(checkEmptyOnPopulated.reason?.includes('empty') || checkEmptyOnPopulated.reason?.includes('0 students') || false, 'Correctly flags empty state destruction reason');

  const populatedIncomingWithNewStudent = {
    ...populatedNative,
    students: [
      ...populatedNative.students,
      { id: 'ST-003', name: 'Bilal Ahmed', roll: '103', klass: 'Class 10' }
    ]
  };
  const checkSafeUpdate = DataProtectionManager.isSafeToOverwrite(populatedNative, populatedIncomingWithNewStudent);
  assert(checkSafeUpdate.safe, 'Allows legitimate updates with valid student records');

  // TEST 4: Integrity Verification
  console.log('\n--- TEST 4: Data Validation & Integrity Checks ---');
  const validRes = DataProtectionManager.validateState(populatedNative);
  assert(validRes.valid && validRes.errors.length === 0, 'Valid state payload passes comprehensive structural validation');
  assert(validRes.stats.studentCount === 2, 'Stats accurately count student records (2)');
  assert(validRes.stats.attendanceCount === 1, 'Stats accurately count attendance records (1)');
  assert(validRes.stats.marksCount === 1, 'Stats accurately count marks records (1)');

  const corruptedDuplicateIds = {
    ...populatedNative,
    students: [
      { id: 'ST-001', name: 'Zaid Khan' },
      { id: 'ST-001', name: 'Duplicate Zaid' }
    ]
  };
  const corruptRes = DataProtectionManager.validateState(corruptedDuplicateIds);
  assert(!corruptRes.valid && corruptRes.errors.some(e => e.includes('Duplicate student ID')), 'Detects duplicate student IDs and rejects payload');

  // TEST 5: State Reconciliation (Non-destructive merge)
  console.log('\n--- TEST 5: State Reconciliation (Non-destructive merge) ---');
  const incomingDiffClass = {
    students: [
      { id: 'ST-001', name: 'Zaid Khan Updated' },
      { id: 'ST-004', name: 'Ayesha Bibi', roll: '104', klass: 'Class 9' }
    ],
    subjects: [{ id: 'SUB-2', name: 'Science' }],
    attendance: [{ id: 'ATT-2', studentId: 'ST-004', date: '2026-11-02', status: 'present' }],
    marks: [{ id: 'MRK-2', studentId: 'ST-004', subjectId: 'SUB-2', exam: 'Quiz 1', marks: '88' }]
  };

  const reconciled = DataProtectionManager.reconcileState(populatedNative, incomingDiffClass);
  assert(reconciled.students.length === 3, 'Reconciliation merged students without dropping existing records (now 3 students)');
  assert(reconciled.subjects.length === 2, 'Reconciliation merged subjects (now 2 subjects)');
  assert(reconciled.attendance.length === 2, 'Reconciliation merged attendance (now 2 records)');
  assert(reconciled.marks.length === 2, 'Reconciliation merged marks (now 2 records)');
  assert(reconciled.students.find((s: any) => s.id === 'ST-002') !== undefined, 'Fatima Noor (ST-002) preserved even though missing from incoming payload');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  return { passed, failed };
}
