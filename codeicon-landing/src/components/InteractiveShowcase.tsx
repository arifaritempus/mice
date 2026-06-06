"use client";

import { useState } from "react";
import content from "@/data/content.json";
import { BarChart2, FileText, Briefcase, Calendar, Map, Plane, Megaphone, Calculator, PieChart, Settings, Sliders, CheckCircle2 } from "lucide-react";
import "./interactive-showcase.css";

const iconMap: Record<string, React.ReactNode> = {
  BarChart2: <BarChart2 size={20} />,
  FileText: <FileText size={20} />,
  Briefcase: <Briefcase size={20} />,
  Calendar: <Calendar size={20} />,
  Map: <Map size={20} />,
  Plane: <Plane size={20} />,
  Megaphone: <Megaphone size={20} />,
  Calculator: <Calculator size={20} />,
  PieChart: <PieChart size={20} />,
  Settings: <Settings size={20} />,
  Sliders: <Sliders size={20} />
};

export default function InteractiveShowcase() {
  const [activeModule, setActiveModule] = useState(content.detailedModules[2]); // Default to 'Projeler'

  return (
    <section className="section showcase-section" id="showcase">
      <div className="container">
        <div className="showcase-header animate-fade-in">
          <h2 className="section-title">Sistemi Yakından Tanıyın</h2>
          <p className="section-subtitle">Codeicon, işinizin her detayı düşünülerek tasarlanmış 11 farklı güçlü modüle sahiptir. Modülleri seçerek arayüz yeteneklerini inceleyin.</p>
        </div>

        <div className="showcase-layout">
          {/* Left Sidebar - Module List */}
          <div className="showcase-sidebar glass-panel">
            {content.detailedModules.slice(0, 8).map((mod) => (
              <button
                key={mod.id}
                className={`showcase-tab ${activeModule.id === mod.id ? 'active' : ''}`}
                onClick={() => setActiveModule(mod)}
              >
                <span className="tab-icon">{iconMap[mod.icon]}</span>
                <span className="tab-title">{mod.title}</span>
              </button>
            ))}
          </div>

          {/* Right Content - Mockup Display */}
          <div className="showcase-content">
            <div className="showcase-mockup glass-panel">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="mockup-url">demo.codeicon.co / {activeModule.id}</div>
              </div>
              
              <div className="mockup-inner-body">
                <div className="mockup-module-header">
                  <div className="module-title-wrap">
                    {iconMap[activeModule.icon]}
                    <h3>{activeModule.title}</h3>
                  </div>
                  <button className="mockup-btn primary">+ YENİ KAYIT</button>
                </div>
                
                <div className="mockup-features-list">
                  {activeModule.features.map((feat, i) => (
                    <div className="mockup-feature-row animate-fade-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                      <CheckCircle2 size={16} className="feature-check" />
                      <p>{feat}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
