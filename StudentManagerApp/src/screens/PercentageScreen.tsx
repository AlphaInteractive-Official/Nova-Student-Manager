import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/common';
import { gradeFor, round } from '../utils/calculations';

interface CalcRow {
  name: string;
  obtained: string;
  max: string;
}

export const PercentageScreen: React.FC = () => {
  const { theme, state } = useApp();

  const [rows, setRows] = useState<CalcRow[]>([
    { name: 'عربی گرامر (Arabic Grammar)', obtained: '85', max: '100' },
    { name: 'عربی اول (Arbi Awwal)', obtained: '78', max: '100' },
    { name: 'تجوید القرآن (Tajweed)', obtained: '42', max: '50' },
  ]);

  const addRow = () => {
    setRows([...rows, { name: '', obtained: '', max: '100' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof CalcRow, val: string) => {
    const next = [...rows];
    next[index][field] = val;
    setRows(next);
  };

  let totalObt = 0;
  let totalMax = 0;
  let enteredCount = 0;

  rows.forEach((r) => {
    const o = parseFloat(r.obtained);
    const m = parseFloat(r.max);
    if (!isNaN(o) && !isNaN(m) && m > 0) {
      totalObt += o;
      totalMax += m;
      enteredCount++;
    }
  });

  const pct = totalMax > 0 ? round((totalObt / totalMax) * 100, 1) : 0;
  const grade = enteredCount > 0 ? gradeFor(pct, state.settings.grades) : '—';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Result Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🧮 Percentage & Grade Calculator</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          Calculate weighted scores, aggregate marks, and determine exam grades instantly.
        </Text>

        <View style={styles.resultBox}>
          <View>
            <Text style={[styles.pctVal, { color: pct >= 50 ? theme.success : theme.danger }]}>{pct}%</Text>
            <Text style={[styles.scoreSub, { color: theme.muted }]}>
              {totalObt} / {totalMax} Marks ({enteredCount} Subject{enteredCount > 1 ? 's' : ''})
            </Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.gradeText, { color: theme.primary }]}>Grade: {grade}</Text>
          </View>
        </View>

        <View style={{ marginVertical: 12 }}>
          <ProgressBar pct={pct} height={10} />
        </View>
      </View>

      {/* Inputs Table */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Subject Marks List</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addRow}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>+ Add Subject Row</Text>
          </TouchableOpacity>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.rowItem}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="Subject name"
              placeholderTextColor={theme.muted}
              value={r.name}
              onChangeText={(t) => updateRow(i, 'name', t)}
            />
            <TextInput
              style={[styles.numInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="Obt"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              value={r.obtained}
              onChangeText={(t) => updateRow(i, 'obtained', t)}
            />
            <Text style={{ color: theme.muted, fontWeight: '700' }}>/</Text>
            <TextInput
              style={[styles.numInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="Max"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              value={r.max}
              onChangeText={(t) => updateRow(i, 'max', t)}
            />
            <TouchableOpacity
              style={[styles.delBtn, { backgroundColor: theme.dangerSoft }]}
              onPress={() => removeRow(i)}
            >
              <Text style={{ color: theme.danger, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    fontSize: 16,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12.5,
    marginTop: 3,
    marginBottom: 10,
  },
  resultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pctVal: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreSub: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  addBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nameInput: {
    flex: 2,
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    fontSize: 13,
  },
  numInput: {
    width: 60,
    height: 38,
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  delBtn: {
    width: 34,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
