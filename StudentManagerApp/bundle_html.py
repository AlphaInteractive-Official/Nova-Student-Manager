import base64
import os
import shutil
import hashlib
import json

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
index_html_path = os.path.join(root_dir, 'index.html')
public_dir = os.path.join(root_dir, 'StudentManagerApp', 'public')
public_app_path = os.path.join(public_dir, 'app.html')
bundle_ts_path = os.path.join(root_dir, 'StudentManagerApp', 'src', 'htmlBundle.ts')
hosting_dir = os.path.join(root_dir, 'hosting')
hosting_app_path = os.path.join(hosting_dir, 'app.html')
hosting_index_path = os.path.join(hosting_dir, 'index.html')
manifest_path = os.path.join(hosting_dir, 'version-manifest.json')

os.makedirs(public_dir, exist_ok=True)
os.makedirs(hosting_dir, exist_ok=True)

# Copy to targets
shutil.copyfile(index_html_path, public_app_path)
shutil.copyfile(index_html_path, hosting_app_path)
shutil.copyfile(index_html_path, hosting_index_path)
print(f'Synced index.html -> public/app.html, hosting/app.html, hosting/index.html')

with open(index_html_path, 'rb') as f:
    content = f.read()

sha256_hash = hashlib.sha256(content).hexdigest()
size_bytes = len(content)
b64_str = base64.b64encode(content).decode('ascii')
print(f'Encoded index.html: {size_bytes} bytes, SHA-256: {sha256_hash}')

with open(bundle_ts_path, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated bundle from index.html\n')
    f.write(f'export const HTML_BASE64 = "{b64_str}";\n')

# Update hosting manifest if it exists
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    manifest['entrySha256'] = sha256_hash
    manifest['entrySize'] = size_bytes
    if 'assets' in manifest and len(manifest['assets']) > 0:
        manifest['assets'][0]['sha256'] = sha256_hash
        manifest['assets'][0]['size'] = size_bytes
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    print(f'Updated {manifest_path} with new SHA-256 and size!')

print(f'Updated {bundle_ts_path} successfully!')
