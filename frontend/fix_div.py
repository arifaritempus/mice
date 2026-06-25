with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('    </div>\n  );\n}', '    </div>\n    </div>\n  );\n}')

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
