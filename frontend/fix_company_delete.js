const fs = require('fs');
let code = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

const targetDelete = `  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'client') {
        await marketingService.clients.delete(deleteConfirm.id);`;
        
const newDelete = `  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'client') {
        const { data: projects } = await supabase.from("projects").select("id").eq("company_id", deleteConfirm.id);
        if (projects && projects.length > 0) {
            toast.error("Bu firmaya bağlı projeler var! Firmayı silemezsiniz.");
            setDeleteConfirm(null);
            return;
        }
        await marketingService.clients.delete(deleteConfirm.id);`;

code = code.replace(targetDelete, newDelete);
fs.writeFileSync('src/app/marketing/page.tsx', code);
console.log("Added block to company delete");
