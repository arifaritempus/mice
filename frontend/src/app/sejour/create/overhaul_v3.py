import sys

def overhaul_sejour(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    new_lines = []
    # Identify key landmarks by content
    for i, line in enumerate(lines):
        line_no = i + 1
        
        # 1. Sales Tab Accommodation (990-1000)
        # We only need 2 closings here before map end
        if 990 <= line_no <= 996 and "</div>" in line:
            # We will rewrite this segment during map end
            continue
        if 995 == line_no and "))}" in line:
            new_lines.append("                        </div>\n")
            new_lines.append("                      </div>\n") # Closes 921 and 932
            new_lines.append("                    ))}\n")
            continue
            
        # 2. Purchase Tab Flight (1740-1750)
        # We need 4 closings for child blocks + 1 for item + 1 for content = 6? 
        # No, let's just make it balanced.
        if 1745 <= line_no <= 1750 and "</div>" in line:
            continue
        if 1748 == line_no and "))}" in line:
            # Trace: 1642(item), 1657(content), 1660(grid), 1733(row), 1735(inner) -> 5 open
            new_lines.append("                            </div>\n")
            new_lines.append("                          </div>\n")
            new_lines.append("                        </div>\n")
            new_lines.append("                      </div>\n")
            new_lines.append("                    </div>\n")
            new_lines.append("                  ))}\n")
            continue

        # 3. Purchase Tab Extra Services (1965-1975)
        if 1961 <= line_no <= 1970 and "</div>" in line:
             continue
        if 1970 == line_no and "))}" in line:
            # Trace: 1892(item), 1896(content), 1951(inner) -> 3 open
            new_lines.append("                        </div>\n")
            new_lines.append("                      </div>\n")
            new_lines.append("                    </div>\n")
            new_lines.append("                  ))}\n")
            continue

        new_lines.append(line)

    # Finally, add the 2 root closings at the very end
    # (Page and Form)
    # But wait, let's see if we need them.
    # I'll just write it out and then run the balance checker.

    with open(filename, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    overhaul_sejour(sys.argv[1])
