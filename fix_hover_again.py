import re

with open('frontend/src/components/TopNavigation.tsx', 'r') as f:
    content = f.read()

start_marker = "{/* Center: Fluid Navigation */}"
end_marker = "{/* Right: Search, Theme, Fullscreen, Notifications */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_center = """{/* Center: Fluid Navigation */}
          <div className="flex items-center gap-2">
            {/* Görüntüleme Genişleyen Buton (Ana Sayfa, Dashboard, Raporlar) */}
            <div className="flex items-center group bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Eye size={16} />
              </div>
              <div className="flex items-center opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-[350px] transition-all duration-500 ease-in-out whitespace-nowrap gap-2 group-hover:ml-2 group-hover:mr-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                        isActive 
                          ? "bg-blue-500/30 text-white border border-blue-500/30" 
                          : "bg-white/10 hover:bg-white/20 text-blue-300 hover:text-blue-200"
                      }`}
                    >
                      <item.icon size={14} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Yeni Oluştur Genişleyen Buton */}
            {(canCreate(Module.QUOTES) || canCreate(Module.SEJOUR)) && (
            <div className="flex items-center group ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:rotate-90 transition-transform duration-500 relative z-10">
                <Plus size={18} className="font-black" />
              </div>
              <div className="flex items-center opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-[240px] transition-all duration-500 ease-in-out whitespace-nowrap gap-2 group-hover:ml-2 group-hover:mr-1">
                {canCreate(Module.QUOTES) && (
                <Link
                  href="/quotes/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <FilePlus size={14} />
                  <span className="text-xs font-bold">Yeni Teklif</span>
                </Link>
                )}
                {canCreate(Module.SEJOUR) && (
                <Link
                  href="/sejour/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Yeni Sejour</span>
                </Link>
                )}
              </div>
            </div>
            )}

            {/* Düzenleme/Listeleme Genişleyen Buton */}
            {(canView(Module.QUOTES) || canView(Module.PROJECTS) || canView(Module.SEJOUR)) && (
            <div className="flex items-center group ml-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Edit size={16} />
              </div>
              <div className="flex items-center opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-[290px] transition-all duration-500 ease-in-out whitespace-nowrap gap-2 group-hover:ml-2 group-hover:mr-1">
                {canView(Module.QUOTES) && (
                <Link
                  href="/quotes"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <FileText size={14} />
                  <span className="text-xs font-bold">Teklif</span>
                </Link>
                )}
                {canView(Module.PROJECTS) && (
                <Link
                  href="/projects"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <Briefcase size={14} />
                  <span className="text-xs font-bold">Proje</span>
                </Link>
                )}
                {canView(Module.SEJOUR) && (
                <Link
                  href="/sejour"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Sejour</span>
                </Link>
                )}
              </div>
            </div>
            )}
          </div>

          """
    
    final_content = content[:start_idx] + new_center + content[end_idx:]
    with open('frontend/src/components/TopNavigation.tsx', 'w') as f:
        f.write(final_content)
    print("Reverted completely")
else:
    print("Could not find markers")
