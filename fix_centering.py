import re

def fix_file(filename):
    with open(filename, "r") as f:
        text = f.read()

    # Step 1: Change the wrapper classes
    # from: <div className="max-w-[1800px] mx-auto flex items-center justify-between">
    # to: <div className="max-w-[1800px] mx-auto flex items-center justify-between relative">
    
    # Step 2: Change the totals container
    # from: <div className="flex items-center gap-6 overflow-x-auto pb-1">
    # to: <div className="flex-1"></div>\n<div className="flex items-center justify-center gap-6 overflow-x-auto pb-1 absolute left-1/2 -translate-x-1/2 w-max max-w-[60vw]">
    
    # Step 3: Change the buttons container
    # from: <div className="flex items-center gap-3">
    # to: <div className="flex items-center justify-end gap-3 flex-1 relative z-10">
    
    wrapper_old = '<div className="max-w-[1800px] mx-auto flex items-center justify-between">'
    wrapper_new = '<div className="max-w-[1800px] mx-auto flex items-center justify-between relative">'
    
    totals_old = '<div className="flex items-center gap-6 overflow-x-auto pb-1">'
    totals_new = '<div className="flex-1"></div>\n              <div className="flex items-center justify-center gap-6 overflow-x-auto pb-1 absolute left-1/2 -translate-x-1/2 w-max max-w-[70vw]">'
    
    buttons_old = '<div className="flex items-center gap-3">'
    # Wait, there are multiple <div className="flex items-center gap-3"> in the file.
    # We only want to replace the one right after the totals block!
    
    text = text.replace(wrapper_old, wrapper_new)
    text = text.replace(totals_old, totals_new)
    
    # Let's use regex for the buttons block that comes right after the </div> of the totals block.
    # We can just replace the specific button container in the footer.
    # The pattern is exactly: `</div>\n\n              <div className="flex items-center gap-3">\n                <button type="button" onClick={() => router.push("/sejour/list")}`
    pattern = r'</div>\s*<div className="flex items-center gap-3">\s*<button type="button" onClick=\{\(\) => router\.push\("/sejour/list"\)\}'
    
    replacement = r'</div>\n\n              <div className="flex items-center justify-end gap-3 flex-1 relative z-10">\n                <button type="button" onClick={() => router.push("/sejour/list")}'
    
    text = re.sub(pattern, replacement, text)
    
    with open(filename, "w") as f:
        f.write(text)

fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
fix_file("frontend/src/app/sejour/create/page.tsx")
print("Centered the footers.")
