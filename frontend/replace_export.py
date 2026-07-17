import re

filepath = 'src/app/projects/[id]/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the start of exportProjectFullToExcel
start_marker = "const exportProjectFullToExcel = async () => {"
start_idx = content.find(start_marker)

if start_idx == -1:
    print("Could not find start marker")
    exit(1)

# Find the end of it. We know the first line AFTER the function is:
# const hotelsData = (project as any)?.hotels_data || [];
end_marker = "const hotelsData = (project as any)?.hotels_data || [];"
end_idx = content.find(end_marker, start_idx)

if end_idx == -1:
    print("Could not find end marker")
    exit(1)

# Backtrack to the line with `  }` right before hotelsData
sub_str = content[start_idx:end_idx]
last_brace_idx = sub_str.rfind("  }\n")

if last_brace_idx == -1:
    print("Could not find the closing brace")
    exit(1)

end_replace_idx = start_idx + last_brace_idx + 4 # include "  }\n"

new_func = """  const exportProjectFullToExcel = async () => {
    try {
      setLoading(true);
      const { generateProjectFullReport } = await import('@/utils/projectFullReportExport');
      await generateProjectFullReport({
        project,
        salesItems: filteredSalesItems,
        purchaseItems: filteredPurchaseItems,
        flightTickets,
        projectOthers,
        collectionPlans,
        paymentPlans,
        accommodationItems,
        transfers,
        getCategoryName,
        getSupplierName,
        getHotelName,
        t
      });
      toast.success(t('projects.excelExportSuccess') || "Excel başarıyla oluşturuldu.");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(t('projects.excelExportError') || "Excel oluşturulurken bir hata meydana geldi.");
    } finally {
      setLoading(false);
    }
  };
"""

new_content = content[:start_idx] + new_func + content[end_replace_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced exportProjectFullToExcel")
