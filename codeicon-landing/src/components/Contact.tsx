import content from "@/data/content.json";
import { Mail, MapPin, AtSign, Phone } from "lucide-react";
import "./contact.css";

export default function Contact() {
  const { company, email, phone, address, instagram } = content.contact;

  return (
    <footer id="contact" className="section contact-section">
      <div className="container">
        <div className="contact-wrapper">
          <div className="contact-info animate-fade-in">
            <h2 className="contact-title">İletişime Geçin</h2>
            <p className="contact-subtitle">Yeni projenizi hayata geçirmek veya daha fazla bilgi almak için bizimle iletişime geçin.</p>
            
            <div className="contact-details">
              <div className="contact-item">
                <Phone size={20} className="contact-icon" />
                <a href={`tel:${phone?.replace(/[^0-9+]/g, '')}`} className="contact-link">{phone}</a>
              </div>
              <div className="contact-item">
                <Mail size={20} className="contact-icon" />
                <a href={`mailto:${email}`} className="contact-link">{email}</a>
              </div>
              <div className="contact-item">
                <MapPin size={20} className="contact-icon" />
                <span className="contact-text">{address}</span>
              </div>
              <div className="contact-item">
                <AtSign size={20} className="contact-icon" />
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="contact-link">
                  @codeicon.co
                </a>
              </div>
            </div>
          </div>

          <div className="contact-brand animate-fade-in delay-200">
            <div className="logo-placeholder">
              <img src={content.meta.logo} alt={company} className="footer-logo" />
            </div>
            <p className="copyright">© {new Date().getFullYear()} {company}. Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
