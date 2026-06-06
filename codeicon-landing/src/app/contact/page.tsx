import content from "@/data/content.json";
import { Mail, MapPin, AtSign } from "lucide-react";

export default function Contact() {
  const { email, address, instagram } = content.contact;

  return (
    <main className="section" style={{ paddingTop: "12rem", minHeight: "100vh" }}>
      <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "4rem" }}>
        <div style={{ flex: "1", minWidth: "300px" }}>
          <h1 className="section-title text-gradient" style={{ fontSize: "clamp(3rem, 5vw, 4rem)", marginBottom: "2rem" }}>
            Hemen Tanışalım
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1.2rem", marginBottom: "3rem" }}>
            Operasyonel yükünüzü hafifletmek ve tüm süreçlerinizi dijitalleştirmek için ekibimizle bir demo toplantısı planlayın.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Mail color="var(--color-accent)" size={24} />
              <a href={`mailto:${email}`} style={{ fontSize: "1.1rem" }}>{email}</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <MapPin color="var(--color-accent)" size={24} />
              <span style={{ fontSize: "1.1rem" }}>{address}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <AtSign color="var(--color-accent)" size={24} />
              <a href={instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: "1.1rem" }}>Instagram Hesabımız</a>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: "1", minWidth: "350px", padding: "3rem", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>Demo Talep Formu</h3>
          <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input type="text" placeholder="Adınız Soyadınız" style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.05)", color: "white" }} />
            <input type="email" placeholder="E-Posta Adresiniz" style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.05)", color: "white" }} />
            <input type="text" placeholder="Şirket Adı" style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.05)", color: "white" }} />
            <button className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>Talebi Gönder</button>
          </form>
        </div>
      </div>
    </main>
  );
}
