import content from "@/data/content.json";
import { ArrowRight } from "lucide-react";
import "./demo.css";

export default function Demo() {
  return (
    <section id="demo" className="section demo-section">
      <div className="container">
        <div className="demo-box animate-fade-in">
          <div className="demo-content">
            <h2 className="demo-title">{content.demo.title}</h2>
            <p className="demo-subtitle">{content.demo.subtitle}</p>
          </div>
          <div className="demo-action">
            <a href={`mailto:${content.contact.email}?subject=Demo Talebi - Codeicon`} className="btn-demo">
              {content.demo.buttonText} <ArrowRight size={20} className="demo-btn-icon" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
