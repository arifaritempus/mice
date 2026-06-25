const fs = require('fs');

let content = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

const startMarker = '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar font-sans text-white">';
const endMarker = '<div className="p-6">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.log("Could not find boundaries.");
  process.exit(1);
}

const replacement = `<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">
      {/* Unified Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Pazarlama Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">Pazarlama verilerinizi analiz edin ve yönetin</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          <div className="flex items-center h-10 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            {([
              { id: 'today', label: 'Bugün' },
              { id: 'week', label: 'Hafta' },
              { id: 'month', label: 'Ay' },
              { id: 'year', label: 'Yıl' },
              { id: 'custom', label: 'Özel' }
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={\`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center h-full \${
                  period === item.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }\`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {period === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-72 shrink-0"
              >
                <DateRangeFieldAccounting 
                  label="" 
                  startValue={startDate} 
                  endValue={endDate} 
                  onStartChange={setStartDate} 
                  onEndChange={setEndDate} 
                  hideLabel 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-[2] min-w-[240px] relative max-w-sm shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Genel Arama (Firma, Sektör vb.)"
              className="w-full pl-9 pr-4 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-[11px] font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button 
              onClick={loadData}
              className="w-10 h-10 inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Yenile"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => {
                setSelectedClient(null);
                setIsClientModalOpen(true);
              }}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105"
            >
              <Plus size={14} /> YENİ EKLE
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Grid - Single Row Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <DashboardStatBox 
          label="TOPLAM PORTFÖY" 
          value={clients.length} 
          icon={Users} 
          color="blue"
          subValue="Dönemsel Toplam"
          trend={{ type: 'up', text: '5%' }}
          active={clientTypeFilter === null}
          onClick={() => setClientTypeFilter(null)}
        />
        <DashboardStatBox 
          label="ACENTELER" 
          value={clients.filter(c => c.type === 'acenta').length} 
          icon={Briefcase} 
          color="purple"
          subValue="Aktif Acenteler"
          trend={{ type: 'up', text: '2%' }}
          active={clientTypeFilter === 'acenta'}
          onClick={() => setClientTypeFilter('acenta')}
        />
        <DashboardStatBox 
          label="GÖRÜŞMELER" 
          value={filteredInteractions.length} 
          icon={MessageSquare} 
          color="emerald"
          subValue="Bu Ayki Etkileşim"
          trend={{ type: 'up', text: '12%' }}
          active={activeTab === 'interactions'}
          onClick={() => setActiveTab('interactions')}
        />
        <DashboardStatBox 
          label="RANDEVULAR" 
          value={appointments.length} 
          icon={Calendar} 
          color="amber"
          subValue="Bekleyen Planlar"
          active={activeTab === 'appointments'}
          onClick={() => setActiveTab('appointments')}
        />
      </div>

      {/* Content Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex border-b border-white/10 p-2 gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <button 
            onClick={() => setActiveTab('clients')}
            className={\`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap \${activeTab === 'clients' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}
          >
            FİRMALAR & ACENTELER
          </button>
          <button 
            onClick={() => setActiveTab('interactions')}
            className={\`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap \${activeTab === 'interactions' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}
          >
            GÖRÜŞME GEÇMİŞİ
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={\`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap \${activeTab === 'appointments' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}
          >
            RANDEVULAR
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">`;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);

// Add missing closing div before style
const endTag = '      <style jsx global>{`';
const replacedEnd = '      </div>\n      <style jsx global>{`';
content = content.replace(endTag, replacedEnd);

fs.writeFileSync('src/app/marketing/page.tsx', content, 'utf8');
console.log("Replaced successfully!");
