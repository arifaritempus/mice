const fs = require('fs');

const filePath = '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const returnStart = content.indexOf('return (\n    <div className="min-h-screen bg-transparent');
if (returnStart === -1) {
    console.log("Could not find return statement");
    process.exit(1);
}

// Find the matching brace for the dashboard return
let braceCount = 0;
let started = false;
let returnEnd = -1;
for (let i = returnStart + 7; i < content.length; i++) {
    if (content[i] === '(') {
        braceCount++;
        started = true;
    } else if (content[i] === ')') {
        braceCount--;
        if (started && braceCount === 0) {
            returnEnd = i;
            break;
        }
    }
}

if (returnEnd === -1) {
    console.log("Could not find end of return statement");
    process.exit(1);
}

const mockData = `
  const mockChartData = [
    { name: 'Oca', value: 20000 },
    { name: 'Şub', value: 45000 },
    { name: 'Mar', value: 65000 },
    { name: 'Nis', value: 80000 },
    { name: 'May', value: 100000 },
    { name: 'Haz', value: 110000 },
    { name: 'Tem', value: 135000 }
  ];

  const recentActivity = [
    { title: 'Yeni Sejour Kaydı', desc: 'Sarah Jones tarafından eklendi', time: '15 dk önce', amount: '₺4,500', type: 'sejour' },
    { title: 'Teklif Onaylandı', desc: 'TechCorp - Antalya Etkinliği', time: '1 saat önce', amount: '₺124,000', type: 'quote' },
    { title: 'Proje Ödemesi Alındı', desc: 'Global A.Ş. - Yaz Kampı', time: '3 saat önce', amount: '₺55,000', type: 'project' },
    { title: 'Sistem Uyarısı', desc: 'Tedarikçi faturası gecikmesi', time: '5 saat önce', amount: '-', type: 'alert' }
  ];
`;

const newReturn = `return (
    <div className="min-h-screen bg-transparent w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Mobile Top Welcome (Hidden on MD) */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <div>
          <h2 className="text-gray-400 text-sm">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <h1 className="text-2xl font-bold text-white mt-1">Tekrar hoş geldin, {userRole || 'Kullanıcı'}!</h1>
          <p className="text-slate-400 text-xs mt-1">Bugünün özetine hazır mısın?</p>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/50 p-0.5 relative">
          <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0a0f1c]"></div>
        </div>
      </div>

      {/* Mobile Shortcuts */}
      <div className="md:hidden grid grid-cols-4 gap-3 mb-2">
        {[
          { icon: Target, label: 'Yeni Teklif', href: '/quotes/create', color: 'blue' },
          { icon: Building2, label: 'Yeni Sejour', href: '/sejour/create', color: 'purple' },
          { icon: BarChart3, label: 'Raporlar', href: '/reports', color: 'indigo' },
          { icon: Users, label: 'Kişiler', href: '/users', color: 'slate' }
        ].map((s, i) => (
          <Link key={i} href={s.href} className="flex flex-col items-center gap-2 group">
            <div className={\`w-14 h-14 rounded-2xl bg-\${s.color}-500/20 border border-\${s.color}-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(var(--\${s.color}-500-rgb),0.15)] group-hover:scale-105 transition-all\`}>
              <s.icon className={\`w-6 h-6 text-\${s.color}-400\`} />
            </div>
            <span className="text-[10px] font-medium text-slate-400 text-center leading-tight">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Desktop Header Filters (Hidden on Mobile) */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Yönetim Paneli</h1>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
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
              className={\`px-4 py-2 text-xs font-bold rounded-lg transition-all \${
                period === item.id
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }\`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative">
            <h3 className="text-sm font-medium text-slate-400">Toplam Gelir</h3>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{formatMoney(metrics.projectRevenue + metrics.sejourRevenue)}</h2>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp size={14} /> +14.2%
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative">
            <h3 className="text-sm font-medium text-slate-400">Aktif Projeler</h3>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{formatInt(projects.filter(p => p.status !== 'cancelled' && p.status !== 'completed').length)}</h2>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp size={14} /> +8.5%
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative">
            <h3 className="text-sm font-medium text-slate-400">Bekleyen Teklifler</h3>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{formatInt(metrics.quotePending)}</h2>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Clock size={14} /> Yeni Eklendi
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative">
            <h3 className="text-sm font-medium text-slate-400">Konfirme Sejour</h3>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{formatInt(metrics.sejourStatusCounts.konfirme || 0)}</h2>
            <div className="flex items-center gap-1 text-xs font-bold text-rose-400">
              <TrendingDown size={14} /> -1.2%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Main Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 lg:col-span-2 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Gelir Özeti</h3>
              <h2 className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Aylık Gelir Büyümesi</h2>
            </div>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="flex-1 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => \`₺\${v/1000}k\`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">Son Aktiviteler</h3>
            <button className="text-slate-500 hover:text-slate-300"><MoreVertical size={16} /></button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-6">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {idx !== recentActivity.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-[-24px] w-[1px] bg-white/10"></div>
                )}
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 \${
                  activity.type === 'alert' ? 'bg-red-500/20 text-red-400' :
                  activity.type === 'sejour' ? 'bg-purple-500/20 text-purple-400' :
                  activity.type === 'quote' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-blue-500/20 text-blue-400'
                }\`}>
                  {activity.type === 'alert' ? <AlertCircle size={14} /> : <User size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-200 truncate pr-2">{activity.title}</h4>
                    <span className="text-xs font-bold text-white">{activity.amount}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{activity.desc}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );`;

let newImports = `import { MoreVertical } from 'lucide-react';\n`;
if (!content.includes('MoreVertical')) {
    content = content.replace("import { \n  TrendingUp,", "import { \n  TrendingUp,\n  MoreVertical,");
}

let finalContent = content.slice(0, returnStart) + mockData + newReturn;
fs.writeFileSync(filePath, finalContent);
console.log("Dashboard updated successfully!");
