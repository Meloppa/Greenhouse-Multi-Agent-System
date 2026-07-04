import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function SensorCharts({ history }) {
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  // Safely fallback to simulation entries if history is empty
  const data = history.length > 0 ? history : [
    { time: '08:00', temperature: 22, humidity: 60, light: 40, soil_moisture: 52 },
    { time: '10:00', temperature: 24, humidity: 62, light: 50, soil_moisture: 51 },
    { time: '12:00', temperature: 26, humidity: 65, light: 80, soil_moisture: 48 },
    { time: '14:00', temperature: 25, humidity: 64, light: 75, soil_moisture: 49 },
    { time: '16:00', temperature: 23, humidity: 61, light: 45, soil_moisture: 53 },
    { time: '18:00', temperature: 21, humidity: 59, light: 20, soil_moisture: 55 }
  ];

  const maxVal = Math.max(...data.map(d => d[selectedMetric] || 1)) * 1.2;

  const metricLabel = {
    temperature: 'Air Temp (°C)',
    humidity: 'Air Humidity (%)',
    light: 'Light (%)',
    soil_moisture: 'Soil Moisture (%)'
  };

  const getBarColor = (val) => {
    if (selectedMetric === 'temperature') return 'url(#greenGrad)';
    if (selectedMetric === 'humidity') return '#0ea5e9';
    if (selectedMetric === 'soil_moisture') return '#4a7c20';
    return '#d97706';
  };

  return (
    <div className="zentra-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-title)' }}>
            Sensor Telemetry History
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
            Real-time historical timeline of environmental stats
          </span>
        </div>
        
        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {Object.keys(metricLabel).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`tag-selector-btn ${selectedMetric === key ? 'active' : ''}`}
            >
              {key === 'temperature' ? 'Temp' : key === 'soil_moisture' ? 'Moisture' : key === 'humidity' ? 'Humidity' : 'Light'}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-body)', cursor: 'pointer' }}>
            <Calendar size={14} color="var(--color-text-muted)" />
            <span>Hourly</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart rendering */}
      <div style={{ width: '100%' }}>
        <svg viewBox="0 0 700 220" style={{ width: '100%', height: 'auto' }}>
          <defs>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a7c20" />
              <stop offset="100%" stopColor="#96c95f" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="20" x2="680" y2="20" stroke="var(--color-border)" strokeWidth="1" />
          <line x1="40" y1="70" x2="680" y2="70" stroke="var(--color-border)" strokeWidth="1" />
          <line x1="40" y1="120" x2="680" y2="120" stroke="var(--color-border)" strokeWidth="1" />
          <line x1="40" y1="170" x2="680" y2="170" stroke="var(--color-border)" strokeWidth="1" />
          
          {/* Base bottom axis */}
          <line x1="40" y1="180" x2="680" y2="180" stroke="var(--color-border)" strokeWidth="1.5" />

          {/* Draw bars */}
          {data.map((item, idx) => {
            const val = item[selectedMetric] || 0;
            const x = 60 + idx * ((620) / data.length);
            const barHeight = Math.max(10, (val / maxVal) * 150);
            const y = 180 - barHeight;
            const barWidth = Math.min(28, 480 / data.length);

            return (
              <g key={idx} className="chart-bar-group">
                {/* Visual highlight on hover */}
                <rect
                  x={x - 8}
                  y="10"
                  width={barWidth + 16}
                  height="170"
                  className="chart-hover-bg"
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
                  className="chart-rect"
                />

                {/* Floating tooltip readout on hover */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill="var(--color-text-title)"
                  fontSize="11"
                  fontWeight="700"
                  className="chart-tooltip"
                >
                  {val}
                </text>

                {/* X labels */}
                <text
                  x={x + barWidth / 2}
                  y="198"
                  textAnchor="middle"
                  fill="var(--color-text-muted)"
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
