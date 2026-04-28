import sys

def cleanup_file(filename, lines_to_remove):
    with open(filename, 'r') as f:
        lines = f.readlines()

    new_lines = []
    # Adjust to 0-indexed and sort reverse to avoid shifting issues? 
    # Or just use a set of line numbers if I process in one pass.
    remove_set = set(lines_to_remove)
    
    for i, line in enumerate(lines):
        line_no = i + 1
        if line_no in remove_set:
            # Verify it's actually a div closing tag
            if "</div>" in line:
                print(f"Removing redundant tag at line {line_no}: {line.strip()}")
                continue
        new_lines.append(line)

    with open(filename, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    # The lines reported by the script as extra closings
    to_remove = [2031, 2240, 2270, 2273]
    cleanup_file(sys.argv[1], to_remove)
