import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

export const SettingsScreen: React.FC = () => {
  const { state, theme, isDark, toggleTheme, updateSettings, loadDemoData, clearAllData } = useApp();

  const [appName, setAppName] = useState(state.settings.appName);
  const [academicYear, setAcademicYear] = useState(state.settings.academicYear);

  // Academies list state
  const [academies, setAcademies] = useState<string[]>(state.settings.academies);
  const [newAcademy, setNewAcademy] = useState('');

  // Classes list state
  const [classes, setClasses] = useState<string[]>(state.settings.classList);
  const [newClass, setNewClass] = useState('');

  // Attendance rule state
  const [threshold, setThreshold] = useState(String(state.settings.attendanceRule.threshold || 50));
  const [bonusMarks, setBonusMarks] = useState(String(state.settings.attendanceRule.bonusMarks || 20));
  const [penaltyMarks, setPenaltyMarks] = useState(String(state.settings.attendanceRule.penaltyMarks || 0));

  const saveGeneral = () => {
    updateSettings({
      appName: appName.trim() || 'Student Manager Hub',
      academicYear: academicYear.trim() || '2025-2026',
    });
    alert('General settings saved!');
  };

  const addAcad = () => {
    if (!newAcademy.trim()) return;
    const next = [...academies, newAcademy.trim()];
    setAcademies(next);
    updateSettings({ academies: next });
    setNewAcademy('');
  };

  const removeAcad = (idx: number) => {
    if (academies.length <= 1) {
      alert('You must have at least one academy.');
      return;
    }
    const next = academies.filter((_, i) => i !== idx);
    setAcademies(next);
    updateSettings({ academies: next });
  };

  const addCls = () => {
    if (!newClass.trim()) return;
    const next = [...classes, newClass.trim()];
    setClasses(next);
    updateSettings({ classList: next });
    setNewClass('');
  };

  const removeCls = (idx: number) => {
    if (classes.length <= 1) {
      alert('You must have at least one class.');
      return;
    }
    const next = classes.filter((_, i) => i !== idx);
    setClasses(next);
    updateSettings({ classList: next });
  };

  const saveAttendanceRule = () => {
    const t = Math.max(0, Math.min(100, parseInt(threshold, 10) || 50));
    const b = Math.max(0, parseInt(bonusMarks, 10) || 20);
    const p = Math.min(0, parseInt(penaltyMarks, 10) || 0);
    updateSettings({
      attendanceRule: {
        threshold: t,
        bonusMarks: b,
        penaltyMarks: p,
      },
    });
    alert(`Attendance Rule Saved! (${t}% threshold, +${b} bonus marks)`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Theme Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🎨 Appearance</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            style={[
              styles.themeBtn,
              !isDark && { backgroundColor: theme.primary },
              { borderColor: theme.border },
            ]}
            onPress={toggleTheme}
          >
            <Text style={{ color: !isDark ? '#fff' : theme.text, fontWeight: '700' }}>☀️ Light Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeBtn,
              isDark && { backgroundColor: theme.primary },
              { borderColor: theme.border },
            ]}
            onPress={toggleTheme}
          >
            <Text style={{ color: isDark ? '#fff' : theme.text, fontWeight: '700' }}>🌙 Dark Theme</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Academy Attendance Rules & Exam Bonus Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🎖️ Academy Attendance Rules & Exam Bonus</Text>
        <Text style={[styles.cardSub, { color: theme.muted }]}>
          Configure the required attendance percentage for students to qualify for examinations and the bonus marks awarded.
        </Text>

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>Min Attendance Required (%) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={threshold}
              onChangeText={setThreshold}
              placeholder="50"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>Bonus Marks Awarded (+) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={bonusMarks}
              onChangeText={setBonusMarks}
              placeholder="20"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>Deduction if Below (-)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={penaltyMarks}
              onChangeText={setPenaltyMarks}
              placeholder="0"
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={saveAttendanceRule}>
          <Text style={styles.saveBtnText}>✓ Save Attendance Rule</Text>
        </TouchableOpacity>
      </View>

      {/* Academies Configuration */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🏛️ Academies Configuration</Text>
        <Text style={[styles.cardSub, { color: theme.muted }]}>
          Add or remove academy names. You can choose which academy each student belongs to during registration.
        </Text>

        <View style={{ gap: 8, marginTop: 10 }}>
          {academies.map((a, i) => (
            <View key={i} style={[styles.listItem, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
              <Text style={[styles.itemText, { color: theme.text }]}>🏛️ {a}</Text>
              <TouchableOpacity
                style={[styles.delBtn, { backgroundColor: theme.dangerSoft }]}
                onPress={() => removeAcad(i)}
              >
                <Text style={{ color: theme.danger, fontWeight: '800' }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
            placeholder="e.g. New Islamic Academy"
            placeholderTextColor={theme.muted}
            value={newAcademy}
            onChangeText={setNewAcademy}
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addAcad}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>+ Add Academy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Classes & Batches Configuration */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>📚 Classes & Batches Configuration</Text>
        <Text style={[styles.cardSub, { color: theme.muted }]}>
          Configure your academic classes (Arbi Awwal, Arbi Duwwam, Arabic Grammar Batches, etc.).
        </Text>

        <View style={{ gap: 8, marginTop: 10 }}>
          {classes.map((c, i) => (
            <View key={i} style={[styles.listItem, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
              <Text style={[styles.itemText, { color: theme.text }]}>📖 {c}</Text>
              <TouchableOpacity
                style={[styles.delBtn, { backgroundColor: theme.dangerSoft }]}
                onPress={() => removeCls(i)}
              >
                <Text style={{ color: theme.danger, fontWeight: '800' }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
            placeholder="e.g. Arbi Soam"
            placeholderTextColor={theme.muted}
            value={newClass}
            onChangeText={setNewClass}
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addCls}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>+ Add Class</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Demo Data & Reset */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>💾 Data Management</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
            onPress={loadDemoData}
          >
            <Text style={{ color: theme.text, fontWeight: '700' }}>✨ Load Demo Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}
            onPress={clearAllData}
          >
            <Text style={{ color: theme.danger, fontWeight: '700' }}>🗑️ Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Branding */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.primary }}>Created by Alpha Interactive</Text>
        <Text style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
          Nova Student Manager Hub · React Native & Android APK Edition
        </Text>
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
  cardSub: {
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  themeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  saveBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  delBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addBtn: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
});
