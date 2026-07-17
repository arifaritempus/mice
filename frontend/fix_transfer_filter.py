import re
import os

filepath = 'src/app/projects/[id]/page.tsx'
with open(filepath, 'r') as f: content = f.read()

old_transfer_filter = """    const searchTerm = transferSearch?.toLowerCase() || "";
    const filtered = baseTransfers.filter((transfer: any) => {
      // Tüm sütunlarda arama yap
      const searchableFields = [
        transfer.date,
        transfer.time,
        transfer.flightCode || "",
        transfer.route,
        transfer.passengerCount?.toString() || "",
        transfer.transferType,
        transfer.vehicleType,
        transfer.supplierName || "",
        transfer.costAmount?.toString() || "",
        transfer.currency,
        transfer.passengers?.join(" ") || "",
        transfer.direction === "arrival" ? "giriş" : "çıkış",
        transfer.typeLabel || "",
      ];

      return searchableFields.some(
        (field) => field && field.toString().toLowerCase().includes(searchTerm),
      );
    });"""

new_transfer_filter = """    const searchTerms = (transferSearch?.toLowerCase() || "").split(' ').filter((t: string) => t.trim() !== '');
    const filtered = baseTransfers.filter((transfer: any) => {
      const searchableFields = [
        transfer.date,
        transfer.time,
        transfer.flightCode || "",
        transfer.route,
        transfer.passengerCount?.toString() || "",
        transfer.transferType,
        transfer.vehicleType,
        transfer.supplierName || "",
        transfer.costAmount?.toString() || "",
        transfer.currency,
        transfer.passengers?.join(" ") || "",
        transfer.direction === "arrival" ? "giriş" : "çıkış",
        transfer.typeLabel || "",
      ];
      
      const textToSearch = searchableFields.map(f => f ? f.toString().toLowerCase() : "").join(" ");
      return searchTerms.every((term: string) => textToSearch.includes(term));
    });"""

content = content.replace(old_transfer_filter, new_transfer_filter)
with open(filepath, 'w') as f: f.write(content)

print("Done fixing page.tsx transfer filter")
