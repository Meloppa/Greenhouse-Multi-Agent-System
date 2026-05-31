import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  ScanLine, 
  CheckSquare, 
  MessageSquare, 
  Settings, 
  Inbox, 
  Sprout, 
  Sparkles 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'sensors', name: 'IoT Sensors', icon: Activity },
    { id: 'diagnostics', name: 'Diagnostics Center', icon: ScanLine },
    { id: 'tasks', name: 'Agri-Tasks', icon: CheckSquare },
    { id: 'chat', name: 'AI Telegram Bot', icon: MessageSquare }
  ];

  const settingsItems = [
    { id: 'inbox', name: 'Alerts Logs', icon: Inbox },
    { id: 'settings', name: 'System Settings', icon: Settings }
  ];

  return (
    <div style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <div style={styles.logoContainer}>
          <Sprout size={22} color="#7C3AED" />
        </div>
        <span style={styles.brandName}>Zentra Flora</span>
      </div>

      {/* Primary Navigation */}
      <div style={styles.sectionHeader}>MENU</div>
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {})
              }}
            >
              <Icon 
                size={18} 
                color={isActive ? '#7C3AED' : '#94A3B8'} 
                style={styles.icon}
              />
              <span style={{ 
                ...styles.label, 
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#0F172A' : '#475569'
              }}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Navigation */}
      <div style={styles.sectionHeader}>SETTINGS</div>
      <nav style={styles.nav}>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {})
              }}
            >
              <Icon 
                size={18} 
                color={isActive ? '#7C3AED' : '#94A3B8'} 
                style={styles.icon}
              />
              <span style={{ 
                ...styles.label, 
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#0F172A' : '#475569'
              }}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade Banner at bottom */}
      <div style={styles.upgradeCard}>
        <div style={styles.upgradeIcon}>
          <Sparkles size={18} color="#7C3AED" />
        </div>
        <h4 style={styles.upgradeTitle}>Unlock full insights</h4>
        <p style={styles.upgradeSubtitle}>across all your physical greenhouses with Zentra.</p>
        <button style={styles.upgradeBtn}>Upgrade Plan</button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '24px 16px',
    position: 'fixed',
    left: 0,
    top: 0,
    overflowY: 'auto',
    zIndex: 10
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px'
  },
  logoContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#F5F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)'
  },
  brandName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: '-0.5px'
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: '1px',
    margin: '16px 0 8px 8px'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease-in-out'
  },
  navButtonActive: {
    backgroundColor: '#F5F3FF'
  },
  icon: {
    marginRight: '12px',
    flexShrink: 0
  },
  label: {
    fontSize: '14px',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  upgradeCard: {
    marginTop: 'auto',
    backgroundColor: '#FAF5FF',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #F3E8FF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.02)'
  },
  upgradeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.05)'
  },
  upgradeTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: '4px'
  },
  upgradeSubtitle: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: '1.4'
  },
  upgradeBtn: {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#6D28D9',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 2px 6px rgba(109, 40, 217, 0.2)'
  }
};
