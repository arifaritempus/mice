"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import DemoModal from "./DemoModal";
import "./header.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`header ${isScrolled ? "scrolled glass-panel" : ""}`}>
        <div className="container header-container">
          <Link href="/" className="logo flex items-center">
            <img src="/logo.png" alt="Codeicon" style={{ height: "32px", width: "auto" }} />
          </Link>
          
          <nav className={`nav-links ${mobileMenuOpen ? "active" : ""}`}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Ana Sayfa</Link>
            <Link href="/solutions" onClick={() => setMobileMenuOpen(false)}>Çözümler</Link>
            <div className="nav-actions">
              <button className="btn-primary nav-btn" onClick={() => { setMobileMenuOpen(false); setIsModalOpen(true); }}>
                Demo Talep Et
              </button>
            </div>
          </nav>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
