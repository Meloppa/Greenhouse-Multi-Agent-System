import React from 'react';
import { Sprout, Settings, Calendar } from 'lucide-react';

export default function GrowthStage({ 
  currentPlant, 
  growthStage, 
  ageDays, 
  sensors, 
  targets, 
  onSelectPlant 
}) {
  const plants = ['Strawberry', 'Tomato', 'Lettuce', 'Orchid', 'Basil'];
  const stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'];

  const handlePlantChange = (e) => {
    onSelectPlant({ plant_type: e.target.value, growth_stage: growthStage, age_days: ageDays });
  };

  const handleStageChange = (e) => {
    onSelectPlant({ plant_type: currentPlant, growth_stage: e.target.value, age_days: ageDays });
  };

  const handleAgeChange = (e) => {
    const age = parseInt(e.target.value) || 1;
    onSelectPlant({ plant_type: currentPlant, growth_stage: growthStage, age_days: age });
  };

  // Helper to draw clean progress bars
  const renderProgress = (label, current, min, max, unit) => {
    // calculate simple percentage alignment
    const pct = Math.min(100, Math.max(0, (current / (max * 1.5)) * 100));
    const isOk = current >= min && current <= max;

    return (
      <div key={label} style={styles.metricRow}>
        <div style={styles.metricLabelRow}>
          <span style={styles.metricLabel}>{label}</span>
          <span style={{ 
            ...styles.metricValue, 
            color: isOk ? '#047857' : '#B91C1C' 
          }}>
            {current}{unit} <span style={styles.targetLabel}>({min}-{max}{unit})</span>
          </span>
        </div>
        <div style={styles.barTrack}>
          {/* Ideal range indicator layer */}
          <div style={{
            ...styles.idealRange,
            left: `${(min / (max * 1.5)) * 100}%`,
            width: `${((max - min) / (max * 1.5)) * 100}%`
          }}></div>
          
          {/* Current reading fill */}
          <div style={{
            ...styles.barFill,
            width: `${pct}%`,
            backgroundColor: isOk ? '#7C3AED' : '#EF4444'
          }}></div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Plant Expert Reconfigurator</h3>
      
      {/* Selection Control Panel */}
      <div style={styles.selectorsGrid}>
        <div style={styles.selectorWrapper}>
          <label style={styles.selectLabel}>Crop Species</label>
          <div style={styles.selectContainer}>
            <Sprout size={14} color="#64748B" style={styles.selectIcon} />
            <select 
              value={currentPlant} 
              onChange={handlePlantChange}
              style={styles.select}
            >
              {plants.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.selectorWrapper}>
          <label style={styles.selectLabel}>Growth Phase</label>
          <div style={styles.selectContainer}>
            <Settings size={14} color="#64748B" style={styles.selectIcon} />
            <select 
              value={growthStage} 
              onChange={handleStageChange}
              style={styles.select}
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.selectorWrapper}>
          <label style={styles.selectLabel}>Age (Days)</label>
          <div style={styles.selectContainer}>
            <Calendar size={14} color="#64748B" style={styles.selectIcon} />
            <input 
              type="number" 
              value={ageDays} 
              onChange={handleAgeChange}
              style={styles.numberInput}
              min="1"
            />
          </div>
        </div>
      </div>

      <hr style={styles.divider} />

      {/* Target parameters compared against current sensor logs */}
      <h4 style={styles.subtitle}>Target Parameters vs Live</h4>
      <div style={styles.metricsWrapper}>
        {renderProgress("Air Temp", sensors.temperature, targets.min_temp, targets.max_temp, "°C")}
        {renderProgress("Air Humidity", sensors.humidity, targets.min_humidity, targets.max_humidity, "%")}
        {renderProgress("Ambient Light", sensors.light, targets.min_light, targets.max_light, " Lux")}
        {renderProgress("Soil Moisture", sensors.soil_moisture, targets.min_soil_moisture, targets.max_soil_moisture, "%")}
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
    gap: '16px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  subtitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  selectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '10px'
  },
  selectorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  selectLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  selectContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 10px',
    height: '36px',
    position: 'relative'
  },
  selectIcon: {
    marginRight: '6px'
  },
  select: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    width: '100%',
    cursor: 'pointer'
  },
  numberInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    width: '100%'
  },
  divider: {
    border: 'none',
    borderBottom: '1px solid #F1F5F9'
  },
  metricsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  metricLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '600'
  },
  metricLabel: {
    color: '#475569'
  },
  metricValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  targetLabel: {
    fontSize: '10px',
    color: '#94A3B8'
  },
  barTrack: {
    position: 'relative',
    height: '6px',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  idealRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#F5F3FF',
    borderLeft: '1px solid #DDD6FE',
    borderRight: '1px solid #DDD6FE'
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: '10px',
    top: 0,
    left: 0,
    transition: 'width 0.5s ease-out, background-color 0.3s ease'
  }
};
