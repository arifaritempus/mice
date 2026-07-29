import re

with open("frontend/src/lib/supabaseService.ts", "r") as f:
    text = f.read()

# Replace for sejour_transfers
text = re.sub(
    r'(sejour_transfers\(\s*\*\s*),\s*suppliers\(\*\)\s*(\))',
    r'\1\2',
    text
)

# Replace for sejour_extra_services
text = re.sub(
    r'(sejour_extra_services\(\s*\*\s*,\s*service_types\(\*\)\s*),\s*suppliers\(\*\)\s*(\))',
    r'\1\2',
    text
)

with open("frontend/src/lib/supabaseService.ts", "w") as f:
    f.write(text)

