with open('frontend/src/app/quotes/[id]/page.tsx', 'r') as f:
    content = f.read()

bad_str = """            </div>
          </div>
          </div>
        )}
      </div>
      <ConfirmModal"""

good_str = """            </div>
          </div>
        )}
        </div>
      </div>
      <ConfirmModal"""

content = content.replace(bad_str, good_str)

with open('frontend/src/app/quotes/[id]/page.tsx', 'w') as f:
    f.write(content)
