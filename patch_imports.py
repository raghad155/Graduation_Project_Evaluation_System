import os
import glob
import re

pages_dir = "src/app/pages"

for ts_file in glob.glob(os.path.join(pages_dir, "**", "*.ts"), recursive=True):
    html_file = ts_file.replace('.ts', '.html')
    if not os.path.exists(html_file):
        continue
    
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        html_content = f.read()
        
    if '<app-icon' in html_content:
        with open(ts_file, 'r', encoding='utf-8') as f:
            ts_content = f.read()
            
        if 'IconComponent' not in ts_content:
            depth = ts_file.count(os.sep) - 2 # Pages depth is usually 2 or 3
            prefix = '../' * max(1, depth)
            
            # Inject import
            ts_content = ts_content.replace("import { Component", f"import {{ IconComponent }} from '{prefix}shared/components/icon/icon.component';\nimport {{ Component")
            
            # Add to imports array
            ts_content = re.sub(r'(imports:\s*\[)([^\]]+)(\])', r'\1\2, IconComponent\3', ts_content)
            
            with open(ts_file, 'w', encoding='utf-8') as f:
                f.write(ts_content)
            print(f"Patched {ts_file}")
