/**
 * UpdateManager
 * Orchestrates remote version checks, SHA-256 asset verification, atomic cache activation,
 * offline fallbacks, and rollback mechanisms for Nova Student Manager.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256 } from './sha256';
import { DataProtectionManager } from '../data/DataProtectionManager';

export const CURRENT_APK_VERSION = '1.1.04';
export const CURRENT_APK_VERSION_CODE = 5;

export const DEFAULT_MANIFEST_URL = 'https://alpha-interactive.github.io/nova-student-manager/version-manifest.json';

export const CACHED_HTML_KEY = '@smh_cached_html_bundle';
export const CACHED_MANIFEST_KEY = '@smh_cached_html_meta';
export const PREVIOUS_HTML_KEY = '@smh_previous_html_bundle';
export const PREVIOUS_MANIFEST_KEY = '@smh_previous_html_meta';
export const STAGED_HTML_KEY = '@smh_staged_html_bundle';
export const STAGED_MANIFEST_KEY = '@smh_staged_html_meta';
export const AUTO_UPDATE_KEY = '@smh_auto_update_enabled';
export const MANIFEST_URL_KEY = '@smh_custom_manifest_url';
export const LAST_CHECK_KEY = '@smh_last_update_check';

export interface VersionManifest {
  name?: string;
  version: string;
  buildCode: number;
  releaseDate?: string;
  minApkVersionCode?: number;
  entryPoint?: string;
  entryUrl?: string;
  entrySha256?: string;
  entrySize?: number;
  assets?: {
    file?: string;
    url?: string;
    sha256?: string;
    size?: number;
  }[];
  releaseNotes?: string;
  compatibility?: {
    minAndroidVersion?: number;
    requiresApkUpgrade?: boolean;
    targetPackage?: string;
    supportedStorageSchema?: string;
    zeroDataLossGuaranteed?: boolean;
  };
}

export interface DownloadProgressEvent {
  stage: 'checking' | 'downloading' | 'verifying' | 'preparing' | 'applying' | 'restarting' | 'completed' | 'failed';
  stageText: string;
  percent: number;
  downloadedBytes?: number;
  totalBytes?: number;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'up-to-date'
  | 'requires-apk'
  | 'failed';

export interface UpdateCheckResult {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  manifest?: VersionManifest;
  error?: string;
  requiresApkUpgrade?: boolean;
}

/**
 * Proper SemVer comparison: returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal.
 */
export function compareSemVer(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const p1 = clean(v1).split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean(v2).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}

