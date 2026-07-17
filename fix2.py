with open('frontend/src/app/quotes/create/page.tsx', 'r') as f:
    content = f.read()

import re

# Remove the extra `)}` and `</div>` at the end of the form
# It looks like:
#               TEKLİFİ KAYDET
#             </button>
#           </div>
#           </div>
#         )}
#         </form>

bad_str = """              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              TEKLİFİ KAYDET
            </button>
          </div>
          </div>
        )}
        </form>"""

good_str = """              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              TEKLİFİ KAYDET
            </button>
          </div>
        </form>"""

content = content.replace(bad_str, good_str)
with open('frontend/src/app/quotes/create/page.tsx', 'w') as f:
    f.write(content)
