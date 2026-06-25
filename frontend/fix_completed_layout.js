const fs = require('fs');
let file = 'src/app/accounting/invoices/income/completed/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the main wrapper
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-4 text-slate-900 dark:text-slate-100 w-full min-w-0 transition-colors duration-200 overflow-hidden">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);

content = content.replace(
  '<div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">',
  '<div className="w-full min-w-0 flex-1 flex flex-col">'
);

// Replace the header wrapper
const headerTarget = `      {/* ═══════════════ V3 HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row items-end gap-6 bg-[#0f172a] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Sol: Başlık */}
        <div className="shrink-0 mr-2 relative z-10">`;

const headerReplace = `      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4 shrink-0">
        
        {/* Sol: Başlık */}
        <div className="shrink-0 mr-2">`;

content = content.replace(headerTarget, headerReplace);

// Remove the `relative z-10` from the right side of header
content = content.replace(
  '<div className="flex flex-wrap items-end gap-4 flex-1 relative z-10">',
  '<div className="flex flex-wrap items-end gap-4 flex-1">'
);

// Table Container Adjustment
const tableContainerTarget = `      {loading && allInvoices.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner compact />
        </div>
      ) : (
        <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">`;

const tableContainerReplace = `      {loading && allInvoices.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner compact />
        </div>
      ) : (
        <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">`;

// Wait, the table container is already matching pending: 
// pending has: <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">

// Write back
fs.writeFileSync(file, content, 'utf8');
