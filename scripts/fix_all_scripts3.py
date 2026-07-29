import glob
import re

scripts = glob.glob('scripts/apply_foolproof_mockup*.py')

for f in scripts:
    with open(f, 'r') as file:
        content = file.read()
    
    # We will forcefully find the assignments to `content` where we inject headers
    
    # Rooms
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\*.*?\\n)?\s*\{showAccommodation && \(['\"],\s*([a-zA-Z0-9_]+)\)",
        r"content = re.sub(r'\\{\\/\\* Accommodation Section \\*\\/\\}\\n\\s*\\{showAccommodation && \\(', \2, content, count=1)",
        content
    )

    # Flights
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\*.*?\\n)?\s*\{showFlight && \(['\"],\s*([a-zA-Z0-9_]+)\)",
        r"content = re.sub(r'\\{\\/\\* (?:Flight|Flight Information) \\*\\/\\}\\n\\s*\\{showFlight && \\(', \2, content, count=1)",
        content
    )

    # Transfers
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\*.*?\\n)?\s*\{showTransfer && \(['\"],\s*([a-zA-Z0-9_]+)\)",
        r"content = re.sub(r'\\{\\/\\* (?:Transfer|Transfer Information) \\*\\/\\}\\n\\s*\\{showTransfer && \\(', \2, content, count=1)",
        content
    )

    # Extra Services
    content = re.sub(
        r"content\s*=\s*content\.replace\(['\"](\s*\{\/\*.*?\\n)?\s*\{showExtraServices && \(['\"],\s*([a-zA-Z0-9_]+)\)",
        r"content = re.sub(r'\\{\\/\\* (?:Extra Services|Extra Services Information) \\*\\/\\}\\n\\s*\\{showExtraServices && \\(', \2, content, count=1)",
        content
    )

    if "import re" not in content:
        content = "import re\n" + content

    with open(f, 'w') as file:
        file.write(content)
    
    print(f"Fixed {f}")
