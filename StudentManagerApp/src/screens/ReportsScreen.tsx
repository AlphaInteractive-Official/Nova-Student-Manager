import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { StatCard, Badge, ProgressBar } from '../components/common';
import {
  attendanceStats,
  filterAttendanceByPeriod,
  getMonthlyAttendanceBreakdown,
  calculateAttendanceRuleBonus,
  marksSummary,
  gradeFor,
  round,
} from '../utils/calculations';

export const ReportsScreen: React.FC = () => {
  const { state, theme } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    state.students[0] ? state.students[0].id : ''
  );
  const [period, setPeriod] = useState<string>('last-3-months');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3]);

  const student = state.students.find((s) => s.id === selectedStudentId) || state.students[0];

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!student) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.muted, fontSize: 16 }}>No students registered yet.</Text>
      </View>
    );
  }

  const allAtt = state.attendance.filter((a) => a.studentId === student.id);
  const filteredAtt = filterAttendanceByPeriod(allAtt, period, selectedMonths);
  const attStats = attendanceStats(filteredAtt);
  const studentMarksList = state.marks.filter((m) => m.studentId === student.id);
  const marksSum = marksSummary(studentMarksList, state.settings.grades);

  // Bonus and Exam Eligibility calculation
  const bonusInfo = calculateAttendanceRuleBonus(
    attStats.pct,
    studentMarksList,
    state.settings.attendanceRule
  );

  const monthlyBreakdown = getMonthlyAttendanceBreakdown(filteredAtt);

  const toggleMonth = (mNum: number) => {
    if (selectedMonths.includes(mNum)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== mNum));
    } else {
      setSelectedMonths([...selectedMonths, mNum]);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Student Selector Row */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.fieldLabel, { color: theme.muted }]}>Select Student for Detailed Report</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {state.students.map((st) => {
              const isSel = st.id === student.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.studentPill,
                    { borderColor: isSel ? theme.primary : theme.border },
                    isSel && { backgroundColor: theme.primarySoft },
                  ]}
                  onPress={() => setSelectedStudentId(st.id)}
                >
                  <Text style={[styles.studentPillText, { color: isSel ? theme.primary : theme.text }]}>
                    {st.name} ({st.id})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Attendance Time Period Filter Toolbar */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.periodHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>🕒 Attendance Time Period</Text>
          <Badge
            label={
              period === 'all'
                ? 'All Time'
                : period === 'this-month'
                ? 'This Month'
                : period === 'last-3-months'
                ? 'Last 3 Months'
                : period === 'last-6-months'
                ? 'Last 6 Months'
                : period === 'this-year'
                ? 'This Year (2026)'
                : `Custom (${selectedMonths.length} Months)`
            }
            type="primary"
            size="sm"
          />
        </View>

        {/* Period Preset Buttons */}
        <View style={styles.periodPresets}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'this-month', label: 'This Month' },
            { id: 'last-3-months', label: 'Last 3 Months' },
            { id: 'last-6-months', label: 'Last 6 Months' },
            { id: 'this-year', label: 'This Year' },
            { id: 'custom-months', label: 'Custom Months' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.periodBtn,
                { borderColor: theme.border },
                period === p.id && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setPeriod(p.id)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  { color: period === p.id ? '#fff' : theme.text2 },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 12-Month Multi-Selector Pills (if Custom Months is active) */}
        {period === 'custom-months' ? (
          <View style={[styles.customMonthsWrap, { borderTopColor: theme.border }]}>
            <View style={styles.customMonthsHeader}>
              <Text style={[styles.customHint, { color: theme.muted }]}>
                Tap any months to select/deselect (e.g. choose 3 months or random months like Jan, Mar, Apr):
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.surface2 }]}
                  onPress={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.surface2 }]}
                  onPress={() => setSelectedMonths([1, 2, 3])}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>Last 3 Mos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.surface2 }]}
                  onPress={() => setSelectedMonths([])}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.monthPillsGrid}>
              {MONTHS_SHORT.map((mName, idx) => {
                const mNum = idx + 1;
                const isSel = selectedMonths.includes(mNum);
                return (
                  <TouchableOpacity
                    key={mNum}
                    style={[
                      styles.monthPill,
                      { borderColor: isSel ? theme.primary : theme.border },
                      isSel && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => toggleMonth(mNum)}
                  >
                    <Text style={[styles.monthPillText, { color: isSel ? '#fff' : theme.text2 }]}>
                      {mName} {isSel ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* Top 4 Performance Metric Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          val={`${attStats.pct}%`}
          label="Period Attendance"
          sub={`${attStats.working} working days`}
          tone={attStats.pct >= 75 ? 'success' : attStats.pct >= 50 ? 'warn' : 'danger'}
          iconText="📅"
        />
        <StatCard
          val={marksSum.count ? `${marksSum.pct}%` : '—'}
          label="Academic Average"
          sub={`${marksSum.count} subjects graded`}
          tone="info"
          iconText="📝"
        />
        <StatCard
          val={marksSum.count ? marksSum.grade : '—'}
          label="Academic Grade"
          sub={`${marksSum.obtained} / ${marksSum.max} marks`}
          tone="warn"
          iconText="🎖️"
        />
        <StatCard
          val={bonusInfo.isEligible ? `+${bonusInfo.bonusAwarded} Bonus` : 'Ineligible'}
          label="Exam Status"
          sub={bonusInfo.isEligible ? 'Qualified for Exams' : `Requires ${bonusInfo.threshold}% attendance`}
          tone={bonusInfo.isEligible ? 'success' : 'danger'}
          iconText={bonusInfo.isEligible ? '✓' : '⚠️'}
        />
      </View>

      {/* Two Column Layout: Attendance Detail & Academy Rule Card */}
      <View style={styles.twoCol}>
        {/* Attendance Detail Card */}
        <View style={[styles.card, styles.colCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>📋 Attendance Detail</Text>

          <View style={styles.attRateRow}>
            <Text style={[styles.attRateVal, { color: theme.text }]}>{attStats.pct}%</Text>
            <Badge
              label={
                attStats.pct >= 80
                  ? 'Excellent'
                  : attStats.pct >= 65
                  ? 'Good'
                  : attStats.pct >= 50
                  ? 'Satisfactory'
                  : 'Needs Attention'
              }
              type={attStats.pct >= 75 ? 'present' : attStats.pct >= 50 ? 'leave' : 'absent'}
            />
          </View>

          {/* Metric Badges (Present, Absent, Leave) */}
          <View style={styles.metricBadgesWrap}>
            <Badge label={`Present: ${attStats.present} (${attStats.presentPct}%)`} type="present" />
            <Badge label={`Absent: ${attStats.absent} (${attStats.absentPct}%)`} type="absent" />
            <Badge label={`Leave: ${attStats.leave} (${attStats.leavePct}%)`} type="leave" />
            <Badge label={`Total: ${attStats.working} Days`} />
          </View>

          <View style={{ marginVertical: 12 }}>
            <ProgressBar pct={attStats.pct} height={9} />
          </View>

          {/* Month-by-Month Breakdown */}
          {monthlyBreakdown.length > 0 ? (
            <View style={[styles.breakdownWrap, { borderTopColor: theme.border }]}>
              <Text style={[styles.breakdownTitle, { color: theme.muted }]}>
                Month-by-Month Breakdown ({monthlyBreakdown.length} Month{monthlyBreakdown.length > 1 ? 's' : ''})
              </Text>
              {monthlyBreakdown.map((mRow, i) => (
                <View key={i} style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.breakdownMonth, { color: theme.text }]}>{mRow.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.success, fontWeight: '700' }}>P:{mRow.stats.present}</Text>
                    <Text style={{ fontSize: 11, color: theme.danger, fontWeight: '700' }}>A:{mRow.stats.absent}</Text>
                    <Text style={{ fontSize: 11, color: '#e8590c', fontWeight: '700' }}>L:{mRow.stats.leave}</Text>
                    <Badge label={`${mRow.stats.pct}%`} size="sm" type={mRow.stats.pct >= 75 ? 'present' : 'leave'} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Academy Attendance Rule & Exam Bonus Card */}
        <View style={[styles.card, styles.colCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>🎖️ Academy Exam Bonus & Eligibility</Text>
          <Text style={[styles.ruleNotice, { color: theme.muted }]}>
            Academy Policy: Students with ≥ {bonusInfo.threshold}% attendance are qualified for exams and awarded +
            {bonusInfo.bonus} bonus marks.
          </Text>

          {/* Eligibility Banner Callout */}
          <View
            style={[
              styles.calloutBanner,
              {
                backgroundColor: bonusInfo.isEligible ? theme.successSoft : theme.dangerSoft,
                borderColor: bonusInfo.isEligible ? 'rgba(15,157,110,0.3)' : 'rgba(224,64,90,0.3)',
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>{bonusInfo.isEligible ? '✅' : '⚠️'}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.calloutTitle,
                  { color: bonusInfo.isEligible ? theme.success : theme.danger },
                ]}
              >
                {bonusInfo.isEligible ? 'Eligible for Final Examinations' : 'Ineligible for Examination'}
              </Text>
              <Text style={[styles.calloutDesc, { color: theme.text2 }]}>
                {bonusInfo.isEligible
                  ? `Student attendance of ${attStats.pct}% meets the required ≥ ${bonusInfo.threshold}% threshold. +${bonusInfo.bonus} bonus marks awarded.`
                  : `Student attendance of ${attStats.pct}% is below the required ${bonusInfo.threshold}% threshold. Needs regular attendance to qualify.`}
              </Text>
            </View>
          </View>

          {/* Combined Score Calculation */}
          <View style={[styles.scoreBreakdownBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
            <Text style={[styles.scoreBreakdownTitle, { color: theme.muted }]}>Combined Performance Score</Text>
            <View style={styles.calcRow}>
              <Text style={{ color: theme.text2, fontSize: 13 }}>Academic Exam Marks:</Text>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                {bonusInfo.academicObt} / {bonusInfo.academicMax}
              </Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={{ color: theme.text2, fontSize: 13 }}>Attendance Bonus Marks (+):</Text>
              <Text
                style={{
                  color: bonusInfo.bonusAwarded >= 0 ? theme.success : theme.danger,
                  fontWeight: '800',
                  fontSize: 13,
                }}
              >
                {bonusInfo.bonusAwarded >= 0 ? `+${bonusInfo.bonusAwarded}` : bonusInfo.bonusAwarded} Marks
              </Text>
            </View>
            <View style={[styles.calcTotalRow, { borderTopColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>Final Combined Total:</Text>
              <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 16 }}>
                {bonusInfo.finalObtained} / {bonusInfo.academicMax} ({bonusInfo.finalPct}%) ·{' '}
                {gradeFor(bonusInfo.finalPct, state.settings.grades)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  studentPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  studentPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  periodPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customMonthsWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  customMonthsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  customHint: {
    fontSize: 12,
    flex: 1,
    minWidth: 200,
  },
  smallActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monthPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colCard: {
    flex: 1,
    minWidth: 320,
  },
  attRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  attRateVal: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  breakdownWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  breakdownTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  breakdownMonth: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  ruleNotice: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 17,
  },
  calloutBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  calloutTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  calloutDesc: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  scoreBreakdownBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  scoreBreakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
