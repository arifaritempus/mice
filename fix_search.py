import re

with open("frontend/src/lib/supabaseService.ts", "r") as f:
    text = f.read()

# I will modify the search term logic in getSejours
# Find:
#     if (params.searchTerm?.trim()) {
#       const s = params.searchTerm.trim().replace(/[%_]/g, '\\$&');
#       query = query.or(`voucher_number.ilike.%${s}%,customer_name.ilike.%${s}%,status.ilike.%${s}%`);
#     }

replacement = """    if (params.searchTerm?.trim()) {
      const s = params.searchTerm.trim().replace(/[%_]/g, '\\\\$&');
      
      // Misafir isimlerinde arama yapabilmek için önce odaları bulalım
      const { data: roomMatches } = await supabase
        .from('sejour_rooms')
        .select('sejour_id')
        .ilike('guest_info', `%${s}%`);
        
      const matchedSejourIds = roomMatches?.map(r => r.sejour_id) || [];
      
      if (matchedSejourIds.length > 0) {
        // Hem ana tablodaki alanlarda hem de eşleşen oda ID'lerinde ara
        query = query.or(`voucher_number.ilike.%${s}%,customer_name.ilike.%${s}%,status.ilike.%${s}%,id.in.(${matchedSejourIds.join(',')})`);
      } else {
        query = query.or(`voucher_number.ilike.%${s}%,customer_name.ilike.%${s}%,status.ilike.%${s}%`);
      }
    }"""

text = re.sub(r'    if \(params\.searchTerm\?\.trim\(\)\) \{\n      const s = params\.searchTerm\.trim\(\)\.replace\(/\[%_\]/g, \'\\\\\$&\'\);\n      query = query\.or\(`voucher_number\.ilike\.%\$\{s\}%,customer_name\.ilike\.%\$\{s\}%,status\.ilike\.%\$\{s\}%`\);\n    \}', replacement, text)

with open("frontend/src/lib/supabaseService.ts", "w") as f:
    f.write(text)

