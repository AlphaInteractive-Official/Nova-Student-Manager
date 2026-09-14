import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { StatCard, Badge, ProgressBar } from '../components/common';
import { attendanceStats, todayStr, marksSummary } from '../utils/calculations';

export const DashboardScreen: React.FC = () => {
  const { state, theme, setCurrentView } = useApp();

  const today = todayStr();
  const todaysAtt = state.attendance.filter((a) => a.date === today);
  const todayStats = attendanceStats(todaysAtt);
  const allAttStats = attendanceStats(state.attendance);
  const overallMarks = marksSummary(state.marks);

  const quickActions = [
    { label: 'Register Student', icon: '👤+', view: 'students' },
    { label: 'Attendance Matrix', icon: '📅', view: 'attendance' },
    { label: 'Marks Register', icon: '📝', view: 'marks' },
    { label: 'Class Timetable', icon: '⏰', view: 'schedule' },
    { label: 'Grade Calculator', icon: '🧮', view: 'percentage' },
    { label: 'Academic Reports', icon: '📈', view: 'reports' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Welcome Banner */}
      <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View>
          <Text style={[styles.bannerTitle, { color: theme.text }]}>Welcome, Teacher 👋</Text>
          <Text style={[styles.bannerSub, { color: theme.muted }]}>
            Managing {state.settings.academies.length} Islamic Academies · {state.students.length} Registered Students
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => setCurrentView('students')}
        >
          <Text style={styles.primaryBtnText}>+ Add Student</Text>
        </TouchableOpacity>
      </View>

      {/* Top Stat Cards Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          val={state.students.length}
          label="Total Students"
          sub={`${state.settings.classList.length} Batches`}
          tone="info"
          iconText="👥"
        />
        <StatCard
          val={todayStats.present}
          label="Present Today"
          sub={`${todayStats.working} sessions logged`}
          tone="success"
          iconText="✓"
        />
        <StatCard
          val={todayStats.absent}
          label="Absent Today"
          sub={`${todayStats.leave} on leave`}
          tone="danger"
          iconText="⚠️"
        />
        <StatCard
          val={`${allAttStats.pct}%`}
          label="Overall Attendance"
          sub={`${allAttStats.working} total days`}
          tone="warn"
          iconText="📈"
        />
      </View>

      {/* Quick Action Buttons */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((qa, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setCurrentView(qa.view as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickIcon}>{qa.icon}</Text>
            <Text style={[styles.quickLabel, { color: theme.text }]}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Academies & Classes Overview */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Active Islamic Academies</Text>
        <View style={styles.academiesWrap}>
          {state.settings.academies.map((acad, idx) => (
            <View
              key={idx}
              style={[styles.acadCard, { backgroundColor: theme.surface2, borderColor: theme.border }]}
            >
              <Text style={styles.acadBadge}>🏛️ Academy {idx + 1}</Text>
              <Text style={[styles.acadName, { color: theme.text }]}>{acad}</Text>
              <Text style={[styles.acadCount, { color: theme.muted }]}>
                {state.students.filter((s) => (s.academy || state.settings.academies[0]) === acad).length} Enrolled Students
              </Text>
            </View>
          ))}
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
    gap: 20,
  },
  banner: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickIcon: {
    fontSize: 20,
  },
  quickLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  academiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  acadCard: {
    flex: 1,
    minWidth: 260,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  acadBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 6,
  },
  acadName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  acadCount: {
    fontSize: 12,
  },
});
