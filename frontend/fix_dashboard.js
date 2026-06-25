const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Remove h-screen overflow-hidden
pageContent = pageContent.replace(
  /<div className="flex flex-col h-screen overflow-hidden bg-slate-950">/g,
  '<div className="flex flex-col min-h-screen bg-slate-950 pb-10">'
);
pageContent = pageContent.replace(
  /<div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">/g,
  '<div className="flex-1 px-2 relative">'
);

// 2. Fetch categories in loadData
if (!pageContent.includes('const ctg = await categoriesService.getAll()')) {
  pageContent = pageContent.replace(
    /const \[\n\s*proj,\n\s*sej,\n\s*qts,\n\s*salesItems,\n\s*projHR,/,
    `const [\n        proj,\n        sej,\n        qts,\n        salesItems,\n        projHR,\n        ctg,`
  );
  pageContent = pageContent.replace(
    /projectsService.getAll\(\),\n\s*SejourService.getAll\(\),\n\s*quotesService.getAll\(\),\n\s*supabase.from\("project_sales_items"\).select\("\*"\),\n\s*projectHumanResourcesService.getAll\(\),/,
    `projectsService.getAll(),\n        SejourService.getAll(),\n        quotesService.getAll(),\n        supabase.from("project_sales_items").select("*"),\n        projectHumanResourcesService.getAll(),\n        categoriesService.getAll(),`
  );
  pageContent = pageContent.replace(
    /projects: Array.isArray\(proj\) \? proj : \[\],/,
    `categories: Array.isArray(ctg) ? ctg : [],\n        projects: Array.isArray(proj) ? proj : [],`
  );
  pageContent = pageContent.replace(
    /projects: any\[\];/,
    `categories: any[];\n    projects: any[];`
  );
  pageContent = pageContent.replace(
    /projects: \[\],/,
    `categories: [],\n      projects: [],`
  );
}

// 3. Fix Bilet Ciro Calculation
const oldFlightRevRegex = /\/\/ BILET CIRO[\s\S]*?const flightRev = projFlightRev \+ sejFlightRev;/;
const newFlightRev = `// BILET CIRO
    const ucakKategoriIds = data.categories.filter((c: any) => c.name.toLowerCase().includes("ucak") || c.name.toLowerCase().includes("uçak")).map((c: any) => c.id);
    const projFlightRev = data.salesItems.filter((si: any) => inRange(si.created_at, range) && (ucakKategoriIds.includes(si.category) || ucakKategoriIds.includes(si.sub_category))).reduce((acc: number, f: any) => acc + (Number(f.total_price) * Number(f.fx) || Number(f.total_try) || 0), 0);
    const sejFlightRev = data.sejours.filter((s: any) => s.status === "KONFİRME" && inRange(s.checkInDate || s.created_at, range)).reduce((acc: number, s: any) => {
      let flightsTotal = 0;
      if (s.flights && Array.isArray(s.flights)) {
        flightsTotal = s.flights.reduce((sum: number, f: any) => sum + (Number(f.satis_fiyati) || Number(f.total_amount) || 0), 0);
      }
      return acc + flightsTotal;
    }, 0);
    const flightRev = projFlightRev + sejFlightRev;`;
pageContent = pageContent.replace(oldFlightRevRegex, newFlightRev);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Applied Step 1, 2, 3 fixes");
