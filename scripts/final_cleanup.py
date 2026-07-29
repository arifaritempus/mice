import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The OLD states were around `const formatAmount = (val: number) => {` and `const [roomPriceInput...`
    # They look like this:
    # const formatAmount = (val: number) => { ... };
    # const [roomPriceInput, setRoomPriceInput] = useState<Record<string, string>>({});
    
    # We will remove them using precise regex for the specific block
    old_states_regex = r'const formatAmount = \(val: number\) => \{\s*if \(\!val && val \!== 0\) return "";\s*return val\.toLocaleString\("tr-TR", \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\);\s*\};\s*const \[roomPriceInput, setRoomPriceInput\] = useState<Record<string, string>>\(\s*\{\}\s*\);\s*const \[roomCostInput, setRoomCostInput\] = useState<Record<string, string>>\(\s*\{\}\s*\);\s*const \[servicePriceInput, setServicePriceInput\] = useState<\s*Record<string, string>\s*>\(\{\}\);\s*'

    content = re.sub(old_states_regex, '', content)

    # Extra service date fix
    if "date?: string;" not in content:
        content = content.replace("serviceType: string;", "date?: string;\n  serviceType: string;")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    clean_file(filepath)
