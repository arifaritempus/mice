import sys

with open("frontend/src/app/hotels/page.tsx", "r") as f:
    text = f.read()

# 1. Update interface
text = text.replace('  email?: string;', '  email?: string;\n  cc_mail?: string;\n  agency_cc_mail?: string;')

# 2. Update init state
text = text.replace('    email: "",', '    email: "",\n    cc_mail: "",\n    agency_cc_mail: "",')

# 3. Update refs
text = text.replace('  const emailInputRef = useRef<HTMLInputElement>(null);', '  const emailInputRef = useRef<HTMLInputElement>(null);\n  const ccMailInputRef = useRef<HTMLInputElement>(null);\n  const agencyCcMailInputRef = useRef<HTMLInputElement>(null);')

# 4. Update editing state setup
text = text.replace('          email: h.email || "",', '          email: h.email || "",\n          cc_mail: h.cc_mail || "",\n          agency_cc_mail: h.agency_cc_mail || "",')

# 5. Update save operation values
text = text.replace('    const emailValue = emailInputRef.current?.value || "";', '    const emailValue = emailInputRef.current?.value || "";\n    const ccMailValue = ccMailInputRef.current?.value || "";\n    const agencyCcMailValue = agencyCcMailInputRef.current?.value || "";')

# 6. Update insert/update payloads
text = text.replace('            email: emailValue,', '            email: emailValue,\n            cc_mail: ccMailValue,\n            agency_cc_mail: agencyCcMailValue,')
text = text.replace('            email: emailValue,', '            email: emailValue,\n            cc_mail: ccMailValue,\n            agency_cc_mail: agencyCcMailValue,') # Since there are two places (insert and update)

# 7. Update reset form
text = text.replace('        email: "",', '        email: "",\n        cc_mail: "",\n        agency_cc_mail: "",')
text = text.replace('      email: "",', '      email: "",\n      cc_mail: "",\n      agency_cc_mail: "",')

# 8. Update edit open values
text = text.replace('      email: hotel.email || "",', '      email: hotel.email || "",\n      cc_mail: hotel.cc_mail || "",\n      agency_cc_mail: hotel.agency_cc_mail || "",')

# 9. Update refs populating
text = text.replace('      if (emailInputRef.current)\n        emailInputRef.current.value = hotel.email || "";', '      if (emailInputRef.current)\n        emailInputRef.current.value = hotel.email || "";\n      if (ccMailInputRef.current)\n        ccMailInputRef.current.value = hotel.cc_mail || "";\n      if (agencyCcMailInputRef.current)\n        agencyCcMailInputRef.current.value = hotel.agency_cc_mail || "";')

# 10. Update excel export
text = text.replace('          hotel.email || "",', '          hotel.email || "",\n          hotel.cc_mail || "",\n          hotel.agency_cc_mail || "",')
# We need to add the headers for Excel export:
text = text.replace('"E-posta",', '"E-posta",\n        "CC Mail",\n        "Acente CC Mail",')

# 11. Update excel import
text = text.replace('        email: row["E-posta"] || "",', '        email: row["E-posta"] || "",\n        cc_mail: row["CC Mail"] || "",\n        agency_cc_mail: row["Acente CC Mail"] || "",')

# 12. Update search (optional but good)
text = text.replace('          (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||', '          (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||\n          (hotel.cc_mail && hotel.cc_mail.toLowerCase().includes(lowerS)) ||\n          (hotel.agency_cc_mail && hotel.agency_cc_mail.toLowerCase().includes(lowerS)) ||')

# 13. Update UI
ui_email = """                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    E-posta
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="ornek@otel.com"
                  />
                </div>"""

ui_new_mails = """                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    E-posta
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="ornek@otel.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    CC Mail
                  </label>
                  <input
                    ref={ccMailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="cc@otel.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Acente CC Mail
                  </label>
                  <input
                    ref={agencyCcMailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="acente-cc@otel.com"
                  />
                </div>"""

text = text.replace(ui_email, ui_new_mails)

with open("frontend/src/app/hotels/page.tsx", "w") as f:
    f.write(text)

print("Patch complete!")
