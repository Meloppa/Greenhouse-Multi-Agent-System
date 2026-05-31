import React from 'react';
import { ShieldAlert, Cpu, Heart, CheckCircle } from 'lucide-react';

export default function StatCard({ type, title, value, change, description, trendUp, style }) {
  // Theme styling mapping based on metrics type
  const iconConfig = {
    health: { icon: Heart, bg: '#FDF2F8', color: '#DB2777' },
    actuators: { icon: Cpu, bg: '#EEF2F6', color: '#475569' },
    water: { icon: ShieldAlert, bg: '#EFF6FF', color: '#3B82F6' },
    tasks: { icon: CheckCircle, bg: '#ECFDF5', color: '#10B981' }
  };

  const config = iconConfig[type] || iconConfig['health'];
  const Icon = config.icon;

  return (
    <div style={{ ...styles.card, ...style }}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        <div style={{ ...styles.iconWrapper, backgroundColor: config.bg }}>
          <Icon size={18} color={config.color} />
        </div>
      </div>
      
      <div style={styles.valueRow}>
        <span style={styles.cardValue}>{value}</span>
      </div>

      <div style={styles.footerRow}>
        {change && (
          <span style={{
            ...styles.changeBadge,
            backgroundColor: trendUp ? '#ECFDF5' : '#FEF2F2',
            color: trendUp ? '#047857' : '#B91C1C'
          }}>
            {change}
          </span>
        )}
        <span style={styles.cardDesc}>{description}</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '146px',
    flex: '1 1 calc(25% - 16px)',
    minWidth: '220px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize'
  },
  iconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  valueRow: {
    margin: '12px 0 8px 0'
  },
  cardValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.5px'
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  changeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px'
  },
  cardDesc: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#94A3B8'
  }
};
