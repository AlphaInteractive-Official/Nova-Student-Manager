# Nova Student Manager — Remote Update & Zero-Data-Loss Architecture

## Organization: Alpha Interactive
## Application: Nova Student Manager (`com.alphainteractive.studentmanager`)
## Version: Native APK v1.1.03 (Build Code 4) | Remote Engine v1.1.04 (Build Code 5)

---

## 1. Executive Summary

This architecture transforms **Nova Student Manager** from a static embedded HTML WebView app into a **centrally maintainable, remotely updateable, and offline-capable hybrid application**, while strictly enforcing **Zero Data Loss** across all existing user records, attendance registers, examination marks, and settings.

### Core Guarantees:
1. **Durable Local Storage**: All student records, attendance matrices, examination marks, and settings remain permanently stored on the device in native `AsyncStorage` (`@smh_permanent_storage_v1`). No cloud database is required and student records are **never** uploaded to any external server.
2. **Zero-Data-Loss Overwrite Prevention**: The native Android shell intercepts every state synchronization. If a fresh remote web application loads with an empty state (0 students), the native guard **blocks** the sync, keeps local records safe, and immediately re-injects the real student records into the WebView.
3. **Atomic Updates with Cryptographic Verification**: Remote updates are downloaded and verified against a 64-character SHA-256 hash before staging. Activation is atomic; if a download fails, is interrupted, or contains corrupted bytes, the app continues running the verified active version.
4. **Offline-First Resilience**: If internet connectivity is unavailable, the application transparently launches the last verified cached version from local storage, or falls back to the native bundled version inside the APK.
5. **APK Upgrade Compatibility**: Keystore configuration (`debug.keystore`), package identifier (`com.alphainteractive.studentmanager`), and storage schema (`v1`) are strictly preserved, allowing new APKs to upgrade seamlessly over existing installations without data loss.

---

## 2. Architecture Map

