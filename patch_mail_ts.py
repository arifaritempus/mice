import sys

with open("frontend/src/lib/mail.ts", "r") as f:
    text = f.read()

text = text.replace('  to: string;\n  subject: string;', '  to: string;\n  cc?: string | string[];\n  subject: string;')
text = text.replace('      to: options.to,\n      replyTo: mail_reply_to || mail_from_email,', '      to: options.to,\n      cc: options.cc,\n      replyTo: mail_reply_to || mail_from_email,')

with open("frontend/src/lib/mail.ts", "w") as f:
    f.write(text)

print("Mail ts patched!")
