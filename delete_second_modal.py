with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    lines = f.readlines()

# We want to keep up to line 823, and then append the final closing braces.
new_lines = lines[:823]
new_lines.append("    </div>\n")
new_lines.append("  );\n")
new_lines.append("}\n")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.writelines(new_lines)

print("Second modal deleted!")
