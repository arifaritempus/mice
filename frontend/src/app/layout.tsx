import "./globals.css";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PublicLayout from "@/components/PublicLayout";
import { Toaster } from "react-hot-toast";
import DraggableAIAssistant from "@/components/AI/DraggableAIAssistant";
import AuthWrapper from "@/components/AuthWrapper";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

function GlobalLoader() {
  return <LoadingSpinner message="Sayfa yükleniyor..." />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export async function generateMetadata(): Promise<Metadata> {
  let title = "NEXUS Analytics";
  let icon = "/favicon.ico";

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await client
        .from("settings")
        .select("value")
        .eq("key", "general_settings")
        .maybeSingle();

      let parsed = data?.value;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) {}
      }

      if (parsed) {
        if (parsed.companyName) title = parsed.companyName;
        if (parsed.darkIconLogo) icon = parsed.darkIconLogo;
        else if (parsed.lightIconLogo) icon = parsed.lightIconLogo;
      }
    }
  } catch (error) {
    console.error("Error fetching metadata settings:", error);
  }

  return {
    title,
    description: "Premium Workspace Management",
    icons: {
      icon,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning className={outfit.variable}>
      <head>
        <link rel="stylesheet" href="/styles.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Read theme from cookie or fallback to dark mode
                var match = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
                var theme = match ? decodeURIComponent(match[1]) : "dark";
                if (theme === "light") {
                  document.documentElement.classList.add("light");
                  document.documentElement.classList.remove("dark");
                } else if (theme === "system") {
                  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  if (systemDark) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.add("light");
                  }
                } else {
                  document.documentElement.classList.add("dark");
                }

                
                fetch('/api/theme-settings')
                  .then(res => res.json())
                  .then(settings => {
                    if (!settings || !settings.general_settings?.colorPrimary) return;
                    var root = document.documentElement;
                    
                    function hexToRgb(hex) {
                      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                      hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
                      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
                    }

                    var baseRgb = hexToRgb(settings.general_settings?.colorPrimary);
                    if (!baseRgb) return;

                    var mix = function(c1, c2, weight) {
                        return Math.round(c1.r * weight + c2.r * (1 - weight)) + ' ' +
                               Math.round(c1.g * weight + c2.g * (1 - weight)) + ' ' +
                               Math.round(c1.b * weight + c2.b * (1 - weight));
                    };
                    var white = { r: 255, g: 255, b: 255 };
                    var black = { r: 0, g: 0, b: 0 };

                    root.style.setProperty('--color-primary-50', mix(baseRgb, white, 0.1));
                    root.style.setProperty('--color-primary-100', mix(baseRgb, white, 0.2));
                    root.style.setProperty('--color-primary-200', mix(baseRgb, white, 0.4));
                    root.style.setProperty('--color-primary-300', mix(baseRgb, white, 0.6));
                    root.style.setProperty('--color-primary-400', mix(baseRgb, white, 0.8));
                    root.style.setProperty('--color-primary-500', baseRgb.r + ' ' + baseRgb.g + ' ' + baseRgb.b);
                    root.style.setProperty('--color-primary-600', mix(baseRgb, black, 0.8));
                    root.style.setProperty('--color-primary-700', mix(baseRgb, black, 0.6));
                    root.style.setProperty('--color-primary-800', mix(baseRgb, black, 0.4));
                    root.style.setProperty('--color-primary-900', mix(baseRgb, black, 0.2));
                    root.style.setProperty('--color-primary-950', mix(baseRgb, black, 0.1));
                  })
                  .catch(console.error);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased text-slate-900 dark:text-slate-100 transition-colors duration-200 h-screen w-full overflow-hidden"
        style={{
          backgroundColor: "rgb(var(--theme-bg-main))",
        }}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthWrapper>
              <PublicLayout>
                <Suspense fallback={<GlobalLoader />}>{children}</Suspense>
              </PublicLayout>
            </AuthWrapper>
          </LanguageProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <DraggableAIAssistant />
        </ThemeProvider>
      </body>
    </html>
  );
}
