"use client";

import { useState } from "react";
import content from "@/data/content.json";
import { ArrowRight } from "lucide-react";
import DemoModal from "./DemoModal";
import "./demo.css";

export default function Demo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section id="demo" className="section demo-section">
        <div className="container">
          <div className="demo-box animate-fade-in">
            <div className="demo-content">
              <h2 className="demo-title">{content.demo.title}</h2>
              <p className="demo-subtitle">{content.demo.subtitle}</p>
            </div>
            <div className="demo-action">
              <button onClick={() => setIsModalOpen(true)} className="btn-demo">
                {content.demo.buttonText} <ArrowRight size={20} className="demo-btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
