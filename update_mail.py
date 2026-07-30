import re

with open("frontend/public/mail_preview.html", "r") as f:
    text = f.read()

# 1. Update header color to a dark theme example (e.g. #0f172a) and add logo image
header_old = """    <div class="header">
      <h1>Yeni MICE Talebi</h1>
      <p>Referans: #TMI260729001</p>
    </div>"""

header_new = """    <div class="header" style="background-color: #0f172a; color: #ffffff;">
      <div style="margin-bottom: 20px;">
         <!-- Örnek Koyu Tema Logosu (Placeholder) -->
         <img src="https://placehold.co/200x50/0f172a/ffffff?text=LA+TOUR+SISTEM" alt="Firma Logo" style="max-height: 50px; width: auto;" />
      </div>
      <h1>Yeni MICE Talebi</h1>
      <p>Referans: #TMI260729001</p>
    </div>"""
text = text.replace(header_old, header_new)

# 2. Update button color to match the theme example (Optional but looks better)
text = text.replace("background: #2563eb;", "background: #0f172a;")
text = text.replace("background: #1d4ed8;", "background: #1e293b;")

# 3. Update the footer to include the Codeicon link
footer_old = """    <div class="footer">
      Bu e-posta <strong>Tempus Sistem</strong> üzerinden otomatik olarak gönderilmiştir.<br>
      Acente İletişim: +90 212 555 44 33 | info@tempussistem.com
    </div>"""

footer_new = """    <div class="footer">
      Bu e-posta <a href="https://www.codeicon.co" target="_blank" style="color: #0f172a; font-weight: bold; text-decoration: none;">La Tour Sistem</a> üzerinden otomatik olarak gönderilmiştir.<br>
      Acente İletişim: +90 212 555 44 33 | info@latour.com
    </div>"""
text = text.replace(footer_old, footer_new)

with open("frontend/public/mail_preview.html", "w") as f:
    f.write(text)

print("Mail preview updated!")
