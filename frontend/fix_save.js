const fs = require('fs');

// 1. Update API route
let api = fs.readFileSync('src/app/api/theme-settings/route.ts', 'utf8');
if (!api.includes('export async function POST')) {
  const postMethod = `
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client
      .from("settings")
      .upsert({ key: "general_settings", value: body }, { onConflict: 'key' });

    if (error) {
      console.error("[ThemeSettingsAPI POST] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[ThemeSettingsAPI POST] Global error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
`;
  fs.writeFileSync('src/app/api/theme-settings/route.ts', api + '\n' + postMethod, 'utf8');
}

// 2. Update layout.tsx
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
layout = layout.replace(/settings\.colorPrimary/g, 'settings.general_settings?.colorPrimary');
fs.writeFileSync('src/app/layout.tsx', layout, 'utf8');

// 3. Update ThemeProvider.tsx
let themeProvider = fs.readFileSync('src/components/providers/ThemeProvider.tsx', 'utf8');
themeProvider = themeProvider.replace(/settings\.colorPrimary/g, 'settings.general_settings?.colorPrimary');
fs.writeFileSync('src/components/providers/ThemeProvider.tsx', themeProvider, 'utf8');

// 4. Update settings page handleSave
let settingsPage = fs.readFileSync('src/app/settings/page.tsx', 'utf8');
const newHandleSave = `
  const handleSave = async () => {
    try {
      const res = await fetch("/api/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("Ayarlar başarıyla kaydedildi! Sayfa yenileniyor...");
        window.location.reload();
      } else {
        alert("Kaydetme hatası!");
      }
    } catch(e) {
      alert("Hata oluştu!");
    }
  };
`;
settingsPage = settingsPage.replace(/const handleSave = \(\) => \{\s*alert\("Ayarlar başarıyla kaydedildi!"\);\s*\};/, newHandleSave.trim());
fs.writeFileSync('src/app/settings/page.tsx', settingsPage, 'utf8');

