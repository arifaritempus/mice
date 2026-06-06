import content from "@/data/content.json";
import { Users, Building, Bus, Plane, Calculator, PieChart } from "lucide-react";
import "./bento-grid.css";

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={24} strokeWidth={1.5} />,
  Building: <Building size={24} strokeWidth={1.5} />,
  Bus: <Bus size={24} strokeWidth={1.5} />,
  Plane: <Plane size={24} strokeWidth={1.5} />,
  Calculator: <Calculator size={24} strokeWidth={1.5} />,
  PieChart: <PieChart size={24} strokeWidth={1.5} />
};

export default function BentoGrid() {
  return (
    <section id="features" className="section bento-section">
      <div className="container">
        <div className="bento-header animate-fade-in">
          <h2 className="section-title">Modüler Mimari, Sınırsız Güç</h2>
          <p className="section-subtitle">Codeicon, farklı ihtiyaçlara yönelik geliştirilmiş modülleriyle işinizin her aşamasına uyum sağlar.</p>
        </div>
        
        <div className="bento-grid">
          {/* Large Card: MICE */}
          <div className="bento-card bento-large glass-panel animate-fade-in">
            <div className="bento-icon">{iconMap[content.features[0].icon]}</div>
            <h3 className="bento-title">{content.features[0].title}</h3>
            <p className="bento-description">{content.features[0].description}</p>
            <div className="bento-graphic mice-graphic"></div>
          </div>

          {/* Medium Card: Sejour */}
          <div className="bento-card bento-medium glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bento-icon">{iconMap[content.features[1].icon]}</div>
            <h3 className="bento-title">{content.features[1].title}</h3>
            <p className="bento-description">{content.features[1].description}</p>
          </div>

          {/* Medium Card: Operasyon */}
          <div className="bento-card bento-medium glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bento-icon">{iconMap[content.features[2].icon]}</div>
            <h3 className="bento-title">{content.features[2].title}</h3>
            <p className="bento-description">{content.features[2].description}</p>
          </div>

          {/* Small Card: Uçuş */}
          <div className="bento-card bento-small glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bento-icon">{iconMap[content.features[3].icon]}</div>
            <h3 className="bento-title">{content.features[3].title}</h3>
          </div>

          {/* Small Card: Muhasebe */}
          <div className="bento-card bento-small glass-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bento-icon">{iconMap[content.features[4].icon]}</div>
            <h3 className="bento-title">{content.features[4].title}</h3>
          </div>

          {/* Wide Card: Raporlar */}
          <div className="bento-card bento-wide glass-panel animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="bento-content-wrap">
              <div className="bento-icon">{iconMap[content.features[5].icon]}</div>
              <h3 className="bento-title">{content.features[5].title}</h3>
              <p className="bento-description">{content.features[5].description}</p>
            </div>
            <div className="bento-graphic reports-graphic"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
