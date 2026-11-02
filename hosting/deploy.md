# Nova Student Manager — Remote Web Application Hosting & Deployment Guide

## Organization: Alpha Interactive
## Application: Nova Student Manager (`com.alphainteractive.studentmanager`)

---

### Overview

Nova Student Manager uses an **Offline-First Remote Update Architecture**.
The web application interface (`app.html`) and release manifest (`version-manifest.json`) are statically hosted on 100% free hosting providers (such as **Cloudflare Pages** or **GitHub Pages**).

- **No backend database is required for updates**: User student data is stored strictly on the user's local device (`@smh_permanent_storage_v1` in native AsyncStorage).
- **Zero data loss**: Web updates deliver HTML/CSS/JS without touching or clearing native storage.
- **Atomic updates with SHA-256 verification**: Updates are verified and staged before activation.
- **Offline resilience**: If there is no internet, the app launches from the local verified cache or bundled APK assets.

---

### Recommended Free Hosting Providers

#### Option A: Cloudflare Pages (Recommended: Fast Global CDN, Free Unlimited Bandwidth)
1. Sign up / Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create Application** -> **Pages**.
3. Choose either:
   - **Direct Upload**: Drag & drop the `hosting/` directory containing `version-manifest.json` and `app.html`.
   - **Connect to Git**: Connect your GitHub repository and set output directory to `hosting/`.
4. Deploy! Your free HTTPS endpoint will be: `https://<your-project>.pages.dev/`.
5. Point your update manifest URL in the app to: `https://<your-project>.pages.dev/version-manifest.json`.

#### Option B: GitHub Pages (100% Free, Built into GitHub Repositories)
1. Create a repository on GitHub (e.g. `nova-student-manager-updates`).
2. Push the contents of the `hosting/` directory to a branch (e.g., `main` or `gh-pages`).
3. In repository **Settings** -> **Pages**:
   - Source: Deploy from a branch -> `main` / `root` (or `gh-pages`).
4. Save. Your free HTTPS endpoint will be: `https://<organization>.github.io/<repo>/`.
5. The update manifest will be available at: `https://<organization>.github.io/<repo>/version-manifest.json`.

---

### Workflow: Publishing a New Remote Web Update

Whenever you want to release an update (bug fix, new UI feature, holiday list update, report enhancement):

1. **Modify the Application**:
   Edit `index.html` at the project root.
2. **Synchronize Bundle & Run Verification**:
   ```bash
   python StudentManagerApp/bundle_html.py
   python StudentManagerApp/verify_features.py
   ```
3. **Compute SHA-256 and Size of `index.html`**:
   ```bash
   python -c "import hashlib; d=open('index.html','rb').read(); print('Bytes:', len(d)); print('SHA256:', hashlib.sha256(d).hexdigest())"
   ```
4. **Update `hosting/` Files**:
   - Copy `index.html` to `hosting/app.html` and `hosting/index.html`.
   - In `hosting/version-manifest.json`, increment `"version"` (e.g., `"1.1.05"`), update `"entrySha256"`, `"entrySize"`, `"releaseDate"`, and describe changes in `"releaseNotes"`.
5. **Publish to Hosting**:
   Deploy the `hosting/` folder to Cloudflare Pages or push to GitHub Pages.
6. **Automatic Rollout**:
   Users running Nova Student Manager will automatically receive the update on launch (if automatic updates are enabled) or can tap **Check for Updates** in **Settings**.
