import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, NativeModules, StatusBar as RNStatusBar, Alert, Vibration, Share, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UpdateManager,
  CACHED_HTML_KEY,
  LAST_CHECK_KEY,
} from './src/updates/UpdateManager';
import {
  DataProtectionManager,
  CANONICAL_STORAGE_KEY,
} from './src/data/DataProtectionManager';
import { UpdateScreen, UpdateStage } from './src/components/UpdateScreen';

// For native mobile builds (Android APK / iOS)
let WebViewComponent: any = null;
let DEFAULT_HTML_BASE64: string = '';

if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
    DEFAULT_HTML_BASE64 = require('./src/htmlBundle').HTML_BASE64;
  } catch (e) {
    console.warn('Native modules require error:', e);
  }
}

function utf8ToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    const gBuf = (globalThis as any).Buffer;
    if (gBuf) {
      return gBuf.from(str, 'utf-8').toString('base64');
    }
    return '';
  }
}

interface UpdateModalState {
  visible: boolean;
  stage: UpdateStage;
  stageText: string;
  percent: number;
  downloadedBytes?: number;
  totalBytes?: number;
  targetVersion?: string;
  error?: string;
  lastManifest?: any;
}

export default function App() {
  const webViewRef = useRef<any>(null);
  const [activeHtmlBase64, setActiveHtmlBase64] = useState<string>(DEFAULT_HTML_BASE64);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [updateModal, setUpdateModal] = useState<UpdateModalState>({
    visible: false,
    stage: 'checking',
    stageText: '',
    percent: 0,
  });

  // Initialize cached engine (offline-first strategy)
  useEffect(() => {
    async function initEngine() {
      try {
        const cachedHtml = await AsyncStorage.getItem(CACHED_HTML_KEY);
        if (cachedHtml && UpdateManager.validateHtml(cachedHtml)) {
          console.log('[App] Loading verified cached remote update bundle.');
          const b64 = utf8ToBase64(cachedHtml);
          if (b64) setActiveHtmlBase64(b64);
        } else {
          console.log('[App] Loading default APK-bundled HTML engine.');
          setActiveHtmlBase64(DEFAULT_HTML_BASE64);
        }
      } catch (err) {
        console.warn('[App] Error loading cached engine, falling back to bundle:', err);
        setActiveHtmlBase64(DEFAULT_HTML_BASE64);
      } finally {
        setIsEngineReady(true);
      }
    }
    initEngine();
  }, []);

  // Post update events to WebView
  const sendToWebView = useCallback((payload: any) => {
    if (!webViewRef.current) return;
    try {
      const code = `
        try {
          if (window.handleUpdateEvent) {
            window.handleUpdateEvent(${JSON.stringify(payload)});
          }
        } catch(e) {
          console.warn("Update event bridge error", e);
        }
        true;
      `;
      webViewRef.current.injectJavaScript(code);
    } catch (e) {
      console.warn('[App] Failed to post message to WebView:', e);
    }
  }, []);

  const restoreDataToWebView = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem(CANONICAL_STORAGE_KEY);
      if (savedData && webViewRef.current) {
        const code = `
          try {
            if (window.handleNativeRestore) {
              window.handleNativeRestore(${JSON.stringify(savedData)});
            }
          } catch(e) {
            console.warn("Restore injection error", e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(code);
      }

      // Send initial update status and configuration
      const versionMeta = await UpdateManager.getActiveVersionMeta();
      const autoUpdate = await UpdateManager.isAutoUpdateEnabled();
      const manifestUrl = await UpdateManager.getManifestUrl();
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);

      sendToWebView({
        type: 'INIT_UPDATE_STATUS',
        activeVersion: versionMeta.version,
        activeSource: versionMeta.source,
        releaseDate: versionMeta.releaseDate,
        autoUpdateEnabled: autoUpdate,
        manifestUrl,
        lastCheckedAt: lastCheck,
      });
    } catch (err) {
      console.warn('AsyncStorage restore failure:', err);
    }
  }, [sendToWebView]);

  // Background update check if enabled
  const runBackgroundUpdateCheck = useCallback(async () => {
    try {
      const enabled = await UpdateManager.isAutoUpdateEnabled();
      if (!enabled) return;

      console.log('[App] Checking for remote updates in background...');
      const checkResult = await UpdateManager.checkForUpdates();

      if (checkResult.status === 'available' && checkResult.manifest) {
        console.log(`[App] Remote update v${checkResult.manifest.version} available. Staging in background...`);
        const dlResult = await UpdateManager.downloadAndStageUpdate(checkResult.manifest);
        if (dlResult.success) {
          sendToWebView({
            type: 'UPDATE_READY',
            version: checkResult.manifest.version,
            releaseNotes: checkResult.manifest.releaseNotes,
          });
        }
      } else if (checkResult.status === 'requires-apk') {
        sendToWebView({
          type: 'REQUIRES_APK',
          version: checkResult.latestVersion,
          releaseNotes: checkResult.releaseNotes,
        });
      }
    } catch (err) {
      console.warn('[App] Background update check error:', err);
    }
  }, [sendToWebView]);

  const handleMessage = async (event: any) => {
    try {
      if (!event || !event.nativeEvent || !event.nativeEvent.data) return;
      const dataStr = event.nativeEvent.data;
      const msg = JSON.parse(dataStr);

      switch (msg.type) {
        case 'SYNC_STATE': {
          if (!msg.payload) break;

          // ZERO-DATA-LOSS GUARD: Validate against empty state overwriting populated data
          const currentRaw = await AsyncStorage.getItem(CANONICAL_STORAGE_KEY);
          const currentState = currentRaw ? JSON.parse(currentRaw) : null;
          const safetyCheck = DataProtectionManager.isSafeToOverwrite(currentState, msg.payload);

          if (!safetyCheck.safe) {
            console.warn('[App] REJECTED UNSAFE SYNC:', safetyCheck.reason);
            // Re-inject the real data to WebView
            restoreDataToWebView();
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Data Protection: Empty state rejected. Preserving saved records.", "warn", 6000); }
              true;
            `);
            break;
          }

          // Safe to persist
          await AsyncStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(msg.payload));
          break;
        }

        case 'REQUEST_RESTORE': {
          restoreDataToWebView();
          break;
        }

        case 'CHECK_FOR_UPDATES': {
          sendToWebView({ type: 'UPDATE_STATUS', status: 'checking', message: 'Checking for updates...' });
          const res = await UpdateManager.checkForUpdates(msg.manifestUrl);
          sendToWebView({
            type: 'CHECK_RESULT',
            status: res.status,
            currentVersion: res.currentVersion,
            latestVersion: res.latestVersion,
            releaseNotes: res.releaseNotes,
            manifest: res.manifest,
            requiresApkUpgrade: res.requiresApkUpgrade,
            error: res.error,
          });
          break;
        }

        case 'START_DOWNLOAD_UPDATE': {
          if (!msg.manifest) break;
          const manifest = msg.manifest;
          const expectedSize = manifest.entrySize || (manifest.assets && manifest.assets[0]?.size) || 375852;

          setUpdateModal({
            visible: true,
            stage: 'downloading',
            stageText: 'Downloading application...',
            percent: 10,
            downloadedBytes: 0,
            totalBytes: expectedSize,
            targetVersion: manifest.version,
            error: undefined,
            lastManifest: manifest,
          });

          sendToWebView({ type: 'UPDATE_STATUS', status: 'downloading', message: 'Downloading application bundle...' });

          const dlRes = await UpdateManager.downloadAndStageUpdate(manifest, (p) => {
            setUpdateModal((prev) => ({
              ...prev,
              stage: p.stage as UpdateStage,
              stageText: p.stageText,
              percent: p.percent,
              downloadedBytes: p.downloadedBytes,
              totalBytes: p.totalBytes,
            }));
            sendToWebView({ type: 'UPDATE_STATUS', status: p.stage, message: p.stageText });
          });

          if (dlRes.success) {
            setUpdateModal((prev) => ({
              ...prev,
              stage: 'applying',
              stageText: 'Applying update & creating safety snapshot...',
              percent: 98,
            }));

            const actRes = await UpdateManager.activateStagedUpdate();
            if (actRes.success) {
              setUpdateModal((prev) => ({
                ...prev,
                stage: 'restarting',
                stageText: 'Restarting application...',
                percent: 100,
              }));

              const cachedHtml = await AsyncStorage.getItem(CACHED_HTML_KEY);
              if (cachedHtml) {
                const b64 = utf8ToBase64(cachedHtml);
                if (b64) setActiveHtmlBase64(b64);
              }

              setTimeout(() => {
                setUpdateModal((prev) => ({
                  ...prev,
                  stage: 'completed',
                  stageText: 'Update completed!',
                  percent: 100,
                }));
                sendToWebView({
                  type: 'UPDATE_READY',
                  version: manifest.version,
                  releaseNotes: manifest.releaseNotes,
                });
                setTimeout(() => {
                  setUpdateModal((prev) => ({ ...prev, visible: false }));
                }, 1400);
              }, 800);
            } else {
              setUpdateModal((prev) => ({
                ...prev,
                stage: 'failed',
                stageText: 'Activation Failed',
                error: actRes.error || 'Failed to activate verified update bundle.',
              }));
              sendToWebView({
                type: 'UPDATE_STATUS',
                status: 'failed',
                message: `Activation failed: ${actRes.error}`,
              });
            }
          } else {
            setUpdateModal((prev) => ({
              ...prev,
              stage: 'failed',
              stageText: 'Download Interrupted',
              error: dlRes.error || 'Network error while downloading update package.',
            }));
            sendToWebView({
              type: 'UPDATE_STATUS',
              status: 'failed',
              message: `Update download failed: ${dlRes.error}`,
            });
          }
          break;
        }

        case 'ACTIVATE_UPDATE': {
          setUpdateModal({
            visible: true,
            stage: 'applying',
            stageText: 'Applying update...',
            percent: 98,
          });

          sendToWebView({ type: 'UPDATE_STATUS', status: 'activating', message: 'Activating new version...' });
          const actRes = await UpdateManager.activateStagedUpdate();
          if (actRes.success) {
            setUpdateModal((prev) => ({
              ...prev,
              stage: 'restarting',
              stageText: 'Restarting application...',
              percent: 100,
            }));

            const cachedHtml = await AsyncStorage.getItem(CACHED_HTML_KEY);
            if (cachedHtml) {
              const b64 = utf8ToBase64(cachedHtml);
              if (b64) setActiveHtmlBase64(b64);
            }

            setTimeout(() => {
              setUpdateModal((prev) => ({
                ...prev,
                stage: 'completed',
                stageText: 'Update completed!',
                percent: 100,
              }));
              setTimeout(() => {
                setUpdateModal((prev) => ({ ...prev, visible: false }));
              }, 1400);
            }, 800);
          } else {
            setUpdateModal((prev) => ({
              ...prev,
              stage: 'failed',
              stageText: 'Activation Failed',
              error: actRes.error || 'Failed to activate verified update bundle.',
            }));
            sendToWebView({
              type: 'UPDATE_STATUS',
              status: 'failed',
              message: `Activation failed: ${actRes.error}`,
            });
          }
          break;
        }

        case 'ROLLBACK_VERSION': {
          const rbRes = await UpdateManager.rollbackToPreviousVersion();
          if (rbRes.success) {
            const cachedHtml = await AsyncStorage.getItem(CACHED_HTML_KEY);
            if (cachedHtml) {
              const b64 = utf8ToBase64(cachedHtml);
              if (b64) setActiveHtmlBase64(b64);
            } else {
              setActiveHtmlBase64(DEFAULT_HTML_BASE64);
            }
          } else {
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Rollback failed: ${rbRes.error}", "error"); }
              true;
            `);
          }
          break;
        }

        case 'SET_AUTO_UPDATE': {
          await UpdateManager.setAutoUpdateEnabled(!!msg.enabled);
          break;
        }

        case 'SET_MANIFEST_URL': {
          await UpdateManager.setManifestUrl(msg.url || '');
          break;
        }

        case 'CREATE_MIGRATION_BACKUP': {
          const versionMeta = await UpdateManager.getActiveVersionMeta();
          const snapshot = await DataProtectionManager.createMigrationBackup(versionMeta.version, 'manual-user-trigger');
          if (snapshot) {
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Pre-migration backup created successfully (${snapshot.stats.studentCount} students).", "success"); }
              true;
            `);
          } else {
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("No active data to back up.", "warn"); }
              true;
            `);
          }
          break;
        }

        case 'RESTORE_MIGRATION_BACKUP': {
          const restored = await DataProtectionManager.restoreMigrationBackup();
          if (restored) {
            restoreDataToWebView();
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Pre-migration backup restored successfully.", "success"); }
              true;
            `);
          } else {
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("No valid migration backup found on device.", "error"); }
              true;
            `);
          }
          break;
        }

        case 'NOTIFICATION': {
          try {
            Vibration.vibrate([0, 250, 150, 250]);
            const notifTitle = msg.title || 'Class Reminder';
            const notifBody = msg.body || 'You have an upcoming class scheduled.';
            const buttons: any[] = [{ text: 'OK', style: 'default' }];
            if (msg.url) {
              buttons.unshift({
                text: 'Open Meeting',
                onPress: () => {
                  try { Linking.openURL(msg.url); } catch(e) {}
                }
              });
            }
            Alert.alert(`🔔 ${notifTitle}`, notifBody, buttons);
          } catch(e) {
            console.warn('Native notification alert error:', e);
          }
          break;
        }

        case 'SHARE_FILE':
        case 'SHARE_IMAGE': {
          try {
            const shareTitle = msg.title || msg.filename || 'Attendance Register';
            const shareMsg = msg.caption || 'Attendance Register — Nova Student Manager';
            const rawData = msg.data || '';
            await Share.share({
              title: shareTitle,
              message: shareMsg,
              url: rawData
            });
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Share sheet opened! Select WhatsApp to send directly.", "success", 4000); }
              true;
            `);
          } catch(e) {
            console.warn('Native share error:', e);
          }
          break;
        }

        case 'DOWNLOAD_FILE': {
          if (!msg.data) break;
          try {
            const filename = msg.filename || `export_${Date.now()}.png`;
            const rawData = msg.data;
            const mime = msg.mime || 'application/octet-stream';

            if (NativeModules.FileSaver && NativeModules.FileSaver.saveFile) {
              const savedPath = await NativeModules.FileSaver.saveFile(filename, rawData, mime);
              webViewRef.current?.injectJavaScript(`
                if(window.toast){ toast("File saved to " + ${JSON.stringify(savedPath)}, "success", 5000); }
                true;
              `);
            } else {
              // Open native share sheet so teacher can save or send directly via WhatsApp
              await Share.share({
                title: filename,
                message: `Export: ${filename}`,
                url: rawData
              });
            }
          } catch (downloadErr) {
            console.warn('Native download handler error:', downloadErr);
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("Download error: " + ${JSON.stringify(String(downloadErr))}, "error", 5000); }
              true;
            `);
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.warn('WebView bridge message error:', err);
    }
  };

  const handleRetryUpdate = useCallback(() => {
    if (updateModal.lastManifest) {
      handleMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'START_DOWNLOAD_UPDATE',
            manifest: updateModal.lastManifest,
          }),
        },
      });
    } else {
      setUpdateModal((prev) => ({ ...prev, visible: false }));
    }
  }, [updateModal.lastManifest]);

  const handleDismissUpdate = useCallback(() => {
    setUpdateModal((prev) => ({ ...prev, visible: false }));
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <StatusBar style="auto" />
        <iframe
          src="/app.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          } as any}
          title="Student Manager Hub"
        />
      </View>
    );
  }

  // Native Android APK / iOS
  if (WebViewComponent && isEngineReady) {
    return (
      <View style={styles.nativeContainer}>
        <StatusBar style="light" backgroundColor="#090D16" />
        <WebViewComponent
          ref={webViewRef}
          key={activeHtmlBase64.slice(0, 32)} // Re-mount when base64 changes on update activation
          originWhitelist={['*']}
          source={{ uri: `data:text/html;charset=utf-8;base64,${activeHtmlBase64}` }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          cacheEnabled={true}
          onLoadEnd={() => {
            restoreDataToWebView();
            // Run background update check 4 seconds after page load
            setTimeout(runBackgroundUpdateCheck, 4000);
          }}
          onMessage={handleMessage}
          style={styles.webView}
        />
        <UpdateScreen
          visible={updateModal.visible}
          stage={updateModal.stage}
          stageText={updateModal.stageText}
          percent={updateModal.percent}
          downloadedBytes={updateModal.downloadedBytes}
          totalBytes={updateModal.totalBytes}
          targetVersion={updateModal.targetVersion}
          error={updateModal.error}
          onRetry={handleRetryUpdate}
          onDismiss={handleDismissUpdate}
        />
      </View>
    );
  }

  return <View style={styles.nativeContainer} />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0a0d14',
  },
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#090D16',
    paddingTop: Platform.OS === 'android' ? Math.max(RNStatusBar.currentHeight || 0, 42) : (Platform.OS === 'ios' ? 44 : 0),
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
