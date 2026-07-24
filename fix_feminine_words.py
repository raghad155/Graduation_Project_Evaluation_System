import os
import glob
import re

src_dir = "src"

replacements = {
    "ارفعي": "ارفع",
    "راجعي": "راجع",
    "اختاري": "اختر",
    "استخدمي": "استخدم",
    "حافظي": "حافظ",
    "واستورديه": "واستورده",
    "استورديه": "استورده",
    "حددي": "حدد",
    "أدخلي": "أدخل",
    "اكتبي": "اكتب",
    "قومي": "قم",
    "تأكدي": "تأكد"
}

fixed_files = 0

for ext in ["*.html", "*.ts"]:
    for filepath in glob.glob(os.path.join(src_dir, "**", ext), recursive=True):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for fem, masc in replacements.items():
                # Word boundary replacement to avoid accidental internal replacements
                # Arabic characters can use \b but to be perfectly safe we use regex \b
                # Wait, space and punctuation boundary is safer for Arabic inside raw strings
                pattern = r'(?<![\u0600-\u06FF])' + fem + r'(?![\u0600-\u06FF])'
                content = re.sub(pattern, masc, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed feminine words in: {filepath}")
                fixed_files += 1
        except Exception as e:
            pass

print(f"Total files updated: {fixed_files}")
