"use client";

import content from "@/data/content.json";
import DashboardMockup from "./DashboardMockup";
import DemoModal from "./DemoModal";
import "./hero.css";
import Link from "next/link";
import { useState } from "react";

export default function Hero() {
  const { headline, subheadline, ctaText } = content.hero;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="hero-section">
      <div className="glow-bg"></div>
      
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge animate-fade-in">MICE ve Operasyon Yönetim ERP'si</div>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">MICE ve Sejour</span><br />Operasyonlarınız Tek Ekranda
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {subheadline}
          </p>
          <div className="hero-action animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/solutions" className="btn-primary">
              {ctaText}
            </Link>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
              Demo İste
            </button>
          </div>
        </div>

        <div className="hero-mockup-wrapper animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <DashboardMockup />
        </div>
      </div>
      
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
