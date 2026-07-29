import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

date_input_component = """
const DateInput = ({ value, onChange, className, name, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = value ? value.split('-').reverse().join('.') : '';
  
  return (
    <input
      {...props}
      type={isFocused ? "date" : "text"}
      value={isFocused ? value : displayValue}
      onChange={onChange}
      onFocus={(e) => {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      }}
      className={className}
      name={name}
      placeholder="GG.AA.YYYY"
    />
  );
};
"""

def apply_v29(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject DateInput after ComboBox
    if "const DateInput =" not in content:
        pattern = re.compile(r'(function ComboBox\{.*?\n\}\n)', re.DOTALL)
        # Wait, ComboBox is function ComboBox({ ... }) { ... }
        # Let's just inject after the imports
        import_pattern = re.compile(r'(import \{ toast \} from "react-hot-toast";\n)')
        content = import_pattern.sub(r'\1\n' + date_input_component + '\n', content)

    # Replace <input type="date" ... />
    # Single line: <input type="date"
    content = content.replace('<input type="date"', '<DateInput')
    
    # Multi line: <input \n type="date"
    # We will use regex for <input followed by whitespace and type="date"
    content = re.sub(r'<input(\s+)type="date"', r'<DateInput\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY APPLIED V29 DATE FORMAT IN {filepath}")

for fp in files:
    apply_v29(fp)
