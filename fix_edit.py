with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'r') as f:
    content = f.read()

target = """          {/* Submit */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

replacement = """          </div>
        )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

if target in content:
    content = content.replace(target, replacement)
    
    # Also fix the outer div wrappers
    lines = content.split('\\n')
    # Let's just use string replace for the last 2 `</div>`
    end_target = """        </form>
      </div>
    </div>
  );"""
    end_replacement = """        </form>
    </div>
  );"""
    content = content.replace(end_target, end_replacement)
    
    with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed edit")
else:
    print("Not found edit")
