with open("frontend/src/app/quotes/[id]/page.tsx", "r") as f:
    content = f.read()

idx = content.find('</div>\n    </div>\n  );\n}')
print(idx)
