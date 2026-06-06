"use client";

import { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import "./demo-modal.css";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Gönderim başarısız oldu");
      }

      setStatus("success");
      
      // Reset form and close modal after 3 seconds
      setTimeout(() => {
        setFormData({ name: "", company: "", email: "", phone: "" });
        setStatus("idle");
        onClose();
      }, 3000);

    } catch (error) {
      setStatus("error");
      setErrorMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-panel animate-fade-in">
        <button className="modal-close" onClick={onClose} disabled={status === "loading"}>
          <X size={24} />
        </button>
        
        {status === "success" ? (
          <div className="modal-header" style={{ padding: "3rem 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CheckCircle2 size={64} color="var(--color-accent)" style={{ marginBottom: "1rem" }} />
            <h2 className="modal-title">Talebiniz Alındı!</h2>
            <p className="modal-subtitle">
              Demo talebiniz başarıyla bize ulaştı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Sistemi Canlı İnceleyin</h2>
              <p className="modal-subtitle">
                MICE operasyonlarınızı ve finansal akışınızı nasıl yöneteceğinizi görmek için ücretsiz bir demo toplantısı planlayın.
              </p>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Adınız Soyadınız</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Adınız Soyadınız" 
                  required 
                  disabled={status === "loading"}
                />
              </div>
              
              <div className="form-group">
                <label>Firma Adı</label>
                <input 
                  type="text" 
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Firma Adı" 
                  disabled={status === "loading"}
                />
              </div>
              
              <div className="form-group">
                <label>E-Posta Adresiniz</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@firma.com" 
                  required 
                  disabled={status === "loading"}
                />
              </div>

              <div className="form-group">
                <label>Telefon Numaranız</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+90 (5XX) XXX XX XX" 
                  required 
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <p style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>{errorMessage}</p>
              )}

              <button 
                type="submit" 
                className="btn-primary modal-submit" 
                disabled={status === "loading"}
                style={{ opacity: status === "loading" ? 0.7 : 1 }}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ marginRight: "8px" }} />
                    Gönderiliyor...
                  </>
                ) : (
                  "Demo Talebini Gönder"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
