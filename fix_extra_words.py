import os
import glob
import re

src_dir = "src"

replacements = {
    "أضيفي": "أضف",
    "ضيفي": "أضف",
    "ابحثي": "ابحث",
    "اضغطي": "اضغط",
    "انقري": "انقر",
    "تجاهلي": "تجاهل",
    "انسخي": "انسخ",
    "الصقي": "الصق"
}

fixed_files = 0

for ext in ["*.html", "*.ts"]:
    for filepath in glob.glob(os.path.join(src_dir, "**", ext), recursive=True):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for fem, masc in replacements.items():
                pattern = r'(?<![\u0600-\u06FF])' + fem + r'(?![\u0600-\u06FF])'
                content = re.sub(pattern, masc, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed extra words in: {filepath}")
                fixed_files += 1
        except Exception as e:
            pass

print(f"Total extra files updated: {fixed_files}")
