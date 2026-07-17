with open('frontend/src/app/quotes/create/page.tsx', 'r') as f:
    content = f.read()
import re
# Find the exact string from line 1693 to 1716
target = """                  </div>
                )}
              </div>
          </div>

          {/* Submit Button */}

          </div>
        )}
          {/* Submit Button */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

replacement = """                  </div>
                )}
              </div>
          </div>
        )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/app/quotes/create/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed")
else:
    print("Not found")
