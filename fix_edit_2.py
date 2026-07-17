with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'r') as f:
    content = f.read()

bad_str = """                  </div>
                )}
              </div>
            </div>
          </div>

          </div>
        )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

good_str = """                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">"""

content = content.replace(bad_str, good_str)
with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'w') as f:
    f.write(content)
