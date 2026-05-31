import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function SensorCharts({ history }) {
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  // Safely fallback to simulation entries if history is empty
  const data = history.length > 0 ? history : [
    { time: '08:00', temperature: 22, humidity: 60, light: 400, soil_moisture: 52 },
    { time: '10:00', temperature: 24, humidity: 62, light: 500, soil_moisture: 51 },
    { time: '12:00', temperature: 26, humidity: 65, light: 800, soil_moisture: 48 },
    { time: '14:00', temperature: 25, humidity: 64, light: 750, soil_moisture: 49 },
    { time: '16:00', temperature: 23, humidity: 61, light: 450, soil_moisture: 53 },
    { time: '18:00', temperature: 21, humidity: 59, light: 200, soil_moisture: 55 }
  ];

  const maxVal = Math.max(...data.map(d => d[selectedMetric] || 1)) * 1.2;

  const metricLabel = {
    temperature: 'Air Temp (°C)',
    humidity: 'Air Humidity (%)',
    light: 'Light (Lux)',
    soil_moisture: 'Soil Moisture (%)'
  };

  const getBarColor = (val) => {
    if (selectedMetric === 'temperature') return 'url(#purpleGrad)';
    if (selectedMetric === 'humidity') return '#3B82F6';
    if (selectedMetric === 'soil_moisture') return '#10B981';
    return '#F59E0B';
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleCol}>
          <h3 style={styles.title}>Sensor Telemetry History</h3>
          <span style={styles.subtitle}>Real-time historical timeline of environmental stats</span>
        </div>
        
        {/* Metric Selector Tabs */}
        <div style={styles.btnRow}>
          {Object.keys(metricLabel).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              style={{
                ...styles.tabBtn,
                ...(selectedMetric === key ? styles.tabBtnActive : {})
              }}
            >
              {key === 'temperature' ? 'Temp' : key === 'soil_moisture' ? 'Moisture' : key === 'humidity' ? 'Humidity' : 'Light'}
            </button>
          ))}
          <div style={styles.dropdown}>
            <Calendar size={14} color="#64748B" />
            <span style={styles.dropdownText}>Hourly</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart rendering */}
      <div style={styles.chartWrapper}>
        <svg viewBox="0 0 700 220" style={styles.svg}>
          <defs>
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="20" x2="680" y2="20" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="40" y1="70" x2="680" y2="70" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="40" y1="120" x2="680" y2="120" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="40" y1="170" x2="680" y2="170" stroke="#F1F5F9" strokeWidth="1" />
          
          {/* Base bottom axis */}
          <line x1="40" y1="180" x2="680" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Draw bars */}
          {data.map((item, idx) => {
            const val = item[selectedMetric] || 0;
            const x = 60 + idx * ((620) / data.length);
            const barHeight = Math.max(10, (val / maxVal) * 150);
            const y = 180 - barHeight;
            const barWidth = Math.min(28, 480 / data.length);

            return (
              <g key={idx} style={styles.barGroup}>
                {/* Visual highlight on hover */}
                <rect
                  x={x - 8}
                  y="10"
                  width={barWidth + 16}
                  height="170"
                  fill="transparent"
                  style={styles.hoverBackground}
                />
                
                {/* Beautiful round corner bars matching reference Zentra chart */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  ry="6"
                  fill={getBarColor(val)}
                  style={styles.rectBar}
                />

                {/* Floating tooltip readout on hover */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="11"
                  fontWeight="700"
                  style={styles.tooltipText}
                >
                  {val}
                </text>

                {/* X labels */}
                <text
                  x={x + barWidth / 2}
                  y="198"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                  fontWeight="600"
                >
                  {item.time}
                </text>
              </g>
            );
          })}
        </svg>
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
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  titleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  subtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  tabBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabBtnActive: {
    backgroundColor: '#F5F3FF',
    color: '#7C3AED',
    boxShadow: '0 2px 6px rgba(124,58,237,0.05)'
  },
  dropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    cursor: 'pointer'
  },
  dropdownText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  chartWrapper: {
    width: '100%',
    overflowX: 'auto'
  },
  svg: {
    width: '100%',
    minWidth: '550px',
    height: 'auto'
  },
  barGroup: {
    cursor: 'pointer'
  },
  rectBar: {
    transition: 'all 0.3s ease-in-out'
  },
  hoverBackground: {
    transition: 'fill 0.2s',
    ':hover': {
      fill: 'rgba(124, 58, 237, 0.02)'
    }
  },
  tooltipText: {
    opacity: 0,
    transition: 'opacity 0.15s ease',
    pointerEvents: 'none',
    transform: 'translateY(2px)',
    g: {
      ':hover &': {
        opacity: 1
      }
    }
  }
};
