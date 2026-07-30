import sys

with open("frontend/src/app/hotels/page.tsx", "r") as f:
    text = f.read()

# Replace interface
text = text.replace('  email?: string;', '  email?: string;\n  cc_mail?: string;\n  agency_cc_mail?: string;', 1)

# Init state
text = text.replace('    email: "",', '    email: "",\n    cc_mail: "",\n    agency_cc_mail: "",', 1)

# Refs
text = text.replace('  const emailInputRef = useRef<HTMLInputElement>(null);', '  const emailInputRef = useRef<HTMLInputElement>(null);\n  const ccMailInputRef = useRef<HTMLInputElement>(null);\n  const agencyCcMailInputRef = useRef<HTMLInputElement>(null);', 1)

# handleEdit
text = text.replace('          email: h.email || "",', '          email: h.email || "",\n          cc_mail: h.cc_mail || "",\n          agency_cc_mail: h.agency_cc_mail || "",', 1)

# handleSave inputs
text = text.replace('    const emailValue = emailInputRef.current?.value || "";', '    const emailValue = emailInputRef.current?.value || "";\n    const ccMailValue = ccMailInputRef.current?.value || "";\n    const agencyCcMailValue = agencyCcMailInputRef.current?.value || "";', 1)

# handleSave insert payload
text = text.replace('            email: emailValue,', '            email: emailValue,\n            cc_mail: ccMailValue,\n            agency_cc_mail: agencyCcMailValue,', 1)

# handleSave update payload
text = text.replace('            email: emailValue,', '            email: emailValue,\n            cc_mail: ccMailValue,\n            agency_cc_mail: agencyCcMailValue,', 1)

# reset form 
text = text.replace('        email: "",', '        email: "",\n        cc_mail: "",\n        agency_cc_mail: "",', 1)

# open edit modal state
text = text.replace('      email: hotel.email || "",', '      email: hotel.email || "",\n      cc_mail: hotel.cc_mail || "",\n      agency_cc_mail: hotel.agency_cc_mail || "",', 1)

# refs populating in edit modal
text = text.replace('      if (emailInputRef.current)\n        emailInputRef.current.value = hotel.email || "";', '      if (emailInputRef.current)\n        emailInputRef.current.value = hotel.email || "";\n      if (ccMailInputRef.current)\n        ccMailInputRef.current.value = hotel.cc_mail || "";\n      if (agencyCcMailInputRef.current)\n        agencyCcMailInputRef.current.value = hotel.agency_cc_mail || "";', 1)

# excel export
text = text.replace('          hotel.email || "",', '          hotel.email || "",\n          hotel.cc_mail || "",\n          hotel.agency_cc_mail || "",', 1)
text = text.replace('"E-posta",', '"E-posta",\n        "CC Mail",\n        "Acente CC Mail",', 1)

# excel import
text = text.replace('        email: row["E-posta"] || "",', '        email: row["E-posta"] || "",\n        cc_mail: row["CC Mail"] || "",\n        agency_cc_mail: row["Acente CC Mail"] || "",', 1)

# excel new row reset
text = text.replace('      email: "",', '      email: "",\n      cc_mail: "",\n      agency_cc_mail: "",', 1)

# search functionality
text = text.replace('          (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||', '          (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||\n          (hotel.cc_mail && hotel.cc_mail.toLowerCase().includes(lowerS)) ||\n          (hotel.agency_cc_mail && hotel.agency_cc_mail.toLowerCase().includes(lowerS)) ||', 1)

# ui html
ui_old = """                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
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
ui_new = """                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    CC Mail
                  </label>
                  <input
                    ref={ccMailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="ornek@cc.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Acente CC Mail
                  </label>
                  <input
                    ref={agencyCcMailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="acente@cc.com"
                  />
                </div>"""
text = text.replace(ui_old, ui_new, 1)

with open("frontend/src/app/hotels/page.tsx", "w") as f:
    f.write(text)

print("Done successfully!")
