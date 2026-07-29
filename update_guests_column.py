import re

with open("frontend/src/app/sejour/page.tsx", "r") as f:
    text = f.read()

# I will find the block starting from `<div className="text-xs max-w-xs">` inside the TD
# up to `</td>` where agencyName ends

start_marker = '<td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">\n                      <div className="text-xs max-w-xs">'
# It's better to use regex to find the exact block

pattern = r'(<td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">\s*<div className="text-xs max-w-xs">)(.*?)(</td>)'
# Wait, this might match the agencyName TD if I'm not careful.
# Let's search for the exact sejour.rooms map logic.

pattern2 = r'(\{\s*sejour\.rooms &&\s*Array\.isArray\(sejour\.rooms\)\s*&&\s*sejour\.rooms\.length > 0 \? \()(.*?)(\)\s*:\s*\(\s*<span className="text-v3-muted-text italic">Misafir bilgisi yok</span>\s*\)\s*\})'
import re
match = re.search(pattern2, text, flags=re.DOTALL)
if match:
    new_logic = """
                          <div className="flex items-center gap-2 group relative">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-v3-text">Oda 1</span>
                              <span className="text-v3-muted-text uppercase truncate max-w-[150px]" title={sejour.rooms[0].guestInfo}>{sejour.rooms[0].guestInfo || "-"}</span>
                            </div>
                            {sejour.rooms.length > 1 && (
                              <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help">
                                +{sejour.rooms.length - 1}
                              </div>
                            )}
                            {sejour.rooms.length > 1 && (
                              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-3 z-50 min-w-[200px]">
                                {sejour.rooms.map((room: any, index: number) => {
                                  const isMatchedGuest = globalTokens.length > 0 && globalTokens.some((token) => (room.guestInfo || "").toLowerCase().includes(token.toLowerCase()));
                                  return (
                                    <div key={index} className={`flex flex-col gap-0.5 text-[11px] p-1.5 rounded ${isMatchedGuest ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                      <span className="font-semibold text-v3-text text-xs">Oda {index + 1}</span>
                                      <span className={`uppercase ${isMatchedGuest ? 'text-yellow-700 dark:text-yellow-300 font-bold' : 'text-v3-muted-text'}`}>{room.guestInfo || "-"}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
"""
    new_text = text[:match.start(2)] + new_logic + text[match.end(2):]
    with open("frontend/src/app/sejour/page.tsx", "w") as f:
        f.write(new_text)
    print("Replaced successfully!")
else:
    print("Match not found!")
