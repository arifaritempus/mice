import content from "@/data/content.json";
import { Mail, MapPin, AtSign, Phone } from "lucide-react";
import "./footer.css";

export default function Footer() {
  const { company, email, phone, address, instagram } = content.contact;

  return (
    <footer className="footer section">
      <div className="container footer-wrapper">
        <div className="footer-info">
          <h2 className="footer-title">Geleceğin Operasyon Yönetimi</h2>
          <p className="footer-subtitle">Dijital dönüşümünüzü bugün başlatın.</p>
          
          <div className="footer-details">
            <div className="footer-item">
              <Phone className="footer-icon" size={20} />
              <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="footer-link">{phone}</a>
            </div>
            <div className="footer-item">
              <Mail className="footer-icon" size={20} />
              <a href={`mailto:${email}`} className="footer-link">{email}</a>
            </div>
            <div className="footer-item">
              <MapPin className="footer-icon" size={20} />
              <span className="footer-text">{address}</span>
            </div>
            <div className="footer-item">
              <AtSign className="footer-icon" size={20} />
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="footer-link">Instagram'da Bizi Takip Edin</a>
            </div>
          </div>
        </div>

        <div className="footer-brand">
          <img src="/logo.png" alt="Codeicon" style={{ height: "40px", marginBottom: "1rem" }} />
          <p className="copyright">© {new Date().getFullYear()} {company}. Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
