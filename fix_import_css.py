import os

html_path = 'src/app/pages/student-import/student-import.component.html'
scss_path = 'src/app/pages/student-import/student-import.component.scss'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()
    
# Replace the bad selector class with the proper switch class
html = html.replace('class="import-type-selector"', 'class="import-type-switch"')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

with open(scss_path, 'r', encoding='utf-8') as f:
    scss = f.read()

# Update the toggle group to support 3 buttons (Students, Supervisors, Projects)
scss = scss.replace('repeat(2,', 'repeat(3,')

with open(scss_path, 'w', encoding='utf-8') as f:
    f.write(scss)
    
print("CSS Classes Fixed!")
