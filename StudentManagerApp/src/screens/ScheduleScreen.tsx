import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/common';

export const ScheduleScreen: React.FC = () => {
  const { state, theme } = useApp();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState('Monday');

  const defaultClasses = [
    { title: 'Arbi Awwal (Morning Session)', time: '09:00 AM - 10:00 AM', academy: state.settings.academies[0], day: 'Monday' },
    { title: 'Arabic Grammar (Evening Batch)', time: '05:00 PM - 06:30 PM', academy: state.settings.academies[1] || state.settings.academies[0], day: 'Monday' },
    { title: 'Arbi Duwwam (Advanced)', time: '10:15 AM - 11:15 AM', academy: state.settings.academies[0], day: 'Tuesday' },
    { title: 'Tajweed & Qirat Revision', time: '04:00 PM - 05:00 PM', academy: state.settings.academies[1] || state.settings.academies[0], day: 'Wednesday' },
    { title: 'Arbi Chahrum', time: '11:30 AM - 12:45 PM', academy: state.settings.academies[0], day: 'Thursday' },
  ];

  const filtered = defaultClasses.filter((c) => c.day === selectedDay);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Weekly Academic Schedule</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>Manage online meeting batches and scheduled periods.</Text>

        {/* Day of Week Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {daysOfWeek.map((day) => {
              const isSel = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    { borderColor: isSel ? theme.primary : theme.border },
                    isSel && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayPillText, { color: isSel ? '#fff' : theme.text2 }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Class Schedule Cards */}
      <View style={{ gap: 12 }}>
        {filtered.length === 0 ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 30 }]}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>☕</Text>
            <Text style={{ color: theme.text, fontWeight: '700' }}>No classes scheduled on {selectedDay}</Text>
          </View>
        ) : (
          filtered.map((item, idx) => (
            <View key={idx} style={[styles.classCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.classTimeBox, { backgroundColor: theme.primarySoft }]}>
                <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>⏰</Text>
                <Text style={[styles.timeText, { color: theme.primary }]}>{item.time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.classTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.classAcad, { color: theme.muted }]}>{item.academy}</Text>
              </View>
              <TouchableOpacity
                style={[styles.meetBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                onPress={() => alert(`Launching class session for ${item.title}`)}
              >
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>Open Session</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12.5,
    marginTop: 3,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    flexWrap: 'wrap',
  },
  classTimeBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  classTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  classAcad: {
    fontSize: 12,
    marginTop: 3,
  },
  meetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
});
