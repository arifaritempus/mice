with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'r') as f:
    content = f.read()

bad_str = """                  </div>
                )}
              </div>
            </div>
          </div>

                    </div>
        )}"""

good_str = """                  </div>
                )}
              </div>
            </div>
          </div>
        )}"""

content = content.replace(bad_str, good_str)
with open('frontend/src/app/quotes/[id]/edit/page.tsx', 'w') as f:
    f.write(content)
