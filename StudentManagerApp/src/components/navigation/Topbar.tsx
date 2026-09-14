import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

export const Topbar: React.FC = () => {
  const { currentView, theme, isDark, toggleTheme, setCurrentView } = useApp();

  const titles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    students: 'Student Directory',
    attendance: 'Monthly Attendance Register',
    marks: 'Marks Register & Subject Grid',
    schedule: 'Class Schedule & Timetable',
    percentage: 'Percentage & Grade Calculator',
    reports: 'Academic & Attendance Reports',
    settings: 'Settings & Configurations',
  };

  return (
    <View style={[styles.topbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{titles[currentView] || 'Student Manager'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
          onPress={toggleTheme}
          accessibilityLabel="Toggle Theme"
        >
          <Text style={{ fontSize: 15 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
          onPress={() => setCurrentView('settings')}
          accessibilityLabel="Settings"
        >
          <Text style={{ fontSize: 15 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
