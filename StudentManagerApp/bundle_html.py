import base64
import os
import shutil

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
index_html_path = os.path.join(root_dir, 'index.html')
public_dir = os.path.join(root_dir, 'StudentManagerApp', 'public')
public_app_path = os.path.join(public_dir, 'app.html')
bundle_ts_path = os.path.join(root_dir, 'StudentManagerApp', 'src', 'htmlBundle.ts')

os.makedirs(public_dir, exist_ok=True)
shutil.copyfile(index_html_path, public_app_path)
print(f'Copied {index_html_path} -> {public_app_path}')

with open(index_html_path, 'rb') as f:
    content = f.read()

b64_str = base64.b64encode(content).decode('ascii')
print(f'Encoded index.html: {len(content)} bytes -> {len(b64_str)} base64 chars')

with open(bundle_ts_path, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated bundle from index.html\n')
    f.write(f'export const HTML_BASE64 = "{b64_str}";\n')

print(f'Updated {bundle_ts_path} successfully!')