```
+-----------------------------------------------------------------------------------+
|                            ALPHA INTERACTIVE HOSTING                              |
|   (Free Static CDN: Cloudflare Pages / GitHub Pages — HTTPS Only)                |
|                                                                                   |
|   +--------------------------+       +----------------------------------------+   |
|   |   version-manifest.json  |  <--  |  app.html (Single-file Web App)        |   |
|   |   - version: 1.1.04      |       |  - SHA-256: 5801032e...501f            |   |
|   |   - minApkVersionCode: 4 |       |  - Size: 375,852 bytes                 |   |
|   +--------------------------+       +----------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS Fetch / Check
                                         v
+-----------------------------------------------------------------------------------+
|                        NOVA STUDENT MANAGER ANDROID APP                           |
|                      (com.alphainteractive.studentmanager)                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [UpdateManager]                                                             |  |
|  | - SemVer Comparator (compareSemVer)                                         |  |
|  | - Pure-TS SHA-256 Verifier (sha256.ts)                                      |  |
|  | - Atomic Cache Manager (@smh_cached_html_bundle)                            |  |
|  | - Rollback Staging (@smh_previous_html_bundle)                              |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  | [DataProtectionManager]                                                     |  |
|  | - Empty Overwrite Guard: isSafeToOverwrite()                                |  |
|  | - Pre-Migration Snapshot: @smh_migration_backup_v1                           |  |
|  | - Rollback Copy: @smh_rollback_copy_v1                                      |  |
|  | - State Reconciliation: Non-destructive ID & composite-key merge            |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------+  |  +-----------------------------------+  |
|  |    Active Storage (Durable)       |  |  |    Fallback Bundled Engine        |  |
|  |    AsyncStorage:                  |  |  |    StudentManagerApp/             |  |
|  |    @smh_permanent_storage_v1      |  |  |    src/htmlBundle.ts              |  |
|  +-----------------------------------+  |  +-----------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  | [React Native WebView Shell] (App.tsx)                                      |  |
|  | - Base64 HTML injection: data:text/html;base64,...                          |  |
|  | - Bi-directional Bridge: postMessage <-> window.handleUpdateEvent           |  |
|  | - On-Load Injection: window.handleNativeRestore(savedState)                 |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             USER INTERFACE (WebView)                              |
|  - Dashboard, Attendance Matrix, Marks Register, Schedule, Reports                |
|  - Settings -> "Application Updates & Zero-Data-Loss Protection"                  |
|    * Automatic Updates Toggle (Enabled / Disabled)                                |
|    * Check for Updates Action & Progress Panel                                    |
|    * Pre-Migration Snapshot & Rollback Buttons                                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Protection System (Zero Data Loss)

### 3.1 The Empty Overwrite Vulnerability & Solution
In traditional hybrid WebView applications, when a fresh web page loads, its in-memory state starts with empty arrays (`students: []`). If an auto-save timer or blur event fires before native data is injected, it can send `SYNC_STATE` with empty arrays to native storage, wiping out records.

**Nova Student Manager Solution**:
In `DataProtectionManager.ts`, the `isSafeToOverwrite()` method inspects every incoming payload:
```typescript
if (currentStats.studentCount > 0 && incomingStats.studentCount === 0) {
  return {
    safe: false,
    reason: `Refusing sync: Incoming state has 0 students, but current device storage has ${currentStats.studentCount} students.`
  };
}
```
When an unsafe sync is detected in `App.tsx`:
1. The write operation to `AsyncStorage` is **aborted**.
2. A high-priority warning is sent to the WebView (`toast("Data Protection: Empty state rejected. Preserving saved records.", "warn")`).
3. The real populated state from native storage is immediately re-injected via `restoreDataToWebView()`.

### 3.2 Pre-Migration Snapshots & Rollback
Before applying any remote update or schema change:
- `DataProtectionManager.createMigrationBackup(appVersion, reason)` captures a full snapshot in `@smh_migration_backup_v1`.
- An identical safety copy is written to `@smh_rollback_copy_v1`.
- The snapshot records:
  - Full application state (students, subjects, attendance, marks, classes, settings).
  - Schema version (`1`).
  - Native application version.
  - Timestamp (ISO 8601).
  - Record statistics (student count, attendance count, marks count).
  - SHA-256 data integrity checksum.

### 3.3 State Reconciliation Algorithm
If an incoming update contains partial records or user data from a restored backup:
- **Students**: Merged by unique `id`. Existing fields are preserved; unknown extra properties are never dropped.
- **Subjects**: Merged by unique `id`.
- **Attendance**: Merged by composite key `${studentId}_${date}`.
- **Marks**: Merged by composite key `${studentId}_${subjectId}_${exam}`.
- **Classes**: Merged by unique class identifier.

---

## 4. Remote Web Application Updates

### 4.1 Update Lifecycle
1. **Version Check**:
   - The app reads the manifest at `https://<hosting-domain>/version-manifest.json`.
   - `compareSemVer(remoteVersion, currentVersion)` determines if an upgrade is available.
   - If `remoteVersion <= currentVersion`, the app reports `up-to-date`.
   - If `manifest.minApkVersionCode > CURRENT_APK_VERSION_CODE (4)`, the app prompts the user to download a new APK rather than applying a web update.
2. **Download & Verification**:
   - Downloads the HTML payload from `manifest.entryUrl`.
   - Computes the SHA-256 hash using the zero-dependency pure-TS algorithm.
   - Compares with `manifest.entrySha256`. If the hash does not match, the payload is rejected and deleted.
3. **Atomic Staging**:
   - The verified HTML is saved to `@smh_staged_html_bundle`.
   - The staged manifest is saved to `@smh_staged_manifest_meta`.
   - The currently working version is **not modified** during download.
4. **Activation**:
   - Moves current cache to `@smh_previous_html_bundle` (for rollback).
   - Moves staged version to `@smh_cached_html_bundle`.
   - Reloads WebView with the new version.
   - Student data in native storage remains 100% untouched and is re-injected.

### 4.2 Version Manifest Specification (`version-manifest.json`)
```json
{
  "version": "1.1.04",
  "buildCode": 5,
  "releaseDate": "2026-11-02",
  "minApkVersionCode": 4,
  "entryUrl": "https://alphainteractive.github.io/nova-student-manager/app.html",
  "entrySha256": "5801032e2d7e1f8fc72a1b356d43d6e8830dbb83508d99992ed5c6726653501f",
  "entrySize": 375852,
  "releaseNotes": "Online application updates, zero-data-loss protection architecture, pre-migration snapshot safety, and bilingual rendering optimizations.",
  "compatibility": {
    "targetPackage": "com.alphainteractive.studentmanager",
    "supportedStorageSchema": "v1",
    "zeroDataLossGuaranteed": true
  }
}
```

---

