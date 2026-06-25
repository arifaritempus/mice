const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

const oldHeaderRegex = /\{\/\* Header Section \*\/\}[\s\S]*?\{\/\* Categories \*\/\}/;

const newHeader = `{/* Header Section */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-6 mb-2 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Rapor Merkezi</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem verilerinizi analiz edin</p>
            </div>
          </div>
          
          {/* Filters Area */}
          <div className="flex flex-row items-end justify-start 2xl:justify-end gap-3 flex-1 flex-wrap">
            
            {/* Report Period Toggle */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">RAPOR DÖNEMİ</label>
              <div className="inline-flex bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 h-10">
                {(['bu_hafta', 'bu_ay', 'bu_yil', 'ozel'] as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={\`px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 \${
                      datePreset === preset
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }\`}
                  >
                    {preset === 'bu_hafta' ? 'HAFTA' : preset === 'bu_ay' ? 'AY' : preset === 'bu_yil' ? 'YIL' : 'ÖZEL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates (Responsive Date Range Field) */}
            {datePreset === 'ozel' && (
              <div className="flex flex-col gap-1.5 shrink-0 w-[240px] animate-in fade-in zoom-in-95 duration-200">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TARİH ARALIĞI</label>
                <div className="h-10">
                  <ResponsiveDateRangeField
                    label=""
                    startValue={startDate}
                    endValue={endDate}
                    onStartChange={(v) => { if(v) setStartDate(v); }}
                    onEndChange={(v) => { if(v) setEndDate(v); }}
                    onApply={() => {}}
                  />
                </div>
              </div>
            )}

            {/* Search (MultiToken) */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GENEL ARAMA (RAPOR İÇİ)</label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchInput}
                  onInputChange={setSearchInput}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchInput('');
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter(st => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Optional: Otel Filter */}
            {(activeReport.id.includes('otel')) && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">OTEL</label>
                <div className="h-10">
                  <input
                    list="report-hotels-list"
                    value={otelFilterInput}
                    onChange={(e) => setOtelFilterInput(e.target.value)}
                    placeholder="Otel seçin..."
                    className="w-full h-full bg-[#0f172a]/60 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Optional: Opsiyon Filter */}
            {activeReport.id === 'opsiyon_takip' && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">OPSİYON</label>
                <div className="h-10">
                  <select
                    value={opsiyonDurumuFilter}
                    onChange={(e) => setOpsiyonDurumuFilter(e.target.value)}
                    className="w-full h-full bg-[#0f172a]/60 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="tum">TÜMÜ</option>
                    {OPSIYON_DURUMU_FILTER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-end gap-2 shrink-0 h-[62px]">
              <button onClick={() => fetchReport()} className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all">SORGULA</button>
              <button 
                onClick={handleExportExcel} 
                className="h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2 px-4 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                title="Excel'e Aktar"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" /></svg>
                EXCEL
              </button>
              <button onClick={() => { applyPreset('bu_yil'); setSearchInput(''); setAppliedSearchInput(''); setSearchTokens([]); setOtelFilterInput(''); setCurrentPage(1); }} className="h-10 w-10 flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl transition-all" title="Filtreleri Temizle">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}`;

code = code.replace(oldHeaderRegex, newHeader);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
