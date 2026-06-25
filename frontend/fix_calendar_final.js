const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/calendar/page.tsx', 'utf8');

const startMarker = '{/* Premium Sticky Header */}';
const endMarker = '</main>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.log("Could not find boundaries.");
  process.exit(1);
}

const replacement = `{/* Unified Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        {/* Left: Title */}
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Bilet Takvimi</h1>
          <p className="text-xs text-slate-400 mt-1">Takvim üzerinden bilet hareketlerinizi yönetin</p>
        </div>

        {/* Right: All Filters and Actions */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 h-10 bg-white/5 px-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={goToPreviousPeriod}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 min-w-[120px] text-center flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                {getViewTitle()}
              </span>
            </div>
            <button
              onClick={goToNextPeriod}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex h-10 bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={\`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center \${viewMode === mode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'}\`}
              >
                {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : 'YIL'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Voucher, PNR, Firma vb.)"
              tokens={searchTokens}
              inputValue={searchQuery}
              suggestions={[]}
              onInputChange={setSearchQuery}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) {
                  setSearchTokens(prev => [...prev, trimmed]);
                  setSearchQuery('');
                }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>

          {/* Clear Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Filtreleri Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Excel Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => exportCalendarExcel()}
              className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel İndir
            </button>
          </div>

          {/* Today Button */}
          <div className="shrink-0">
            <button
              onClick={goToToday}
              className="h-10 px-4 bg-blue-500/20 text-[10px] font-bold text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all uppercase tracking-widest border border-blue-500/30"
            >
              BUGÜN
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col space-y-4">
        {/* Currency Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {['TRY', 'USD', 'EUR', 'GBP'].map(curr => (
            <div key={curr} className="bg-[#0f172a]/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{curr} ÖZETİ</span>
                </div>
                <button
                  onClick={() => exportCalendarExcel(curr)}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-xl transition-all"
                  title={\`\${curr} Bazlı Excel İndir\`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">TOPLAM</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(statsTotals.instTotals[curr as keyof typeof statsTotals.instTotals], curr)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-0 flex flex-col overflow-hidden">
          {(viewMode === 'monthly' || viewMode === 'weekly') && (
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#0f172a]/40 shrink-0">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                <div key={day} className="py-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{day}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scrollable grid body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={\`grid min-h-full \${
              viewMode === 'daily' ? 'grid-cols-1' :
              viewMode === 'weekly' ? 'grid-cols-7' :
              viewMode === 'yearly' ? 'grid-cols-4' :
              'grid-cols-7'
            }\`}>
              {calendarData.map((period, idx) => {
                const isToday = period.startDate.toDateString() === new Date().toDateString();
                const isCurrentMonth = period.startDate.getMonth() === currentDate.getMonth();
                
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.005 }}
                    key={idx}
                    onClick={() => {
                      if (period.tickets.length > 0) {
                        setSelectedPeriod(period);
                        setIsPeriodModalOpen(true);
                      }
                    }}
                    className={\`min-h-[120px] p-3 border-r border-b border-white/5 group relative transition-all cursor-pointer \${!isCurrentMonth && viewMode === "monthly" ? "bg-transparent opacity-40" : "bg-transparent hover:bg-white/10"} \${isToday ? "bg-blue-500/10 border-blue-500/30" : ""}\`}
                  >
                    <div className="absolute inset-0 border border-white/0 m-1 rounded-xl group-hover:border-white/10 transition-all pointer-events-none" />
                    <div className="relative flex justify-between items-start mb-4">
                      <span className={\`text-[11px] font-semibold tracking-wider \${isToday ? "px-2 py-0.5 bg-blue-500/40 text-white rounded-md" : isCurrentMonth || viewMode === "yearly" ? "text-white" : "text-slate-500"}\`}>
                        {viewMode === 'yearly' 
                          ? period.startDate.toLocaleDateString('tr-TR', { month: 'long' }) 
                          : \`\${period.startDate.getDate()} \${period.startDate.toLocaleDateString('tr-TR', { month: 'short' })}\`}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {/* Currency Totals Summary */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Object.entries(period.totals).map(([curr, total]) => total > 0 && (
                          <div key={curr} className="flex items-center gap-1 text-[9px] font-semibold bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                            <span className="text-blue-300">{curr}</span>
                            <span className="text-white">{formatCurrency(total, curr)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Movement List Preview */}
                      <div className="space-y-1 overflow-hidden">
                        {period.tickets.slice(0, 3).map((ticket, tIdx) => (
                          <div key={tIdx} className="text-[9px] leading-tight p-1.5 bg-[#0f172a]/60 rounded-md border border-white/5 group-hover:border-white/20 transition-colors">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-blue-400 tracking-tighter truncate max-w-[60px]">{ticket.voucher_no}</span>
                              <span className="font-semibold text-white ml-1">
                                {formatCurrency(ticket.installment?.amount || ticket.payment?.amount || 0, ticket.installment?.currency || ticket.payment?.currency || 'TRY')}
                              </span>
                            </div>
                            <div className="text-slate-300 font-semibold truncate mt-0.5">
                              {ticket.agent || ticket.company_name || '-'}
                            </div>
                            <div className="text-[8px] text-slate-500 mt-0.5 truncate tracking-tighter" title={[ticket.project_code, ticket.reference_code, ticket.route, ticket.pnr].filter(Boolean).join(' • ')}>
                              {[ticket.project_code, ticket.reference_code, ticket.route, ticket.pnr].filter(Boolean).join(' • ') || '-'}
                            </div>
                          </div>
                        ))}
                        {period.tickets.length > 3 && (
                          <div className="text-[8px] font-bold text-blue-400 uppercase px-1 pt-1 flex items-center gap-1 animate-pulse">
                            <Plus className="w-2 h-2" /> {period.tickets.length - 3} HAREKET DAHA
                          </div>
                        )}
                        {period.tickets.length > 0 && period.tickets.length <= 3 && (
                          <div className="text-[8px] font-bold text-slate-500 uppercase px-1 pt-1 flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                            <Plus className="w-2 h-2" /> DETAYLAR
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>`;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);

// While I'm here, ensure MultiTokenFilterInput is imported!
if (!content.includes('import MultiTokenFilterInput')) {
  content = content.replace(
    "import LoadingSpinner from '@/components/LoadingSpinner';",
    "import LoadingSpinner from '@/components/LoadingSpinner';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

fs.writeFileSync('src/app/tickets/calendar/page.tsx', content, 'utf8');
console.log("Successfully replaced the header and layout block.");
