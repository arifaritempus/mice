import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

text = text.replace('supabase.from("hotels").select("id, name").eq("is_active", true).order("name")', 'supabase.from("hotels").select("id, name, concept").eq("is_active", true).order("name")')

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Hotels query fixed to include concept!")
