import content from "@/data/content.json";
import { Users, Building, Bus, Plane, Calculator, PieChart } from "lucide-react";
import "./features.css";

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={32} strokeWidth={1.5} />,
  Building: <Building size={32} strokeWidth={1.5} />,
  Bus: <Bus size={32} strokeWidth={1.5} />,
  Plane: <Plane size={32} strokeWidth={1.5} />,
  Calculator: <Calculator size={32} strokeWidth={1.5} />,
  PieChart: <PieChart size={32} strokeWidth={1.5} />
};

export default function Features() {
  return (
    <section id="features" className="section features-section">
      <div className="container">
        <div className="features-header animate-fade-in">
          <h2 className="section-title">Ayrıcalıklı Özelliklerimiz</h2>
          <div className="title-separator"></div>
          <p className="section-subtitle">Tüm seyahat, etkinlik ve muhasebe operasyonlarınızı tek bir çatı altında toplayan akıllı yönetim mimarisi.</p>
        </div>
        
        <div className="features-grid">
          {content.features.map((feature, index) => (
            <div 
              key={feature.id} 
              className={`feature-card animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="feature-icon-wrapper">
                {iconMap[feature.icon]}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
