import os
import glob
import re

scripts = glob.glob('scripts/apply_foolproof_mockup*.py')

for f in scripts:
    with open(f, 'r') as file:
        content = file.read()
    
    # We will use regex to find any replace call like:
    # content = content.replace('                {showAccommodation && (', rooms_header)
    # and replace it with:
    # content = re.sub(r'\\{\\/\\* Accommodation Section \\*\\/\\}\\n\\s*\\{showAccommodation && \\(', rooms_header, content, count=1)
    
    # 1. Accommodation
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\* Accommodation Section \*\/\\n)?\s*\{showAccommodation && \(['\"],\s*rooms_header\)",
        r"content = re.sub(r'\\{\\/\\* Accommodation Section \\*\\/\\}\\n\\s*\\{showAccommodation && \\(', rooms_header, content, count=1)",
        content
    )

    # 2. Flight
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\* Flight Section \*\/\\n)?\s*\{showFlight && \(['\"],\s*flights_header\)",
        r"content = re.sub(r'\\{\\/\\* (?:Flight|Flight Information) \\*\\/\\}\\n\\s*\\{showFlight && \\(', flights_header, content, count=1)",
        content
    )

    # 3. Transfer
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\* Transfer Section \*\/\\n)?\s*\{showTransfer && \(['\"],\s*transfers_header\)",
        r"content = re.sub(r'\\{\\/\\* (?:Transfer|Transfer Information) \\*\\/\\}\\n\\s*\\{showTransfer && \\(', transfers_header, content, count=1)",
        content
    )

    # 4. Extra Services
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\* Extra Services Section \*\/\\n)?\s*\{showExtraServices && \(['\"],\s*extra_header\)",
        r"content = re.sub(r'\\{\\/\\* (?:Extra Services|Extra Services Information) \\*\\/\\}\\n\\s*\\{showExtraServices && \\(', extra_header, content, count=1)",
        content
    )

    # Make sure we import re if not imported
    if "import re" not in content:
        content = "import re\n" + content

    with open(f, 'w') as file:
        file.write(content)
    
    print(f"Fixed {f}")
