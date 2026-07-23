import os
import re

emoji_pattern = re.compile(
    u'('
    u'\ud83c[\udf00-\udfff]|'
    u'\ud83d[\udc00-\ude4f\ude80-\udeff]|'
    u'[\u2600-\u26FF\u2700-\u27BF])+',
    re.UNICODE)

for root, dirs, files in os.walk('c:/xampp/htdocs/frontend-project-main/frontend-project-main/frontend/src/app/pages'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if emoji_pattern.search(content):
                    print(filepath)
