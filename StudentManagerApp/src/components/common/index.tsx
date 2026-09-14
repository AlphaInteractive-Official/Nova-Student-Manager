import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { initials } from '../../utils/calculations';

interface StatCardProps {
  val: string | number;
  label: string;
  sub?: string;
  tone?: 'success' | 'danger' | 'warn' | 'info';
  iconText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ val, label, sub, tone, iconText }) => {
  const { theme } = useApp();

  const toneColor =
    tone === 'success'
      ? theme.success
      : tone === 'danger'
      ? theme.danger
      : tone === 'warn'
      ? theme.warn
      : tone === 'info'
      ? theme.info
      : theme.primary;

  const toneBg =
    tone === 'success'
      ? theme.successSoft
      : tone === 'danger'
      ? theme.dangerSoft
      : tone === 'warn'
      ? theme.warnSoft
      : tone === 'info'
      ? theme.infoSoft
      : theme.primarySoft;

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: toneBg }]}>
        <Text style={[styles.statIconText, { color: toneColor }]}>{iconText || '✦'}</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statVal, { color: theme.text }]}>{val}</Text>
        <Text style={[styles.statLbl, { color: theme.muted }]}>{label}</Text>
        {sub ? <Text style={[styles.statSub, { color: theme.muted }]}>{sub}</Text> : null}
      </View>
    </View>
  );
};

interface BadgeProps {
  label: string;
  type?: 'present' | 'absent' | 'leave' | 'info' | 'primary' | 'default';
  iconText?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'default', iconText, size = 'md' }) => {
  const { theme } = useApp();

  let bg = theme.surface2;
  let text = theme.text2;

  if (type === 'present') {
    bg = theme.successSoft;
    text = theme.success;
  } else if (type === 'absent') {
    bg = theme.dangerSoft;
    text = theme.danger;
  } else if (type === 'leave') {
    bg = '#fff1e6';
    text = '#e8590c';
  } else if (type === 'primary') {
    bg = theme.primarySoft;
    text = theme.primary;
  } else if (type === 'info') {
    bg = theme.infoSoft;
    text = theme.info;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingVertical: size === 'sm' ? 2 : 4, paddingHorizontal: size === 'sm' ? 6 : 9 }]}>
      {iconText ? <Text style={[styles.badgeText, { color: text, marginRight: 4 }]}>{iconText}</Text> : null}
      <Text style={[styles.badgeText, { color: text, fontSize: size === 'sm' ? 10.5 : 12 }]}>{label}</Text>
    </View>
  );
};

interface ProgressBarProps {
  pct: number;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ pct, height = 7 }) => {
  const { theme } = useApp();
  const clamped = Math.max(0, Math.min(100, pct));
  const color = clamped >= 75 ? theme.success : clamped >= 50 ? theme.warn : theme.danger;

  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.surface3, height }]}>
      <View style={[styles.progressFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
};

interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, color = '#4f46e5', size = 36 }) => {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statContent: {
    flex: 1,
  },
  statVal: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLbl: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  badge: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
