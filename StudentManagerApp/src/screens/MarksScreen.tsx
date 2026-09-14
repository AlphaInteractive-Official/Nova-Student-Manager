import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { gradeFor, round } from '../utils/calculations';

export const MarksScreen: React.FC = () => {
  const { state, theme, saveMark } = useApp();

  const [exam, setExam] = useState('Final Term');
  const [selectedAcademy, setSelectedAcademy] = useState('all');

  const exams = ['Final Term', 'Midterm Examination', 'Monthly Test 1', 'Monthly Test 2'];

  const filteredStudents = state.students.filter((s) => {
    return selectedAcademy === 'all' || s.academy === selectedAcademy;
  });

  const marksMap: Record<string, number | string> = {};
  state.marks.forEach((m) => {
    if ((m.exam || 'Final Term') === exam) {
      marksMap[`${m.studentId}_${m.subjectId}`] = m.obtained;
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.examTabs}>
          {exams.map((ex, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.examBtn,
                exam === ex && { backgroundColor: theme.primary },
              ]}
              onPress={() => setExam(ex)}
            >
              <Text style={[styles.examBtnText, { color: exam === ex ? '#fff' : theme.text2 }]}>
                {ex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Academy Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface2 }]}>
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

      {/* Marks Spreadsheet Grid */}
      <ScrollView horizontal style={styles.scroll}>
        <View>
          {/* Header Row */}
          <View style={[styles.headerRow, { backgroundColor: theme.surface2, borderBottomColor: theme.border }]}>
            <View style={[styles.cellSr, styles.borderRight, { borderColor: theme.border }]}>
              <Text style={[styles.headText, { color: theme.muted }]}>SR</Text>
            </View>
            <View style={[styles.cellName, styles.borderRight, { borderColor: theme.border }]}>
              <Text style={[styles.headText, { color: theme.muted }]}>Student Name</Text>
            </View>
            {state.subjects.map((sub) => (
              <View
                key={sub.id}
                style={[styles.cellSubject, styles.borderRight, { borderColor: theme.border }]}
              >
                <Text style={[styles.subjTitle, { color: theme.text }]} numberOfLines={1}>
                  {sub.name}
                </Text>
                <Text style={[styles.subjMax, { color: theme.muted }]}>Max: {sub.maxMarks}</Text>
              </View>
            ))}
            <View style={[styles.cellTotal, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.primary }]}>Total</Text>
            </View>
            <View style={[styles.cellTotal, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.primary }]}>%</Text>
            </View>
            <View style={[styles.cellGrade, { borderColor: theme.border, backgroundColor: theme.surface3 }]}>
              <Text style={[styles.headText, { color: theme.primary }]}>Grade</Text>
            </View>
          </View>

          {/* Student Marks Rows */}
          <ScrollView style={{ flex: 1 }}>
            {filteredStudents.map((st, sIdx) => {
              let totalObtained = 0;
              let totalMax = 0;
              let enteredCount = 0;

              return (
                <View
                  key={st.id}
                  style={[styles.dataRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                >
                  <View style={[styles.cellSr, styles.borderRight, { borderColor: theme.border }]}>
                    <Text style={[styles.cellText, { color: theme.muted }]}>{sIdx + 1}</Text>
                  </View>
                  <View style={[styles.cellName, styles.borderRight, { borderColor: theme.border }]}>
                    <Text style={[styles.studentNameText, { color: theme.text }]} numberOfLines={1}>
                      {st.name}
                    </Text>
                    <Text style={[styles.studentDetailText, { color: theme.muted }]} numberOfLines={1}>
                      {st.id}
                    </Text>
                  </View>

                  {/* Subject Inputs */}
                  {state.subjects.map((sub) => {
                    const val = marksMap[`${st.id}_${sub.id}`];
                    totalMax += sub.maxMarks;
                    if (val !== undefined && val !== '' && !isNaN(Number(val))) {
                      totalObtained += Number(val);
                      enteredCount++;
                    }

                    return (
                      <View
                        key={sub.id}
                        style={[styles.cellSubject, styles.borderRight, { borderColor: theme.border }]}
                      >
                        <TextInput
                          style={[
                            styles.markInput,
                            {
                              backgroundColor: theme.surface2,
                              color: theme.text,
                              borderColor: theme.border,
                            },
                          ]}
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor={theme.muted}
                          value={val !== undefined ? String(val) : ''}
                          onChangeText={(text) => {
                            const clean = text.trim();
                            saveMark(st.id, sub.id, exam, clean, sub.maxMarks);
                          }}
                        />
                      </View>
                    );
                  })}

                  {/* Live Computed Totals */}
                  {(() => {
                    const pct = totalMax > 0 && enteredCount > 0 ? round((totalObtained / totalMax) * 100, 1) : 0;
                    const grade = enteredCount > 0 ? gradeFor(pct, state.settings.grades) : '—';
                    return (
                      <>
                        <View style={[styles.cellTotal, { borderColor: theme.border }]}>
                          <Text style={{ fontWeight: '800', color: theme.text }}>
                            {enteredCount > 0 ? `${totalObtained}/${totalMax}` : '—'}
                          </Text>
                        </View>
                        <View style={[styles.cellTotal, { borderColor: theme.border }]}>
                          <Text style={{ fontWeight: '800', color: pct >= 50 ? theme.success : theme.danger }}>
                            {enteredCount > 0 ? `${pct}%` : '—'}
                          </Text>
                        </View>
                        <View style={[styles.cellGrade, { borderColor: theme.border }]}>
                          <Text style={{ fontWeight: '800', color: theme.primary }}>{grade}</Text>
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
    padding: 14,
    borderBottomWidth: 1,
  },
  examTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  examBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  examBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterBar: {
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
  scroll: {
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
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellName: {
    width: 180,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cellSubject: {
    width: 130,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cellTotal: {
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  cellGrade: {
    width: 60,
    height: 50,
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
  studentNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentDetailText: {
    fontSize: 10.5,
    marginTop: 2,
  },
  subjTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  subjMax: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  markInput: {
    width: '90%',
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
});
