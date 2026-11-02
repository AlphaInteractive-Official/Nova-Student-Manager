import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { NavView } from '../../types';

interface NavItemDef {
  id: NavView;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'marks', label: 'Marks', icon: '📝' },
  { id: 'schedule', label: 'Schedule', icon: '⏰' },
  { id: 'percentage', label: 'Percentage', icon: '🧮' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar: React.FC = () => {
  const { state, currentView, setCurrentView, theme } = useApp();

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Brand Header */}
      <View style={[styles.brandWrap, { borderBottomColor: theme.border }]}>
        <View style={[styles.brandLogo, { backgroundColor: theme.primary }]}>
          <Text style={styles.brandLogoText}>🎓</Text>
        </View>
        <View>
          <Text style={[styles.brandTitle, { color: theme.text }]}>{state.settings.appName || 'Student Manager'}</Text>
          <Text style={[styles.brandSub, { color: theme.muted }]}>Islamic Academy Hub</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <ScrollView style={styles.navLinks} showsVerticalScrollIndicator={false}>
        <Text style={[styles.navSectionLabel, { color: theme.muted }]}>WORKSPACE</Text>
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navBtn,
                isActive && { backgroundColor: theme.primarySoft },
              ]}
              onPress={() => setCurrentView(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.navText,
                  { color: isActive ? theme.primary : theme.text2 },
                  isActive && styles.navTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Branding Requirement */}
      <View style={[styles.sidebarFoot, { borderTopColor: theme.border }]}>
        <Text style={[styles.footBrand, { color: theme.primary }]}>Created by Alpha Interactive</Text>
        <Text style={[styles.footSub, { color: theme.muted }]}>Online Manager · Android APK</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  navLinks: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  navSectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 10,
  },
  navIcon: {
    fontSize: 16,
  },
  navText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  navTextActive: {
    fontWeight: '700',
  },
  sidebarFoot: {
    padding: 14,
    borderTopWidth: 1,
  },
  footBrand: {
    fontSize: 12,
    fontWeight: '700',
  },
  footSub: {
    fontSize: 10,
    marginTop: 3,
  },
});
