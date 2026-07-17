import { SettingsService } from "./src/lib/supabaseService";
async function test() {
  try {
    const s = await SettingsService.getSettings();
    console.log(JSON.stringify(s.general_settings, null, 2));
  } catch (e) { console.error(e); }
}
test();
