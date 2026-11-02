import os

file_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(file_dir)
index_html_path = os.path.join(root_dir, 'index.html')
if not os.path.exists(index_html_path):
    index_html_path = os.path.join(file_dir, 'index.html')
if not os.path.exists(index_html_path):
    index_html_path = 'index.html'

with open(index_html_path, 'r', encoding='utf-8') as f:
    text = f.read()

checks = [
    ("close-sidebar action handler", "case 'close-sidebar': closeSidebar(); break;"),
    ("sidebarOverlay element", 'id="sidebarOverlay"'),
    ("sidebar-close-btn button", 'class="icon-btn sidebar-close-btn" data-action="close-sidebar"'),
    ("desktop overlay hide CSS", '#sidebarOverlay{display:none !important;pointer-events:none !important}'),
    ("openSidebar function", "function openSidebar()"),
    ("closeSidebar function", "function closeSidebar()"),
    ("toggleSidebar function", "function toggleSidebar()"),
    ("isDefaultHoliday function", "function isDefaultHoliday(dateObj, academyName)"),
    ("Al Momina holiday check", "isMomina"),
    ("syncWithNative function", "function syncWithNative(dataObj)"),
    ("handleNativeRestore function", "window.handleNativeRestore = function(jsonStr)"),
    ("Escape key closes sidebar", "if(sb && sb.classList.contains('open')){"),
    ("direct click listener on sidebarOverlay", "sbOverlay.addEventListener('click', function(e){"),
]

all_passed = True
for name, sub in checks:
    if sub in text:
        print(f"PASS: {name}")
    else:
        print(f"FAIL: {name}")
        all_passed = False

if all_passed:
    print("ALL INTEGRITY CHECKS PASSED!")
else:
    raise SystemExit(1)
