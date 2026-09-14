import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { Avatar, Badge } from '../components/common';

export const StudentsScreen: React.FC = () => {
  const { state, theme, addStudent, updateStudent, deleteStudent } = useApp();

  const [search, setSearch] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formAcademy, setFormAcademy] = useState(state.settings.academies[0] || '');
  const [formClasses, setFormClasses] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setRoll('');
    setPhone('');
    setEmail('');
    setFormAcademy(state.settings.academies[0] || '');
    setFormClasses([state.settings.classList[0] || 'Arbi Awwal']);
    setModalVisible(true);
  };

  const openEditModal = (st: Student) => {
    setEditingStudent(st);
    setName(st.name);
    setRoll(st.roll || '');
    setPhone(st.phone || '');
    setEmail(st.email || '');
    setFormAcademy(st.academy || state.settings.academies[0] || '');
    setFormClasses(st.classes || (st.klass ? [st.klass] : []));
    setModalVisible(true);
  };

  const toggleClass = (cName: string) => {
    if (formClasses.includes(cName)) {
      setFormClasses(formClasses.filter((c) => c !== cName));
    } else {
      setFormClasses([...formClasses, cName]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        name: name.trim(),
        roll: roll.trim(),
        phone: phone.trim(),
        email: email.trim(),
        academy: formAcademy,
        classes: formClasses,
      });
    } else {
      addStudent({
        name: name.trim(),
        roll: roll.trim(),
        phone: phone.trim(),
        email: email.trim(),
        academy: formAcademy,
        classes: formClasses,
      });
    }
    setModalVisible(false);
  };

  const filteredStudents = state.students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll || '').includes(search) ||
      (s.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesAcad = selectedAcademy === 'all' || s.academy === selectedAcademy;
    return matchesSearch && matchesAcad;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Search & Filter Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
          placeholder="Search by student name, roll, or STU-ID..."
          placeholderTextColor={theme.muted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={openAddModal}
        >
          <Text style={styles.addBtnText}>+ Register Student</Text>
        </TouchableOpacity>
      </View>

      {/* Academy Filters */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface2 }]}>
        <TouchableOpacity
          style={[styles.filterChip, selectedAcademy === 'all' && { backgroundColor: theme.primary }]}
          onPress={() => setSelectedAcademy('all')}
        >
          <Text style={[styles.filterChipText, { color: selectedAcademy === 'all' ? '#fff' : theme.text2 }]}>
            All Academies ({state.students.length})
          </Text>
        </TouchableOpacity>
        {state.settings.academies.map((acad, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.filterChip, selectedAcademy === acad && { backgroundColor: theme.primary }]}
            onPress={() => setSelectedAcademy(acad)}
          >
            <Text style={[styles.filterChipText, { color: selectedAcademy === acad ? '#fff' : theme.text2 }]}>
              {acad} ({state.students.filter((s) => (s.academy || state.settings.academies[0]) === acad).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student Cards List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>No students found</Text>
            <Text style={{ color: theme.muted, fontSize: 13 }}>Click Register Student to enroll your first student.</Text>
          </View>
        ) : (
          filteredStudents.map((st) => (
            <View
              key={st.id}
              style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Avatar name={st.name} color={st.color} size={48} />
              <View style={styles.studentInfo}>
                <View style={styles.studentHeader}>
                  <Text style={[styles.studentName, { color: theme.text }]}>{st.name}</Text>
                  <Text style={[styles.studentId, { color: theme.primary }]}>{st.id}</Text>
                </View>
                <Text style={[styles.studentSub, { color: theme.muted }]}>
                  {st.academy || state.settings.academies[0]} {st.roll ? `· Roll ${st.roll}` : ''}
                </Text>
                {/* Enrolled Classes Badges */}
                <View style={styles.badgeRow}>
                  {(st.classes && st.classes.length ? st.classes : (st.klass ? [st.klass] : [])).map((c, i) => (
                    <Badge key={i} label={c} type="primary" size="sm" />
                  ))}
                  {st.phone ? <Badge label={st.phone} size="sm" /> : null}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: theme.surface2 }]}
                  onPress={() => openEditModal(st)}
                >
                  <Text style={{ fontSize: 13 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: theme.dangerSoft }]}
                  onPress={() => deleteStudent(st.id)}
                >
                  <Text style={{ fontSize: 13, color: theme.danger }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Student Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingStudent ? 'Edit Student Details' : 'Register New Student'}
            </Text>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Full Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Fatima Zahra"
                placeholderTextColor={theme.muted}
                value={name}
                onChangeText={setName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.muted }]}>Roll Number</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. 101"
                    placeholderTextColor={theme.muted}
                    value={roll}
                    onChangeText={setRoll}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.muted }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={theme.muted}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Academy Radio Buttons (Select Only One) */}
              <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 12 }]}>
                Islamic Academy (Choose Only One) *
              </Text>
              {state.settings.academies.map((acad, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.radioRow,
                    { borderColor: formAcademy === acad ? theme.primary : theme.border },
                    formAcademy === acad && { backgroundColor: theme.primarySoft },
                  ]}
                  onPress={() => setFormAcademy(acad)}
                >
                  <View style={[styles.radioCircle, formAcademy === acad && { borderColor: theme.primary }]}>
                    {formAcademy === acad ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                  <Text style={[styles.radioText, { color: theme.text }]}>{acad}</Text>
                </TouchableOpacity>
              ))}

              {/* Class Checkboxes (Select Multiple) */}
              <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 12 }]}>
                Enrolled Classes & Batches (Select Multiple) *
              </Text>
              {state.settings.classList.map((c, i) => {
                const isChecked = formClasses.includes(c);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.checkRow,
                      { borderColor: isChecked ? theme.primary : theme.border },
                      isChecked && { backgroundColor: theme.primarySoft },
                    ]}
                    onPress={() => toggleClass(c)}
                  >
                    <View style={[styles.checkSquare, isChecked && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                      {isChecked ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text> : null}
                    </View>
                    <Text style={[styles.checkText, { color: theme.text }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFoot}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: theme.text2, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13.5,
  },
  addBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  studentId: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#7e8fa8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  checkSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#7e8fa8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222f4c',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
});
