import React from 'react';
import { Search, Download, Plus, Sparkles, Activity } from 'lucide-react';

export default function HeaderBanner({ plantName, stage, onExport }) {
  return (
    <div style={styles.container}>
      {/* Top action row */}
      <div style={styles.topRow}>
        {/* Search Input Bar */}
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search crop telemetry, diagnostics, scheduler tasks..." 
            style={styles.searchInput}
          />
          <kbd style={styles.kbd}>⌘K</kbd>
        </div>

        {/* Buttons */}
        <div style={styles.btnGroup}>
          <button style={styles.btnSecondary} onClick={onExport}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
          <button style={styles.btnPrimary}>
            <Plus size={16} />
            <span>Add New Zone</span>
          </button>
        </div>
      </div>

      {/* Main Banner Illustration Section */}
      <div style={styles.banner}>
        {/* Greenhouse Banner Image Background */}
        <img 
          src="/greenhouse_banner.png" 
          alt="Smart Greenhouse Banner" 
          style={styles.bannerImg}
        />

        {/* Dark overlay gradients */}
        <div style={styles.bannerOverlay}></div>

        {/* Glass floating card info */}
        <div style={styles.glassCard}>
          <div style={styles.badge}>
            <Activity size={12} color="#10B981" />
            <span style={styles.badgeText}>Agent Active</span>
          </div>
          <h2 style={styles.bannerTitle}>AI Greenhouse Control</h2>
          <p style={styles.bannerSubtitle}>
            Actively managing <strong>{plantName}</strong> ({stage}) using Plant Expert & Actuator Control Agents.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '0 16px',
    height: '46px',
    width: '400px',
    maxWidth: '100%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)'
  },
  searchIcon: {
    marginRight: '10px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#0F172A',
    width: '100%',
    fontWeight: '500'
  },
  kbd: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    marginLeft: '8px',
    pointerEvents: 'none'
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    height: '46px',
    padding: '0 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#7C3AED',
    border: 'none',
    borderRadius: '12px',
    height: '46px',
    padding: '0 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
  },
  banner: {
    position: 'relative',
    height: '180px',
    borderRadius: '24px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(109, 40, 217, 0.05)'
  },
  bannerImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    top: 0,
    left: 0
  },
  bannerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.4) 0%, rgba(124, 58, 237, 0.1) 100%)'
  },
  glassCard: {
    position: 'relative',
    marginLeft: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    padding: '16px 24px',
    maxWidth: '460px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '20px',
    padding: '2px 8px',
    width: 'fit-content'
  },
  badgeText: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  bannerTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  bannerSubtitle: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.5'
  }
};
