const fs = require('fs');
let code = fs.readFileSync('src/app/requests/page.tsx', 'utf8');

const targetDelete = `  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const { error } = await supabase.from("mice_requests").delete().eq("id", deleteModal.id);`;

const newDelete = `  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      // Önce bu talebe bağlı proje var mı kontrol et! (Zincirleme silinmeyi önlemek için)
      const { data: quotes } = await supabase.from("quotes").select("id").eq("request_id", deleteModal.id);
      if (quotes && quotes.length > 0) {
        const quoteIds = quotes.map(q => q.id);
        const { data: projects } = await supabase.from("projects").select("id").in("quote_id", quoteIds);
        if (projects && projects.length > 0) {
           toast.error("Bu talebe bağlı yaşayan bir proje var! Talebi silemezsiniz.");
           setDeleteModal({ isOpen: false, id: "", title: "" });
           return;
        }
      }

      const { error } = await supabase.from("mice_requests").delete().eq("id", deleteModal.id);`;

code = code.replace(targetDelete, newDelete);
fs.writeFileSync('src/app/requests/page.tsx', code);
console.log("Added block to request delete");
