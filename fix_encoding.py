import os
import glob

# The PowerShell Set-Content command read the UTF-8 files as Windows-1252 
# and wrote them back incorrectly. The bytes are still the original UTF-8 bytes,
# but PowerShell interpreted them as latin-1 then wrote them as latin-1.
# So the file now contains latin-1 bytes that were originally UTF-8 bytes.
# To fix: read as latin-1, encode to bytes, decode as UTF-8.

pages_dir = "src/app/pages"

fixed_count = 0
error_files = []

for html_file in glob.glob(os.path.join(pages_dir, "**", "*.html"), recursive=True):
    with open(html_file, 'rb') as f:
        raw_bytes = f.read()
    
    # Check if file has BOM (already correct UTF-8)
    if raw_bytes[:3] == b'\xef\xbb\xbf':
        print(f"SKIP (BOM): {html_file}")
        continue
    
    # Try to decode as UTF-8 first
    try:
        content_utf8 = raw_bytes.decode('utf-8')
        # Check for garbled patterns (Windows-1252 misread Arabic bytes look like Ø± ط etc.)
        if 'Ø' in content_utf8 or 'Ù' in content_utf8 or 'طھ' in content_utf8 or 'ظ' in content_utf8:
            # It's double-encoded: bytes are latin-1, but represent UTF-8 codepoints
            # Re-read as latin-1, get back the original bytes, then decode as UTF-8
            latin1_str = raw_bytes.decode('latin-1')
            try:
                restored_bytes = latin1_str.encode('latin-1')
                restored_text = restored_bytes.decode('utf-8')
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(restored_text)
                print(f"FIXED: {html_file}")
                fixed_count += 1
            except (UnicodeDecodeError, UnicodeEncodeError) as e:
                print(f"ERROR (inner): {html_file}: {e}")
                error_files.append(html_file)
        else:
            print(f"OK: {html_file}")
    except UnicodeDecodeError:
        print(f"ERROR (outer): {html_file}")
        error_files.append(html_file)

print(f"\nDone! Fixed {fixed_count} files. Errors: {len(error_files)}")
for e in error_files:
    print(f"  ERROR: {e}")
