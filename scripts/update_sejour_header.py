import re
import os

files_to_process = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx",
]

NEW_HEADER_STRUCTURE = """  return (
    <div className="w-full h-[100vh] overflow-y-auto bg-transparent relative custom-scrollbar">
      {/* Sticky Header - V3 Standard */}
      <div className="sticky top-0 z-40 pb-2 pt-2 mb-6 border-b border-v3-border bg-slate-900/10 dark:bg-[#0a0f18]/90 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center w-full gap-4">
          <div className="flex items-center space-x-3 w-full md:w-1/3">
            <button
              type="button"
              onClick={() => router.push("/sejour")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <div>
              <h1 className="text-xl font-black text-v3-text tracking-tight uppercase">SEJOUR BİLGİLERİ</h1>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">{salesData.voucherNumber || "YENİ KAYIT"}</p>
            </div>
          </div>

          <div className="flex bg-transparent p-1 rounded-xl border border-v3-border w-full md:w-[450px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    : "text-v3-muted hover:text-v3-text hover:bg-v3-border"
                }`}
              >
                <span className="mr-1.5 text-xs">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex justify-end w-full md:w-1/3 space-x-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-6 py-2.5 bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase rounded-lg hover:bg-blue-500/90 active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm"
            >
              PDF İNDİR
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              className="px-6 py-2.5 bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm shadow-emerald-500/30"
            >
              KAYDET
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 pb-32">
        {/* Status and Messages */}
        <div className="mb-4">"""

def replace_header_in_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block starting with `  return (` and ending before `{error && (` or similar
    # In both create and edit page
    
    # regex to match: 
    # return (
    # ... lots of stuff ...
    # {/* Status and Messages */}
    
    pattern = r'  return\s*\(\s*<div[^>]*w-full[^>]*overflow-y-auto[^>]*>\s*<div[^>]*max-w-\[1800px\][^>]*>.*?{/\*\s*Status and Messages\s*\*/}\s*<div[^>]*mb-2[^>]*>'
    
    match = re.search(pattern, content, flags=re.DOTALL)
    if match:
        content = content[:match.start()] + NEW_HEADER_STRUCTURE + content[match.end():]
        print(f"Successfully replaced header in {filepath}")
    else:
        print(f"Failed to find match in {filepath}")
        
    # Remove the old tabs map (since it's now in the header)
    pattern2 = r'          {/\*\s*Main Navigation Tabs\s*\*/}.*?{/\*\s*Tab Content\s*\*/}'
    match2 = re.search(pattern2, content, flags=re.DOTALL)
    if match2:
        content = content[:match2.start()] + '          {/* Tab Content */}' + content[match2.end():]
        print(f"Successfully removed old tabs in {filepath}")
        
    # Change wrapping `max-w-[1800px]` to `max-w-[1920px]` in a few places
    content = content.replace('max-w-[1800px]', 'max-w-[1920px]')
    content = content.replace('col-span-1 lg:col-span-2', 'col-span-1 lg:col-span-3')
    
    # Change responsive grid sizes so it occupies the full page beautifully
    content = content.replace('grid-cols-1 lg:grid-cols-3', 'grid-cols-1 xl:grid-cols-4')
    content = content.replace('lg:col-span-2', 'xl:col-span-3')
    content = content.replace('lg:col-span-1', 'xl:col-span-1')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


for fp in files_to_process:
    replace_header_in_file(fp)

