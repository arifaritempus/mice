import fs from "fs";
import path from "path";
import content from "@/data/content.json";
import { CheckCircle2, BarChart2, FileText, Briefcase, Calendar, Map, Plane, Megaphone, Calculator, PieChart, Settings, Sliders } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  BarChart2: <BarChart2 size={32} color="var(--color-accent)" />,
  FileText: <FileText size={32} color="var(--color-accent)" />,
  Briefcase: <Briefcase size={32} color="var(--color-accent)" />,
  Calendar: <Calendar size={32} color="var(--color-accent)" />,
  Map: <Map size={32} color="var(--color-accent)" />,
  Plane: <Plane size={32} color="var(--color-accent)" />,
  Megaphone: <Megaphone size={32} color="var(--color-accent)" />,
  Calculator: <Calculator size={32} color="var(--color-accent)" />,
  PieChart: <PieChart size={32} color="var(--color-accent)" />,
  Settings: <Settings size={32} color="var(--color-accent)" />,
  Sliders: <Sliders size={32} color="var(--color-accent)" />
};

export default function Solutions() {
  return (
    <main className="section" style={{ paddingTop: "12rem", backgroundColor: "var(--color-bg)" }}>
      <div className="container">
        <h1 className="section-title text-gradient" style={{ textAlign: "center", marginBottom: "1rem", fontSize: "clamp(3rem, 5vw, 4.5rem)" }}>
          Modüler Çözümlerimiz
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "1.2rem", maxWidth: "800px", margin: "0 auto 5rem auto" }}>
          Codeicon, işletmenizin uçtan uca tüm operasyonel, finansal ve pazarlama süreçlerini tek bir platformda toplar. 
          Sektörün en gelişmiş özellikleri ile tanışın.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
          {content.detailedModules.map((module, i) => {
            // Check if image exists in public folder
            const imagePath = `/images/mockups/${module.id}.png`;
            const absolutePath = path.join(process.cwd(), "public", "images", "mockups", `${module.id}.png`);
            const imageExists = fs.existsSync(absolutePath);

            return (
            <div 
              key={module.id} 
              className={`glass-panel animate-fade-in ${i % 2 === 0 ? "desktop-row" : "desktop-row-reverse"}`} 
              style={{ 
                borderRadius: "24px", 
                animationDelay: `${(i % 3) * 0.1}s`,
                overflow: "hidden",
                borderTop: "3px solid var(--color-accent)"
              }}
            >
              <div className="mobile-p-2" style={{ flex: 1, padding: "4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "12px", borderRadius: "12px" }}>
                    {iconMap[module.icon]}
                  </div>
                  <h2 style={{ fontSize: "2rem", fontFamily: "var(--font-inter)", fontWeight: 600 }}>{module.title}</h2>
                </div>
                
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {module.features.map((feat, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <CheckCircle2 size={20} color="var(--color-accent)" style={{ marginTop: "3px", flexShrink: 0 }} />
                      <span style={{ color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: "1.05rem" }}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image Box */}
              <div className="mobile-min-h" style={{ 
                flex: 1, 
                backgroundColor: "rgba(0,0,0,0.2)", 
                borderLeft: i % 2 === 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                borderRight: i % 2 !== 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: imageExists ? "0" : "2rem",
                position: "relative",
                overflow: "hidden"
              }}>
                {imageExists ? (
                  <img 
                    src={imagePath} 
                    alt={`${module.title} Dashboard`} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", opacity: 0.9, border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "400px",
                    borderRadius: "12px",
                    border: "2px dashed rgba(255,255,255,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-muted)",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
                    textAlign: "center",
                    padding: "2rem"
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.2 }}>📸</div>
                    <span style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--color-text)" }}>Sistem Görseli Eklenecek</span>
                    <span style={{ fontSize: "0.85rem", letterSpacing: "0.05em", opacity: 0.7 }}>
                      "{module.title}" modülünün DEMO ekran görüntüsünü buraya ekleyebilirsiniz.<br/>
                      <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", marginTop: "10px", display: "inline-block" }}>
                        public/images/mockups/{module.id}.png
                      </code>
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
