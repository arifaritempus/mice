const fs = require('fs');

let content = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

const targetStr = `      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Pazarlama Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">Pazarlama verilerinizi analiz edin ve yönetin</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          <div className="w-[240px] shrink-0">
            <ResponsiveDateRangeField
              label="Tarih Aralığı"
              startValue={startDate}
              endValue={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={() => loadData()}
            />
          </div>`;

const replaceStr = `      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        {/* Left Side: Title + Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0">
          <div className="shrink-0">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">Pazarlama Yönetimi</h1>
            <p className="text-xs text-slate-400 mt-1">Pazarlama verilerinizi analiz edin ve yönetin</p>
          </div>
          <div className="w-[240px] shrink-0">
            <ResponsiveDateRangeField
              label="Tarih Aralığı"
              startValue={startDate}
              endValue={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={() => loadData()}
            />
          </div>
        </div>

        {/* Right Side: Search and Actions */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/app/marketing/page.tsx', content, 'utf8');
console.log("Moved date filter left.");
