with open("frontend/src/app/quotes/create/page.tsx") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "return (" in line:
        print(f"Line {i}: {line.strip()}")
