import sys

def fix_sejour_tags(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
        line_no = i + 1
        
        # Accommodation Section (Sales Tab)
        if 990 <= line_no <= 995 and "))}" in line:
            new_lines.append("                    </div>\n")
            new_lines.append("                  </div>\n")
            new_lines.append("                ))}\n")
            print(f"Fixed Accommodation Section at line {line_no}")
        
        # Flight Section (Purchase Tab)
        elif 1745 <= line_no <= 1750 and "))}" in line:
            new_lines.append("                        </div>\n")
            new_lines.append("                      </div>\n")
            new_lines.append("                    ))}\n")
            print(f"Fixed Flight Section at line {line_no}")
            
        # Extra Services Section (Purchase Tab)
        elif 1960 <= line_no <= 1965 and "))}" in line:
            new_lines.append("                        </div>\n")
            new_lines.append("                      </div>\n")
            new_lines.append("                    ))}\n")
            print(f"Fixed Extra Services Section at line {line_no}")
        else:
            new_lines.append(line)

    with open(filename, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    fix_sejour_tags(sys.argv[1])
