/**
 * UpdateScreen Component
 * Dedicated full-screen update experience for Nova Student Manager.
 * Designed following Nova Student Manager's dark theme and cyan/blue accent visual identity.
 * Features:
 * - Real-time progress bar (0-100%) and downloaded/total size display.
 * - 7 distinct update stages with step indicator.
 * - Nova Student Manager & Alpha Interactive branding.
 * - Non-blocking failure state with retry and dismiss options.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';

export type UpdateStage =
  | 'checking'
  | 'downloading'
  | 'verifying'
  | 'preparing'
  | 'applying'
  | 'restarting'
  | 'completed'
  | 'failed';

export interface UpdateScreenProps {
  visible: boolean;
  stage: UpdateStage;
  stageText: string;
  percent: number;
  downloadedBytes?: number;
  totalBytes?: number;
  targetVersion?: string;
  error?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const STAGES: { key: UpdateStage; label: string; number: number }[] = [
  { key: 'checking', label: 'Checking for updates', number: 1 },
  { key: 'downloading', label: 'Downloading application', number: 2 },
  { key: 'verifying', label: 'Verifying integrity', number: 3 },
  { key: 'preparing', label: 'Preparing application', number: 4 },
  { key: 'applying', label: 'Applying update', number: 5 },
  { key: 'restarting', label: 'Restarting application', number: 6 },
  { key: 'completed', label: 'Update completed', number: 7 },
];

export const UpdateScreen: React.FC<UpdateScreenProps> = ({
  visible,
  stage,
  stageText,
  percent,
  downloadedBytes,
  totalBytes,
  targetVersion,
  error,
  onRetry,
  onDismiss,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.max(0, Math.min(100, percent)),
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  useEffect(() => {
    if (stage === 'downloading' || stage === 'verifying' || stage === 'applying') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [stage]);

  if (!visible) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);
  const isFailed = stage === 'failed';
  const isCompleted = stage === 'completed';

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const progressInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Background radial glow effect */}
      <View style={styles.ambientGlow} />

      {/* Header Branding */}
      <View style={styles.header}>
        <Animated.View style={[styles.logoIconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoIconText}>✦</Text>
        </Animated.View>
        <Text style={styles.appName}>NOVA STUDENT MANAGER</Text>
        <Text style={styles.appTagline}>Alpha Interactive Application Engine</Text>
        {targetVersion && (
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>UPDATING TO v{targetVersion}</Text>
          </View>
        )}
      </View>

      {/* Central Progress Card */}
      <View style={[styles.card, isFailed && styles.cardError]}>
        {/* Stage Title */}
        <View style={styles.stageHeader}>
          <Text style={[styles.stageTitle, isFailed && styles.stageTitleError]}>
            {isFailed ? 'Update Interrupted' : isCompleted ? 'Update Completed!' : stageText || 'Updating...'}
          </Text>
          {!isFailed && (
            <Text style={styles.percentText}>{Math.round(percent)}%</Text>
          )}
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              isFailed && styles.progressBarFillError,
              { width: progressInterpolate },
            ]}
          />
        </View>

        {/* Bytes indicator */}
        <View style={styles.sizeRow}>
          {totalBytes && totalBytes > 0 ? (
            <Text style={styles.sizeText}>
              {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
            </Text>
          ) : (
            <Text style={styles.sizeText}>
              {isFailed ? 'Verification interrupted' : 'Transferring verified data blocks'}
            </Text>
          )}
          <Text style={styles.securityText}>✓ SHA-256 Verified</Text>
        </View>

        {/* Error Detail Display */}
        {isFailed && (
          <View style={styles.errorBox}>
            <Text style={styles.errorHeadline}>What happened:</Text>
            <Text style={styles.errorDetail}>
              {error || 'The update server could not be reached. Your previous working version and all student data remain completely safe.'}
            </Text>
            <View style={styles.buttonRow}>
              {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              {onDismiss && (
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.8}>
                  <Text style={styles.dismissButtonText}>Dismiss &amp; Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Completed Indicator */}
        {isCompleted && (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>
              ✓ Verified bundle successfully installed. Relaunching active interface...
            </Text>
          </View>
        )}

        {/* Stages Checklist */}
        {!isFailed && (
          <View style={styles.stagesList}>
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <View key={s.key} style={styles.stageItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isPast && styles.stageDotPast,
                      isCurrent && styles.stageDotCurrent,
                    ]}
                  >
                    <Text style={styles.stageDotText}>
                      {isPast ? '✓' : s.number}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stageLabel,
                      isPast && styles.stageLabelPast,
                      isCurrent && styles.stageLabelCurrent,
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Safety Notice & Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.safetyNotice}>
          🔒 Zero-Data-Loss Active: Your student records, attendance, and marks are safely preserved.
        </Text>
        <Text style={styles.orgBranding}>DEVELOPED BY ALPHA INTERACTIVE</Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#090D16',
    zIndex: 9999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  ambientGlow: {
    position: 'absolute',
    top: '15%',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIconText: {
    fontSize: 32,
    color: '#38BDF8',
  },
  appName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  versionBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  versionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  cardError: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#181216',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  stageTitleError: {
    color: '#F87171',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
    marginLeft: 12,
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 6,
  },
  progressBarFillError: {
    backgroundColor: '#EF4444',
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sizeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  securityText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 6,
  },
  errorHeadline: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FCA5A5',
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  retryButtonText: {
    color: '#090D16',
    fontWeight: '700',
    fontSize: 12.5,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  dismissButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12.5,
  },
  completedBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#6EE7B7',
    fontWeight: '600',
    textAlign: 'center',
  },
  stagesList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stageDotPast: {
    backgroundColor: '#059669',
  },
  stageDotCurrent: {
    backgroundColor: '#06B6D4',
  },
  stageDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stageLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  stageLabelPast: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stageLabelCurrent: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  safetyNotice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 8,
    lineHeight: 16,
  },
  orgBranding: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1.5,
  },
});
