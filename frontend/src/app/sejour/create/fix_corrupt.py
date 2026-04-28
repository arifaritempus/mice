import sys

def fix_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
        line_no = i + 1
        # Fix the corrupted lines at 1748 and 1963
        if "</div>" in line and "))}" in line:
            # Split it into two lines
            indent = line[:line.find("</div>")]
            new_lines.append(f"{indent}</div>\n")
            new_lines.append(f"{indent}    ))}}\n")
            print(f"Fixed line {line_no}")
        else:
            new_lines.append(line)

    with open(filename, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    fix_file(sys.argv[1])
