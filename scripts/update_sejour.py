import sys

file_path = "frontend/src/app/sejour/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update th and td padding
content = content.replace('px-3 py-2', 'px-2.5 py-2.5')
content = content.replace('px-2 py-2', 'px-2.5 py-2.5')

# 2. Update tr hover class
content = content.replace(
    'className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer border-b border-v3-border last:border-0"',
    'className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"'
)

# 3. Add getDayNameShort to CheckInDate
old_checkin = """                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {formatDate(
                        sejour.checkInDate || sejour.check_in_date || "",
                      )}
                    </td>"""
new_checkin = """                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="flex items-center">
                        <span>{formatDate(sejour.checkInDate || sejour.check_in_date || "")}</span>
                        {(sejour.checkInDate || sejour.check_in_date) && <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(sejour.checkInDate || sejour.check_in_date || "")}</span>}
                      </div>
                    </td>"""
content = content.replace(old_checkin, new_checkin)

# Add getDayNameShort to CheckOutDate
old_checkout = """                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {formatDate(
                        sejour.checkOutDate || sejour.check_out_date || "",
                      )}
                    </td>"""
new_checkout = """                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="flex items-center">
                        <span>{formatDate(sejour.checkOutDate || sejour.check_out_date || "")}</span>
                        {(sejour.checkOutDate || sejour.check_out_date) && <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(sejour.checkOutDate || sejour.check_out_date || "")}</span>}
                      </div>
                    </td>"""
content = content.replace(old_checkout, new_checkout)

# 4. Update the Unified Stats Strip Background
content = content.replace(
    'className="mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm w-full overflow-x-auto custom-scrollbar"',
    'className="mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm w-full overflow-x-auto custom-scrollbar"'
)

# 5. Fix the stats label
content = content.replace(
    '<span className="text-[10px] uppercase font-semibold text-v3-muted mr-1 pl-1 shrink-0">\n              DURUM:\n            </span>',
    '<span className="text-[10px] uppercase font-semibold text-v3-text mr-1 pl-1 shrink-0">\n              DURUM:\n            </span>'
)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated sejour/page.tsx")
