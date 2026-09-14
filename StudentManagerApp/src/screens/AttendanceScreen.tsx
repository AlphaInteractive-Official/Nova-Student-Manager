import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { pad2, todayStr } from '../utils/calculations';
import { AttendanceRecord } from '../types';

export const AttendanceScreen: React.FC = () => {
  const { state, theme, markAttendance, bulkMarkAttendance } = useApp();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedAcademy, setSelectedAcademy] = useState('all');

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPrefix = `${year}-${pad2(month)}`;
  const today = todayStr();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const cycleStatus = (sid: string, dateStr: string, currentStatus?: AttendanceRecord['status']) => {
    const cycle: AttendanceRecord['status'][] = ['present', 'absent', 'leave', 'holiday'];
    const next = !currentStatus
      ? 'present'
      : cycle[(cycle.indexOf(currentStatus) + 1) % cycle.length];
    markAttendance(sid, dateStr, next);
  };

  const filteredStudents = state.students.filter((s) => {
    return selectedAcademy === 'all' || s.academy === selectedAcademy;
  });

  const monthAttMap: Record<string, AttendanceRecord['status']> = {};
  state.attendance.forEach((a) => {
    if (String(a.date || '').startsWith(monthPrefix)) {
      monthAttMap[`${a.studentId}_${a.date}`] = a.status;
    }
  });

  const markAllToday = () => {
    const sids = filteredStudents.map((s) => s.id);
    bulkMarkAttendance(today, 'present', sids);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Month Navigation & Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.monthNav}>
          <TouchableOpacity style={[styles.navArrow, { backgroundColor: theme.surface2 }]} onPress={prevMonth}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            📅 {monthNames[month - 1]} {year}
          </Text>
          <TouchableOpacity style={[styles.navArrow, { backgroundColor: theme.surface2 }]} onPress={nextMonth}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: theme.success }]}
            onPress={markAllToday}
          >
            <Text style={styles.bulkBtnText}>✓ Mark All Present Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Academy Filter Pills */}
      <View style={[styles.acadFilterBar, { backgroundColor: theme.surface2 }]}>
        <TouchableOpacity
          style={[styles.chip, selectedAcademy === 'all' && { backgroundColor: theme.primary }]}
          onPress={() => setSelectedAcademy('all')}
        >
          <Text style={[styles.chipText, { color: selectedAcademy === 'all' ? '#fff' : theme.text2 }]}>
            All Academies
          </Text>
        </TouchableOpacity>
        {state.settings.academies.map((acad, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.chip, selectedAcademy === acad && { backgroundColor: theme.primary }]}
            onPress={() => setSelectedAcademy(acad)}
          >
            <Text style={[styles.chipText, { color: selectedAcademy === acad ? '#fff' : theme.text2 }]}>
              {acad}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly Register Table Grid */}
      <ScrollView horizontal style={styles.tableScroll}>
        <View>
          {/* Table Header Row */}
          <View style={[styles.headerRow, { backgroundColor: theme.surface2, borderBottomColor: theme.border }]}>
            <View style={[styles.cellSr, styles.borderRight, { borderColor: theme.border }]}>
              <Text style={[styles.headText, { color: theme.muted }]}>SR</Text>
            </View>
            <View style={[styles.cellName, styles.borderRight, { borderColor: theme.border }]}>
              <Text style={[styles.headText, { color: theme.muted }]}>Student Name & Details</Text>
            </View>
            {/* Days 1 to N */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const dObj = new Date(year, month - 1, d);
              const isSunday = dObj.getDay() === 0;
              const isToday = `${monthPrefix}-${pad2(d)}` === today;
              return (
                <View
                  key={d}
                  style={[
                    styles.cellDay,
                    styles.borderRight,
                    { borderColor: theme.border },
                    isSunday && { backgroundColor: 'rgba(224,64,90,0.06)' },
                    isToday && { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Text style={[styles.dayNum, { color: isToday ? theme.primary : isSunday ? theme.danger : theme.text }]}>
                    {d}
                  </Text>
                  <Text style={[styles.dayDow, { color: theme.muted }]}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dObj.getDay()]}
                  </Text>
                </View>
              );
            })}
            {/* Live Totals Header */}
            <View style={[styles.cellStat, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.success }]}>P</Text>
            </View>
            <View style={[styles.cellStat, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.danger }]}>A</Text>
            </View>
            <View style={[styles.cellStat, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: '#e8590c' }]}>L</Text>
            </View>
            <View style={[styles.cellRate, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.primary }]}>Rate %</Text>
            </View>
          </View>

          {/* Table Data Rows */}
          <ScrollView style={{ flex: 1 }}>
            {filteredStudents.map((st, sIdx) => {
              let pCount = 0;
              let aCount = 0;
              let lCount = 0;

              return (
                <View
                  key={st.id}
                  style={[
                    styles.dataRow,
                    { backgroundColor: theme.surface, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={[styles.cellSr, styles.borderRight, { borderColor: theme.border }]}>
                    <Text style={[styles.cellText, { color: theme.muted }]}>{sIdx + 1}</Text>
                  </View>
                  <View style={[styles.cellName, styles.borderRight, { borderColor: theme.border }]}>
                    <Text style={[styles.studentNameText, { color: theme.text }]} numberOfLines={1}>
                      {st.name}
                    </Text>
                    <Text style={[styles.studentDetailText, { color: theme.muted }]} numberOfLines={1}>
                      {st.id} {st.roll ? `· Roll ${st.roll}` : ''}
                    </Text>
                  </View>

                  {/* Days */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const ds = `${monthPrefix}-${pad2(d)}`;
                    const status = monthAttMap[`${st.id}_${ds}`];
                    if (status === 'present') pCount++;
                    else if (status === 'absent') aCount++;
                    else if (status === 'leave') lCount++;

                    let cellColor = theme.muted;
                    let cellBg = 'transparent';
                    let char = '-';

                    if (status === 'present') {
                      char = 'P';
                      cellColor = theme.success;
                      cellBg = theme.successSoft;
                    } else if (status === 'absent') {
                      char = 'A';
                      cellColor = theme.danger;
                      cellBg = theme.dangerSoft;
                    } else if (status === 'leave') {
                      char = 'L';
                      cellColor = '#e8590c';
                      cellBg = '#fff1e6';
                    } else if (status === 'holiday') {
                      char = 'H';
                      cellColor = theme.info;
                      cellBg = theme.infoSoft;
                    }

                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.cellDay,
                          styles.borderRight,
                          { borderColor: theme.border, backgroundColor: cellBg },
                        ]}
                        onPress={() => cycleStatus(st.id, ds, status)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.statusChar, { color: cellColor }]}>{char}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Summary Totals */}
                  {(() => {
                    const totalWorking = pCount + aCount + lCount;
                    const rate = totalWorking > 0 ? Math.round((pCount / totalWorking) * 100) : 0;
                    return (
                      <>
                        <View style={[styles.cellStat, { borderColor: theme.border }]}>
                          <Text style={{ color: theme.success, fontWeight: '800' }}>{pCount}</Text>
                        </View>
                        <View style={[styles.cellStat, { borderColor: theme.border }]}>
                          <Text style={{ color: theme.danger, fontWeight: '800' }}>{aCount}</Text>
                        </View>
                        <View style={[styles.cellStat, { borderColor: theme.border }]}>
                          <Text style={{ color: '#e8590c', fontWeight: '800' }}>{lCount}</Text>
                        </View>
                        <View style={[styles.cellRate, { borderColor: theme.border }]}>
                          <Text style={{ color: rate >= 75 ? theme.success : rate >= 50 ? theme.warn : theme.danger, fontWeight: '800' }}>
                            {totalWorking > 0 ? `${rate}%` : '—'}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bulkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12.5,
  },
  acadFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableScroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  borderRight: {
    borderRightWidth: 1,
  },
  cellSr: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellName: {
    width: 190,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cellDay: {
    width: 36,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellStat: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  cellRate: {
    width: 68,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  dayDow: {
    fontSize: 9,
    fontWeight: '700',
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentDetailText: {
    fontSize: 10.5,
    marginTop: 2,
  },
  statusChar: {
    fontSize: 14,
    fontWeight: '800',
  },
});
