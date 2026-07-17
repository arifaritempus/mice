import os

filepath = 'src/app/projects/[id]/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

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

# Replace lines 12518 to 13266 (0-indexed: 12518 to 13266)
# Note: lines list is 0-indexed, so line 12519 is index 12518.
# Line 13266 is index 13265. We slice out [12518:13266] and insert new_func.

start_idx = 12518
end_idx = 13266

new_lines = lines[:start_idx] + [new_func] + lines[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Replacement done!")
