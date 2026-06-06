import { Home, BarChart2, Briefcase, Calendar, Map, Plane, Megaphone, Calculator, FileText, Bell } from "lucide-react";
import "./dashboard-mockup.css";

export default function DashboardMockup() {
  return (
    <div className="mockup-container glass-panel">
      <div className="mockup-header">
        <div className="mockup-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <div className="mockup-url">demo.codeicon.co</div>
      </div>
      
      <div className="mockup-body">
        {/* Sidebar */}
        <div className="mockup-sidebar">
          <div className="mockup-logo">
            <div className="logo-placeholder"></div>
            <span className="logo-text-small">CODEICON</span>
          </div>
          
          <nav className="mockup-nav">
            <div className="nav-item active"><Home size={16} /> ANA SAYFA</div>
            <div className="nav-item"><BarChart2 size={16} /> DASHBOARD</div>
            <div className="nav-item"><Briefcase size={16} /> MICE</div>
            <div className="nav-item"><Calendar size={16} /> SEJOUR</div>
            <div className="nav-item"><Map size={16} /> OPERASYON</div>
            <div className="nav-item"><Plane size={16} /> BİLET</div>
            <div className="nav-item"><Megaphone size={16} /> PAZARLAMA</div>
            <div className="nav-item"><Calculator size={16} /> MUHASEBE</div>
            <div className="nav-item"><FileText size={16} /> RAPORLAR</div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="mockup-content">
          <div className="content-header">
            <div className="update-text">SON GÜNCELLEME: 14:30</div>
            <h2 className="content-title">Ana Sayfa</h2>
            <div className="header-actions">
              <button className="mockup-btn primary">YENİ TEKLİF</button>
              <button className="mockup-btn secondary">YENİ SEJOUR</button>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue"><Briefcase size={18} /></div>
              <div className="stat-info">
                <div className="stat-label">AKTİF PROJELER</div>
                <div className="stat-value">1</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper green"><Calendar size={18} /></div>
              <div className="stat-info">
                <div className="stat-label">AKTİF SEJOURLAR</div>
                <div className="stat-value">1</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper purple"><Map size={18} /></div>
              <div className="stat-info">
                <div className="stat-label">YAKLAŞAN TRANSFERLER</div>
                <div className="stat-value">1</div>
              </div>
            </div>
          </div>
          
          <div className="flow-section">
            <h3 className="flow-title">AKTİF AKIŞ</h3>
            <div className="flow-grid">
              <div className="flow-card">
                <div className="flow-header">
                  <div className="flow-header-title"><Briefcase size={14} /> AKTİF PROJELER</div>
                </div>
                <div className="flow-empty">
                  <div className="empty-icon"></div>
                  <span>Yakın zamanda kayıt bulunmuyor</span>
                </div>
              </div>
              <div className="flow-card">
                <div className="flow-header">
                  <div className="flow-header-title"><Plane size={14} /> UÇUŞ & BİLETLER</div>
                </div>
                <div className="flow-item">
                  <div className="flow-badge green">SEJOUR</div>
                  <div className="flow-details">
                    <div className="flow-code">TK4321</div>
                    <div className="flow-route">ECN → IST</div>
                  </div>
                  <div className="flow-date">
                    <span>06 Haz</span>
                    <span className="small">1 YOLCU</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
