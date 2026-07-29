with open("current_rooms.txt", "r") as f:
    old_content = f.read()

new_content = """                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs max-w-xs">
                        {sejour.rooms && Array.isArray(sejour.rooms) && sejour.rooms.length > 0 ? (
                          <div className="flex items-center gap-2 group relative">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-v3-text text-[11px]">
                                {String(sejour.rooms[0].roomNumber || "").toLowerCase().includes("oda") ? sejour.rooms[0].roomNumber : `Oda ${sejour.rooms[0].roomNumber || 1}`}
                              </span>
                              <span className="text-v3-text uppercase truncate max-w-[150px]" title={sejour.rooms[0].guestInfo}>{sejour.rooms[0].guestInfo || "Misafir bilgisi yok"}</span>
                            </div>
                            {sejour.rooms.length > 1 && (
                              <div className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-help">
                                +{sejour.rooms.length - 1} Oda
                              </div>
                            )}
                            {sejour.rooms.length > 1 && (
                              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-3 z-50 min-w-[200px]">
                                {sejour.rooms.map((room: any, index: number) => {
                                  const isMatchedGuest = globalTokens.length > 0 && globalTokens.some((token) => (room.guestInfo || "").toLowerCase().includes(token.toLowerCase()));
                                  return (
                                    <div key={index} className={`flex flex-col gap-0.5 text-[11px] p-1.5 rounded ${isMatchedGuest ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                      <span className="font-semibold text-v3-text text-xs">
                                        {String(room.roomNumber || "").toLowerCase().includes("oda") ? room.roomNumber : `Oda ${room.roomNumber || index + 1}`}
                                      </span>
                                      <span className={`uppercase ${isMatchedGuest ? 'text-yellow-700 dark:text-yellow-300 font-bold' : 'text-v3-text'}`}>{room.guestInfo || "Misafir bilgisi yok"}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-v3-muted dark:text-gray-500">
                            Misafir bilgisi yok
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {formatDate("""

with open("frontend/src/app/sejour/page.tsx", "r") as f:
    text = f.read()

import re
# We just need to extract from '<td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">\n                      <div className="text-xs max-w-xs">'
# to '{formatDate('

pattern = r'(<td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">\s*<div className="text-xs max-w-xs">\s*\{sejour\.rooms &&.*?Misafir bilgisi yok\s*</span>\s*\)\s*\}\s*</div>\s*</td>\s*<td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">\s*\{formatDate\()'

match = re.search(pattern, text, flags=re.DOTALL)
if match:
    text = text[:match.start()] + new_content + text[match.end():]
    with open("frontend/src/app/sejour/page.tsx", "w") as f:
        f.write(text)
    print("Replaced successfully")
else:
    print("Not matched")
