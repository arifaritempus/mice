import os
import re

files_to_fix = [
    'src/app/quotes/view/[id]/page.tsx',
    'src/app/projects/view/[id]/page.tsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the scrolling issue
    content = re.sub(
        r'className="min-h-screen p-4 md:p-8 transition-colors duration-500"',
        r'className="min-h-screen h-full overflow-y-auto p-4 md:p-8 transition-colors duration-500"',
        content
    )

    # 2. Fix the logo fetching logic to prevent fallback to icon logo
    old_logo_fetch = """          if (!wordmarkLogoBase64)
            wordmarkLogoBase64 =
              logos.wordmarkLogoBase64 || logos.iconLogoBase64 || null;"""
    
    new_logo_fetch = """          if (!wordmarkLogoBase64)
            wordmarkLogoBase64 = logos.wordmarkLogoBase64 || null;"""
    
    content = content.replace(old_logo_fetch, new_logo_fetch)

    # Note: in projects/view/[id]/page.tsx it might be slightly different spacing, so let's do a regex replace
    content = re.sub(
        r'if\s*\(!wordmarkLogoBase64\)\s*wordmarkLogoBase64\s*=\s*logos\.wordmarkLogoBase64\s*\|\|\s*logos\.iconLogoBase64\s*\|\|\s*null;',
        r'if (!wordmarkLogoBase64) wordmarkLogoBase64 = logos.wordmarkLogoBase64 || null;',
        content
    )

    # Add variables to hold dimensions right after the try catch block
    dimension_vars = """        } catch (logoError) {
          console.error("Logo loading error for excel:", logoError);
        }
      }

      const iconWidth = logos?.iconWidth || 120;
      const iconHeight = logos?.iconHeight || 60;
      const wordmarkWidth = logos?.wordmarkWidth || 120;
      const wordmarkHeight = logos?.wordmarkHeight || 60;"""
      
    content = re.sub(
        r'        \} catch \(logoError\) \{\s*console\.error\("Logo loading error for excel:", logoError\);\s*\}\s*\}',
        dimension_vars,
        content
    )

    # We need `logos` defined in a broader scope to access its dimensions
    # Let's see how `logos` is defined. It is `const logos = await getLogosForExcel(true, appSettings);` inside a try catch.
    # We should lift `let logos: any = {};` above the try catch.
    
    old_try_block = """      if (!iconLogoBase64 || !wordmarkLogoBase64) {
        try {
          const logos = await getLogosForExcel(true, appSettings);
          if (!iconLogoBase64) iconLogoBase64 = logos.iconLogoBase64 || null;"""
          
    new_try_block = """      let logosData: any = {};
      if (!iconLogoBase64 || !wordmarkLogoBase64) {
        try {
          logosData = await getLogosForExcel(true, appSettings);
          if (!iconLogoBase64) iconLogoBase64 = logosData.iconLogoBase64 || null;
          if (!wordmarkLogoBase64) wordmarkLogoBase64 = logosData.wordmarkLogoBase64 || null;
        } catch (logoError) {
          console.error("Logo loading error for excel:", logoError);
        }
      }

      const iconWidth = logosData.iconWidth || 60; // default 60 (since aspect ratio gets preserved, 60 is standard height)
      const iconHeight = logosData.iconHeight || 60;
      const wordmarkWidth = logosData.wordmarkWidth || 120;
      const wordmarkHeight = logosData.wordmarkHeight || 60;"""
    
    # Actually it's easier to just find the entire block and replace it using regex
    pattern = re.compile(r'      if \(\!iconLogoBase64 \|\| \!wordmarkLogoBase64\) \{.*?\}\s*\}', re.DOTALL)
    
    if pattern.search(content):
        content = pattern.sub(new_try_block, content)
    else:
        print("COULD NOT FIND LOGO BLOCK IN", filepath)

    # Now replace the hardcoded dimensions with the variables
    # For icon logo
    content = re.sub(
        r'ext:\s*\{\s*width:\s*120,\s*height:\s*60\s*\}\s*,\s*\)\s*;\s*\} catch \(e\) \{\s*console\.error\("Icon error:"',
        r'ext: { width: iconWidth, height: iconHeight },\n              }\n            );\n          } catch (e) {\n            console.error("Icon error:"',
        content
    )
    # Also another signature
    content = re.sub(
        r'tl:\s*\{\s*col:\s*0\.15,\s*row:\s*0\.15\s*\},\s*ext:\s*\{\s*width:\s*120,\s*height:\s*60\s*\}',
        r'tl: { col: 0.15, row: 0.15 },\n                ext: { width: iconWidth, height: iconHeight }',
        content
    )

    # For wordmark logo
    content = re.sub(
        r'tl:\s*\{\s*col:\s*5\.9,\s*row:\s*0\.23\s*\},\s*ext:\s*\{\s*width:\s*120,\s*height:\s*60\s*\}',
        r'tl: { col: 5.9, row: 0.23 },\n                ext: { width: wordmarkWidth, height: wordmarkHeight }',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

print("Done patching.")
