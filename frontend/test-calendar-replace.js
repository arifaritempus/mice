const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add imports
if (!code.includes('react-calendar')) {
  code = code.replace(
    'import { motion, AnimatePresence } from "framer-motion";',
    'import { motion, AnimatePresence } from "framer-motion";\nimport CalendarComponent from "react-calendar";\nimport "react-calendar/dist/Calendar.css";'
  );
}

// 2. Add state
if (!code.includes('const [calendarFilter, setCalendarFilter]')) {
  code = code.replace(
    'const [customDate, setCustomDate] = useState({ start: "", end: "" });',
    'const [customDate, setCustomDate] = useState({ start: "", end: "" });\n  const [calendarFilter, setCalendarFilter] = useState("Tümü");'
  );
}

// 3. Update useMemo allOps logic
const oldOpsLogic = `    // Operational Flow (Upcoming Confirmed)`;
const newOpsLogic = `
    // Operational Flow (Calendar Ops)
    const allOps: any[] = [];
    
    const addOp = (startDate: any, endDate: any, category: string, title: string, color: string) => {
      let current = parseDateSafe(startDate);
      const end = parseDateSafe(endDate) || current;
      if (!current) return;
      
      // Prevent infinite loops if dates are somehow invalid but parsed
      let safetyCount = 0;
      while (current <= end && safetyCount < 365) {
        allOps.push({
          date: new Date(current),
          category,
          title,
          color
        });
        current.setDate(current.getDate() + 1);
        safetyCount++;
      }
    };

    data.projects.forEach((p: any) => {
      addOp(p.start_date, p.end_date, "Proje", \`Proje: \${p.proje_adi || p.reference || "Bilinmiyor"}\`, "bg-blue-500/80");
      // Ekip
      if (p.team_members || p.manager_id) {
        addOp(p.start_date, p.end_date, "Ekip", \`Ekip: \${p.proje_adi || p.reference}\`, "bg-indigo-500/80");
      }
    });

    data.sejours.forEach((s: any) => {
      addOp(s.checkInDate, s.checkOutDate, "Sejour", \`Sejour: \${s.file_number || s.guestInfo}\`, "bg-emerald-500/80");
    });

    data.flights.forEach((f: any) => {
      addOp(f.gidis_tarihi, f.donus_tarihi || f.gidis_tarihi, "Bilet", \`Uçuş: \${f.airline || f.havayolu}\`, "bg-amber-500/80");
    });

    data.transfers.forEach((t: any) => {
      addOp(t.transfer_date, t.transfer_date, "Transfer", \`Transfer: \${t.vehicle_type || t.route}\`, "bg-fuchsia-500/80");
    });

    data.hrRows.forEach((h: any) => {
      const role = (h.role || h.personnel_type || h.type || "").toLowerCase();
      if (role.includes("part") || role.includes("time")) {
        addOp(h.start_date, h.end_date, "Part-Time", \`Part-Time: \${h.name || h.personnel_name}\`, "bg-orange-500/80");
      } else if (role.includes("rehber") || role.includes("guide")) {
        addOp(h.start_date, h.end_date, "Rehber", \`Rehber: \${h.name || h.personnel_name}\`, "bg-teal-500/80");
      }
    });
`;

// We'll replace the block from "const upcomingOps: any[] = [];" up to "return {"
const opsRegex = /\/\/ Operational Flow \(Upcoming Confirmed\)[\s\S]*?const topOps = upcomingOps\.slice\(0, 10\);/m;
code = code.replace(opsRegex, newOpsLogic.trim());

// also update the return object to include allOps instead of topOps
code = code.replace(/topOps,/g, 'allOps,');

fs.writeFileSync('src/app/dashboard/page.tsx', code, 'utf8');
console.log('Done modifying logic');