## 5. Free Hosting Setup & Deployment

### 5.1 Cloudflare Pages (Recommended)
Cloudflare Pages provides global edge CDN distribution with free unlimited bandwidth and automatic SSL:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
2. Click **Create application** -> **Pages**.
3. Choose **Direct Upload** (drag & drop the `hosting/` directory) or **Connect to Git**.
4. Set Output Directory to `hosting/`.
5. Deploy. You receive a free URL: `https://<project-name>.pages.dev/`.
6. Set the app manifest URL to: `https://<project-name>.pages.dev/version-manifest.json`.

### 5.2 GitHub Pages
1. Push the contents of `hosting/` to your GitHub repository (branch `main` or `gh-pages`).
2. Go to **Settings** -> **Pages**.
3. Select Source: **Deploy from a branch** -> branch `/` (root) or `/hosting`.
4. Your free endpoint is: `https://<org>.github.io/<repo>/version-manifest.json`.

---

## 6. Native APK Upgrade Compatibility

When native code changes, permissions change, or new native libraries are added, an APK upgrade is required.

### Mandatory Rules for Seamless In-Place APK Upgrades:
1. **Package Identifier**: Must strictly remain `com.alphainteractive.studentmanager` (defined in `app.json` and `build.gradle`).
2. **Signing Keystore**: Must use the exact same keystore (`StudentManagerApp/android/app/debug.keystore`).
   - Keystore path: `android/app/debug.keystore`
   - Key alias: `androiddebugkey`
   - Store password: `android`
   - Key password: `android`
   *(Both debug and release builds in `build.gradle` are configured to use this keystore).*
3. **Version Code**: Increment `versionCode` in `app.json` (e.g. from `4` to `5`) and in `build.gradle`.
4. **No Uninstall Required**: Users simply tap and install the new APK over their existing installation. Android OS preserves the private app data directory (`AsyncStorage`).

---

## 7. Test Results & Validation Matrix

| Test ID | Test Scenario | Execution Method | Result | Notes |
|---|---|---|---|---|
| **Test A** | Existing Data Preservation | Automated (`test_update_architecture.js`) | **PASS** | Populated student records and history survive state reconciliation |
| **Test B** | Empty Overwrite Guard | Automated (`test_update_architecture.js`) | **PASS** | Incoming empty state is strictly blocked from overwriting 2+ students |
| **Test C** | SHA-256 Bit-Level Verification | Automated (`test_update_architecture.js`) | **PASS** | Pure-TS SHA-256 matches Node.js `crypto` byte-for-byte on 375KB payload |
| **Test D** | SemVer Comparison Logic | Automated (`test_update_architecture.js`) | **PASS** | Correctly resolves upgrade, equality, minor, and major version bounds |
| **Test E** | Manifest & Payload Hash Parity | Automated (`test_update_architecture.js`) | **PASS** | `entrySha256` and `entrySize` match generated `app.html` file exactly |
| **Test F** | Package & Keystore Identity | Automated (`test_update_architecture.js`) | **PASS** | `com.alphainteractive.studentmanager` & `debug.keystore` verified in `build.gradle` |
| **Test G** | HTML Feature Integrity | Python (`verify_features.py`) | **PASS** | All 13 core features, sidebar, holidays, and bridge handlers verified |
| **Test H** | TypeScript Compilation | Compiler (`npx tsc --noEmit`) | **PASS** | 0 errors, 0 warnings across `StudentManagerApp` |

---

## 8. Rollback & Emergency Recovery Procedures

### Scenario 1: Reverting a Broken Remote Web Update
If a new web version introduced an unexpected bug:
1. **Via UI**: In the app, navigate to **Settings** -> **Application Updates & Zero-Data-Loss Protection** -> Click **Rollback Web Engine Version**. The app immediately restores `@smh_previous_html_bundle` or original APK bundle.
2. **Via Hosting Server**: In `hosting/version-manifest.json`, set `"entryUrl"` back to the previous stable `app.html` and decrement or re-release.

### Scenario 2: Restoring from Pre-Migration Snapshot
If user records need to be reverted to the pre-migration state:
1. Navigate to **Settings** -> **Application Updates & Zero-Data-Loss Protection**.
2. Click **Restore Pre-Migration Snapshot**.
3. Confirm in the dialog. The native storage replaces `@smh_permanent_storage_v1` with `@smh_migration_backup_v1` and reloads the interface.