export class UpdateManager {
  /**
   * Retrieves whether automatic updates are enabled (defaults to true).
   */
  static async isAutoUpdateEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(AUTO_UPDATE_KEY);
      if (val === null) return true; // Default enabled
      return val === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Toggles or sets automatic updates setting.
   */
  static async setAutoUpdateEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_UPDATE_KEY, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Failed to save auto-update preference:', err);
    }
  }

  /**
   * Retrieves the configured update manifest URL.
   */
  static async getManifestUrl(): Promise<string> {
    try {
      const custom = await AsyncStorage.getItem(MANIFEST_URL_KEY);
      return custom && custom.trim() ? custom.trim() : DEFAULT_MANIFEST_URL;
    } catch {
      return DEFAULT_MANIFEST_URL;
    }
  }

  /**
   * Sets a custom manifest URL for development or staging testing.
   */
  static async setManifestUrl(url: string): Promise<void> {
    try {
      if (!url || !url.trim()) {
        await AsyncStorage.removeItem(MANIFEST_URL_KEY);
      } else {
        await AsyncStorage.setItem(MANIFEST_URL_KEY, url.trim());
      }
    } catch (err) {
      console.warn('Failed to set custom manifest URL:', err);
    }
  }

  /**
   * Returns the currently active cached application metadata, or null if running bundled.
   */
  static async getActiveVersionMeta(): Promise<{ version: string; releaseDate?: string; source: 'cached' | 'bundled' }> {
    try {
      const metaStr = await AsyncStorage.getItem(CACHED_MANIFEST_KEY);
      if (metaStr) {
        const meta = JSON.parse(metaStr);
        return {
          version: meta.version || CURRENT_APK_VERSION,
          releaseDate: meta.releaseDate,
          source: 'cached',
        };
      }
    } catch {}
    return {
      version: CURRENT_APK_VERSION,
      source: 'bundled',
    };
  }

  /**
   * Validates downloaded HTML bundle to ensure it contains required application markers.
   */
  static validateHtml(html: string): boolean {
    if (!html || typeof html !== 'string') return false;
    if (html.length < 50000) return false; // Full index.html is ~360 KB
    const requiredMarkers = [
      '<!DOCTYPE html>',
      'Student Manager',
      'handleNativeRestore',
      'syncWithNative',
      'smh_data_v1',
    ];
    return requiredMarkers.every((marker) => html.includes(marker));
  }

  /**
   * Checks the remote manifest for an available update.
   */
  static async checkForUpdates(manifestUrlOverride?: string): Promise<UpdateCheckResult> {
    const activeMeta = await this.getActiveVersionMeta();
    const manifestUrl = manifestUrlOverride || (await this.getManifestUrl());

    try {
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());

      const res = await fetch(manifestUrl, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) {
        throw new Error(`Manifest fetch failed with HTTP ${res.status}: ${res.statusText}`);
      }

      const manifest: VersionManifest = await res.json();
      if (!manifest || !manifest.version) {
        throw new Error('Manifest missing valid version identifier.');
      }

      // Check native APK compatibility
      if (manifest.minApkVersionCode && manifest.minApkVersionCode > CURRENT_APK_VERSION_CODE) {
        return {
          status: 'requires-apk',
          currentVersion: activeMeta.version,
          latestVersion: manifest.version,
          releaseNotes: manifest.releaseNotes,
          manifest,
          requiresApkUpgrade: true,
        };
      }

      const cmp = compareSemVer(manifest.version, activeMeta.version);
      if (cmp > 0) {
        return {
          status: 'available',
          currentVersion: activeMeta.version,
          latestVersion: manifest.version,
          releaseNotes: manifest.releaseNotes,
          manifest,
          requiresApkUpgrade: false,
        };
      }

      return {
        status: 'up-to-date',
        currentVersion: activeMeta.version,
        latestVersion: manifest.version,
        manifest,
        requiresApkUpgrade: false,
      };
    } catch (err: any) {
      console.warn('[UpdateManager] Check update failed:', err.message || err);
      return {
        status: 'failed',
        currentVersion: activeMeta.version,
        error: err.message || String(err),
      };
    }
  }

  /**
   * Downloads, validates, and stages a verified remote update.
   */
  static async downloadAndStageUpdate(
    manifest: VersionManifest,
    onProgress?: (progress: DownloadProgressEvent) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const assetUrl = manifest.entryUrl || (manifest.assets && manifest.assets[0]?.url);
      const expectedHash = (manifest.entrySha256 || (manifest.assets && manifest.assets[0]?.sha256) || '').trim().toLowerCase();
      const expectedSize = manifest.entrySize || (manifest.assets && manifest.assets[0]?.size) || 375852;

      if (!assetUrl || !expectedHash) {
        throw new Error('Manifest missing valid application bundle URL or SHA-256 checksum.');
      }

      onProgress?.({
        stage: 'checking',
        stageText: 'Checking for updates...',
        percent: 5,
        downloadedBytes: 0,
        totalBytes: expectedSize,
      });

      // Download payload with real-time byte tracking
      const htmlContent = await new Promise<string>((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', assetUrl);
          xhr.setRequestHeader('Cache-Control', 'no-cache');

          xhr.onprogress = (event) => {
            const loaded = event.loaded;
            const total = event.lengthComputable && event.total > 0 ? event.total : expectedSize;
            const rawPercent = Math.min(100, Math.round((loaded / total) * 100));
            // Scale download percent from 10% to 75%
            const overallPercent = 10 + Math.round((rawPercent / 100) * 65);
            onProgress?.({
              stage: 'downloading',
              stageText: 'Downloading application...',
              percent: overallPercent,
              downloadedBytes: loaded,
              totalBytes: total,
            });
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.responseText);
            } else {
              reject(new Error(`Download failed with HTTP ${xhr.status}: ${xhr.statusText || 'Server Error'}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error('Network error during bundle download. Please check your internet connection.'));
          };

          xhr.ontimeout = () => {
            reject(new Error('Connection timed out while downloading update package.'));
          };

          xhr.timeout = 35000;
          xhr.send();
        } catch (err: any) {
          // Fallback to standard fetch if XHR fails
          fetch(assetUrl, { headers: { 'Cache-Control': 'no-cache' } })
            .then((r) => {
              if (!r.ok) throw new Error(`Download failed with HTTP ${r.status}`);
              return r.text();
            })
            .then(resolve)
            .catch(reject);
        }
      });

      // 1. Verify cryptographic SHA-256 checksum
      onProgress?.({
        stage: 'verifying',
        stageText: 'Verifying integrity...',
        percent: 85,
        downloadedBytes: expectedSize,
        totalBytes: expectedSize,
      });

      const computedHash = sha256(htmlContent);
      if (computedHash !== expectedHash) {
        throw new Error(
          `Integrity checksum mismatch! Expected: ${expectedHash.slice(0, 16)}..., Computed: ${computedHash.slice(0, 16)}...`
        );
      }

      // 2. Validate HTML application structure
      onProgress?.({
        stage: 'preparing',
        stageText: 'Preparing application...',
        percent: 92,
        downloadedBytes: expectedSize,
        totalBytes: expectedSize,
      });

      if (!this.validateHtml(htmlContent)) {
        throw new Error('Downloaded bundle failed structural verification (missing critical runtime markers).');
      }

      // 3. Save to staging area
      onProgress?.({
        stage: 'preparing',
        stageText: 'Preparing application...',
        percent: 96,
        downloadedBytes: expectedSize,
        totalBytes: expectedSize,
      });

      await AsyncStorage.setItem(STAGED_HTML_KEY, htmlContent);
      await AsyncStorage.setItem(STAGED_MANIFEST_KEY, JSON.stringify(manifest));

      return { success: true };
    } catch (err: any) {
      console.error('[UpdateManager] Download error:', err);
      // Clean up staged artifacts if failed
      await AsyncStorage.removeItem(STAGED_HTML_KEY).catch(() => {});
      await AsyncStorage.removeItem(STAGED_MANIFEST_KEY).catch(() => {});
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Atomically activates a staged update and creates a data protection snapshot.
   */
  static async activateStagedUpdate(): Promise<{ success: boolean; activatedVersion?: string; error?: string }> {
    try {
      const stagedHtml = await AsyncStorage.getItem(STAGED_HTML_KEY);
      const stagedMetaStr = await AsyncStorage.getItem(STAGED_MANIFEST_KEY);

      if (!stagedHtml || !stagedMetaStr) {
        throw new Error('No staged update found to activate.');
      }

      const stagedMeta: VersionManifest = JSON.parse(stagedMetaStr);

      // Create a safety snapshot of existing user data before the switch
      await DataProtectionManager.createMigrationBackup(stagedMeta.version, 'pre-update-activation');

      // Save current working bundle to rollback location
      const currentCachedHtml = await AsyncStorage.getItem(CACHED_HTML_KEY);
      const currentCachedMeta = await AsyncStorage.getItem(CACHED_MANIFEST_KEY);

      if (currentCachedHtml) {
        await AsyncStorage.setItem(PREVIOUS_HTML_KEY, currentCachedHtml);
        if (currentCachedMeta) {
          await AsyncStorage.setItem(PREVIOUS_MANIFEST_KEY, currentCachedMeta);
        }
      }

      // Atomic activation
      await AsyncStorage.setItem(CACHED_HTML_KEY, stagedHtml);
      await AsyncStorage.setItem(CACHED_MANIFEST_KEY, JSON.stringify(stagedMeta));

      // Clear staging
      await AsyncStorage.removeItem(STAGED_HTML_KEY);
      await AsyncStorage.removeItem(STAGED_MANIFEST_KEY);

      console.log(`[UpdateManager] Activated update v${stagedMeta.version} successfully!`);
      return { success: true, activatedVersion: stagedMeta.version };
    } catch (err: any) {
      console.error('[UpdateManager] Activation failed:', err);
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Rollback to the previous verified working HTML version if available.
   */
  static async rollbackToPreviousVersion(): Promise<{ success: boolean; restoredVersion?: string; error?: string }> {
    try {
      const previousHtml = await AsyncStorage.getItem(PREVIOUS_HTML_KEY);
      const previousMetaStr = await AsyncStorage.getItem(PREVIOUS_MANIFEST_KEY);

      if (!previousHtml) {
        throw new Error('No previous version available for rollback.');
      }

      const previousMeta = previousMetaStr ? JSON.parse(previousMetaStr) : { version: 'previous' };

      // Swap active and previous
      await AsyncStorage.setItem(CACHED_HTML_KEY, previousHtml);
      if (previousMetaStr) {
        await AsyncStorage.setItem(CACHED_MANIFEST_KEY, previousMetaStr);
      }
      await AsyncStorage.removeItem(PREVIOUS_HTML_KEY);
      await AsyncStorage.removeItem(PREVIOUS_MANIFEST_KEY);

      console.log(`[UpdateManager] Rolled back to version v${previousMeta.version}.`);
      return { success: true, restoredVersion: previousMeta.version };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }
}
