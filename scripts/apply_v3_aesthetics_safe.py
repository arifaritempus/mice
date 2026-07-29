import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_safe(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Background
    content = content.replace(
        '<div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">',
        '<div className="w-full overflow-y-auto min-h-screen pb-32 bg-[#fafbfc] dark:bg-gray-950 transition-colors duration-200">'
    )
    content = content.replace(
        '<div className="w-full max-w-[1800px] bg-transparent mx-auto relative rounded-3xl overflow-hidden flex flex-col h-screen">',
        '<div className="w-full max-w-[1920px] mx-auto relative flex flex-col min-h-screen">'
    )

    # 2. Header
    new_header = """        {/* V3 Modern Top Header */}
        <div className="bg-[#f8faff] dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-[1920px] mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-[#1e293b] dark:text-white tracking-tight">Yeni Sejour Oluştur</h1>
              <div className="text-[11px] text-gray-500 font-medium mt-1 flex items-center gap-2">
                <span>Sejour</span> <span className="text-gray-300">&gt;</span> <span>Yeni Sejour</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 rounded-lg text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-all shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                PDF İndir
              </button>
              <button type="button" onClick={(e) => handleSubmit(e as any)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 transition-all shadow-[0_4px_10px_rgba(37,99,235,0.2)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Kaydet
              </button>
            </div>
          </div>
        </div>"""
    
    # Replace ONLY the old header block, without regex to prevent issues
    content = re.sub(r'\{\/\*\s*Header\s*\*\/.*?\{\/\*\s*Status and Messages\s*\*\/\}', new_header + '\n        {/* Status and Messages */}', content, flags=re.DOTALL)

    # 3. Tabs
    content = re.sub(r'\{\/\*\s*Main Navigation Tabs\s*\*\/.*?<\/div>\n\s*<\/div>', """{/* Main Navigation Tabs Mockup */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-8 mt-4">
            <div className="flex max-w-[1920px] mx-auto overflow-x-auto custom-scrollbar gap-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="mr-2 text-sm opacity-70">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>""", content, flags=re.DOTALL)

    # 4. Inputs inside activeTab === "sales"
    content = re.sub(r'bg-white dark:bg-gray-800\/80 p-6 rounded-2xl border border-gray-100', r'bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mx-6', content)
    
    # 5. Fix Status and Messages margin
    content = content.replace('<div className="max-w-[1800px] mx-auto mb-2">', '<div className="max-w-[1920px] mx-auto px-6 mt-4 w-full mb-2">')
    # 6. Fix Form wrapper
    content = content.replace('<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">', '<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-w-[1920px] mx-auto px-6 w-full">')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied safe v3 aesthetics to {filepath}")

for fp in files:
    apply_safe(fp)
