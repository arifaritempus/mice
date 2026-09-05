const fs = require('fs');
let code = fs.readFileSync('src/app/quotes/page.tsx', 'utf8');

const targetDelete = `  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      setLoading(true);
      await quotesService.delete(quoteToDelete);`;
      
const newDelete = `  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      setLoading(true);
      
      // Proje kontrolü (Cascade delete'i önlemek için)
      const { data: projects } = await supabase.from("projects").select("id").eq("quote_id", quoteToDelete);
      if (projects && projects.length > 0) {
          toast.error("Bu teklife bağlı yaşayan bir PROJE var! Teklifi silerseniz proje de silinir. Lütfen önce projeyi silin veya bağlantıyı koparın.");
          setLoading(false);
          setShowDeleteConfirm(false);
          return;
      }
      
      await quotesService.delete(quoteToDelete);`;

code = code.replace(targetDelete, newDelete);
fs.writeFileSync('src/app/quotes/page.tsx', code);
console.log("Added block to quote delete");
